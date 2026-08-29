import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Tawar-menawar harga antara pembeli dan Boemi.
 *
 * Aturan pokok: riwayat TIDAK PERNAH ditimpa. Tiap penawaran dan balasan
 * ditambahkan sebagai ronde baru. Riwayat inilah yang nanti dicetak menjadi
 * dokumen "Riwayat Negosiasi" — kalau baris lama bisa diedit, dokumennya
 * kehilangan seluruh gunanya sebagai bukti.
 */

export type OfferItem = {
  requestItemId: string;
  name: string;
  qty: number;
  unitPrice: number; // exclude PPN
  subtotal: number;
};

export type Offer = {
  id: string;
  round: number;
  actor: "buyer" | "seller";
  kind: "offer" | "counter" | "accept" | "reject";
  subtotal: number;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  items: OfferItem[];
};

type OfferRow = {
  id: string;
  round: number;
  actor: "buyer" | "seller";
  kind: Offer["kind"];
  subtotal: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

/** Seluruh ronde negosiasi satu permintaan, urut dari yang paling awal. */
export async function listOffers(requestId: string): Promise<Offer[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("quote_offers")
    .select("*")
    .eq("request_id", requestId)
    .order("round");
  if (error || !data) return [];

  const offers = data as OfferRow[];
  if (offers.length === 0) return [];

  const { data: itemRows } = await sb
    .from("quote_offer_items")
    .select("offer_id, request_item_id, unit_price, qty, subtotal")
    .in(
      "offer_id",
      offers.map((o) => o.id),
    );

  // Nama barang diambil dari item permintaan supaya riwayat tetap terbaca
  // walau produknya kelak diganti namanya di katalog.
  const { data: reqItems } = await sb
    .from("quote_request_items")
    .select("id, name")
    .eq("request_id", requestId);

  const namaItem = new Map(
    ((reqItems ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]),
  );

  const perOffer = new Map<string, OfferItem[]>();
  for (const it of (itemRows ?? []) as {
    offer_id: string;
    request_item_id: string;
    unit_price: number;
    qty: number;
    subtotal: number;
  }[]) {
    const arr = perOffer.get(it.offer_id) ?? [];
    arr.push({
      requestItemId: it.request_item_id,
      name: namaItem.get(it.request_item_id) ?? "(barang dihapus)",
      qty: it.qty,
      unitPrice: it.unit_price,
      subtotal: it.subtotal,
    });
    perOffer.set(it.offer_id, arr);
  }

  return offers.map((o) => ({
    id: o.id,
    round: o.round,
    actor: o.actor,
    kind: o.kind,
    subtotal: o.subtotal,
    note: o.note,
    createdBy: o.created_by,
    createdAt: o.created_at,
    items: perOffer.get(o.id) ?? [],
  }));
}

export type NewOffer = {
  requestId: string;
  actor: "buyer" | "seller";
  kind: Offer["kind"];
  note: string | null;
  createdBy: string;
  /** Wajib untuk 'offer' dan 'counter'; diabaikan untuk 'accept'/'reject'. */
  items?: { requestItemId: string; qty: number; unitPrice: number }[];
};

export class NegotiationError extends Error {}

/**
 * Tambah satu ronde. Nomor ronde dihitung dari ronde terakhir, dan tabrakan
 * ditangkap oleh batasan unik (request_id, round) di database — jadi dua orang
 * yang mengirim bersamaan tidak bisa menghasilkan ronde kembar.
 */
export async function addOffer(input: NewOffer): Promise<Offer> {
  const sb = getAdminSupabase();
  if (!sb) throw new NegotiationError("Database belum terhubung.");

  const { data: last } = await sb
    .from("quote_offers")
    .select("round, kind")
    .eq("request_id", input.requestId)
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastRow = last as { round: number; kind: string } | null;

  if (lastRow && (lastRow.kind === "accept" || lastRow.kind === "reject")) {
    throw new NegotiationError(
      "Negosiasi sudah ditutup. Buat permintaan baru bila harga mau dibahas lagi.",
    );
  }

  const round = (lastRow?.round ?? 0) + 1;

  const items = input.items ?? [];
  const perluItem = input.kind === "offer" || input.kind === "counter";
  if (perluItem && items.length === 0)
    throw new NegotiationError("Harga penawaran belum diisi.");

  for (const it of items) {
    if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0)
      throw new NegotiationError("Harga tidak valid.");
    if (!Number.isInteger(it.qty) || it.qty <= 0)
      throw new NegotiationError("Jumlah barang tidak valid.");
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const { data: offerRow, error } = await sb
    .from("quote_offers")
    .insert({
      request_id: input.requestId,
      round,
      actor: input.actor,
      kind: input.kind,
      subtotal,
      note: input.note,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) {
    if (/duplicate key/i.test(error.message))
      throw new NegotiationError("Ada balasan lain yang masuk barusan. Muat ulang halaman.");
    throw new NegotiationError(error.message);
  }

  const o = offerRow as OfferRow;

  if (items.length > 0) {
    const { error: itemErr } = await sb.from("quote_offer_items").insert(
      items.map((i) => ({
        offer_id: o.id,
        request_item_id: i.requestItemId,
        unit_price: i.unitPrice,
        qty: i.qty,
        subtotal: i.unitPrice * i.qty,
      })),
    );
    if (itemErr) {
      // Ronde tanpa rincian harga = riwayat yang menyesatkan. Batalkan.
      await sb.from("quote_offers").delete().eq("id", o.id);
      throw new NegotiationError("Gagal menyimpan rincian harga. Coba lagi.");
    }
  }

  // Status permintaan mengikuti ronde terakhir.
  const status =
    input.kind === "accept"
      ? "agreed"
      : input.kind === "reject"
        ? "rejected"
        : "negotiating";
  await sb.from("quote_requests").update({ status }).eq("id", input.requestId);

  return {
    id: o.id,
    round: o.round,
    actor: o.actor,
    kind: o.kind,
    subtotal: o.subtotal,
    note: o.note,
    createdBy: o.created_by,
    createdAt: o.created_at,
    items: items.map((i) => ({
      requestItemId: i.requestItemId,
      name: "",
      qty: i.qty,
      unitPrice: i.unitPrice,
      subtotal: i.unitPrice * i.qty,
    })),
  };
}

/** Harga yang berlaku sekarang: ronde terakhir yang memuat rincian harga. */
export function hargaBerlaku(offers: Offer[]): Offer | null {
  for (let i = offers.length - 1; i >= 0; i--) {
    if (offers[i].items.length > 0) return offers[i];
  }
  return null;
}

/** Negosiasi sudah ditutup (disepakati atau ditolak)? */
export function negosiasiSelesai(offers: Offer[]): "agreed" | "rejected" | null {
  const last = offers[offers.length - 1];
  if (!last) return null;
  if (last.kind === "accept") return "agreed";
  if (last.kind === "reject") return "rejected";
  return null;
}

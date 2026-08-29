import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { getCompanyProfile, nextDocNumber, profileSiap, type DocType } from "@/lib/admin/company";
import { listOffers, hargaBerlaku, negosiasiSelesai } from "@/lib/admin/negotiation";
import { terbilangRupiah } from "@/lib/terbilang";
import { PPN_RATE } from "@/lib/format";

/**
 * Penerbitan dokumen pengadaan.
 *
 * Seluruh isi surat dibekukan ke dalam `snapshot` saat terbit. Halaman cetak
 * membaca snapshot itu, BUKAN data terkini — supaya surat yang sama, diunduh
 * kapan pun, isinya persis sama. Ini syarat dokumen yang dipakai untuk
 * pertanggungjawaban anggaran.
 */

export type DocItem = {
  nama: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  /** Spesifikasi barang (dari deskripsi produk), dibekukan untuk Lampiran PDN. */
  spesifikasi?: string;
};

export type DocSnapshot = {
  jenis: DocType;
  nomor: string;
  tanggal: string;
  tanggalNegosiasi: string | null;
  penerbit: {
    nama: string;
    npwp: string;
    alamat: string;
    kota: string;
    telepon: string;
    email: string;
    penandatangan: string;
    jabatan: string;
  };
  pembeli: {
    instansi: string;
    npwp: string;
    alamat: string;
    kota: string;
    telepon: string;
    email: string;
    pejabat: string;
    nip: string;
    jabatan: string;
    tahunAnggaran: number | null;
    sumberDana: string;
  };
  items: DocItem[];
  subtotal: number;
  ppnRate: number;
  ppn: number;
  pphRate: number;
  pph: number;
  total: number;
  terbilang: string;
  catatan: string | null;
  kodePermintaan: string;

  /* --- bagian khas dokumen lanjutan --- */
  nomorSuratPesanan?: string;
  bank?: { nama: string; nomor: string; atasNama: string };
  jatuhTempo?: string;
  pernyataan?: string;
  ronde?: {
    nomor: number;
    pihak: string;
    jenis: string;
    subtotal: number;
    catatan: string | null;
    waktu: string;
    items: { nama: string; qty: number; hargaSatuan: number; total: number }[];
  }[];
};

export class DocumentError extends Error {}

/**
 * Terbitkan Surat Pesanan dari permintaan penawaran yang harganya SUDAH
 * disepakati. Menolak bila belum sepakat atau identitas penerbit belum lengkap —
 * surat resmi tidak boleh keluar dengan NPWP kosong.
 */
export async function issueSuratPesanan(params: {
  requestId: string;
  issuedBy: string;
  pphRate: number; // persen, 0 = tidak dikenakan
  catatan: string | null;
}): Promise<{ id: string; nomor: string }> {
  const sb = getAdminSupabase();
  if (!sb) throw new DocumentError("Database belum terhubung.");

  const penerbit = await getCompanyProfile();
  if (!profileSiap(penerbit))
    throw new DocumentError(
      "Identitas perusahaan belum lengkap. Isi di menu Identitas Perusahaan dulu.",
    );

  const { data: reqRow } = await sb
    .from("quote_requests")
    .select("id, code, user_id, customer_name, customer_email, customer_phone, institution")
    .eq("id", params.requestId)
    .maybeSingle();

  if (!reqRow) throw new DocumentError("Permintaan penawaran tidak ditemukan.");
  const req = reqRow as {
    id: string;
    code: string;
    user_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    institution: string | null;
  };

  const sudahAda = await sb
    .from("documents")
    .select("id, number")
    .eq("request_id", req.id)
    .eq("doc_type", "SP")
    .is("voided_at", null)
    .maybeSingle();

  if (sudahAda.data) {
    const d = sudahAda.data as { id: string; number: string };
    throw new DocumentError(
      `Surat pesanan untuk permintaan ini sudah terbit dengan nomor ${d.number}.`,
    );
  }

  const offers = await listOffers(req.id);
  if (negosiasiSelesai(offers) !== "agreed")
    throw new DocumentError(
      "Harga belum disepakati. Selesaikan negosiasi sebelum menerbitkan surat pesanan.",
    );

  const berlaku = hargaBerlaku(offers);
  if (!berlaku || berlaku.items.length === 0)
    throw new DocumentError("Tidak ada rincian harga yang bisa dipakai.");

  // Tanggal negosiasi = ronde terakhir yang memuat harga. Bidang ini ada di
  // surat pesanan contoh, jadi ikut dicantumkan.
  const tanggalNegosiasi = berlaku.createdAt;

  // Profil instansi pembeli, kalau dia sudah mengisinya di portal.
  let pembeliProfil: Record<string, string | number | null> = {};
  if (req.user_id) {
    const { data: bp } = await sb
      .from("buyer_profiles")
      .select("*")
      .eq("user_id", req.user_id)
      .maybeSingle();
    if (bp) pembeliProfil = bp as Record<string, string | number | null>;
  }

  // Spesifikasi tiap barang = deskripsi produk, dibekukan bersama surat supaya
  // Lampiran PDN tetap sama walau produk diedit belakangan.
  const { data: reqItemRows } = await sb
    .from("quote_request_items")
    .select("id, product_id")
    .eq("request_id", req.id);
  const rows = (reqItemRows ?? []) as { id: string; product_id: string | null }[];
  const prodIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))] as string[];
  const specByProduct = new Map<string, string>();
  if (prodIds.length) {
    const { data: prods } = await sb
      .from("products")
      .select("id, description")
      .in("id", prodIds);
    for (const p of (prods ?? []) as { id: string; description: string | null }[])
      specByProduct.set(p.id, p.description ?? "");
  }
  const specByReqItem = new Map<string, string>();
  for (const r of rows)
    specByReqItem.set(r.id, (r.product_id && specByProduct.get(r.product_id)) || "");

  const items: DocItem[] = berlaku.items.map((i) => ({
    nama: i.name,
    qty: i.qty,
    satuan: "Unit",
    hargaSatuan: i.unitPrice,
    total: i.subtotal,
    spesifikasi: specByReqItem.get(i.requestItemId) || undefined,
  }));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const ppnRate = PPN_RATE * 100;
  const ppn = Math.round(subtotal * PPN_RATE);
  const pphRate = Number.isFinite(params.pphRate) ? Math.max(0, params.pphRate) : 0;
  const pph = Math.round((subtotal * pphRate) / 100);
  const total = subtotal + ppn;

  const nomor = await nextDocNumber("SP");

  const snapshot: DocSnapshot = {
    jenis: "SP",
    nomor,
    tanggal: new Date().toISOString(),
    tanggalNegosiasi,
    penerbit: {
      nama: penerbit.nama,
      npwp: penerbit.npwp,
      alamat: penerbit.alamat,
      kota: penerbit.kota,
      telepon: penerbit.telepon,
      email: penerbit.email,
      penandatangan: penerbit.penandatangan,
      jabatan: penerbit.jabatan,
    },
    pembeli: {
      instansi:
        String(pembeliProfil.institution ?? "") || req.institution || req.customer_name,
      npwp: String(pembeliProfil.npwp ?? ""),
      alamat: String(pembeliProfil.address ?? ""),
      kota: String(pembeliProfil.city ?? ""),
      telepon: String(pembeliProfil.phone ?? "") || (req.customer_phone ?? ""),
      email: req.customer_email,
      pejabat: String(pembeliProfil.officer_name ?? "") || req.customer_name,
      nip: String(pembeliProfil.officer_nip ?? ""),
      jabatan: String(pembeliProfil.officer_role ?? ""),
      tahunAnggaran: pembeliProfil.budget_year ? Number(pembeliProfil.budget_year) : null,
      sumberDana: String(pembeliProfil.budget_source ?? ""),
    },
    items,
    subtotal,
    ppnRate,
    ppn,
    pphRate,
    pph,
    total,
    terbilang: terbilangRupiah(total),
    catatan: params.catatan,
    kodePermintaan: req.code,
  };

  const { data: docRow, error } = await sb
    .from("documents")
    .insert({
      doc_type: "SP",
      number: nomor,
      request_id: req.id,
      snapshot: snapshot as never,
      issued_by: params.issuedBy,
    })
    .select("id, number")
    .single();

  if (error) throw new DocumentError("Gagal menyimpan dokumen: " + error.message);

  // Permintaan ditandai sudah bersurat.
  await sb.from("quote_requests").update({ status: "quoted" }).eq("id", req.id);

  const d = docRow as { id: string; number: string };
  return { id: d.id, nomor: d.number };
}

export type StoredDocument = {
  id: string;
  docType: DocType;
  number: string;
  requestId: string | null;
  issuedBy: string | null;
  issuedAt: string;
  voidedAt: string | null;
  snapshot: DocSnapshot;
};

export async function getDocument(id: string): Promise<StoredDocument | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from("documents").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const r = data as {
    id: string;
    doc_type: DocType;
    number: string;
    request_id: string | null;
    issued_by: string | null;
    issued_at: string;
    voided_at: string | null;
    snapshot: DocSnapshot;
  };

  return {
    id: r.id,
    docType: r.doc_type,
    number: r.number,
    requestId: r.request_id,
    issuedBy: r.issued_by,
    issuedAt: r.issued_at,
    voidedAt: r.voided_at,
    snapshot: r.snapshot,
  };
}

/**
 * Urutan dokumen mengikuti alur pengadaan, dari awal ke akhir:
 * Negosiasi → Surat Pesanan → Pernyataan PDN → Invoice → Surat Jalan → BAST → Kwitansi.
 * Dipakai di panel admin dan portal supaya daftar dokumen selalu runtut, bukan
 * acak berdasarkan kapan diterbitkan.
 */
export const URUTAN_DOKUMEN: Record<DocType, number> = {
  NEG: 1,
  SP: 2,
  PDN: 3,
  INV: 4,
  SJ: 5,
  BAST: 6,
  KW: 7,
};

/** Dokumen milik satu permintaan penawaran, terurut sesuai alur pengadaan. */
export async function listDocumentsForRequest(requestId: string): Promise<StoredDocument[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("documents")
    .select("*")
    .eq("request_id", requestId);

  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((r) => ({
      id: String(r.id),
      docType: r.doc_type as DocType,
      number: String(r.number),
      requestId: r.request_id ? String(r.request_id) : null,
      issuedBy: r.issued_by ? String(r.issued_by) : null,
      issuedAt: String(r.issued_at),
      voidedAt: r.voided_at ? String(r.voided_at) : null,
      snapshot: r.snapshot as DocSnapshot,
    }))
    .sort(
      (a, b) =>
        (URUTAN_DOKUMEN[a.docType] ?? 99) - (URUTAN_DOKUMEN[b.docType] ?? 99),
    );
}

/* ================= DOKUMEN LANJUTAN ================= */

/**
 * Semua dokumen lanjutan berangkat dari Surat Pesanan yang sudah terbit.
 * Alasannya: SP memuat harga yang disepakati dan identitas kedua pihak pada
 * saat itu. Kalau tiap dokumen menghitung ulang sendiri, invoice dan surat
 * pesanan bisa berbeda angka — dan itu temuan pemeriksaan yang paling mahal.
 */
async function suratPesananDasar(requestId: string): Promise<StoredDocument> {
  const dokumen = await listDocumentsForRequest(requestId);
  const sp = dokumen.find((d) => d.docType === "SP" && !d.voidedAt);
  if (!sp)
    throw new DocumentError(
      "Terbitkan Surat Pesanan lebih dulu — dokumen lain mengambil angkanya dari sana.",
    );
  return sp;
}

async function simpanDokumen(params: {
  type: DocType;
  requestId: string;
  snapshot: DocSnapshot;
  issuedBy: string;
}): Promise<{ id: string; nomor: string }> {
  const sb = getAdminSupabase();
  if (!sb) throw new DocumentError("Database belum terhubung.");

  const { data, error } = await sb
    .from("documents")
    .insert({
      doc_type: params.type,
      number: params.snapshot.nomor,
      request_id: params.requestId,
      snapshot: params.snapshot as never,
      issued_by: params.issuedBy,
    })
    .select("id, number")
    .single();

  if (error) throw new DocumentError("Gagal menyimpan dokumen: " + error.message);
  const d = data as { id: string; number: string };
  return { id: d.id, nomor: d.number };
}

/** Cegah dokumen jenis sama terbit dua kali untuk permintaan yang sama. */
async function pastikanBelumTerbit(requestId: string, type: DocType): Promise<void> {
  const dokumen = await listDocumentsForRequest(requestId);
  const ada = dokumen.find((d) => d.docType === type && !d.voidedAt);
  if (ada)
    throw new DocumentError(`Dokumen ini sudah terbit dengan nomor ${ada.number}.`);
}

export type JenisLanjutan = "INV" | "SJ" | "BAST" | "KW" | "NEG" | "PDN";

/**
 * Terbitkan dokumen lanjutan. Isinya menyalin snapshot Surat Pesanan lalu
 * menambah bagian khas tiap jenis — sehingga angka antar dokumen dijamin sama.
 */
export async function issueDokumenLanjutan(params: {
  requestId: string;
  type: JenisLanjutan;
  issuedBy: string;
  catatan: string | null;
}): Promise<{ id: string; nomor: string }> {
  const penerbit = await getCompanyProfile();
  const sp = await suratPesananDasar(params.requestId);
  await pastikanBelumTerbit(params.requestId, params.type);

  // Syarat khusus per jenis — ditolak lebih awal daripada mencetak surat cacat.
  if (params.type === "INV" && !penerbit.bankAccount)
    throw new DocumentError(
      "Nomor rekening belum diisi di Identitas Perusahaan. Invoice tanpa rekening tidak bisa dibayar.",
    );
  if (params.type === "PDN" && !penerbit.pdnStatement.trim())
    throw new DocumentError(
      "Redaksi Surat Pernyataan PDN belum diisi di Identitas Perusahaan. Isi pernyataan hukum harus dari Boemi, bukan dikarang sistem.",
    );

  const nomor = await nextDocNumber(params.type);
  const sekarang = new Date();

  const snapshot: DocSnapshot = {
    ...sp.snapshot,
    jenis: params.type,
    nomor,
    tanggal: sekarang.toISOString(),
    catatan: params.catatan,
    // Identitas penerbit disegarkan hanya untuk bagian pembayaran; sisanya
    // tetap mengikuti Surat Pesanan supaya kedua surat konsisten.
    bank:
      params.type === "INV" || params.type === "KW"
        ? {
            nama: penerbit.bankName,
            nomor: penerbit.bankAccount,
            atasNama: penerbit.bankHolder || penerbit.nama,
          }
        : undefined,
    jatuhTempo:
      params.type === "INV"
        ? new Date(
            sekarang.getTime() + penerbit.termDays * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
    pernyataan: params.type === "PDN" ? penerbit.pdnStatement : undefined,
    nomorSuratPesanan: sp.number,
  };

  if (params.type === "NEG") {
    const offers = await listOffers(params.requestId);
    snapshot.ronde = offers.map((o) => ({
      nomor: o.round,
      pihak: o.actor === "seller" ? penerbit.nama : snapshot.pembeli.instansi,
      jenis: o.kind,
      subtotal: o.subtotal,
      catatan: o.note,
      waktu: o.createdAt,
      items: o.items.map((i) => ({
        nama: i.name,
        qty: i.qty,
        hargaSatuan: i.unitPrice,
        total: i.subtotal,
      })),
    }));
  }

  return simpanDokumen({
    type: params.type,
    requestId: params.requestId,
    snapshot,
    issuedBy: params.issuedBy,
  });
}

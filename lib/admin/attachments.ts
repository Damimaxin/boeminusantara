import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Lampiran berkas: faktur pajak, bukti bayar, foto pengiriman, foto serah terima.
 *
 * Disimpan di bucket PRIVAT. Tidak ada URL publik — tiap kali dibuka, server
 * menerbitkan tautan bertanda tangan yang kedaluwarsa. Kalau bucket-nya publik,
 * siapa pun yang menebak nama berkas bisa membaca faktur pajak orang.
 *
 * Waktu unggah dan sidik jari berkas (sha256) dihitung DI SERVER. Itu
 * membuktikan berkas tidak berubah setelah diunggah — bukan membuktikan foto
 * benar diambil di lokasi dan waktu tersebut. Batas ini disengaja.
 */

const BUCKET = "boemi-lampiran";

export const JENIS_LAMPIRAN = [
  "faktur_pajak",
  "bukti_bayar",
  "foto_kirim",
  "foto_bast",
  "lainnya",
] as const;

export type JenisLampiran = (typeof JENIS_LAMPIRAN)[number];

export const LABEL_LAMPIRAN: Record<JenisLampiran, string> = {
  faktur_pajak: "Faktur Pajak",
  bukti_bayar: "Bukti Pembayaran",
  foto_kirim: "Foto Barang Dikirim",
  foto_bast: "Foto Serah Terima",
  lainnya: "Berkas Lain",
};

const MIME_DIIZINKAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAKS_BYTE = 15 * 1024 * 1024;

export type Lampiran = {
  id: string;
  kind: JenisLampiran;
  filename: string;
  mime: string;
  sizeBytes: number;
  sha256: string;
  caption: string | null;
  uploadedBy: string | null;
  uploadedAt: string;
  replacedAt: string | null;
};

export class LampiranError extends Error {}

/** Nama berkas dibersihkan — nama asli tidak pernah dipakai sebagai jalur. */
function jalurAman(requestId: string, kind: string, filename: string): string {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${requestId}/${kind}/${randomUUID()}.${ext || "bin"}`;
}

export async function unggahLampiran(params: {
  requestId: string;
  kind: JenisLampiran;
  file: File;
  caption: string | null;
  uploadedBy: string;
}): Promise<Lampiran> {
  const sb = getAdminSupabase();
  if (!sb) throw new LampiranError("Database belum terhubung.");

  const { file } = params;
  if (!file || file.size === 0) throw new LampiranError("Berkas belum dipilih.");
  if (file.size > MAKS_BYTE) throw new LampiranError("Ukuran berkas melebihi 15 MB.");
  if (!MIME_DIIZINKAN.includes(file.type))
    throw new LampiranError("Hanya menerima gambar (JPG/PNG/WEBP) atau PDF.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const path = jalurAman(params.requestId, params.kind, file.name);

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw new LampiranError("Gagal mengunggah berkas: " + upErr.message);

  const { data, error } = await sb
    .from("attachments")
    .insert({
      request_id: params.requestId,
      kind: params.kind,
      path,
      filename: file.name.slice(0, 200),
      mime: file.type,
      size_bytes: buffer.length,
      sha256,
      caption: params.caption,
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    // Jangan tinggalkan berkas yatim di penyimpanan.
    await sb.storage.from(BUCKET).remove([path]);
    throw new LampiranError("Gagal menyimpan catatan berkas: " + error.message);
  }

  return keLampiran(data as Record<string, unknown>);
}

const keLampiran = (r: Record<string, unknown>): Lampiran => ({
  id: String(r.id),
  kind: r.kind as JenisLampiran,
  filename: String(r.filename),
  mime: String(r.mime ?? ""),
  sizeBytes: Number(r.size_bytes ?? 0),
  sha256: String(r.sha256 ?? ""),
  caption: r.caption ? String(r.caption) : null,
  uploadedBy: r.uploaded_by ? String(r.uploaded_by) : null,
  uploadedAt: String(r.uploaded_at),
  replacedAt: r.replaced_at ? String(r.replaced_at) : null,
});

export async function listLampiran(requestId: string): Promise<Lampiran[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("attachments")
    .select("*")
    .eq("request_id", requestId)
    .order("uploaded_at", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(keLampiran);
}

/**
 * Tautan unduh sementara. Dibuat per permintaan dan kedaluwarsa 10 menit,
 * jadi tautan yang terlanjur ter-forward tidak berlaku selamanya.
 */
export async function tautanLampiran(id: string): Promise<string | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;

  const { data: row } = await sb
    .from("attachments")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;

  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(String((row as { path: string }).path), 600);

  if (error || !data) return null;
  return data.signedUrl;
}

/** Berkas induk satu lampiran — dipakai untuk memeriksa hak akses. */
export async function requestIdLampiran(id: string): Promise<string | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("attachments")
    .select("request_id")
    .eq("id", id)
    .maybeSingle();
  const r = data as { request_id: string | null } | null;
  return r?.request_id ?? null;
}

/* ============ PENGIRIMAN ============ */

export type Pengiriman = {
  courier: string;
  trackingNumber: string;
  shippedAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  note: string | null;
};

export async function getPengiriman(requestId: string): Promise<Pengiriman | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;

  const { data } = await sb
    .from("shipments")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (!data) return null;

  const r = data as Record<string, string | null>;
  return {
    courier: r.courier ?? "",
    trackingNumber: r.tracking_number ?? "",
    shippedAt: r.shipped_at,
    receivedAt: r.received_at,
    receivedBy: r.received_by,
    note: r.note,
  };
}

export async function simpanPengiriman(params: {
  requestId: string;
  courier: string;
  trackingNumber: string;
  note: string | null;
}): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new LampiranError("Database belum terhubung.");

  const ada = await getPengiriman(params.requestId);
  const isi = {
    request_id: params.requestId,
    courier: params.courier,
    tracking_number: params.trackingNumber,
    note: params.note,
    // Tanggal kirim tercatat sekali, saat resi pertama kali diisi.
    shipped_at: ada?.shippedAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = ada
    ? await sb.from("shipments").update(isi).eq("request_id", params.requestId)
    : await sb.from("shipments").insert(isi);

  if (error) throw new LampiranError(error.message);
}

/** Pembeli menyatakan barang diterima — pengunci serah terima. */
export async function tandaiDiterima(
  requestId: string,
  olehEmail: string,
): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new LampiranError("Database belum terhubung.");

  const ada = await getPengiriman(requestId);
  if (!ada) throw new LampiranError("Data pengiriman belum ada.");
  if (ada.receivedAt) return; // sudah ditandai, jangan ditimpa

  const { error } = await sb
    .from("shipments")
    .update({
      received_at: new Date().toISOString(),
      received_by: olehEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("request_id", requestId);

  if (error) throw new LampiranError(error.message);
}

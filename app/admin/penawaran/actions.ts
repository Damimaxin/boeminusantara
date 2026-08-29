"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveQuote, setQuoteStatus } from "@/lib/admin/quotes";
import { checkAdmin } from "@/lib/admin/auth";
import { addOffer, NegotiationError } from "@/lib/admin/negotiation";
import { listRequestItems } from "@/lib/admin/quotes";
import {
  issueSuratPesanan,
  issueDokumenLanjutan,
  DocumentError,
  type JenisLanjutan,
} from "@/lib/admin/documents";
import { recordAudit } from "@/lib/audit";
import {
  unggahLampiran,
  simpanPengiriman,
  LampiranError,
  JENIS_LAMPIRAN,
  type JenisLampiran,
} from "@/lib/admin/attachments";

/**
 * Server Action bisa dipanggil langsung lewat HTTP — jadi tiap action
 * memeriksa admin sendiri, tidak menumpang pagar layout.
 */
async function requireAdmin() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/penawaran");
}


export type ApproveState = {
  ok: boolean;
  error?: string;
  preview?: boolean;
  fieldErrors?: Record<string, string>;
};

/**
 * Server Action: ACC permintaan + terbitkan surat. Setelah sukses, redirect
 * ke halaman surat. `requestId` di-bind di page.
 */
export async function approveQuoteAction(
  requestId: string,
  _prev: ApproveState,
  formData: FormData,
): Promise<ApproveState> {
  await requireAdmin();
  const discountRaw = String(formData.get("discount") ?? "").trim();
  const ppnEnabled = formData.get("ppnEnabled") === "on";
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  const terms = String(formData.get("terms") ?? "").trim();
  const approvedBy = String(formData.get("approvedBy") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  let discount = 0;
  if (discountRaw !== "") {
    discount = Number(discountRaw);
    if (Number.isNaN(discount) || discount < 0) {
      fieldErrors.discount = "Diskon harus angka ≥ 0.";
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const res = await approveQuote(requestId, {
    discount: Math.round(discount),
    ppnEnabled,
    validUntil: validUntil || null,
    terms: terms || null,
    approvedBy: approvedBy || null,
  });

  if (!res.ok) {
    if (res.error === "no_db") {
      return {
        ok: false,
        preview: true,
        error:
          "Mode preview — belum terhubung database. Surat tidak dapat diterbitkan.",
      };
    }
    return { ok: false, error: `Gagal menerbitkan surat: ${res.error}` };
  }

  revalidatePath("/admin/penawaran");
  revalidatePath(`/admin/penawaran/${requestId}`);
  await recordAudit({ action: "penawaran.acc", target: requestId, detail: { diskon: discount, ppn: ppnEnabled } });
  redirect(`/admin/penawaran/${requestId}/surat`);
}

/** Server Action: tandai status (reviewed/rejected). Dipakai form kecil. */
export async function setStatusAction(
  requestId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const status = String(formData.get("status") ?? "").trim();
  if (
    status === "reviewed" ||
    status === "rejected" ||
    status === "pending"
  ) {
    await setQuoteStatus(requestId, status);
    await recordAudit({ action: "penawaran.status", target: requestId, detail: { status } });
    revalidatePath("/admin/penawaran");
    revalidatePath(`/admin/penawaran/${requestId}`);
  }
}

/* ============ NEGOSIASI HARGA ============ */

export type NegotiationState = { ok: boolean; error?: string };

/**
 * Server Action: kirim harga tandingan, terima harga pembeli, atau tolak.
 * `requestId` di-bind di page.
 *
 * Harga diambil dari kolom isian per barang (`harga_<id>`), lalu dicocokkan
 * dengan daftar barang milik permintaan ini — id yang tidak dikenal diabaikan,
 * sehingga kiriman yang diutak-atik tidak bisa menyusupkan barang lain.
 */
export async function negotiateAction(
  requestId: string,
  _prev: NegotiationState,
  formData: FormData,
): Promise<NegotiationState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect(`/masuk?next=/admin/penawaran/${requestId}`);

  const tindakan = String(formData.get("tindakan") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  if (!["counter", "accept", "reject"].includes(tindakan))
    return { ok: false, error: "Tindakan tidak dikenal." };

  const daftar = await listRequestItems(requestId);
  if (daftar.length === 0)
    return { ok: false, error: "Permintaan ini tidak punya rincian barang." };

  let items: { requestItemId: string; qty: number; unitPrice: number }[] = [];

  if (tindakan === "counter") {
    items = daftar.map((d) => {
      const raw = String(formData.get(`harga_${d.id}`) ?? "").trim();
      return {
        requestItemId: d.id,
        qty: d.qty,
        unitPrice: Math.max(0, Math.round(Number(raw) || 0)),
      };
    });
    if (items.some((i) => i.unitPrice <= 0))
      return { ok: false, error: "Semua harga harus diisi dengan angka di atas nol." };
  }

  try {
    await addOffer({
      requestId,
      actor: "seller",
      kind: tindakan as "counter" | "accept" | "reject",
      note: catatan,
      createdBy: gate.email,
      items: tindakan === "counter" ? items : undefined,
    });
  } catch (e) {
    if (e instanceof NegotiationError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal menyimpan balasan. Coba lagi." };
  }

  revalidatePath(`/admin/penawaran/${requestId}`);
  revalidatePath("/admin/penawaran");
  return { ok: true };
}

/* ============ PENERBITAN DOKUMEN ============ */

export type TerbitState = { ok: boolean; error?: string; docId?: string; nomor?: string };

/** Terbitkan Surat Pesanan dari harga yang sudah disepakati. */
export async function terbitkanSuratPesananAction(
  requestId: string,
  _prev: TerbitState,
  formData: FormData,
): Promise<TerbitState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect(`/masuk?next=/admin/penawaran/${requestId}`);

  const pph = Number(String(formData.get("pphRate") ?? "0")) || 0;
  const catatan = String(formData.get("catatanSurat") ?? "").trim() || null;

  try {
    const hasil = await issueSuratPesanan({
      requestId,
      issuedBy: gate.email,
      pphRate: pph,
      catatan,
    });
    await recordAudit({ action: "dokumen.terbit", target: hasil.nomor, detail: { jenis: "SP", requestId } });
    revalidatePath(`/admin/penawaran/${requestId}`);
    revalidatePath("/admin/penawaran");
    revalidatePath("/portal/dokumen");
    return { ok: true, docId: hasil.id, nomor: hasil.nomor };
  } catch (e) {
    if (e instanceof DocumentError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal menerbitkan surat. Coba lagi." };
  }
}

/** Terbitkan dokumen lanjutan (invoice, surat jalan, BAST, kwitansi, dst). */
export async function terbitkanDokumenAction(
  requestId: string,
  _prev: TerbitState,
  formData: FormData,
): Promise<TerbitState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect(`/masuk?next=/admin/penawaran/${requestId}`);

  const jenis = String(formData.get("jenis") ?? "");
  const sah = ["INV", "SJ", "BAST", "KW", "NEG", "PDN"];
  if (!sah.includes(jenis)) return { ok: false, error: "Jenis dokumen tidak dikenal." };

  try {
    const hasil = await issueDokumenLanjutan({
      requestId,
      type: jenis as JenisLanjutan,
      issuedBy: gate.email,
      catatan: String(formData.get("catatanSurat") ?? "").trim() || null,
    });
    await recordAudit({ action: "dokumen.terbit", target: hasil.nomor, detail: { jenis, requestId } });
    revalidatePath(`/admin/penawaran/${requestId}`);
    revalidatePath("/portal/dokumen");
    return { ok: true, docId: hasil.id, nomor: hasil.nomor };
  } catch (e) {
    if (e instanceof DocumentError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal menerbitkan dokumen. Coba lagi." };
  }
}

/* ============ LAMPIRAN & PENGIRIMAN ============ */

export type LampiranState = { ok: boolean; error?: string; success?: string };

export async function unggahLampiranAction(
  requestId: string,
  _prev: LampiranState,
  formData: FormData,
): Promise<LampiranState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect(`/masuk?next=/admin/penawaran/${requestId}`);

  const kind = String(formData.get("kind") ?? "");
  if (!JENIS_LAMPIRAN.includes(kind as JenisLampiran))
    return { ok: false, error: "Jenis berkas tidak dikenal." };

  const file = formData.get("berkas");
  if (!(file instanceof File)) return { ok: false, error: "Berkas belum dipilih." };

  try {
    await unggahLampiran({
      requestId,
      kind: kind as JenisLampiran,
      file,
      caption: String(formData.get("caption") ?? "").trim() || null,
      uploadedBy: gate.email,
    });
  } catch (e) {
    if (e instanceof LampiranError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal mengunggah. Coba lagi." };
  }

  revalidatePath(`/admin/penawaran/${requestId}`);
  revalidatePath("/portal/dokumen");
  return { ok: true, success: "Berkas tersimpan." };
}

export async function simpanPengirimanAction(
  requestId: string,
  _prev: LampiranState,
  formData: FormData,
): Promise<LampiranState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect(`/masuk?next=/admin/penawaran/${requestId}`);

  const courier = String(formData.get("courier") ?? "").trim();
  const tracking = String(formData.get("trackingNumber") ?? "").trim();
  if (!courier && !tracking)
    return { ok: false, error: "Isi ekspedisi atau nomor resi." };

  try {
    await simpanPengiriman({
      requestId,
      courier,
      trackingNumber: tracking,
      note: String(formData.get("note") ?? "").trim() || null,
    });
  } catch (e) {
    if (e instanceof LampiranError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal menyimpan pengiriman." };
  }

  revalidatePath(`/admin/penawaran/${requestId}`);
  revalidatePath("/portal/pengiriman");
  return { ok: true, success: "Data pengiriman tersimpan." };
}

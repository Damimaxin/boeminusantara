"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalUser, getMyQuote } from "@/lib/portal";
import { addOffer, NegotiationError } from "@/lib/admin/negotiation";

export type PortalNegoState = { ok: boolean; error?: string };

/**
 * Sekolah membalas harga: ajukan harga sendiri, terima harga Boemi, atau tolak.
 *
 * Kepemilikan diperiksa ULANG di sini, bukan hanya di halaman. Server Action
 * bisa dipanggil langsung lewat HTTP dengan id apa pun — kalau pemeriksaannya
 * cuma di halaman, sekolah lain bisa menyusup ke negosiasi orang.
 */
export async function portalNegotiateAction(
  quoteId: string,
  _prev: PortalNegoState,
  formData: FormData,
): Promise<PortalNegoState> {
  const user = await getPortalUser();
  if (!user) redirect(`/masuk?next=/portal/penawaran/${quoteId}`);

  const quote = await getMyQuote(user, quoteId);
  if (!quote) return { ok: false, error: "Penawaran tidak ditemukan." };

  const tindakan = String(formData.get("tindakan") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  if (!["offer", "accept", "reject"].includes(tindakan))
    return { ok: false, error: "Tindakan tidak dikenal." };

  let items: { requestItemId: string; qty: number; unitPrice: number }[] = [];

  if (tindakan === "offer") {
    items = quote.items.map((it) => {
      const raw = String(formData.get(`harga_${it.id}`) ?? "").trim();
      return {
        requestItemId: it.id,
        qty: it.qty,
        unitPrice: Math.max(0, Math.round(Number(raw) || 0)),
      };
    });

    if (items.some((i) => i.unitPrice <= 0))
      return { ok: false, error: "Semua harga harus diisi dengan angka di atas nol." };
  }

  try {
    await addOffer({
      requestId: quoteId,
      actor: "buyer",
      kind: tindakan as "offer" | "accept" | "reject",
      note: catatan,
      createdBy: user.email,
      items: tindakan === "offer" ? items : undefined,
    });
  } catch (e) {
    if (e instanceof NegotiationError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal mengirim. Coba lagi." };
  }

  revalidatePath(`/portal/penawaran/${quoteId}`);
  revalidatePath("/portal");
  revalidatePath(`/admin/penawaran/${quoteId}`);
  return { ok: true };
}

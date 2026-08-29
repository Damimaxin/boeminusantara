"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalUser, getMyQuote } from "@/lib/portal";
import { tandaiDiterima, LampiranError } from "@/lib/admin/attachments";

export type TerimaState = { ok: boolean; error?: string };

/**
 * Sekolah menyatakan barang diterima. Ini pengunci serah terima — bukan
 * fotonya. Waktu dan pelakunya dicatat server, dan tidak bisa ditimpa sekali
 * sudah ditandai.
 */
export async function tandaiDiterimaAction(
  quoteId: string,
  _prev: TerimaState,
): Promise<TerimaState> {
  const user = await getPortalUser();
  if (!user) redirect(`/masuk?next=/portal/penawaran/${quoteId}`);

  // Kepemilikan diperiksa ulang di sini, bukan hanya di halaman.
  const milik = await getMyQuote(user, quoteId);
  if (!milik) return { ok: false, error: "Transaksi tidak ditemukan." };

  try {
    await tandaiDiterima(quoteId, user.email);
  } catch (e) {
    if (e instanceof LampiranError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }

  revalidatePath(`/portal/penawaran/${quoteId}`);
  revalidatePath("/portal/pengiriman");
  revalidatePath("/portal");
  return { ok: true };
}

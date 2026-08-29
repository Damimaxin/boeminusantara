"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal";
import { submitRating, submitComplaint } from "@/lib/complaints";

export type UlasanState = { ok: boolean; error?: string; success?: string };

export async function kirimRatingAction(
  _prev: UlasanState,
  formData: FormData,
): Promise<UlasanState> {
  const user = await getPortalUser();
  if (!user) redirect("/masuk?next=/portal");

  const requestId = String(formData.get("requestId") ?? "");
  const stars = Number(formData.get("stars"));
  const comment = String(formData.get("comment") ?? "");

  const r = await submitRating(user, requestId, stars, comment);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/portal/penawaran/${requestId}`);
  return { ok: true, success: "Terima kasih atas penilaian Anda." };
}

export async function kirimKomplainAction(
  _prev: UlasanState,
  formData: FormData,
): Promise<UlasanState> {
  const user = await getPortalUser();
  if (!user) redirect("/masuk?next=/portal");

  const requestId = String(formData.get("requestId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");

  const r = await submitComplaint(user, requestId, subject, message);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/portal/penawaran/${requestId}`);
  return { ok: true, success: "Keluhan terkirim. Tim kami akan menindaklanjuti." };
}

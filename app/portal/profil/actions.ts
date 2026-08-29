"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalUser, saveMyProfile } from "@/lib/portal";

export type ProfilState = { ok: boolean; error?: string; success?: string };

export async function saveProfilAction(
  _prev: ProfilState,
  formData: FormData,
): Promise<ProfilState> {
  const user = await getPortalUser();
  if (!user) redirect("/masuk?next=/portal/profil");

  const ambil = (k: string) => String(formData.get(k) ?? "").trim();
  const tahun = Number(ambil("budgetYear"));

  if (!ambil("institution"))
    return { ok: false, error: "Nama instansi wajib diisi." };

  try {
    await saveMyProfile(user, {
      institution: ambil("institution"),
      npwp: ambil("npwp"),
      address: ambil("address"),
      city: ambil("city"),
      postalCode: ambil("postalCode"),
      phone: ambil("phone"),
      officerName: ambil("officerName"),
      officerNip: ambil("officerNip"),
      officerRole: ambil("officerRole"),
      budgetYear: Number.isFinite(tahun) && tahun > 2000 ? tahun : null,
      budgetSource: ambil("budgetSource"),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  revalidatePath("/portal/profil");
  revalidatePath("/portal");
  return { ok: true, success: "Profil instansi tersimpan." };
}

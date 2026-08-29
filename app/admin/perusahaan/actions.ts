"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveCompanyProfile } from "@/lib/admin/company";
import { checkAdmin } from "@/lib/admin/auth";

export type CompanyFormState = { ok: boolean; error?: string; success?: string };

export async function saveCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/perusahaan");

  const ambil = (k: string) => String(formData.get(k) ?? "").trim();

  const nama = ambil("nama");
  const npwp = ambil("npwp");
  const penandatangan = ambil("penandatangan");

  if (!nama) return { ok: false, error: "Nama perusahaan wajib diisi." };
  if (!npwp) return { ok: false, error: "NPWP wajib diisi — tercetak di setiap surat." };
  if (!penandatangan)
    return { ok: false, error: "Nama penanda tangan wajib diisi." };

  try {
    await saveCompanyProfile({
      nama,
      npwp,
      alamat: ambil("alamat"),
      kota: ambil("kota"),
      telepon: ambil("telepon"),
      email: ambil("email"),
      penandatangan,
      jabatan: ambil("jabatan"),
      kodeSurat: ambil("kodeSurat") || "BNKB",
      bankName: ambil("bankName"),
      bankAccount: ambil("bankAccount"),
      bankHolder: ambil("bankHolder"),
      pdnStatement: ambil("pdnStatement"),
      termDays: Math.max(1, Number(ambil("termDays")) || 14),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  revalidatePath("/admin/perusahaan");
  return { ok: true, success: "Identitas perusahaan tersimpan." };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addStaff, removeStaff } from "@/lib/admin/staff";
import { checkAdmin, isOwnerEmail } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/audit";

export type StaffFormState = { ok: boolean; error?: string; success?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mengelola admin = kuasa PEMILIK, bukan sekadar admin. Server Action bisa
 * dipanggil langsung lewat HTTP, jadi cek ini tidak boleh cuma di halaman.
 */
async function requireOwner() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/pengguna");
  if (!isOwnerEmail(gate.email)) redirect("/admin");
  return gate;
}

export async function addStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const gate = await requireOwner();

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email tidak valid." };
  if (!name) return { ok: false, error: "Nama wajib diisi." };

  try {
    await addStaff({ email, name, addedBy: gate.ok ? gate.email : "" });
    await recordAudit({ action: "admin.tambah", target: email, detail: { nama: name } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menambah admin." };
  }

  revalidatePath("/admin/pengguna");
  return {
    ok: true,
    success: `${name} ditambahkan. Minta yang bersangkutan mendaftar di /daftar memakai email ${email}.`,
  };
}

export async function removeStaffAction(formData: FormData): Promise<void> {
  const gate = await requireOwner();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  // Jangan biarkan admin mencabut akses dirinya sendiri lalu terkunci di luar.
  if (gate.ok && email.toLowerCase() === gate.email.toLowerCase()) return;

  await removeStaff(email);
  await recordAudit({ action: "admin.cabut", target: email });
  revalidatePath("/admin/pengguna");
}

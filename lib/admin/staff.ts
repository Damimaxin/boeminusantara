import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { ownerAllowlist } from "@/lib/admin/auth";

export type StaffRow = {
  email: string;
  name: string;
  addedBy: string | null;
  createdAt: string;
};

export type AdminPerson = StaffRow & {
  /** Pemilik berasal dari setelan server, tidak bisa dihapus lewat panel. */
  isOwner: boolean;
};

/** Semua orang yang bisa masuk panel: pemilik (env) + staf (tabel). */
export async function listAdminPeople(): Promise<AdminPerson[]> {
  const sb = getAdminSupabase();
  const owners = ownerAllowlist();

  const ownerRows: AdminPerson[] = owners.map((email) => ({
    email,
    name: "Pemilik",
    addedBy: null,
    createdAt: "",
    isOwner: true,
  }));

  if (!sb) return ownerRows;

  const { data, error } = await sb
    .from("admin_users")
    .select("email, name, added_by, created_at")
    .order("created_at");

  if (error || !data) return ownerRows;

  const staff: AdminPerson[] = (
    data as { email: string; name: string; added_by: string | null; created_at: string }[]
  )
    // Kalau email yang sama juga ada di env, tampilkan sekali saja sebagai pemilik.
    .filter((r) => !owners.includes(r.email.toLowerCase()))
    .map((r) => ({
      email: r.email,
      name: r.name,
      addedBy: r.added_by,
      createdAt: r.created_at,
      isOwner: false,
    }));

  return [...ownerRows, ...staff];
}

export async function addStaff(input: {
  email: string;
  name: string;
  addedBy: string;
}): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung.");

  const { error } = await sb.from("admin_users").insert({
    email: input.email.toLowerCase(),
    name: input.name,
    added_by: input.addedBy,
  });

  if (error) {
    if (/duplicate key/i.test(error.message))
      throw new Error("Email itu sudah terdaftar sebagai admin.");
    throw new Error(error.message);
  }
}

export async function removeStaff(email: string): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung.");

  // Pemilik dari env memang tidak ada di tabel, tapi cek ini bikin niat kodenya
  // eksplisit: akses pemilik tidak boleh dicabut lewat panel.
  if (ownerAllowlist().includes(email.toLowerCase()))
    throw new Error("Akun pemilik tidak bisa dihapus dari panel.");

  const { error } = await sb.from("admin_users").delete().eq("email", email.toLowerCase());
  if (error) throw new Error(error.message);
}

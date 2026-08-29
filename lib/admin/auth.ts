import "server-only";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Gerbang admin — SATU sumber kebenaran, dipakai middleware & layout /admin.
 *
 * Prinsip (aturan besi RVSL): FAIL-CLOSED. Kalau ragu, tolak.
 * - ADMIN_EMAILS kosong  → TIDAK ADA yang boleh masuk (dulu: semua user login boleh).
 * - Supabase belum diset → tidak ada session yang bisa diverifikasi → tolak.
 *
 * Pagar dipasang dua lapis (middleware + server layout) supaya satu lapis jebol
 * tidak langsung membuka panel admin.
 */

/**
 * Admin PEMILIK dari env ADMIN_EMAILS. Tidak bisa dihapus lewat panel —
 * ini jaring pengaman supaya panel tidak mungkin terkunci total.
 */
export function ownerAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isOwnerEmail = (email: string | null | undefined) =>
  Boolean(email) && ownerAllowlist().includes(email!.toLowerCase());

/** Staf admin tambahan yang dikelola client lewat /admin/pengguna. */
export async function listStaffEmails(): Promise<string[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("admin_users").select("email");
  if (error || !data) return [];
  return (data as { email: string }[]).map((r) => r.email.toLowerCase());
}

/**
 * True kalau email ini boleh masuk panel: pemilik (env) atau staf (tabel).
 * FAIL-CLOSED: kedua sumber kosong = tidak ada yang boleh masuk.
 */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const e = email.toLowerCase();
  if (ownerAllowlist().includes(e)) return true;
  return (await listStaffEmails()).includes(e);
}

export type AdminCheck =
  | { ok: true; email: string; isOwner: boolean }
  | { ok: false; reason: "no-auth-config" | "no-session" | "not-admin" };

/**
 * Verifikasi session dari cookie DI SERVER (bukan cuma middleware).
 * Pakai getUser() — memvalidasi token ke Supabase, bukan percaya isi cookie.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "no-auth-config" };

  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, reason: "no-auth-config" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, reason: "no-session" };
  if (!(await isAdminEmail(user.email))) return { ok: false, reason: "not-admin" };

  return { ok: true, email: user.email!, isOwner: isOwnerEmail(user.email) };
}

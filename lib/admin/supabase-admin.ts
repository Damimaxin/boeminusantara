import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk operasi ADMIN (server-only).
 *
 * - Kalau `SUPABASE_SERVICE_ROLE_KEY` tersedia → pakai service role (bypass RLS)
 *   supaya admin bisa tulis produk/stok. Key ini WAJIB server-only, jangan
 *   pernah bocor ke client bundle.
 * - Kalau tidak ada service role tapi anon key ada → jatuh ke anon (read jalan,
 *   write mungkin ditolak RLS — itu wajar, tinggal set service role nanti).
 * - Kalau env kosong sama sekali → null → data layer jatuh ke SEED_PRODUCTS
 *   (mode "preview / belum terhubung DB").
 */
function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  return url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        // WAJIB: seluruh tabel Boemi ada di schema `boemi`, bukan `public`
        // (schema public dipakai bersama aplikasi RVSL lain di project Supabase
        // yang sama). Tanpa baris ini semua query mengenai schema kosong dan
        // data layer diam-diam jatuh ke SEED_PRODUCTS — kelihatan "jalan"
        // padahal tidak menyentuh database sama sekali.
        db: { schema: "boemi" },
      })
    : null;
}

let cached: ReturnType<typeof makeAdminClient> | undefined;

export function getAdminSupabase() {
  if (cached === undefined) cached = makeAdminClient();
  return cached;
}

/** True kalau ada koneksi DB apa pun (service role atau anon). */
export const isAdminDbConnected = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );

/** True kalau bisa TULIS aman (punya service role). Dipakai untuk peringatan UI. */
export const hasServiceRole = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public (anon) Supabase client untuk read data storefront (produk, kategori).
 * Auth berbasis cookie (Email + Google) akan pakai @supabase/ssr terpisah nanti.
 *
 * Kalau env belum diset, kembalikan null → data layer jatuh ke SEED_PRODUCTS.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  cached = url && key ? createClient(url, key) : null;
  return cached;
}

export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

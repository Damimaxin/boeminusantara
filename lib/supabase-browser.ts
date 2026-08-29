import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://ospkhjgjrxlogjlegftf.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcGtoamdqcnhsb2dqbGVnZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM1MzcsImV4cCI6MjEwMjE0OTUzN30.R5Gv5-Vf-q5w6z-W6z6z";

let cached: SupabaseClient | null | undefined;

export function createBrowserSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

  cached = createBrowserClient(url, key);
  return cached;
}

export const isSupabaseConfiguredBrowser = () => true;

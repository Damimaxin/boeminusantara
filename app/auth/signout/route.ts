import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { publicOrigin } from "@/lib/site-url";

/**
 * Sign out. Dipanggil via POST (form) supaya tidak terpicu prefetch/GET tak sengaja.
 */
export async function POST(request: NextRequest) {
  const origin = publicOrigin(request);
  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}

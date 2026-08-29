import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { publicOrigin } from "@/lib/site-url";

/**
 * Konfirmasi tautan email (pemulihan sandi / verifikasi akun) pola SSR resmi.
 *
 * Beda dari /auth/callback yang menukar `?code=` (alur PKCE, dipakai OAuth):
 * di sini kita menukar `token_hash` — bentuk yang dipakai tautan dari email.
 * Ini penting karena alur email yang lain menaruh token di belakang tanda `#`,
 * dan potongan itu TIDAK PERNAH dikirim browser ke server, jadi tidak bisa
 * diproses di sisi server sama sekali.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (tokenHash && type) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as "recovery" | "email" | "invite" | "magiclink",
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/masuk?error=tautan`);
}

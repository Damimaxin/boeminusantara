import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { publicOrigin } from "@/lib/site-url";

/**
 * Callback OAuth (Google) & konfirmasi email.
 * Supabase mengarahkan ke sini dengan ?code=... → tukar jadi session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const code = searchParams.get("code");

  // 'next' opsional: ke mana diarahkan setelah login berhasil.
  // Hanya path relatif satu-origin yang diterima — "//situs-lain.com" ditolak
  // supaya tautan login tidak bisa dipakai melempar orang ke situs asing.
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Gagal / tanpa code → kembali ke halaman masuk dengan penanda error.
  return NextResponse.redirect(`${origin}/masuk?error=auth`);
}

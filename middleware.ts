import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function internalGate(request: NextRequest): NextResponse | null {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();
  if (!host.startsWith("internal.")) return null;

  const p = request.nextUrl.pathname;
  const boleh =
    p.startsWith("/admin") ||
    p.startsWith("/dokumen") ||
    p.startsWith("/masuk") ||
    p.startsWith("/auth") ||
    p.startsWith("/atur-sandi") ||
    p.startsWith("/lupa-sandi") ||
    p.startsWith("/_next") ||
    p === "/favicon.ico";

  if (boleh) return null;

  const ke = request.nextUrl.clone();
  ke.pathname = "/admin";
  ke.search = "";
  return NextResponse.redirect(ke);
}

export async function middleware(request: NextRequest) {
  const gerbangInternal = internalGate(request);
  if (gerbangInternal) return gerbangInternal;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ospkhjgjrxlogjlegftf.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcGtoamdqcnhsb2dqbGVnZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM1MzcsImV4cCI6MjEwMjE0OTUzN30.R5Gv5-Vf-q5w6z-W6z6z";

  let supabaseResponse = NextResponse.next({ request });

  if (!url || !key) {
    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/portal")
    ) {
      return new NextResponse("Admin dinonaktifkan: autentikasi belum dikonfigurasi.", {
        status: 503,
      });
    }
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/portal")
    ) {
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/masuk";
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch {
    // Edge runtime fallback
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

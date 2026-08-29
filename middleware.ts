import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();

  const { pathname } = request.nextUrl;

  // 1. Subdomain Rewrite: admin.boeminusantara.com/ -> /admin internally
  const isAdminSubdomain = host.startsWith("admin.") || host.startsWith("internal.");

  if (isAdminSubdomain && pathname === "/") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.rewrite(adminUrl);
  }

  // 2. Supabase Auth Guard for /admin and /portal
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ospkhjgjrxlogjlegftf.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcGtoamdqcnhsb2dqbGVnZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM1MzcsImV4cCI6MjEwMjE0OTUzN30.R5Gv5-Vf-q5w6z-W6z6z";

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/portal");

    if (isProtected && !user) {
      if (!pathname.startsWith("/masuk")) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/masuk";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch {
    // Fallback for auth
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

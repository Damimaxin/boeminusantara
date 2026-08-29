import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();

  const { pathname } = request.nextUrl;
  const isAdminDomain = host.startsWith("admin.") || host.startsWith("internal.");
  const isMainDomain = !isAdminDomain;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ospkhjgjrxlogjlegftf.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcGtoamdqcnhsb2dqbGVnZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM1MzcsImV4cCI6MjEwMjE0OTUzN30.R5Gv5-Vf-q5w6z-W6z6z";

  let response = NextResponse.next({ request });

  // On main domain (boeminusantara.com), redirect /masuk to admin subdomain
  // Portal Klien stays at /portal but uses admin subdomain for login
  if (isMainDomain && pathname.startsWith("/masuk")) {
    const adminLoginUrl = new URL(request.url);
    adminLoginUrl.host = `admin.${adminLoginUrl.host.replace(/^www\./, "")}`;
    adminLoginUrl.pathname = "/masuk";
    return NextResponse.redirect(adminLoginUrl);
  }

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

    // Admin subdomain: redirect unauthenticated users to login
    if (isAdminDomain && !user) {
      if (
        !pathname.startsWith("/masuk") &&
        !pathname.startsWith("/auth") &&
        !pathname.startsWith("/atur-sandi") &&
        !pathname.startsWith("/lupa-sandi")
      ) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/masuk";
        loginUrl.searchParams.set("next", "/admin");
        return NextResponse.redirect(loginUrl);
      }
    }

    // Portal Klien (/portal): redirect unauthenticated users to admin subdomain login
    if (isMainDomain && pathname.startsWith("/portal") && !user) {
      if (
        !pathname.startsWith("/masuk") &&
        !pathname.startsWith("/auth") &&
        !pathname.startsWith("/atur-sandi") &&
        !pathname.startsWith("/lupa-sandi")
      ) {
        const adminLoginUrl = request.nextUrl.clone();
        adminLoginUrl.host = `admin.${adminLoginUrl.host.replace(/^www\./, "")}`;
        adminLoginUrl.pathname = "/masuk";
        adminLoginUrl.searchParams.set("next", "/portal");
        return NextResponse.redirect(adminLoginUrl);
      }
    }
  } catch {
    // Edge runtime fallback
  }

  // If logged in on admin subdomain and accessing root "/", rewrite to /admin
  if (isAdminDomain && pathname === "/") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.rewrite(adminUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

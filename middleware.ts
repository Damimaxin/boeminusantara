import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ospkhjgjrxlogjlegftf.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcGtoamdqcnhsb2dqbGVnZnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM1MzcsImV4cCI6MjEwMjE0OTUzN30.FzUsEGbikAoTWQRz-_ikcKyXQuniMPwRXhzlweXU7aM";

export async function middleware(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  ).toLowerCase();

  const { pathname } = request.nextUrl;
  const isAdminDomain = host.startsWith("admin.") || host.startsWith("internal.");
  const isMainDomain = !isAdminDomain;

  // Skip auth check for non-protected paths on main domain
  const isAdminPath = pathname.startsWith("/admin");
  const isPortalPath = pathname.startsWith("/portal");
  const isAuthPath =
    pathname.startsWith("/masuk") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/atur-sandi") ||
    pathname.startsWith("/lupa-sandi") ||
    pathname.startsWith("/daftar");

  // On main domain: redirect /masuk to admin subdomain
  if (isMainDomain && pathname.startsWith("/masuk")) {
    const adminUrl = new URL(request.url);
    const mainHost = adminUrl.hostname.replace(/^www\./, "");
    adminUrl.hostname = `admin.${mainHost}`;
    adminUrl.pathname = "/masuk";
    return NextResponse.redirect(adminUrl);
  }

  // Only run Supabase auth check when actually needed
  const needsAuthCheck =
    isAdminDomain || isAdminPath || isPortalPath;

  if (!needsAuthCheck) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  let hasSession = false;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    // Use getSession() — reads from cookie, no network round-trip, fast on Edge
    const { data: { session } } = await supabase.auth.getSession();
    hasSession = !!session;
  } catch {
    // If auth check fails, fail open for main domain, fail closed for admin
    hasSession = isMainDomain;
  }

  // Admin subdomain: redirect unauthenticated to login
  if (isAdminDomain && !hasSession && !isAuthPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/masuk";
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  // Portal Klien on main domain: redirect unauthenticated to admin login
  if (isMainDomain && isPortalPath && !hasSession) {
    const adminLoginUrl = request.nextUrl.clone();
    const mainHost = adminLoginUrl.hostname.replace(/^www\./, "");
    adminLoginUrl.hostname = `admin.${mainHost}`;
    adminLoginUrl.pathname = "/masuk";
    adminLoginUrl.searchParams.set("next", "/portal");
    return NextResponse.redirect(adminLoginUrl);
  }

  // Admin subdomain root "/" → rewrite to /admin
  if (isAdminDomain && pathname === "/" && hasSession) {
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

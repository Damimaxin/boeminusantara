"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createBrowserSupabase,
  isSupabaseConfiguredBrowser,
} from "@/lib/supabase-browser";

/** Login Google baru muncul kalau provider-nya dinyalakan di Supabase. */
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true";

/**
 * Tujuan setelah login, dari ?next=. Hanya path relatif satu-origin yang
 * diterima ("/admin"); "//jahat.com" & URL absolut ditolak → open-redirect.
 */
function safeNext(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function MasukPage() {
  const configured = isSupabaseConfiguredBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError("Email atau kata sandi salah. Coba lagi.");
      return;
    }
    // Berhasil → balik ke halaman tujuan (mis. /admin). Middleware sinkron cookie.
    window.location.assign(safeNext());
  }

  async function handleGoogleLogin() {
    setError(null);
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Gagal masuk dengan Google. Coba lagi.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded border border-line bg-paper p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Masuk</h1>
        <p className="mt-1 text-sm text-mute">
          Masuk untuk melacak pesanan dan menyimpan alamat pengiriman.
        </p>

        {!configured ? (
          <div className="mt-6 rounded border border-line bg-paper-dim p-4 text-sm text-ink-soft">
            Autentikasi belum dikonfigurasi. Silakan hubungi pengelola toko.
          </div>
        ) : (
          <>
            <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-ink-soft"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-navy"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-ink-soft"
                >
                  Kata sandi
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-navy"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <p className="text-sm text-red" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-deep disabled:opacity-60"
              >
                {loading ? "Memproses…" : "Masuk"}
              </button>
            </form>

            {/* Tombol Google hanya muncul kalau providernya memang dinyalakan
                di Supabase. Sebelumnya selalu tampil padahal provider mati —
                yang menekan cuma dapat error tanpa penjelasan. */}
            {GOOGLE_ENABLED && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-mute">
                  <span className="h-px flex-1 bg-line" />
                  atau
                  <span className="h-px flex-1 bg-line" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-dim"
                >
                  <GoogleIcon />
                  Masuk dengan Google
                </button>
              </>
            )}

            <p className="mt-4 text-center text-sm">
              <Link href="/lupa-sandi" className="text-navy hover:underline">
                Lupa kata sandi?
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-mute">
              Belum punya akun?{" "}
              <Link href="/daftar" className="font-medium text-navy hover:underline">
                Daftar
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

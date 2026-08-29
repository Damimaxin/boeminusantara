"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createBrowserSupabase,
  isSupabaseConfiguredBrowser,
} from "@/lib/supabase-browser";

export default function DaftarPage() {
  const configured = isSupabaseConfiguredBrowser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Simpan nama juga ke user metadata (berguna sebelum profil dibuat).
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setError(
        error.message.includes("already")
          ? "Email ini sudah terdaftar. Silakan masuk."
          : "Gagal mendaftar. Periksa data lalu coba lagi.",
      );
      return;
    }

    // Kalau session langsung aktif (email confirmation OFF), user.id tersedia →
    // simpan nama ke customer_profiles. Kalau perlu konfirmasi email, upsert
    // profil dilakukan setelah callback (nama tersimpan di user metadata).
    const userId = data.user?.id;
    if (userId && data.session) {
      await supabase
        .from("customer_profiles")
        .upsert({ id: userId, full_name: fullName });
    }

    setLoading(false);

    if (data.session) {
      // Sudah login → ke beranda.
      window.location.assign("/");
    } else {
      // Butuh konfirmasi email.
      setDone(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded border border-line bg-paper p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Daftar</h1>
        <p className="mt-1 text-sm text-mute">
          Buat akun untuk melacak pesanan dan menyimpan alamat pengiriman.
        </p>

        {!configured ? (
          <div className="mt-6 rounded border border-line bg-paper-dim p-4 text-sm text-ink-soft">
            Autentikasi belum dikonfigurasi. Silakan hubungi pengelola toko.
          </div>
        ) : done ? (
          <div className="mt-6 rounded border border-line bg-paper-dim p-4 text-sm text-ink-soft">
            Cek email <span className="font-medium text-ink">{email}</span> untuk
            menyelesaikan pendaftaran. Klik tautan konfirmasi lalu masuk.
          </div>
        ) : (
          <>
            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-ink-soft"
                >
                  Nama lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-navy"
                  placeholder="Nama kamu"
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-navy"
                  placeholder="Minimal 6 karakter"
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
                {loading ? "Memproses…" : "Daftar"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-mute">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="font-medium text-navy hover:underline">
                Masuk
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createBrowserSupabase,
  isSupabaseConfiguredBrowser,
} from "@/lib/supabase-browser";

/**
 * Minta tautan atur ulang kata sandi.
 *
 * Pesan sukses sengaja tidak membedakan email terdaftar atau tidak — kalau
 * dibedakan, halaman ini jadi alat untuk menebak siapa saja yang punya akun.
 */
export default function LupaSandiPage() {
  const configured = isSupabaseConfiguredBrowser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    setSending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atur-sandi`,
    });
    setSending(false);
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded border border-line bg-paper p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Lupa Kata Sandi</h1>

        {!configured ? (
          <p className="mt-4 text-sm text-ink-soft">
            Autentikasi belum dikonfigurasi. Hubungi pengelola.
          </p>
        ) : sent ? (
          <p className="mt-3 text-sm text-ink-soft">
            Kalau email itu terdaftar, tautan atur ulang sudah dikirim. Periksa
            kotak masuk dan folder spam. Tautan berlaku sebentar saja.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-mute">
              Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-navy"
                placeholder="nama@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-deep disabled:opacity-60"
            >
              {sending ? "Mengirim…" : "Kirim Tautan"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-mute">
          <Link href="/masuk" className="font-medium text-navy hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </main>
  );
}

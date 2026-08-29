"use client";

import { useEffect, useState } from "react";
import {
  createBrowserSupabase,
  isSupabaseConfiguredBrowser,
} from "@/lib/supabase-browser";

/**
 * Halaman atur ulang kata sandi.
 *
 * Dibuka lewat tautan pemulihan: tautan itu menukar diri jadi sesi login
 * sementara, lalu halaman ini memakai sesi tersebut untuk memasang sandi baru.
 * Tanpa sesi yang sah, form tidak bisa dipakai — jadi tautan orang lain tidak
 * bisa dipakai mengganti sandi akun ini.
 */
const MIN_LENGTH = 8;

export default function AturSandiPage() {
  const configured = isSupabaseConfiguredBrowser();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    (async () => {
      // Sebagian tautan email menaruh token di belakang tanda '#'. Potongan itu
      // tidak pernah dikirim ke server, jadi harus dipungut di browser.
      const hash = window.location.hash.startsWith("#")
        ? new URLSearchParams(window.location.hash.slice(1))
        : null;
      const accessToken = hash?.get("access_token");
      const refreshToken = hash?.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Bersihkan token dari alamat supaya tidak tertinggal di riwayat browser.
        window.history.replaceState(null, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));
      setReady(true);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Kata sandi minimal ${MIN_LENGTH} karakter.`);
      return;
    }
    if (password !== confirm) {
      setError("Dua kolom kata sandi belum sama.");
      return;
    }

    const supabase = createBrowserSupabase();
    if (!supabase) return;

    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (err) {
      setError("Gagal menyimpan kata sandi. Tautan mungkin sudah kedaluwarsa.");
      return;
    }
    setDone(true);
  }

  const field =
    "mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-navy";
  const label = "block text-sm font-medium text-ink-soft";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded border border-line bg-paper p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Atur Kata Sandi</h1>

        {!configured ? (
          <p className="mt-4 text-sm text-ink-soft">
            Autentikasi belum dikonfigurasi. Hubungi pengelola.
          </p>
        ) : !ready ? (
          <p className="mt-4 text-sm text-mute">Memeriksa tautan…</p>
        ) : done ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Kata sandi baru tersimpan. Silakan lanjut ke panel.
            </p>
            <a
              href="/admin"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded bg-navy text-sm font-medium text-paper hover:bg-navy-deep"
            >
              Buka Panel Admin
            </a>
          </>
        ) : !hasSession ? (
          <p className="mt-3 text-sm text-ink-soft">
            Tautan tidak berlaku atau sudah kedaluwarsa. Minta tautan baru ke
            pengelola, lalu buka halaman ini lewat tautan tersebut.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-mute">
              Buat kata sandi baru. Minimal {MIN_LENGTH} karakter.
            </p>

            <div>
              <label htmlFor="password" className={label}>
                Kata sandi baru
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </div>

            <div>
              <label htmlFor="confirm" className={label}>
                Ulangi kata sandi
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={field}
              />
            </div>

            {error && (
              <p className="text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-paper transition hover:bg-navy-deep disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan Kata Sandi"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

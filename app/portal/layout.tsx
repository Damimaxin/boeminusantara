import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal";

export const metadata: Metadata = {
  title: { default: "Portal Klien · Boemi Nusantara", template: "%s · Portal Boemi" },
  // Isinya data transaksi instansi — jangan sampai terindeks mesin pencari.
  robots: { index: false, follow: false },
};

const MENU = [
  { href: "/portal", label: "Beranda" },
  { href: "/portal/transaksi", label: "Transaksi" },
  { href: "/portal/dokumen", label: "Dokumen" },
  { href: "/portal/pengiriman", label: "Pengiriman" },
  { href: "/portal/aset", label: "Aset & Perawatan" },
  { href: "/portal/profil", label: "Profil Instansi" },
  { href: "/", label: "Katalog" },
];

/**
 * Portal untuk PEMBELI (sekolah & instansi) — sengaja terpisah dari /admin.
 * Chrome-nya beda, menunya beda, dan datanya disaring per pemakai di server.
 *
 * Gerbangnya cuma "sudah login": siapa pun boleh punya akun pembeli. Yang
 * membatasi bukan siapa dia, tapi data mana yang tampil — lihat lib/portal.ts.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getPortalUser();
  if (!user) redirect("/masuk?next=/portal");

  return (
    <div className="min-h-screen bg-[var(--color-paper-dim)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight text-[var(--color-navy)]">
                BOEMI
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-mute)]">
                Portal Klien
              </span>
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              {MENU.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)]"
                >
                  {m.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-mute)]">
            <span>{user.email}</span>
            <Link href="/" className="hover:text-[var(--color-navy)]">
              Katalog
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded border border-[var(--color-line)] px-2 py-1 transition hover:bg-[var(--color-paper-dim)]"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

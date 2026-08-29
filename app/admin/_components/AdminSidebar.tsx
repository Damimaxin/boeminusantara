"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; exact?: boolean; owner?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/kategori", label: "Kategori & Sub-kategori" },
  { href: "/admin/stok", label: "Stok" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/penawaran", label: "Penawaran" },
  { href: "/admin/komplain", label: "Komplain" },
  { href: "/admin/pelanggan", label: "Pelanggan" },
  { href: "/admin/artikel", label: "Artikel" },
  { href: "/admin/banner", label: "Banner" },
  { href: "/admin/halaman", label: "Halaman" },
  { href: "/admin/pengguna", label: "Pengguna Admin", owner: true },
  { href: "/admin/perusahaan", label: "Identitas Perusahaan" },
  { href: "/admin/panduan", label: "Panduan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export function AdminSidebar({ isOwner = false }: { isOwner?: boolean }) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-navy)] text-[var(--color-paper)]">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-red)] text-sm font-bold">
          B
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold">Boemi Nusantara</div>
          <div className="text-[10px] uppercase tracking-wide text-white/60">
            Panel Admin
          </div>
        </div>
      </div>

      {/* Navigasi */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.filter((item) => !item.owner || isOwner).map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "block rounded-[var(--radius-card)] px-3 py-2 text-sm transition " +
                    (active
                      ? "bg-white/15 font-medium text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white")
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer sidebar */}
      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/50">
        <a
          href={
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname.endsWith(".localhost") ||
              window.location.hostname === "127.0.0.1")
              ? "http://localhost:3000"
              : process.env.NEXT_PUBLIC_SITE_URL || "https://boeminusantara.com"
          }
          className="hover:text-white/80 transition inline-block"
        >
          ← Kembali ke toko
        </a>
      </div>
    </aside>
  );
}

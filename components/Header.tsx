import Link from "next/link";
import Image from "next/image";
import QuoteNavButton from "@/components/QuoteNavButton";
import CartNavButton from "@/components/CartNavButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur">
      {/* Bar validitas + kontak resmi perusahaan */}
      <div className="bg-[var(--color-navy)] text-[var(--color-paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-paper)] text-[10px] font-bold text-[var(--color-navy)]">
              ✓
            </span>
            Vendor Resmi Terverifikasi
          </span>
          <span className="hidden items-center gap-2.5 text-[color-mix(in_srgb,var(--color-paper)_80%,transparent)] sm:inline-flex">
            <a href="tel:+622155717126" className="hover:underline">
              (021) 55717126
            </a>
            <span aria-hidden>·</span>
            <a href="mailto:info@boeminusantara.com" className="hover:underline">
              info@boeminusantara.com
            </a>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/boemi-mark.png"
            alt="Boemi Nusantara"
            width={53}
            height={30}
            priority
            className="h-7 w-auto sm:h-8"
          />
          <span className="hidden sm:block">
            <span className="text-base font-semibold tracking-tight text-[var(--color-navy)] sm:text-lg">
              BOEMI
            </span>
            <span className="ml-1 text-base font-light tracking-[0.2em] text-[var(--color-mute)] sm:text-lg">
              NUSANTARA
            </span>
          </span>
        </Link>

        <form action="/cari" className="relative flex-1">
          <input
            name="q"
            type="search"
            placeholder="Cari alat praktik SMK…"
            className="h-11 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3.5 text-sm outline-none transition focus:border-[var(--color-navy)] focus:bg-[var(--color-paper)]"
            aria-label="Cari produk"
          />
        </form>

        <nav className="flex shrink-0 items-center gap-1 text-sm">
          <Link
            href="/edukasi"
            className="hidden min-h-11 items-center rounded-[var(--radius-card)] px-3 text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)] md:inline-flex"
          >
            Edukasi
          </Link>
          <Link
            href="/portal"
            className="hidden min-h-11 items-center rounded-[var(--radius-card)] px-3 text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)] md:inline-flex"
          >
            Portal Klien
          </Link>
          <Link
            href="/masuk"
            className="hidden min-h-11 items-center rounded-[var(--radius-card)] px-3 text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)] sm:inline-flex"
          >
            Masuk
          </Link>
          <QuoteNavButton />
          <CartNavButton />
        </nav>
      </div>
    </header>
  );
}

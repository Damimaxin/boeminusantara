import Link from "next/link";

/** Remah roti: "Beranda / <label>". */
export default function Breadcrumb({ label }: { label: string }) {
  return (
    <nav
      aria-label="Remah roti"
      className="mx-auto max-w-6xl px-4 pt-6 text-sm text-[var(--color-mute)]"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="transition hover:text-[var(--color-navy)]"
          >
            Beranda
          </Link>
        </li>
        <li aria-hidden className="text-[var(--color-line)]">
          /
        </li>
        <li aria-current="page" className="text-[var(--color-ink-soft)]">
          {label}
        </li>
      </ol>
    </nav>
  );
}

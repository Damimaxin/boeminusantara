import Link from "next/link";
import { getDynamicCategories } from "@/lib/categories";

export default async function CategoryNav({ active }: { active?: string }) {
  const categories = await getDynamicCategories();

  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3">
        <Link
          href="/"
          className={chip(!active)}
          aria-current={!active ? "page" : undefined}
        >
          Semua
        </Link>
        <Link
          href="/cari?q=Daiden"
          className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--color-red)] bg-[var(--color-red)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          🔥 Mesin Las Daiden
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/kategori/${c.slug}`}
            className={chip(active === c.slug)}
            aria-current={active === c.slug ? "page" : undefined}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function chip(isActive: boolean): string {
  const base =
    "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition";
  return isActive
    ? `${base} border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]`
    : `${base} border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]`;
}

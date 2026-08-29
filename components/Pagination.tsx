import Link from "next/link";

/**
 * Paginasi SSR via query param `?page=`.
 * `basePath` = path halaman; `query` = param yang harus dipertahankan (sort, q, dst).
 * Halaman ditulis ke `?page=` (page 1 tidak menyertakan param, biar URL bersih).
 */
export default function Pagination({
  page,
  total,
  pageSize,
  basePath,
  query = {},
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = pageRange(current, totalPages);

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className={navBtn(false)} rel="prev">
          Sebelumnya
        </Link>
      ) : (
        <span className={navBtn(true)} aria-disabled>
          Sebelumnya
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="px-2 text-sm text-[var(--color-mute)]"
          >
            …
          </span>
        ) : p === current ? (
          <span key={p} aria-current="page" className={pageBtn(true)}>
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={pageBtn(false)}>
            {p}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link href={hrefFor(current + 1)} className={navBtn(false)} rel="next">
          Berikutnya
        </Link>
      ) : (
        <span className={navBtn(true)} aria-disabled>
          Berikutnya
        </span>
      )}
    </nav>
  );
}

/** Deret nomor halaman dengan elipsis: 1 … c-1 c c+1 … N */
function pageRange(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (p: number) => out.push(p);
  const window = 1;
  const first = 1;
  const last = total;
  const from = Math.max(first, current - window);
  const to = Math.min(last, current + window);

  add(first);
  if (from > first + 1) out.push("…");
  for (let p = from; p <= to; p++) {
    if (p !== first && p !== last) add(p);
  }
  if (to < last - 1) out.push("…");
  if (last !== first) add(last);
  return out;
}

function navBtn(disabled: boolean): string {
  const base =
    "inline-flex min-h-11 items-center rounded-md border px-3 text-sm transition";
  return disabled
    ? `${base} cursor-not-allowed border-[var(--color-line)] text-[var(--color-mute)] opacity-60`
    : `${base} border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]`;
}

function pageBtn(isActive: boolean): string {
  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm transition";
  return isActive
    ? `${base} border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]`
    : `${base} border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]`;
}

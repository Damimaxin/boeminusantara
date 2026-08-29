"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { SortKey } from "@/lib/products";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Nama A–Z" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
];

/**
 * Baris atas grid: jumlah hasil + dropdown Urutkan.
 * Ubah sort lewat query param `?sort=` (SSR); reset ke halaman 1.
 */
export default function ProductToolbar({
  total,
  sort = "name",
}: {
  total: number;
  sort?: SortKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "name") params.set("sort", value);
    else params.delete("sort");
    params.delete("page"); // sort baru → kembali ke halaman 1
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-mute)]">
        {total.toLocaleString("id-ID")} produk
      </span>
      <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <span className="text-[var(--color-mute)]">Urutkan</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="min-h-11 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm text-[var(--color-ink)] transition hover:border-[var(--color-navy)] focus:border-[var(--color-navy)] focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

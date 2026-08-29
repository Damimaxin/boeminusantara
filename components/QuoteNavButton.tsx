"use client";

import Link from "next/link";
import { useQuote } from "@/components/QuoteProvider";

export default function QuoteNavButton() {
  const { count } = useQuote();

  return (
    <Link
      href="/penawaran"
      className="relative inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-navy)] px-3 font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)]"
    >
      <span>Penawaran</span>
      <span
        aria-hidden
        className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-navy)] px-1.5 text-[11px] font-semibold leading-none text-[var(--color-paper)]"
      >
        {count}
      </span>
      <span className="sr-only">{count} item dalam permintaan penawaran</span>
    </Link>
  );
}

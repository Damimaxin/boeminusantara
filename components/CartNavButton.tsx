"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartNavButton() {
  const { count } = useCart();

  return (
    <Link
      href="/keranjang"
      className="relative inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-navy-deep)]"
    >
      <span>Keranjang</span>
      {count > 0 && (
        <span
          aria-hidden
          className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-paper)] px-1.5 text-[11px] font-semibold leading-none text-[var(--color-navy)]"
        >
          {count}
        </span>
      )}
      <span className="sr-only">{count} item dalam keranjang</span>
    </Link>
  );
}

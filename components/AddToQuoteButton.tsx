"use client";

import { useState } from "react";
import { useQuote } from "@/components/QuoteProvider";

type Props = {
  slug: string;
  name: string;
  price: number; // exclude PPN
  className?: string;
};

export default function AddToQuoteButton({
  slug,
  name,
  price,
  className,
}: Props) {
  const { addItem } = useQuote();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ slug, name, price });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={
        className ??
        "inline-flex h-12 flex-1 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-navy-deep)]"
      }
    >
      {added ? "✓ Ditambahkan" : "Tambah ke Penawaran"}
    </button>
  );
}

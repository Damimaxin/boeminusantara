"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";

type Props = {
  slug: string;
  name: string;
  price: number; // exclude PPN
  image: string | null;
  disabled?: boolean;
};

/** Tombol "Beli Langsung" — hanya dipasang untuk produk di bawah ambang RFQ. */
export default function AddToCartButton({
  slug,
  name,
  price,
  image,
  disabled,
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ slug, name, price, image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      className="inline-flex h-12 flex-1 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {added ? "✓ Masuk keranjang" : "Beli Langsung"}
    </button>
  );
}

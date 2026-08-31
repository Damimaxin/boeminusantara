import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatIDR } from "@/lib/format";
import { categoryName } from "@/lib/categories";
import ProductImage from "@/components/ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)] transition hover:border-[var(--color-navy)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--color-paper-dim)]">
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
          {categoryName(product.category)}
        </span>
        <h3 className="line-clamp-2 text-sm leading-snug text-[var(--color-ink)]">
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
          <span className="text-sm font-semibold text-[var(--color-ink)]">
            {formatIDR(product.price)}
          </span>
          <span className="ml-1 text-[11px] text-[var(--color-mute)]">
            excl. PPN
          </span>
        </div>
      </div>
    </Link>
  );
}

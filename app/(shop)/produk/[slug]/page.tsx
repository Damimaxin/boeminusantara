import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { formatIDR, ppnAmount, PPN_RATE } from "@/lib/format";
import { categoryName } from "@/lib/categories";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import AddToCartButton from "@/components/AddToCartButton";
import { isInstantBuyable } from "@/lib/checkout";

import ProductGallery from "@/components/ProductGallery";

export const revalidate = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produk tidak ditemukan" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const withPpn = product.price + ppnAmount(product.price);
  const inStock = product.stock > 0;
  // Alat besar (di atas ambang) sengaja tidak bisa dibeli online — lihat lib/checkout.ts.
  const buyable = isInstantBuyable(product.price);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <nav className="mb-6 text-sm text-[var(--color-mute)]">
        <Link href="/" className="hover:text-[var(--color-navy)]">
          Beranda
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/kategori/${product.category}`}
          className="hover:text-[var(--color-navy)]"
        >
          {categoryName(product.category)}
        </Link>
      </nav>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
        {/* Galeri Media (9 Slot Foto + 1 Slot Video) */}
        <div>
          <ProductGallery
            name={product.name}
            image={product.image}
            images={product.images}
            video={product.video}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
            {categoryName(product.category)}
          </span>
          <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {product.name}
          </h1>

          <div className="mt-5 border-y border-[var(--color-line)] py-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatIDR(product.price)}
              </span>
              <span className="text-sm text-[var(--color-mute)]">excl. PPN</span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-mute)]">
              {formatIDR(withPpn)} termasuk PPN {Math.round(PPN_RATE * 100)}%
            </p>
          </div>

          <div className="mt-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Spesifikasi
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {product.description}
            </p>
          </div>

          <div className="mt-5 text-sm">
            {inStock ? (
              <span className="inline-flex items-center gap-2 text-[var(--color-ink)]">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-[var(--color-navy)]"
                />
                Stok tersedia · {product.stock} unit
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-[var(--color-red)]">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-[var(--color-red)]"
                />
                Stok habis
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToQuoteButton
              slug={product.slug}
              name={product.name}
              price={product.price}
            />
            {buyable && (
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                price={product.price}
                image={product.image}
                disabled={!inStock}
              />
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--color-mute)]">
            {buyable
              ? "Bisa dibeli langsung dan dibayar online, atau minta surat penawaran resmi kalau pembelian atas nama instansi (PO/kontrak)."
              : "Alat ini dibeli lewat penawaran resmi: tambahkan ke penawaran, tim kami membalas dengan surat penawaran ber-PPN untuk dasar PO instansi."}{" "}
            <a
              href={`mailto:info@boeminusantara.com?subject=${encodeURIComponent(
                `Permintaan Penawaran — ${product.name}`,
              )}`}
              className="underline underline-offset-2 hover:text-[var(--color-navy)]"
            >
              atau hubungi kami
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

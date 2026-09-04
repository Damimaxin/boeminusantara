import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryNav from "@/components/CategoryNav";
import ProductGrid from "@/components/ProductGrid";
import ProductToolbar from "@/components/ProductToolbar";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import {
  getProducts,
  DEFAULT_PAGE_SIZE,
  CATEGORY_ALIASES,
  type SortKey,
} from "@/lib/products";
import { getDynamicCategories, categoryName } from "@/lib/categories";

function parseSort(v?: string): SortKey {
  return v === "price_asc" || v === "price_desc" ? v : "name";
}

const POPULAR_SLUGS = ["tkro", "titl", "toi", "tav", "tp"];

export const revalidate = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getDynamicCategories();
  const title =
    categoryName(slug, categories) !== slug
      ? categoryName(slug, categories)
      : categoryName(CATEGORY_ALIASES[slug.toLowerCase()] || slug, categories);
  return { title };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const categories = await getDynamicCategories();

  // Validate slug against top-level categories, subcategories, and aliases
  const allSlugs = new Set<string>();
  for (const c of categories) {
    allSlugs.add(c.slug.toLowerCase());
    if (c.subcategories) {
      for (const sub of c.subcategories) {
        allSlugs.add(sub.slug.toLowerCase());
      }
    }
  }
  const isAlias = Boolean(CATEGORY_ALIASES[slug.toLowerCase()]);
  if (!allSlugs.has(slug.toLowerCase()) && !isAlias) {
    notFound();
  }

  const resolvedCategory = CATEGORY_ALIASES[slug.toLowerCase()] || slug;
  const sp = await searchParams;
  const sort = parseSort(sp?.sort);
  const rawPage = sp?.page;
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1);
  const { products, total } = await getProducts({
    category: resolvedCategory,
    sort,
    page,
  });

  const catTitle =
    categoryName(slug, categories) !== slug
      ? categoryName(slug, categories)
      : categoryName(resolvedCategory, categories);

  return (
    <>
      <CategoryNav active={slug} />
      <Breadcrumb label={catTitle} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-lg font-medium tracking-tight">
          {catTitle}
        </h1>

        {total === 0 ? (
          <div className="border border-dashed border-[var(--color-line)] px-6 py-16 text-center">
            <p className="text-base font-medium text-[var(--color-ink)]">
              Belum ada produk pada kategori “{catTitle}”
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-mute)]">
              Katalog untuk kategori ini sedang diperbarui. Anda dapat menjelajahi kategori populer lainnya atau melihat seluruh produk.
            </p>
            <div className="mt-6">
              <p className="mb-3 text-xs uppercase tracking-wide text-[var(--color-mute)]">
                Kategori Populer
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SLUGS.map((popSlug) => (
                  <Link
                    key={popSlug}
                    href={`/kategori/${popSlug}`}
                    className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--color-line)] px-4 text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
                  >
                    {categoryName(popSlug, categories)}
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm">
                <Link
                  href="/"
                  className="text-[var(--color-navy)] underline underline-offset-4 hover:text-[var(--color-red)]"
                >
                  Lihat semua produk
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <ProductToolbar total={total} sort={sort} />
            <ProductGrid products={products} />
            <Pagination
              page={page}
              total={total}
              pageSize={DEFAULT_PAGE_SIZE}
              basePath={`/kategori/${slug}`}
              query={{ sort: sort !== "name" ? sort : undefined }}
            />
          </>
        )}
      </section>
    </>
  );
}

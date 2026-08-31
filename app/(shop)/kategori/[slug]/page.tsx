import { notFound } from "next/navigation";
import CategoryNav from "@/components/CategoryNav";
import ProductGrid from "@/components/ProductGrid";
import ProductToolbar from "@/components/ProductToolbar";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import {
  getProducts,
  DEFAULT_PAGE_SIZE,
  type SortKey,
} from "@/lib/products";
import { getDynamicCategories, categoryName } from "@/lib/categories";

function parseSort(v?: string): SortKey {
  return v === "price_asc" || v === "price_desc" ? v : "name";
}

export const revalidate = 10;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getDynamicCategories();
  return { title: categoryName(slug, categories) };
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
  if (!categories.some((c) => c.slug === slug)) notFound();

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const page = Math.max(1, Number(sp.page) || 1);
  const { products, total } = await getProducts({
    category: slug,
    sort,
    page,
  });

  const catTitle = categoryName(slug, categories);

  return (
    <>
      <CategoryNav active={slug} />
      <Breadcrumb label={catTitle} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-lg font-medium tracking-tight">
          {catTitle}
        </h1>
        <ProductToolbar total={total} sort={sort} />
        <ProductGrid products={products} />
        <Pagination
          page={page}
          total={total}
          pageSize={DEFAULT_PAGE_SIZE}
          basePath={`/kategori/${slug}`}
          query={{ sort: sort !== "name" ? sort : undefined }}
        />
      </section>
    </>
  );
}

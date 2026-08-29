import HeroSlider from "@/components/HeroSlider";
import BannerStrip from "@/components/BannerStrip";
import CategoryNav from "@/components/CategoryNav";
import ArticleTeasers from "@/components/ArticleTeasers";
import ProductGrid from "@/components/ProductGrid";
import ProductToolbar from "@/components/ProductToolbar";
import Pagination from "@/components/Pagination";
import {
  getProducts,
  DEFAULT_PAGE_SIZE,
  type SortKey,
} from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseSort(v?: string): SortKey {
  return v === "price_asc" || v === "price_desc" ? v : "name";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const page = Math.max(1, Number(sp.page) || 1);
  const { products, total } = await getProducts({ sort, page });

  return (
    <>
      {/* Dynamic Multi-Slide Interactive Hero Banner */}
      <HeroSlider />

      <BannerStrip />

      <CategoryNav />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-medium tracking-tight">
          Semua Produk &amp; Peralatan SMK
        </h2>
        <ProductToolbar total={total} sort={sort} />
        <ProductGrid products={products} />
        <Pagination
          page={page}
          total={total}
          pageSize={DEFAULT_PAGE_SIZE}
          basePath="/"
          query={{ sort: sort !== "name" ? sort : undefined }}
        />
      </section>

      <ArticleTeasers />
    </>
  );
}

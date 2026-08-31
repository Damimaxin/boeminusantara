import Link from "next/link";
import CategoryNav from "@/components/CategoryNav";
import ProductGrid from "@/components/ProductGrid";
import ProductToolbar from "@/components/ProductToolbar";
import Pagination from "@/components/Pagination";
import {
  getProducts,
  DEFAULT_PAGE_SIZE,
  type SortKey,
} from "@/lib/products";
import { getDynamicCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseSort(v?: string): SortKey {
  return v === "price_asc" || v === "price_desc" ? v : "name";
}

const POPULAR = ["tkro", "titl", "toi", "tav", "tp"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return { title: q ? `Cari: ${q}` : "Cari" };
}

async function EmptyState({ heading, hint }: { heading: string; hint: string }) {
  const categories = await getDynamicCategories();
  const chips = categories.filter((c) => POPULAR.includes(c.slug) || categories.length <= 15);
  return (
    <div className="border border-dashed border-[var(--color-line)] px-6 py-16 text-center">
      <p className="text-base font-medium text-[var(--color-ink)]">{heading}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-mute)]">
        {hint}
      </p>
      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-[var(--color-mute)]">
          Kategori populer
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.slug}
              href={`/kategori/${c.slug}`}
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--color-line)] px-4 text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
            >
              {c.name}
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
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const sp = await Promise.resolve(searchParams);
  const rawQ = sp?.q ?? "";
  const q = (Array.isArray(rawQ) ? rawQ[0] : rawQ).trim();
  const sort = parseSort(Array.isArray(sp?.sort) ? sp.sort[0] : sp?.sort);
  const rawPage = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const { products, total } = q
    ? await getProducts({ search: q, sort, page })
    : { products: [], total: 0 };

  return (
    <>
      <CategoryNav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5">
          <h1 className="text-lg font-medium tracking-tight">
            {q ? (
              <>
                Hasil untuk “<span className="font-semibold">{q}</span>”
              </>
            ) : (
              "Cari produk"
            )}
          </h1>
        </div>

        {!q ? (
          <EmptyState
            heading="Mulai pencarian"
            hint="Ketik nama alat, merek, atau kode di kolom pencarian di atas — atau jelajahi lewat kategori berikut."
          />
        ) : total === 0 ? (
          <EmptyState
            heading={`Tidak ada hasil untuk “${q}”`}
            hint="Coba kata kunci yang lebih umum atau periksa ejaannya. Kamu juga bisa telusuri per kategori."
          />
        ) : (
          <>
            <ProductToolbar total={total} sort={sort} />
            <ProductGrid products={products} />
            <Pagination
              page={page}
              total={total}
              pageSize={DEFAULT_PAGE_SIZE}
              basePath="/cari"
              query={{ q, sort: sort !== "name" ? sort : undefined }}
            />
          </>
        )}
      </section>
    </>
  );
}

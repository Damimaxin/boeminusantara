import Link from "next/link";
import { listAllProducts } from "@/lib/admin/products";
import { categoryName } from "@/lib/categories";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Produk" };

const LOW_STOCK_THRESHOLD = 10;

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Produk</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {products.length.toLocaleString("id-ID")} produk dalam katalog.
          </p>
        </div>
        <Link
          href="/admin/produk/baru"
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90"
        >
          + Tambah Produk
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada produk. Klik “Tambah Produk” untuk mulai.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 text-right font-medium">
                  Harga (exPPN)
                </th>
                <th className="px-4 py-3 text-right font-medium">Stok</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock <= LOW_STOCK_THRESHOLD;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-ink)]">
                        {p.name}
                      </div>
                      <div className="text-xs text-[var(--color-mute)]">
                        /{p.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                      {categoryName(p.category)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatIDR(p.price)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          p.stock <= 0
                            ? "font-semibold text-[var(--color-red)]"
                            : low
                              ? "text-[var(--color-red)]"
                              : "text-[var(--color-ink)]"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.active ? (
                        <span className="inline-flex items-center rounded-full bg-[var(--color-navy)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-navy)]">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[var(--color-line-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-mute)]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/produk/${p.id}`}
                        className="text-xs text-[var(--color-navy)] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

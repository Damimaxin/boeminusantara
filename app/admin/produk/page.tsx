import Link from "next/link";
import { listAllProducts } from "@/lib/admin/products";
import { categoryName } from "@/lib/categories";
import { formatIDR } from "@/lib/format";
import { DeleteProductButton } from "./_components/DeleteProductButton";

export const metadata = { title: "Daftar Produk" };

const LOW_STOCK_THRESHOLD = 10;

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">Katalog Produk</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Total {products.length.toLocaleString("id-ID")} produk terdaftar dalam database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/kategori"
            className="inline-flex h-10 items-center rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-paper-dim)]"
          >
            📁 Kelola Kategori
          </Link>
          <Link
            href="/admin/produk/baru"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-semibold text-[var(--color-paper)] shadow transition hover:opacity-90"
          >
            <span>🚀 + Tambah Produk Baru</span>
          </Link>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-center space-y-3">
          <p className="text-base font-semibold text-[var(--color-navy)]">
            Belum ada produk dalam katalog.
          </p>
          <p className="text-sm text-[var(--color-mute)]">
            Klik tombol “Tambah Produk Baru” untuk mulai menambahkan produk pertama Anda.
          </p>
          <Link
            href="/admin/produk/baru"
            className="inline-flex items-center gap-1 px-5 py-2.5 bg-[var(--color-navy)] text-white text-sm font-medium rounded-md hover:opacity-90 transition"
          >
            🚀 + Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3.5 font-semibold">Nama Produk</th>
                <th className="px-4 py-3.5 font-semibold">Kategori (Jurusan)</th>
                <th className="px-4 py-3.5 text-right font-semibold">
                  Harga (exPPN)
                </th>
                <th className="px-4 py-3.5 text-right font-semibold">Stok</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock <= LOW_STOCK_THRESHOLD;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)] transition"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[var(--color-navy)]">
                        {p.name}
                      </div>
                      <div className="text-xs text-[var(--color-mute)] flex items-center gap-2 mt-0.5">
                        <span>Slug: /{p.slug}</span>
                        {p.sku && <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">SKU: {p.sku}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-ink-soft)] font-medium">
                      {categoryName(p.category)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-[var(--color-navy)]">
                      {formatIDR(p.price)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      <span
                        className={
                          p.stock <= 0
                            ? "font-semibold text-[var(--color-red)] bg-red-50 px-2 py-0.5 rounded border border-red-200"
                            : low
                              ? "text-[var(--color-red)] font-semibold"
                              : "text-[var(--color-ink)] font-medium"
                        }
                      >
                        {p.stock} unit
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.active ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          ✓ Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/produk/${p.id}`}
                          className="inline-flex items-center px-3 py-1 bg-[var(--color-navy)]/10 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white rounded text-xs font-semibold transition"
                        >
                          ✏️ Edit Produk
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
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

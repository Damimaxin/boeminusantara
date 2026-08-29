import Link from "next/link";
import { formatIDR } from "@/lib/format";
import { getLowStockProducts } from "@/lib/admin/products";
import { getDashboard } from "@/lib/admin/dashboard";
import { categoryName } from "@/lib/categories";

export const metadata = { title: "Dashboard" };

const LOW = 5;

const fmtWaktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AdminDashboardPage() {
  const [d, lowStock] = await Promise.all([getDashboard(), getLowStockProducts(LOW)]);

  const statusCards = [
    { label: "Menunggu konfirmasi", b: d.status.menungguKonfirmasi },
    { label: "Sudah dikonfirmasi", b: d.status.dikonfirmasi },
    { label: "Dalam pengiriman", b: d.status.dikirim },
    { label: "Sudah serah terima", b: d.status.sudahBast },
    { label: "Selesai / dibayar", b: d.status.selesai },
    { label: "Komplain aktif", b: d.status.komplain, warn: true },
  ];

  const tindakan = [
    { label: "Penawaran baru", n: d.tindakan.pesananBaru, href: "/admin/penawaran" },
    { label: "Negosiasi berjalan", n: d.tindakan.negosiasi, href: "/admin/penawaran" },
    { label: "Komplain", n: d.tindakan.komplain, href: "/admin/komplain" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Terakhir diperbarui {fmtWaktu(d.updatedAt)} WIB
          </p>
        </div>
        {d.rating.count > 0 && (
          <div className="text-right text-sm">
            <span className="text-[var(--color-mute)]">Rata-rata ulasan </span>
            <span className="font-semibold text-amber-600">
              ★ {d.rating.avg?.toFixed(1)}
            </span>
            <span className="text-[var(--color-mute)]"> ({d.rating.count})</span>
          </div>
        )}
      </header>

      {/* Butuh tindakan */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          Butuh Tindakan
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {tindakan.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={
                "group rounded-[var(--radius-card)] border bg-[var(--color-paper)] p-4 transition hover:border-[var(--color-navy)] " +
                (t.n > 0 ? "border-[var(--color-red)]/30" : "border-[var(--color-line)]")
              }
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={
                    "text-2xl font-semibold tabular-nums " +
                    (t.n > 0 ? "text-[var(--color-red-deep)]" : "text-[var(--color-ink)]")
                  }
                >
                  {t.n}
                </span>
                <span className="text-sm text-[var(--color-ink-soft)]">{t.label}</span>
              </div>
              <span className="mt-1 block text-xs text-[var(--color-navy)]">
                Buka →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Status pesanan */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          Status Pesanan
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statusCards.map((c) => (
            <div
              key={c.label}
              className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
            >
              <div className="text-[11px] leading-tight text-[var(--color-mute)]">
                {c.label}
              </div>
              <div
                className={
                  "mt-1.5 text-xl font-semibold tabular-nums " +
                  (c.warn && c.b.count > 0
                    ? "text-[var(--color-red-deep)]"
                    : "text-[var(--color-ink)]")
                }
              >
                {c.b.count}
              </div>
              <div className="mt-0.5 text-[11px] tabular-nums text-[var(--color-ink-soft)]">
                {c.b.total > 0 ? formatIDR(c.b.total) : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ringkasan produk */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
            Ringkasan Produk
          </h2>
          <Link
            href="/admin/produk/baru"
            className="rounded-[var(--radius-card)] bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] transition hover:opacity-90"
          >
            + Tambah Produk
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Produk aktif" value={d.produk.aktif} href="/admin/produk" />
          <Stat
            label="Hampir habis"
            value={d.produk.hampirHabis}
            href="/admin/stok"
            warn={d.produk.hampirHabis > 0}
          />
          <Stat
            label="Stok habis"
            value={d.produk.habis}
            href="/admin/stok"
            warn={d.produk.habis > 0}
          />
        </div>
      </section>

      {/* Perlu restock */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
            Perlu Restock (≤ {LOW} unit)
          </h2>
          <Link href="/admin/stok" className="text-xs text-[var(--color-navy)] hover:underline">
            Kelola stok →
          </Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
            Tidak ada produk yang perlu restock.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 text-right font-medium">Stok</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-line-soft)] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/produk/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                      {categoryName(p.category)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          p.stock <= 0
                            ? "font-semibold text-[var(--color-red)]"
                            : "text-[var(--color-ink)]"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: number;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-center transition hover:border-[var(--color-navy)]"
    >
      <div
        className={
          "text-2xl font-semibold tabular-nums " +
          (warn ? "text-[var(--color-red-deep)]" : "text-[var(--color-ink)]")
        }
      >
        {value.toLocaleString("id-ID")}
      </div>
      <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{label}</div>
    </Link>
  );
}

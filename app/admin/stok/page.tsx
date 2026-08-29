import {
  listStockMovements,
  productOptions,
  MOVEMENT_LABELS,
} from "@/lib/admin/stock";
import { StockMovementForm } from "./_components/StockMovementForm";

export const metadata = { title: "Stok" };

const dtf = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dtf.format(d);
}

export default async function AdminStockPage() {
  const [movements, options] = await Promise.all([
    listStockMovements(),
    productOptions(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Stok</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Riwayat mutasi persediaan. Setiap pencatatan menyesuaikan stok produk.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Riwayat mutasi */}
        <section className="order-2 lg:order-1">
          <h2 className="mb-3 text-sm font-semibold">Riwayat Mutasi</h2>
          {movements.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
              Belum ada mutasi stok tercatat. Tambahkan lewat form di samping.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                    <th className="px-4 py-3 font-medium">Waktu</th>
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Jenis</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--color-line-soft)] last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-ink-soft)]">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">{m.productName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                            (m.type === "in"
                              ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                              : m.type === "out"
                                ? "bg-[var(--color-red)]/10 text-[var(--color-red-deep)]"
                                : "bg-[var(--color-line-soft)] text-[var(--color-ink-soft)]")
                          }
                        >
                          {MOVEMENT_LABELS[m.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.type === "out" ? "−" : m.type === "in" ? "+" : ""}
                        {Math.abs(m.qty)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-mute)]">
                        {m.ref ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Form tambah mutasi */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <h2 className="mb-4 text-sm font-semibold">Catat Mutasi Stok</h2>
            <StockMovementForm products={options} />
          </div>
        </aside>
      </div>
    </div>
  );
}

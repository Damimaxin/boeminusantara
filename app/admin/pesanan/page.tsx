import Link from "next/link";
import { listOrders, listProcurementOrders } from "@/lib/admin/orders";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Pesanan" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Bayar",
  paid: "Sudah Dibayar",
  processing: "Diproses",
  diproses: "Diproses",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Batal",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type Baris = {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  buyerName: string;
  buyerInstitution: string | null;
  itemCount: number;
  jenis: "online" | "pengadaan";
  href: string;
};

export default async function AdminOrdersPage() {
  const [online, pengadaan] = await Promise.all([
    listOrders(),
    listProcurementOrders(),
  ]);

  const baris: Baris[] = [
    ...online.map((o) => ({
      ...o,
      jenis: "online" as const,
      href: `/pesanan/${o.code}`,
    })),
    ...pengadaan.map((o) => ({
      ...o,
      jenis: "pengadaan" as const,
      href: `/admin/penawaran/${o.requestId}`,
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const unpaid = online.filter((o) => o.status === "pending").length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Pesanan</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {baris.length} pesanan · {online.length} online, {pengadaan.length}{" "}
          pengadaan · {unpaid} menunggu pembayaran.
        </p>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Pelanggan</th>
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-[var(--color-mute)]"
                >
                  Belum ada pesanan. Pesanan online muncul dari checkout; pesanan
                  pengadaan muncul begitu Surat Pesanan diterbitkan di menu
                  Penawaran.
                </td>
              </tr>
            ) : (
              baris.map((o) => (
                <tr
                  key={o.jenis + o.id}
                  className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={o.href}
                      className="font-medium text-[var(--color-navy)] hover:underline"
                    >
                      {o.code}
                    </Link>
                    <div className="text-xs text-[var(--color-mute)]">
                      {o.itemCount} item
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (o.jenis === "pengadaan"
                          ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                          : "bg-[var(--color-paper-dim)] text-[var(--color-ink-soft)]")
                      }
                    >
                      {o.jenis === "pengadaan" ? "Pengadaan" : "Online"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[var(--color-ink)]">{o.buyerName}</div>
                    {o.buyerInstitution && (
                      <div className="text-xs text-[var(--color-mute)]">
                        {o.buyerInstitution}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {fmtDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (o.status === "paid" || o.status === "done"
                          ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                          : o.status === "cancelled"
                            ? "bg-[var(--color-red)]/10 text-[var(--color-red-deep)]"
                            : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                      }
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIDR(o.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getPortalUser, listMyOrders } from "@/lib/portal";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Pengiriman" };

const TAHAP = ["paid", "processing", "shipped", "done"];

const LABEL_TAHAP: Record<string, string> = {
  paid: "Dibayar",
  processing: "Disiapkan",
  shipped: "Dikirim",
  done: "Diterima",
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function PengirimanPage() {
  const user = (await getPortalUser())!;
  const orders = await listMyOrders(user);

  // Pesanan yang belum dibayar belum masuk urusan pengiriman.
  const berjalan = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Pengiriman
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Perjalanan barang Anda, dari disiapkan sampai diterima.
        </p>
      </header>

      {berjalan.length === 0 ? (
        <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
          Belum ada pengiriman berjalan. Pengiriman muncul di sini setelah
          pembayaran diterima.
        </div>
      ) : (
        <ul className="space-y-3">
          {berjalan.map((o) => {
            const posisi = TAHAP.indexOf(o.status);
            return (
              <li
                key={o.code}
                className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/pesanan/${o.code}`}
                    className="font-medium text-[var(--color-navy)] hover:underline"
                  >
                    {o.code}
                  </Link>
                  <span className="text-sm tabular-nums text-[var(--color-ink-soft)]">
                    {formatIDR(o.total)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-mute)]">
                  {tanggal(o.createdAt)}
                </p>

                <ol className="mt-4 flex flex-wrap gap-x-2 gap-y-2 text-xs">
                  {TAHAP.map((t, i) => (
                    <li key={t} className="flex items-center gap-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 " +
                          (i <= posisi
                            ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                            : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                        }
                      >
                        {LABEL_TAHAP[t]}
                      </span>
                      {i < TAHAP.length - 1 && (
                        <span aria-hidden className="text-[var(--color-line)]">
                          →
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-[var(--color-mute)]">
        Nomor resi dan foto barang saat dikirim akan tampil di sini setelah bagian
        pengiriman selesai dibangun. Sementara ini tim kami mengabari lewat email.
      </p>
    </div>
  );
}

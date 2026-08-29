import Link from "next/link";
import { getPortalUser, listMyQuotes, listMyOrders } from "@/lib/portal";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Transaksi" };

const STATUS_PENAWARAN: Record<string, string> = {
  pending: "Menunggu ditinjau",
  reviewed: "Sedang ditinjau",
  negotiating: "Tawar-menawar",
  agreed: "Harga disepakati",
  quoted: "Surat penawaran terbit",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
};

const STATUS_PESANAN: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Sudah dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function PortalHome() {
  const user = (await getPortalUser())!;
  const [quotes, orders] = await Promise.all([
    listMyQuotes(user),
    listMyOrders(user),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Transaksi Saya
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Seluruh permintaan penawaran dan pesanan Anda.
        </p>
      </header>


      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          Permintaan Penawaran
        </h2>

        {quotes.length === 0 ? (
          <p className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
            Belum ada permintaan penawaran.{" "}
            <Link href="/" className="text-[var(--color-navy)] hover:underline">
              Lihat katalog
            </Link>{" "}
            untuk mulai.
          </p>
        ) : (
          <ul className="space-y-2">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/portal/penawaran/${q.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition hover:border-[var(--color-navy)]"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--color-ink)]">{q.code}</div>
                    <div className="text-xs text-[var(--color-mute)]">
                      {tanggal(q.createdAt)} · {q.itemCount} barang
                      {q.institution ? ` · ${q.institution}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm tabular-nums text-[var(--color-ink-soft)]">
                      {formatIDR(q.subtotal)}
                    </span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs " +
                        (q.status === "negotiating"
                          ? "bg-[var(--color-red)]/10 text-[var(--color-red-deep)]"
                          : q.status === "agreed" || q.status === "quoted"
                            ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                            : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                      }
                    >
                      {STATUS_PENAWARAN[q.status] ?? q.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          Pesanan
        </h2>

        {orders.length === 0 ? (
          <p className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
            Belum ada pesanan.
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.code}>
                <Link
                  href={`/pesanan/${o.code}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition hover:border-[var(--color-navy)]"
                >
                  <div>
                    <div className="font-medium text-[var(--color-ink)]">{o.code}</div>
                    <div className="text-xs text-[var(--color-mute)]">
                      {tanggal(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm tabular-nums text-[var(--color-ink-soft)]">
                      {formatIDR(o.total)}
                    </span>
                    <span className="rounded-full bg-[var(--color-paper-dim)] px-2 py-0.5 text-xs text-[var(--color-mute)]">
                      {STATUS_PESANAN[o.status] ?? o.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

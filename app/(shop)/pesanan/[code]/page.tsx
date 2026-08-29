import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderByCode } from "@/lib/orders";
import { formatIDR } from "@/lib/format";
import { isXenditConfigured } from "@/lib/xendit";

export const metadata: Metadata = {
  title: "Status Pesanan",
  // Halaman ini berisi data pembeli — jangan sampai terindeks mesin pencari.
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { text: string; note: string }> = {
  pending: {
    text: "Menunggu Pembayaran",
    note: "Pesanan sudah tercatat. Kami proses setelah pembayaran diterima.",
  },
  paid: {
    text: "Sudah Dibayar",
    note: "Pembayaran diterima. Tim kami menyiapkan pengiriman.",
  },
  processing: { text: "Diproses", note: "Pesanan sedang disiapkan." },
  shipped: { text: "Dikirim", note: "Barang dalam perjalanan." },
  done: { text: "Selesai", note: "Pesanan selesai. Terima kasih." },
  cancelled: { text: "Dibatalkan", note: "Pesanan dibatalkan." },
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const status = STATUS_LABEL[order.status] ?? {
    text: order.status,
    note: "",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-red">Pesanan</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
        {order.code}
      </h1>

      <div className="mt-6 rounded border border-line bg-paper p-5">
        <p className="text-sm font-semibold text-ink">{status.text}</p>
        <p className="mt-1 text-sm text-ink-soft">{status.note}</p>

        {order.status === "pending" && !isXenditConfigured() && (
          <div className="mt-4 rounded border border-line bg-paper-dim p-4 text-sm text-ink-soft">
            <p className="font-medium text-ink">Langkah pembayaran</p>
            <p className="mt-1">
              Tim kami menghubungi Anda lewat email atau WhatsApp dengan rincian
              tagihan, ongkos kirim, dan nomor rekening resmi perusahaan.
              Sebutkan nomor pesanan{" "}
              <strong className="text-ink">{order.code}</strong> saat konfirmasi
              pembayaran.
            </p>
          </div>
        )}
      </div>

      <ul className="mt-6 divide-y divide-line rounded border border-line bg-paper">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-4 p-4 text-sm">
            <span className="text-ink-soft">
              {i.name} <span className="text-mute">×{i.qty}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatIDR(i.subtotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 rounded border border-line bg-paper p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="tabular-nums">{formatIDR(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">PPN</dt>
          <dd className="tabular-nums">{formatIDR(order.ppn)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatIDR(order.total)}</dd>
        </div>
      </dl>

      <p className="mt-6 text-xs text-mute">
        Simpan halaman ini untuk memantau pesanan. Pertanyaan?{" "}
        <a href="mailto:info@boeminusantara.com" className="text-navy hover:underline">
          info@boeminusantara.com
        </a>
      </p>

      <Link href="/" className="mt-6 inline-block text-sm text-navy hover:underline">
        ← Kembali ke katalog
      </Link>
    </div>
  );
}

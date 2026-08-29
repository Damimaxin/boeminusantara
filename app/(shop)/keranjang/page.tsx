"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatIDR, ppnAmount } from "@/lib/format";

export default function KeranjangPage() {
  const { items, subtotal, hydrated, removeItem, setQty } = useCart();
  const ppn = ppnAmount(subtotal);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-mute">Memuat keranjang…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Keranjang masih kosong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Alat praktik bernilai besar dilayani lewat penawaran resmi. Barang
          satuan bisa langsung dimasukkan ke keranjang dari halaman produk.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-card)] bg-navy px-5 text-sm font-medium text-paper hover:bg-navy-deep"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Keranjang</h1>

      <ul className="mt-6 divide-y divide-line rounded border border-line bg-paper">
        {items.map((it) => (
          <li key={it.slug} className="flex gap-4 p-4">
            {it.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.image}
                alt=""
                className="h-20 w-20 shrink-0 rounded border border-line object-cover"
              />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded border border-line bg-paper-dim" />
            )}

            <div className="min-w-0 flex-1">
              <Link
                href={`/produk/${it.slug}`}
                className="text-sm font-medium text-ink hover:text-navy hover:underline"
              >
                {it.name}
              </Link>
              <p className="mt-1 text-sm text-ink-soft">
                {formatIDR(it.price)}{" "}
                <span className="text-xs text-mute">/unit, belum PPN</span>
              </p>

              <div className="mt-3 flex items-center gap-3">
                <label htmlFor={`qty-${it.slug}`} className="text-xs text-mute">
                  Jumlah
                </label>
                <input
                  id={`qty-${it.slug}`}
                  type="number"
                  min={1}
                  max={999}
                  value={it.qty}
                  onChange={(e) => setQty(it.slug, Number(e.target.value))}
                  className="h-9 w-20 rounded border border-line bg-paper px-2 text-sm outline-none focus:border-navy"
                />
                <button
                  type="button"
                  onClick={() => removeItem(it.slug)}
                  className="text-xs text-red hover:underline"
                >
                  Hapus
                </button>
              </div>
            </div>

            <div className="shrink-0 text-right text-sm font-medium text-ink tabular-nums">
              {formatIDR(it.price * it.qty)}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded border border-line bg-paper p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums">{formatIDR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">PPN</dt>
            <dd className="tabular-nums">{formatIDR(ppn)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatIDR(subtotal + ppn)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-card)] bg-navy text-sm font-medium text-paper hover:bg-navy-deep"
        >
          Lanjut ke Pembayaran
        </Link>
        <p className="mt-3 text-xs text-mute">
          Ongkos kirim dihitung terpisah oleh tim kami setelah pesanan masuk.
        </p>
      </div>
    </div>
  );
}

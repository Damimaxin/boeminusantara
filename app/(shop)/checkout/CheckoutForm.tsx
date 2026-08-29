"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatIDR, ppnAmount } from "@/lib/format";
import type { CheckoutState } from "./actions";

type Action = (prev: CheckoutState, formData: FormData) => Promise<CheckoutState>;

const INITIAL: CheckoutState = { ok: false };

export default function CheckoutForm({ action }: { action: Action }) {
  const { items, subtotal, hydrated, clear } = useCart();
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const router = useRouter();
  const ppn = ppnAmount(subtotal);

  // Pesanan berhasil dibuat → keranjang dikosongkan, lalu pindah halaman.
  // Ke halaman bayar kalau gateway aktif; kalau belum, ke halaman status pesanan.
  useEffect(() => {
    if (!state.ok) return;
    clear();
    if (state.payUrl) window.location.assign(state.payUrl);
    else if (state.orderCode) router.push(`/pesanan/${state.orderCode}`);
  }, [state, clear, router]);

  const field =
    "mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-navy";
  const label = "block text-sm font-medium text-ink";
  const errText = "mt-1 text-xs text-red";
  const fe = state.fieldErrors ?? {};

  if (hydrated && items.length === 0 && !state.ok) {
    return (
      <div className="mt-8 rounded border border-line bg-paper p-6 text-sm text-ink-soft">
        Keranjang kosong.{" "}
        <Link href="/" className="text-navy hover:underline">
          Kembali ke katalog
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Keranjang dikirim sebagai slug + jumlah saja; harga ditentukan server. */}
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ slug: i.slug, qty: i.qty })))} />

      <div className="space-y-5">
        {state.error && (
          <div className="rounded border border-red bg-red/5 px-4 py-3 text-sm text-red-deep">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="name" className={label}>
            Nama Penerima
          </label>
          <input id="name" name="name" className={field} autoComplete="name" />
          {fe.name && <p className={errText}>{fe.name}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input id="email" name="email" type="email" className={field} autoComplete="email" />
            {fe.email && <p className={errText}>{fe.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className={label}>
              Telepon / WhatsApp
            </label>
            <input id="phone" name="phone" className={field} autoComplete="tel" />
            {fe.phone && <p className={errText}>{fe.phone}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="institution" className={label}>
            Nama Sekolah / Instansi{" "}
            <span className="font-normal text-mute">(opsional)</span>
          </label>
          <input id="institution" name="institution" className={field} />
        </div>

        <div>
          <label htmlFor="address" className={label}>
            Alamat Pengiriman
          </label>
          <textarea id="address" name="address" rows={3} className={field} autoComplete="street-address" />
          {fe.address && <p className={errText}>{fe.address}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={label}>
              Kota / Kabupaten
            </label>
            <input id="city" name="city" className={field} />
            {fe.city && <p className={errText}>{fe.city}</p>}
          </div>
          <div>
            <label htmlFor="postalCode" className={label}>
              Kode Pos <span className="font-normal text-mute">(opsional)</span>
            </label>
            <input id="postalCode" name="postalCode" className={field} inputMode="numeric" />
          </div>
        </div>

        <div>
          <label htmlFor="note" className={label}>
            Catatan <span className="font-normal text-mute">(opsional)</span>
          </label>
          <textarea id="note" name="note" rows={2} className={field} />
        </div>
      </div>

      <aside className="h-fit rounded border border-line bg-paper p-5">
        <h2 className="text-sm font-semibold text-ink">Ringkasan</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between gap-3">
              <span className="min-w-0 text-ink-soft">
                {i.name} <span className="text-mute">×{i.qty}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatIDR(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
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

        <button
          type="submit"
          disabled={pending || items.length === 0}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-card)] bg-navy text-sm font-medium text-paper transition hover:bg-navy-deep disabled:opacity-60"
        >
          {pending ? "Memproses…" : "Buat Pesanan"}
        </button>
        <p className="mt-3 text-xs text-mute">
          Ongkos kirim dikonfirmasi tim kami setelah pesanan masuk.
        </p>
      </aside>
    </form>
  );
}

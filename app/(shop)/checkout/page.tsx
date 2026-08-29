import type { Metadata } from "next";
import CheckoutForm from "./CheckoutForm";
import { submitCheckoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Pembayaran",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Pembayaran</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Isi data penerima. Harga dihitung ulang dari katalog saat pesanan dibuat.
      </p>
      <CheckoutForm action={submitCheckoutAction} />
    </div>
  );
}

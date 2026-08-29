const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Format angka Rupiah tanpa desimal. Harga selalu EXCLUDE PPN di storefront. */
export function formatIDR(value: number): string {
  return idr.format(value);
}

/** Tarif PPN default (configurable). Konfirmasi akunting client: 11% vs 12%. */
export const PPN_RATE = 0.11;

export function ppnAmount(subtotal: number): number {
  return Math.round(subtotal * PPN_RATE);
}

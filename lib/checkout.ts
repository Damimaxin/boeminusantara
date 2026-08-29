/**
 * Aturan checkout HYBRID (keputusan Russell, 2026-07-20).
 *
 * Pembeli Boemi ada dua jenis dan cara belinya beda:
 *  - Sekolah/instansi beli alat besar (ratusan juta) pakai dana BOS/SIPlah →
 *    tidak mungkin bayar di web. Wajib lewat Penawaran (RFQ) → surat penawaran →
 *    PO → invoice.
 *  - Pembeli kecil (tools, alat ukur, sparepart) wajar bayar langsung.
 *
 * Ambang di bawah ini yang memisahkan keduanya. Harga EXCLUDE PPN.
 * Modul ini dipakai server DAN client, jadi tidak boleh "server-only".
 */
export const INSTANT_BUY_MAX_PRICE = 10_000_000;

/** Produk ini boleh dibeli langsung (masuk keranjang), atau harus lewat RFQ? */
export function isInstantBuyable(price: number): boolean {
  return price > 0 && price <= INSTANT_BUY_MAX_PRICE;
}

// PPN dihitung dengan `ppnAmount()` dari lib/format.ts — satu sumber, jangan
// dihitung ulang di sini.

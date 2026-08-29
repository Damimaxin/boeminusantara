/**
 * Angka Rupiah menjadi kata — wajib ada di surat pesanan dan kwitansi
 * ("Terbilang: Dua puluh tiga juta tiga ratus sepuluh ribu rupiah").
 *
 * Ditulis sendiri, bukan mengambil paket: aturannya sederhana dan tetap,
 * sementara satu dependency berarti satu pintu supply-chain baru untuk sesuatu
 * yang muncul di dokumen resmi.
 */

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

/** Bagian di bawah seribu — inti aturannya ada di sini. */
function dibawahSeribu(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${SATUAN[puluh]} puluh${sisa ? " " + SATUAN[sisa] : ""}`;
  }
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  // "seratus", bukan "satu ratus".
  const depan = ratus === 1 ? "seratus" : `${SATUAN[ratus]} ratus`;
  return `${depan}${sisa ? " " + dibawahSeribu(sisa) : ""}`;
}

const SKALA = ["", "ribu", "juta", "miliar", "triliun"];

/** Angka bulat menjadi kata, tanpa kata "rupiah". */
export function angkaKeKata(nilai: number): string {
  const n = Math.floor(Math.abs(nilai));
  if (n === 0) return "nol";

  const bagian: string[] = [];
  let sisa = n;
  let skala = 0;

  while (sisa > 0) {
    const tiga = sisa % 1000;
    if (tiga > 0) {
      // "seribu", bukan "satu ribu".
      const kata =
        tiga === 1 && skala === 1 ? "seribu" : `${dibawahSeribu(tiga)} ${SKALA[skala]}`;
      bagian.unshift(kata.trim());
    }
    sisa = Math.floor(sisa / 1000);
    skala++;
  }

  const hasil = bagian.join(" ").replace(/\s+/g, " ").trim();
  return nilai < 0 ? `minus ${hasil}` : hasil;
}

/** Versi siap cetak: huruf pertama kapital + akhiran "rupiah". */
export function terbilangRupiah(nilai: number): string {
  const kata = angkaKeKata(nilai);
  return kata.charAt(0).toUpperCase() + kata.slice(1) + " rupiah";
}

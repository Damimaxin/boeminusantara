"use client";

/**
 * Cetak lewat dialog cetak browser. Sengaja tidak memakai pustaka PDF:
 * satu dependency lagi untuk sesuatu yang sudah disediakan browser, dan
 * "Simpan sebagai PDF" ada di dialog yang sama.
 */
export function CetakButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center rounded bg-[#12263f] px-4 text-sm font-medium text-white transition hover:opacity-90"
    >
      Cetak / Simpan PDF
    </button>
  );
}

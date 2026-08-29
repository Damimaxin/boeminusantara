"use client";

/** Tombol cetak surat. Disembunyikan saat print via kelas `print:hidden`. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 print:hidden"
    >
      Cetak Surat
    </button>
  );
}

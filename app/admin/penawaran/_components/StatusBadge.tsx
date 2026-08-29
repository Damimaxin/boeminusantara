import type { QuoteRequest } from "@/lib/admin/quotes";

const LABELS: Record<QuoteRequest["status"], string> = {
  pending: "Menunggu",
  reviewed: "Ditinjau",
  quoted: "Terbit Surat",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
};

/** Badge status permintaan penawaran. Warna dari token — tak ada warna baru. */
export function StatusBadge({ status }: { status: QuoteRequest["status"] }) {
  const cls =
    status === "quoted"
      ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
      : status === "rejected"
        ? "bg-[var(--color-red)]/10 text-[var(--color-red)]"
        : status === "reviewed"
          ? "bg-[var(--color-navy)]/5 text-[var(--color-ink-soft)]"
          : "bg-[var(--color-line-soft)] text-[var(--color-mute)]";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        cls
      }
    >
      {LABELS[status]}
    </span>
  );
}

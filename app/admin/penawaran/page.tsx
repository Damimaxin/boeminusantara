import Link from "next/link";
import { listQuotes } from "@/lib/admin/quotes";
import { isAdminDbConnected } from "@/lib/admin/supabase-admin";
import { StatusBadge } from "./_components/StatusBadge";

export const metadata = { title: "Penawaran" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function AdminQuotesPage() {
  const quotes = await listQuotes();
  const connected = isAdminDbConnected();
  const empty = quotes.length === 0;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Penawaran</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Permintaan penawaran (RFQ) masuk. Tinjau, ACC, dan terbitkan surat
          penawaran resmi.
        </p>
      </header>

      {empty && (
        <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          {connected
            ? "Belum ada permintaan penawaran masuk."
            : "Mode preview — belum terhubung database. Permintaan penawaran akan tampil di sini setelah DB & boemi-api terhubung."}
        </div>
      )}

      {!empty && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Pemohon / Instansi</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                    {q.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[var(--color-ink)]">
                      {q.customer_name}
                    </div>
                    <div className="text-xs text-[var(--color-mute)]">
                      {q.institution || q.customer_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-soft)]">
                    {q.quote_request_items?.length ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/penawaran/${q.id}`}
                      className="text-xs text-[var(--color-navy)] hover:underline"
                    >
                      Tinjau
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

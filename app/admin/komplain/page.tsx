import Link from "next/link";
import { listComplaints } from "@/lib/complaints";
import { tanganiKomplainAction } from "./actions";

export const metadata = { title: "Komplain" };

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Baru", cls: "bg-[var(--color-red)]/10 text-[var(--color-red-deep)]" },
  handling: { label: "Ditangani", cls: "bg-amber-500/15 text-amber-700" },
  resolved: { label: "Selesai", cls: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AdminKomplainPage() {
  const komplain = await listComplaints();
  const baru = komplain.filter((c) => c.status === "open").length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Komplain</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {komplain.length} keluhan · {baru} baru.
        </p>
      </header>

      {komplain.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada keluhan masuk. Keluhan dari sekolah muncul di sini begitu
          mereka mengirimnya dari portal.
        </p>
      ) : (
        <ul className="space-y-4">
          {komplain.map((c) => (
            <li
              key={c.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{c.subject}</span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] " + STATUS[c.status]?.cls
                      }
                    >
                      {STATUS[c.status]?.label ?? c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-mute)]">
                    {c.buyerEmail} · {fmt(c.createdAt)}
                    {c.requestId && (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/penawaran/${c.requestId}`}
                          className="text-[var(--color-navy)] hover:underline"
                        >
                          lihat penawaran
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-ink-soft)]">
                {c.message}
              </p>

              {c.adminNote && (
                <p className="mt-2 rounded border border-[var(--color-line)] bg-[var(--color-paper-dim)] p-2 text-xs text-[var(--color-ink-soft)]">
                  <span className="font-medium text-[var(--color-ink)]">Tanggapan: </span>
                  {c.adminNote}
                </p>
              )}

              <form action={tanganiKomplainAction} className="mt-4 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[11px] text-[var(--color-mute)]">Tanggapan (opsional)</label>
                  <input
                    name="adminNote"
                    defaultValue={c.adminNote ?? ""}
                    placeholder="Balasan untuk sekolah…"
                    className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-navy)]"
                  />
                </div>
                <select
                  name="status"
                  defaultValue={c.status}
                  className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-navy)]"
                >
                  <option value="open">Baru</option>
                  <option value="handling">Ditangani</option>
                  <option value="resolved">Selesai</option>
                </select>
                <button
                  type="submit"
                  className="rounded bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] transition hover:opacity-90"
                >
                  Simpan
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

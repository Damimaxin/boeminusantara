import { listCustomers } from "@/lib/admin/customers";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Pelanggan" };

const fmtTgl = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default async function AdminCustomersPage() {
  const pelanggan = await listCustomers();
  const totalNilai = pelanggan.reduce((s, c) => s + c.totalNilai, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Pelanggan</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {pelanggan.length} pelanggan · nilai transaksi {formatIDR(totalNilai)}.
        </p>
      </header>

      {pelanggan.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada pelanggan. Data terisi sendiri begitu ada sekolah yang
          mengajukan penawaran atau memesan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Nama / Instansi</th>
                <th className="px-4 py-3 font-medium">Kontak</th>
                <th className="px-4 py-3 text-right font-medium">Penawaran</th>
                <th className="px-4 py-3 text-right font-medium">Pesanan</th>
                <th className="px-4 py-3 text-right font-medium">Total Nilai</th>
                <th className="px-4 py-3 font-medium">Aktivitas</th>
              </tr>
            </thead>
            <tbody>
              {pelanggan.map((c) => (
                <tr
                  key={c.email}
                  className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-ink)]">
                      {c.institution || c.name}
                    </div>
                    {c.institution && c.name !== c.institution && (
                      <div className="text-xs text-[var(--color-mute)]">{c.name}</div>
                    )}
                    {c.npwp && (
                      <div className="text-xs text-[var(--color-mute)]">NPWP: {c.npwp}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    <div>{c.email}</div>
                    {c.phone && <div className="text-xs text-[var(--color-mute)]">{c.phone}</div>}
                    {c.city && <div className="text-xs text-[var(--color-mute)]">{c.city}</div>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.penawaranCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.pesananCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.totalNilai > 0 ? formatIDR(c.totalNilai) : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {fmtTgl(c.lastActivity)}
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

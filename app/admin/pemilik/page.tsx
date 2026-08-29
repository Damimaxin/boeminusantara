import Link from "next/link";
import { redirect } from "next/navigation";
import { checkAdmin, isOwnerEmail } from "@/lib/admin/auth";
import { listAudit, auditActors } from "@/lib/audit";

export const metadata = { title: "Ruang Pemilik", robots: { index: false } };

/**
 * Ruang Pemilik — hanya untuk email di ADMIN_EMAILS (pemilik), bukan staf.
 * Gerbang diperiksa DI SERVER: staf yang menebak alamat /admin/pemilik tetap
 * dilempar keluar, bukan sekadar tidak melihat tautannya.
 */

const AKSI_LABEL: Record<string, string> = {
  "produk.tambah": "Tambah produk",
  "produk.ubah": "Ubah produk",
  "stok.in": "Stok masuk",
  "stok.out": "Stok keluar",
  "stok.adjust": "Koreksi stok",
  "penawaran.acc": "ACC penawaran",
  "penawaran.status": "Ubah status penawaran",
  "dokumen.terbit": "Terbitkan dokumen",
  "artikel.tambah": "Tulis artikel",
  "artikel.ubah": "Ubah artikel",
  "artikel.hapus": "Hapus artikel",
  "admin.tambah": "Tambah admin",
  "admin.cabut": "Cabut akses admin",
};

const fmtWaktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function RuangPemilikPage({
  searchParams,
}: {
  searchParams: Promise<{ pelaku?: string }>;
}) {
  const gate = await checkAdmin();
  if (!gate.ok || !isOwnerEmail(gate.email)) redirect("/admin");

  const { pelaku } = await searchParams;
  const [rows, actors] = await Promise.all([
    listAudit({ actor: pelaku, limit: 300 }),
    auditActors(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span aria-hidden>🔒</span>
          <h1 className="text-xl font-semibold tracking-tight">Ruang Pemilik</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Jejak aktivitas seluruh admin. Halaman ini hanya terlihat oleh Anda
          sebagai pemilik — admin lain tidak bisa membukanya.
        </p>
      </header>

      {/* penyaring per pelaku */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin/pemilik"
          className={
            "rounded-full border px-3 py-1 transition " +
            (!pelaku
              ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]"
              : "border-[var(--color-line)] hover:border-[var(--color-navy)]")
          }
        >
          Semua
        </Link>
        {actors.map((a) => (
          <Link
            key={a.email}
            href={`/admin/pemilik?pelaku=${encodeURIComponent(a.email)}`}
            className={
              "rounded-full border px-3 py-1 transition " +
              (pelaku === a.email
                ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] hover:border-[var(--color-navy)]")
            }
          >
            {a.email} <span className="opacity-70">({a.count})</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada aktivitas tercatat. Jejak mulai terkumpul begitu admin
          mengubah produk, stok, penawaran, dokumen, atau artikel.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Tindakan</th>
                <th className="px-4 py-3 font-medium">Objek</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-ink-soft)] tabular-nums">
                    {fmtWaktu(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.actorEmail}
                    {isOwnerEmail(r.actorEmail) && (
                      <span className="ml-1.5 rounded-full bg-[var(--color-navy)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-navy)]">
                        pemilik
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink)]">
                    {AKSI_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                    {r.target ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--color-mute)]">
        Menampilkan {rows.length} kejadian terbaru. Jejak ini ditulis oleh sistem
        dan tidak bisa diubah atau dihapus dari panel.
      </p>
    </div>
  );
}

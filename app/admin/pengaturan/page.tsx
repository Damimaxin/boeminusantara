import { PPN_RATE } from "@/lib/format";
import { hasServiceRole, isAdminDbConnected } from "@/lib/admin/supabase-admin";

export const metadata = { title: "Pengaturan" };

export default function AdminSettingsPage() {
  const connected = isAdminDbConnected();
  const canWrite = hasServiceRole();

  const rows: { label: string; value: string }[] = [
    {
      label: "Koneksi Database",
      value: connected ? "Terhubung" : "Belum (mode preview/seed)",
    },
    {
      label: "Service Role (tulis aman)",
      value: canWrite ? "Aktif" : "Belum diset",
    },
    { label: "Tarif PPN", value: `${Math.round(PPN_RATE * 100)}%` },
    { label: "Kebijakan Harga", value: "Semua harga EXCLUDE PPN" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Konfigurasi toko &amp; status sistem.
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.label}
                className="border-b border-[var(--color-line-soft)] last:border-0"
              >
                <td className="w-1/2 px-4 py-3 text-[var(--color-ink-soft)]">
                  {r.label}
                </td>
                <td className="px-4 py-3 font-medium">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-mute)]">
        Pengaturan lanjutan (kupon, pemasok, faktur pajak, ongkir) &amp;
        manajemen pengguna admin segera hadir.
      </p>
    </div>
  );
}

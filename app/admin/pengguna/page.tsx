import { redirect } from "next/navigation";
import { listAdminPeople } from "@/lib/admin/staff";
import { checkAdmin, isOwnerEmail } from "@/lib/admin/auth";
import { StaffForm } from "./_components/StaffForm";
import { addStaffAction, removeStaffAction } from "./actions";

export const metadata = { title: "Pengguna Admin" };

export default async function AdminUsersPage() {
  // Kelola admin = kuasa pemilik. Staf yang menebak alamat ini dilempar keluar.
  const gate = await checkAdmin();
  if (!gate.ok || !isOwnerEmail(gate.email)) redirect("/admin");

  const people = await listAdminPeople();
  const myEmail = gate.email.toLowerCase();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Pengguna Admin</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Siapa saja yang boleh masuk panel ini.
        </p>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ditambahkan oleh</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr
                key={p.email}
                className="border-b border-[var(--color-line-soft)] last:border-0"
              >
                <td className="px-4 py-3">
                  <span className="text-[var(--color-ink)]">{p.name}</span>
                  {p.isOwner && (
                    <span className="ml-2 inline-flex rounded-full bg-[var(--color-navy)]/10 px-2 py-0.5 text-xs text-[var(--color-navy)]">
                      Pemilik
                    </span>
                  )}
                  {p.email.toLowerCase() === myEmail && (
                    <span className="ml-2 text-xs text-[var(--color-mute)]">(Anda)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.email}</td>
                <td className="px-4 py-3 text-[var(--color-mute)]">
                  {p.isOwner ? "Setelan server" : (p.addedBy ?? "—")}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.isOwner || p.email.toLowerCase() === myEmail ? (
                    <span className="text-xs text-[var(--color-mute)]">—</span>
                  ) : (
                    <form action={removeStaffAction}>
                      <input type="hidden" name="email" value={p.email} />
                      <button
                        type="submit"
                        className="text-[var(--color-red)] hover:underline"
                      >
                        Cabut akses
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StaffForm action={addStaffAction} />
    </div>
  );
}

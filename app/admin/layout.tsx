import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./_components/AdminSidebar";
import { hasServiceRole, isAdminDbConnected } from "@/lib/admin/supabase-admin";
import { checkAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: { default: "Admin · Boemi Nusantara", template: "%s · Admin Boemi" },
  robots: { index: false, follow: false },
};

/**
 * Layout ADMIN — terpisah total dari storefront (tanpa Header/Footer toko).
 * Desktop-first: sidebar tetap di kiri, konten di kanan.
 *
 * Gerbang lapis-2: middleware sudah menyaring, tapi kita verifikasi ulang session
 * di server. Middleware bukan batas keamanan yang boleh berdiri sendiri.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin");

  const connected = isAdminDbConnected();
  const canWrite = hasServiceRole();

  return (
    <div className="flex min-h-screen bg-[var(--color-paper-dim)] text-[var(--color-ink)]">
      <AdminSidebar isOwner={gate.isOwner} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bar identitas admin + keluar */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-2 text-xs text-[var(--color-ink-soft)]">
          <span>
            Masuk sebagai <strong className="font-medium">{gate.email}</strong>
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded border border-[var(--color-line)] px-2 py-1 hover:bg-[var(--color-paper-dim)]"
            >
              Keluar
            </button>
          </form>
        </div>

        {/* Bar status koneksi DB */}
        {(!connected || !canWrite) && (
          <div className="border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-2 text-xs text-[var(--color-ink-soft)]">
            {!connected ? (
              <span>
                Mode preview — belum terhubung database. Data yang tampil berasal
                dari seed; perubahan tidak tersimpan. Set{" "}
                <code className="rounded bg-[var(--color-paper-dim)] px-1">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                &amp;{" "}
                <code className="rounded bg-[var(--color-paper-dim)] px-1">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{" "}
                untuk mengaktifkan.
              </span>
            ) : (
              <span>
                Terhubung tanpa service role — operasi tulis mungkin ditolak
                (RLS). Set{" "}
                <code className="rounded bg-[var(--color-paper-dim)] px-1">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{" "}
                di server untuk menyimpan perubahan.
              </span>
            )}
          </div>
        )}

        <main className="min-w-0 flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

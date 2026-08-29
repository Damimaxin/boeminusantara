import { listAllBanners } from "@/lib/admin/content";
import { BannerForm } from "./_components/BannerForm";
import { createBannerAction, toggleBannerAction, deleteBannerAction } from "./actions";

export const metadata = { title: "Banner" };

export default async function AdminBannerPage() {
  const banners = await listAllBanners();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Banner Beranda</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Slot promo paling atas di halaman depan. Yang tayang diurutkan dari
          angka urutan terkecil.
        </p>
      </header>

      {banners.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada banner. Kalau kosong, beranda tampil seperti biasa tanpa slot promo.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Banner</th>
                <th className="px-4 py-3 text-right font-medium">Urutan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[var(--color-line-soft)] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-ink)]">{b.title}</div>
                    <div className="text-xs text-[var(--color-mute)]">
                      {b.image}
                      {b.link ? ` → ${b.link}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (b.active
                          ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                          : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                      }
                    >
                      {b.active ? "Tayang" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <form action={toggleBannerAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="active" value={String(!b.active)} />
                        <button
                          type="submit"
                          className="text-[var(--color-navy)] hover:underline"
                        >
                          {b.active ? "Nonaktifkan" : "Tayangkan"}
                        </button>
                      </form>
                      <form action={deleteBannerAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <button
                          type="submit"
                          className="text-[var(--color-red)] hover:underline"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BannerForm action={createBannerAction} />
    </div>
  );
}

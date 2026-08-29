import Link from "next/link";
import { listAllArticles } from "@/lib/admin/content";
import { PILLAR_LABEL } from "@/lib/types";
import { deleteArticleAction } from "./actions";

export const metadata = { title: "Artikel" };

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default async function AdminArticlesPage() {
  const articles = await listAllArticles();
  const published = articles.filter((a) => a.status === "published").length;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Artikel</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {articles.length} konten · {published} tayang di web.
          </p>
        </div>
        <Link
          href="/admin/artikel/baru"
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90"
        >
          + Tulis Artikel
        </Link>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-mute)]">
          Belum ada artikel. Klik “Tulis Artikel” untuk mulai — konten Edukasi dan
          Motivasi yang sudah dibuat untuk Instagram bisa ditayangkan di sini.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Pilar</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Terbit</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--color-line-soft)] last:border-0 hover:bg-[var(--color-paper-dim)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-ink)]">{a.title}</div>
                    <div className="text-xs text-[var(--color-mute)]">/edukasi/{a.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {PILLAR_LABEL[a.pillar]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (a.status === "published"
                          ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                          : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                      }
                    >
                      {a.status === "published" ? "Tayang" : "Draf"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)] tabular-nums">
                    {fmtDate(a.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {a.status === "published" && (
                        <Link
                          href={`/edukasi/${a.slug}`}
                          className="text-[var(--color-ink-soft)] hover:underline"
                        >
                          Lihat
                        </Link>
                      )}
                      <Link
                        href={`/admin/artikel/${a.id}`}
                        className="text-[var(--color-navy)] hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteArticleAction}>
                        <input type="hidden" name="id" value={a.id} />
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
    </div>
  );
}

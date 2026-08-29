import Link from "next/link";
import { getPublishedArticles } from "@/lib/content";
import { PILLAR_LABEL } from "@/lib/types";

/**
 * Tiga tulisan terbaru di kaki beranda — pintu masuk ke /edukasi.
 * Belum ada artikel terbit → tidak merender apa pun.
 */
export default async function ArticleTeasers() {
  const articles = await getPublishedArticles({ limit: 3 });
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-paper-dim)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-medium tracking-tight">Edukasi &amp; Wawasan</h2>
          <Link href="/edukasi" className="text-sm text-[var(--color-navy)] hover:underline">
            Lihat semua
          </Link>
        </div>

        <ul className="grid gap-5 sm:grid-cols-3">
          {articles.map((a) => (
            <li
              key={a.id}
              className="overflow-hidden rounded border border-[var(--color-line)] bg-[var(--color-paper)]"
            >
              <Link href={`/edukasi/${a.slug}`} className="block">
                {a.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.cover}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-navy)]">
                    {PILLAR_LABEL[a.pillar]}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-[var(--color-ink)]">
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-ink-soft)]">
                      {a.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

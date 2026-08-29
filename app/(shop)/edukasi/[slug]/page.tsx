import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug, getPublishedArticles } from "@/lib/content";
import { PILLAR_LABEL } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.title,
    description: article.excerpt || undefined,
  };
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = (await getPublishedArticles({ pillar: article.pillar, limit: 4 })).filter(
    (a) => a.id !== article.id,
  );

  // Paragraf dipisah baris kosong (kesepakatan editor di admin).
  const paragraphs = article.body.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/edukasi" className="text-sm text-navy hover:underline">
        ← Edukasi &amp; Wawasan
      </Link>

      <article className="mt-6">
        <span className="text-xs font-medium uppercase tracking-wide text-navy">
          {PILLAR_LABEL[article.pillar]}
        </span>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-mute">{fmtDate(article.publishedAt)}</p>

        {article.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover}
            alt=""
            className="mt-6 w-full rounded border border-line object-cover"
          />
        )}

        <div className="mt-8 space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
        </div>

        {article.source && (
          <p className="mt-8 rounded border border-line bg-paper-dim p-4 text-sm text-ink-soft">
            <span className="font-medium text-ink">Sumber: </span>
            {article.source}
          </p>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mute">
            Tulisan lain
          </h2>
          <ul className="mt-4 space-y-3">
            {related.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/edukasi/${a.slug}`}
                  className="text-[15px] font-medium text-ink hover:text-navy hover:underline"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

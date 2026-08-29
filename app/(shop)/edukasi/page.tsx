import Link from "next/link";
import { getPublishedArticles } from "@/lib/content";
import { PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/types";

export const metadata = {
  title: "Edukasi & Wawasan SMK",
  description:
    "Kebijakan pendidikan vokasi, praktik baik bengkel, dan wawasan untuk guru dan siswa SMK.",
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export default async function EdukasiPage({
  searchParams,
}: {
  searchParams: Promise<{ pilar?: string }>;
}) {
  const { pilar } = await searchParams;
  const active = PILLARS.includes(pilar as Pillar) ? (pilar as Pillar) : undefined;
  const articles = await getPublishedArticles({ pillar: active });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Edukasi &amp; Wawasan
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Kebijakan pendidikan vokasi dan praktik baik bengkel — ditulis untuk guru,
          kepala program, dan siswa SMK.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        <FilterChip href="/edukasi" label="Semua" active={!active} />
        {PILLARS.map((p) => (
          <FilterChip
            key={p}
            href={`/edukasi?pilar=${p}`}
            label={PILLAR_LABEL[p]}
            active={active === p}
          />
        ))}
      </nav>

      {articles.length === 0 ? (
        <p className="mt-10 rounded border border-line bg-paper p-6 text-sm text-mute">
          Belum ada tulisan di bagian ini. Silakan cek lagi nanti.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li
              key={a.id}
              className="overflow-hidden rounded border border-line bg-paper transition hover:shadow-sm"
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
                  <span className="text-xs font-medium uppercase tracking-wide text-navy">
                    {PILLAR_LABEL[a.pillar]}
                  </span>
                  <h2 className="mt-1 text-base font-semibold leading-snug text-ink">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{a.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-mute">{fmtDate(a.publishedAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 transition " +
        (active
          ? "border-navy bg-navy text-paper"
          : "border-line bg-paper text-ink-soft hover:border-navy")
      }
    >
      {label}
    </Link>
  );
}

import Link from "next/link";
import { getPublishedPage } from "@/lib/content";

/**
 * Kerangka halaman informasi vokasi (Magang, Pelatihan, Pengaduan).
 *
 * Isinya diambil dari CMS supaya tim Boemi bisa memperbaruinya sendiri; kalau
 * belum diisi, dipakai teks bawaan. Sengaja TANPA FORMULIR — pendaftaran
 * magang berarti menyimpan data pribadi siswa, sebagian di bawah umur, dan itu
 * sebaiknya berpijak pada perjanjian kerja sama lebih dulu. Kanal pengaduan
 * tanpa petugas yang menjawab juga lebih merugikan nama baik daripada tidak ada.
 */
export async function HalamanVokasi({
  slug,
  judul,
  ringkas,
  bawaan,
  langkah,
  ctaLabel,
  ctaSubjek,
}: {
  slug: string;
  judul: string;
  ringkas: string;
  bawaan: string[];
  langkah?: { judul: string; isi: string }[];
  ctaLabel: string;
  ctaSubjek: string;
}) {
  const cms = await getPublishedPage(slug);

  const paragraf = cms
    ? cms.body.split(/\n\s*\n/).filter((p) => p.trim())
    : bawaan;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red">
        Vokasi
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
        {cms?.title ?? judul}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
        {ringkas}
      </p>

      <div className="mt-8 space-y-4">
        {paragraf.map((p, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-ink-soft">
            {p}
          </p>
        ))}
      </div>

      {langkah && langkah.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight text-navy">
            Alurnya
          </h2>
          <ol className="mt-4 space-y-4">
            {langkah.map((l, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sm text-mute">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-ink">{l.judul}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{l.isi}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12 rounded border border-line bg-paper-dim p-6">
        <p className="text-sm text-ink-soft">
          Sekolah, dinas, atau industri yang ingin bekerja sama bisa menghubungi
          kami langsung. Program disusun menyesuaikan kebutuhan masing-masing
          satuan pendidikan.
        </p>
        <a
          href={`mailto:info@boeminusantara.com?subject=${encodeURIComponent(ctaSubjek)}`}
          className="mt-4 inline-flex h-11 items-center rounded bg-navy px-5 text-sm font-medium text-paper transition hover:bg-navy-deep"
        >
          {ctaLabel}
        </a>
        <p className="mt-3 text-xs text-mute">
          info@boeminusantara.com · (021) 55717126
        </p>
      </section>

      <nav className="mt-10 flex flex-wrap gap-4 border-t border-line pt-6 text-sm">
        <Link href="/magang" className="text-navy hover:underline">
          Magang
        </Link>
        <Link href="/pelatihan" className="text-navy hover:underline">
          Pelatihan
        </Link>
        <Link href="/pengaduan" className="text-navy hover:underline">
          Pengaduan
        </Link>
        <Link href="/edukasi" className="text-navy hover:underline">
          Edukasi &amp; Wawasan
        </Link>
      </nav>
    </div>
  );
}

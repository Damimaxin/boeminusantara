import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedPage } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tentang & Legalitas",
    description:
      "Profil PT. Boemi Nusantara Kaya Berkah — penyedia alat & perlengkapan praktik SMK, vendor pemerintah terdaftar. Legalitas, alur pemesanan instansi, dan kontak resmi.",
  };
}

// Data legalitas — nomor resmi belum tersedia, pakai placeholder yang jujur.
const LEGALITAS = [
  {
    label: "NIB",
    desc: "Nomor Induk Berusaha",
  },
  {
    label: "NPWP",
    desc: "Nomor Pokok Wajib Pajak Perusahaan",
  },
  {
    label: "SIUP / Akta Pendirian",
    desc: "Surat Izin Usaha Perdagangan & Akta Notaris",
  },
] as const;

const ALUR = [
  {
    judul: "Minta Penawaran",
    desc: "Sampaikan kebutuhan alat praktik SMK beserta jumlah dan spesifikasi. Bisa lewat email atau telepon.",
  },
  {
    judul: "Surat Penawaran Resmi",
    desc: "Kami kirim surat penawaran ber-kop perusahaan lengkap dengan harga, PPN, dan estimasi pengiriman.",
  },
  {
    judul: "PO / Kontrak",
    desc: "Instansi menerbitkan Purchase Order atau kontrak pengadaan sebagai dasar transaksi resmi.",
  },
  {
    judul: "Pengiriman",
    desc: "Barang dikirim langsung oleh tim kami, disertai dokumen serah terima dan faktur pajak.",
  },
] as const;

export default async function TentangPage() {
  // Profil bisa ditimpa lewat CMS (/admin/halaman). Belum diisi → pakai teks bawaan.
  const cms = await getPublishedPage("tentang");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* Profil singkat */}
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red">
          Tentang & Legalitas
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          {cms?.title ?? "PT. Boemi Nusantara Kaya Berkah"}
        </h1>
        {cms ? (
          <div className="mt-4 space-y-4">
            {cms.body
              .split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i} className="text-base leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
          </div>
        ) : (
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Kami adalah penyedia alat dan perlengkapan praktik SMK — dari
            peralatan bengkel, laboratorium, hingga perlengkapan tata boga dan
            administrasi. Sebagai vendor yang terdaftar sebagai penyedia
            pemerintah, kami terbiasa melayani pengadaan instansi dengan dokumen
            resmi, harga ber-PPN, dan pengiriman yang tercatat.
          </p>
        )}
      </header>

      {/* Legalitas */}
      <section className="mt-14" aria-labelledby="legalitas-heading">
        <h2
          id="legalitas-heading"
          className="text-lg font-semibold tracking-tight text-navy"
        >
          Legalitas Perusahaan
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Dokumen legalitas kami lengkap dan dapat diverifikasi oleh panitia
          pengadaan.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {LEGALITAS.map((item) => (
            <li
              key={item.label}
              className="rounded-[var(--radius-card)] border border-line bg-paper-dim p-4"
            >
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-mute">{item.desc}</p>
              <p className="mt-3 text-xs font-medium text-ink-soft">
                Nomor tersedia; dokumen resmi dapat diberikan atas permintaan
                pengadaan.
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Alur pemesanan instansi */}
      <section className="mt-14" aria-labelledby="alur-heading">
        <h2
          id="alur-heading"
          className="text-lg font-semibold tracking-tight text-navy"
        >
          Alur Pemesanan Instansi
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Proses pengadaan yang rapi dan sesuai administrasi instansi.
        </p>
        <ol className="mt-6 space-y-4">
          {ALUR.map((step, i) => (
            <li key={step.judul} className="flex gap-4">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-paper"
              >
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-ink">{step.judul}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Kontak */}
      <section
        className="mt-14 rounded-[var(--radius-card)] border border-line bg-paper-dim p-6 sm:p-8"
        aria-labelledby="kontak-heading"
      >
        <h2
          id="kontak-heading"
          className="text-lg font-semibold tracking-tight text-navy"
        >
          Kontak & Alamat
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-mute">
              Alamat
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-ink">
              Jl. Hasyim Ashari No. 34 C-D, Cipondoh, Tangerang
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-mute">
              Telp / Fax
            </dt>
            <dd className="mt-1.5 text-sm text-ink">
              <a
                href="tel:+622155717126"
                className="font-medium text-navy hover:underline"
              >
                (021) 55717126
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-mute">
              Email
            </dt>
            <dd className="mt-1.5 text-sm text-ink">
              <a
                href="mailto:info@boeminusantara.com"
                className="font-medium text-navy hover:underline"
              >
                info@boeminusantara.com
              </a>
            </dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-card)] bg-navy px-4 text-sm font-medium text-paper transition hover:bg-navy-deep"
          >
            Lihat katalog produk
          </Link>
        </div>
      </section>
    </div>
  );
}

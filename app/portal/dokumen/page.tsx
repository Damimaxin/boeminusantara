import Link from "next/link";
import { getPortalUser, listMyQuotes } from "@/lib/portal";
import { listDocumentsForRequest } from "@/lib/admin/documents";
import type { DocType } from "@/lib/admin/company";
import { formatIDR } from "@/lib/format";

export const metadata = { title: "Dokumen" };

const NAMA_DOK: Record<string, string> = {
  SP: "Surat Pesanan",
  INV: "Invoice",
  SJ: "Surat Jalan",
  BAST: "Berita Acara Serah Terima",
  KW: "Kwitansi",
  NEG: "Riwayat Negosiasi",
  PDN: "Surat Pernyataan PDN",
};

/** Yang biasanya diminta panitia pengadaan — dipakai untuk daftar centang. */
const WAJIB: DocType[] = ["SP", "INV", "SJ", "BAST", "KW"];

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function PortalDokumen() {
  const user = (await getPortalUser())!;
  const quotes = await listMyQuotes(user);

  // Dokumen diambil per transaksi milik pemakai ini — bukan dari daftar global.
  const perTransaksi = await Promise.all(
    quotes.map(async (q) => ({
      quote: q,
      dokumen: (await listDocumentsForRequest(q.id)).filter((d) => !d.voidedAt),
    })),
  );

  const adaIsi = perTransaksi.some((t) => t.dokumen.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Dokumen
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Berkas pengadaan Anda, tersusun per transaksi. Tanda centang menunjukkan
          dokumen yang sudah terbit — berguna saat memeriksa kelengkapan berkas.
        </p>
      </header>

      {!adaIsi ? (
        <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
          Belum ada dokumen terbit. Dokumen muncul di sini setelah harga
          disepakati dan tim Boemi menerbitkan surat pesanan.
        </div>
      ) : (
        <div className="space-y-5">
          {perTransaksi
            .filter((t) => t.dokumen.length > 0)
            .map(({ quote, dokumen }) => {
              const terbit = new Set(dokumen.map((d) => d.docType));
              return (
                <section
                  key={quote.id}
                  className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/portal/penawaran/${quote.id}`}
                      className="font-medium text-[var(--color-navy)] hover:underline"
                    >
                      {quote.code}
                    </Link>
                    <span className="text-xs text-[var(--color-mute)]">
                      {tanggal(quote.createdAt)} · {formatIDR(quote.subtotal)}
                    </span>
                  </div>

                  {/* Daftar centang kelengkapan */}
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                    {WAJIB.map((j) => (
                      <li
                        key={j}
                        className={
                          "rounded-full px-2 py-0.5 " +
                          (terbit.has(j)
                            ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                            : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
                        }
                      >
                        {terbit.has(j) ? "✓ " : "○ "}
                        {NAMA_DOK[j]}
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-4 divide-y divide-[var(--color-line-soft)]">
                    {dokumen.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                      >
                        <div>
                          <div className="text-[var(--color-ink)]">
                            {NAMA_DOK[d.docType] ?? d.docType}
                          </div>
                          <div className="text-xs text-[var(--color-mute)]">
                            {d.number} · {tanggal(d.issuedAt)}
                          </div>
                        </div>
                        <Link
                          href={`/dokumen/${d.id}`}
                          className="text-[var(--color-navy)] hover:underline"
                        >
                          Unduh / cetak
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
        </div>
      )}

      <p className="text-xs text-[var(--color-mute)]">
        Faktur pajak diunggah tim Boemi setelah terbit dari Coretax dan akan
        muncul di daftar ini.
      </p>
    </div>
  );
}

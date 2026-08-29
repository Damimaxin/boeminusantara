import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getQuotationByRequest } from "@/lib/admin/quotes";
import { listDocumentsForRequest } from "@/lib/admin/documents";
import { formatIDR } from "@/lib/format";
import { PrintButton } from "../../_components/PrintButton";

export const metadata = { title: "Surat Penawaran" };

const COMPANY = {
  name: "PT. Boemi Nusantara Kaya Berkah",
  address: "Jl. Hasyim Ashari No. 34 C-D, Cipondoh, Tangerang",
  contact: "Telp/Fax (021) 55717126 · info@boeminusantara.com",
};

function formatDateLong(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function SuratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await getQuotationByRequest(id);

  // Jalur lama: surat = tabel `quotations`. Alur sekarang memakai DOKUMEN
  // (Surat Pesanan/SP). Kalau tidak ada quotation, arahkan ke dokumen SP bila
  // ada, jika tidak kembali ke rincian penawaran — jangan biarkan 404.
  if (!q) {
    const dokumen = await listDocumentsForRequest(id);
    const sp = dokumen.find((d) => d.docType === "SP" && !d.voidedAt);
    if (sp) redirect(`/dokumen/${sp.id}`);
    redirect(`/admin/penawaran/${id}`);
  }

  const req = q.quote_requests;
  const items = req?.quote_request_items ?? [];
  const recipient = req?.institution || req?.customer_name || "—";

  return (
    <>
      {/* Aturan print: margin halaman cukup besar supaya KOP tidak terpotong.
          KOP mengalir normal di atas dokumen (bukan position:fixed) → aman saat print. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 20mm 18mm 22mm 18mm; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
              .surat-sheet {
                box-shadow: none !important;
                border: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: none !important;
              }
              .surat-table { page-break-inside: auto; }
              .surat-table tr { page-break-inside: avoid; }
            }
          `,
        }}
      />

      {/* Bar aksi (tidak ikut tercetak) */}
      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/admin/penawaran/${id}`}
          className="text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]"
        >
          ← Kembali ke permintaan
        </Link>
        <PrintButton />
      </div>

      {/* Lembar surat */}
      <div className="surat-sheet mx-auto max-w-[820px] rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-10 text-[var(--color-navy)] shadow-sm">
        {/* KOP */}
        <header className="flex items-start gap-4 border-b-2 border-[var(--color-navy)] pb-4">
          <Image
            src="/boemi-logo.png"
            alt="Boemi Nusantara"
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {COMPANY.name}
            </h1>
            <p className="text-sm text-[var(--color-navy)]/80">
              {COMPANY.address}
            </p>
            <p className="text-sm text-[var(--color-navy)]/80">
              {COMPANY.contact}
            </p>
          </div>
        </header>

        {/* Judul + meta */}
        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold uppercase tracking-widest underline underline-offset-4">
            Surat Penawaran Harga
          </h2>
        </div>

        <div className="mt-6 flex justify-between text-sm">
          <div>
            <div className="text-[var(--color-navy)]/70">Nomor</div>
            <div className="font-semibold">{q.code}</div>
          </div>
          <div className="text-right">
            <div className="text-[var(--color-navy)]/70">Tanggal</div>
            <div className="font-semibold">
              {formatDateLong(q.approved_at || q.created_at)}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <div className="text-[var(--color-navy)]/70">Kepada Yth.</div>
          <div className="font-semibold">{recipient}</div>
          {req?.customer_name && req?.institution && (
            <div className="text-[var(--color-navy)]/80">
              u.p. {req.customer_name}
            </div>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[var(--color-navy)]/90">
          Dengan hormat, bersama surat ini kami sampaikan penawaran harga untuk
          barang-barang sebagai berikut:
        </p>

        {/* Tabel item */}
        <table className="surat-table mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-[var(--color-navy)] text-left">
              <th className="w-10 px-2 py-2 font-semibold">No</th>
              <th className="px-2 py-2 font-semibold">Nama Barang</th>
              <th className="w-16 px-2 py-2 text-right font-semibold">Qty</th>
              <th className="px-2 py-2 text-right font-semibold">
                Harga Satuan
              </th>
              <th className="px-2 py-2 text-right font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr
                key={it.id}
                className="border-b border-[var(--color-navy)]/20"
              >
                <td className="px-2 py-2 align-top">{i + 1}</td>
                <td className="px-2 py-2 align-top">{it.name}</td>
                <td className="px-2 py-2 text-right align-top tabular-nums">
                  {it.qty}
                </td>
                <td className="px-2 py-2 text-right align-top tabular-nums">
                  {formatIDR(it.price)}
                </td>
                <td className="px-2 py-2 text-right align-top tabular-nums">
                  {formatIDR(it.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-2 py-1.5 text-right">
                Subtotal (belum termasuk PPN)
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatIDR(q.subtotal)}
              </td>
            </tr>
            {q.discount > 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-1.5 text-right">
                  Diskon
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  − {formatIDR(q.discount)}
                </td>
              </tr>
            )}
            {q.ppn_enabled && (
              <tr>
                <td colSpan={4} className="px-2 py-1.5 text-right">
                  PPN 11%
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatIDR(q.ppn_amount)}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-[var(--color-navy)] text-base font-bold">
              <td colSpan={4} className="px-2 py-2 text-right">
                TOTAL
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatIDR(q.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Masa berlaku + syarat */}
        <div className="mt-6 space-y-3 text-sm text-[var(--color-navy)]/90">
          <p>
            <span className="font-semibold">Masa berlaku penawaran:</span>{" "}
            {q.valid_until ? formatDateLong(q.valid_until) : "—"}
          </p>
          {q.terms && (
            <div>
              <div className="font-semibold">Syarat &amp; Ketentuan:</div>
              <p className="whitespace-pre-line leading-relaxed">{q.terms}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-[var(--color-navy)]/90">
          Demikian penawaran ini kami sampaikan. Atas perhatian dan kerja
          samanya, kami ucapkan terima kasih.
        </p>

        {/* Tanda tangan */}
        <div className="mt-10 flex justify-end">
          <div className="text-center text-sm">
            <div className="text-[var(--color-navy)]/80">Hormat kami,</div>
            <div className="font-semibold">{COMPANY.name}</div>
            <div className="h-20" />
            <div className="border-t border-[var(--color-navy)] pt-1 font-semibold">
              {q.approved_by || "( ................................. )"}
            </div>
            <div className="text-[var(--color-navy)]/70">Bagian Penjualan</div>
          </div>
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocument } from "@/lib/admin/documents";
import { checkAdmin } from "@/lib/admin/auth";
import { getPortalUser, getMyQuote } from "@/lib/portal";
import { formatIDR } from "@/lib/format";
import { CetakButton } from "./CetakButton";

export const metadata: Metadata = {
  title: "Dokumen",
  robots: { index: false, follow: false },
};

// Warna kop dokumen — biru navy sesuai logo Boemi.
const BIRU = "#1b2f6f";

// Dokumen yang MENAMPILKAN harga: Surat Pesanan, Invoice, Kwitansi, Negosiasi.
const DENGAN_HARGA = new Set(["SP", "INV", "KW", "NEG"]);
// Dokumen tanpa harga (hanya nama + qty): Surat Jalan, BAST, Pernyataan PDN.
const TANPA_HARGA = new Set(["SJ", "BAST", "PDN"]);

const KLAUSUL = [
  "Penyedia berkewajiban menyediakan barang/jasa sesuai surat pesanan ini dan dalam jangka waktu yang berlaku.",
  "Penyedia berhak memintakan pembayaran sesuai total pembayaran setelah pekerjaan selesai, dibuktikan dengan Berita Acara Serah Terima.",
  "Pemesan berhak mendapatkan barang atau jasa sesuai surat pesanan ini.",
  "Pemesan berhak menolak barang/jasa yang tidak sesuai dengan surat pesanan.",
  "Pemesan berkewajiban menyelesaikan pembayaran sesuai mekanisme yang disepakati.",
  "Segala perselisihan yang timbul diselesaikan antara para pihak sesuai ketentuan yang berlaku.",
];

const JUDUL: Record<string, string> = {
  SP: "Surat Pesanan",
  INV: "Surat Tagihan / Invoice",
  SJ: "Surat Jalan",
  BAST: "Berita Acara Serah Terima",
  KW: "Kwitansi",
  NEG: "Riwayat Negosiasi Harga",
  PDN: "Surat Pernyataan PDN",
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function tanggalPanjang(iso: string): string {
  const d = new Date(iso);
  return `${HARI[d.getDay()]} ${d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

const tanggalPendek = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/**
 * Halaman cetak dokumen. Isinya dibaca dari snapshot yang dibekukan saat
 * terbit — bukan dari data terkini — sehingga surat yang sama selalu tampil
 * sama, berapa lama pun setelah diterbitkan.
 *
 * Yang boleh membuka: admin Boemi, atau pemilik permintaan penawarannya.
 */
export default async function DokumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const gate = await checkAdmin();
  let boleh = gate.ok;

  if (!boleh && doc.requestId) {
    const user = await getPortalUser();
    if (user) boleh = (await getMyQuote(user, doc.requestId)) !== null;
  }

  // Bukan haknya → 404, bukan "dilarang".
  if (!boleh) notFound();

  const s = doc.snapshot;
  const denganHarga = DENGAN_HARGA.has(s.jenis);
  const tdBorder = "border border-black px-2 py-1.5";

  // ---- Tabel rincian DENGAN harga (SP / INV / KW / NEG) ----
  const tabelHarga = (label: string) => (
    <section className="mt-6">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </p>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border border-black bg-neutral-100">
            <th className={tdBorder + " text-left font-semibold"}>No.</th>
            <th className={tdBorder + " text-left font-semibold"}>Uraian Barang / Jasa</th>
            <th className={tdBorder + " text-right font-semibold"}>Jumlah</th>
            <th className={tdBorder + " text-left font-semibold"}>Satuan</th>
            <th className={tdBorder + " text-right font-semibold"}>Harga Satuan</th>
            <th className={tdBorder + " text-right font-semibold"}>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          {s.items.map((it, i) => (
            <tr key={i}>
              <td className={tdBorder + " align-top"}>{i + 1}</td>
              <td className={tdBorder}>
                {it.nama}
                <div className="text-[11px] text-neutral-600">Barang Kena PPN</div>
              </td>
              <td className={tdBorder + " text-right tabular-nums"}>{it.qty}</td>
              <td className={tdBorder}>{it.satuan}</td>
              <td className={tdBorder + " text-right tabular-nums"}>{formatIDR(it.hargaSatuan)}</td>
              <td className={tdBorder + " text-right tabular-nums"}>{formatIDR(it.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className={tdBorder + " text-right"}>Total sebelum PPN</td>
            <td className={tdBorder + " text-right tabular-nums"}>{formatIDR(s.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={5} className={tdBorder + " text-right"}>PPN {s.ppnRate}%</td>
            <td className={tdBorder + " text-right tabular-nums"}>{formatIDR(s.ppn)}</td>
          </tr>
          <tr>
            <td colSpan={5} className={tdBorder + " text-right font-semibold"}>Total Pembayaran</td>
            <td className={tdBorder + " text-right font-semibold tabular-nums"}>{formatIDR(s.total)}</td>
          </tr>
          {s.pph > 0 && (
            <tr>
              <td colSpan={5} className={tdBorder + " text-right"}>PPh {s.pphRate}%</td>
              <td className={tdBorder + " text-right tabular-nums"}>{formatIDR(s.pph)}</td>
            </tr>
          )}
        </tfoot>
      </table>
      <p className="mt-2 text-[12px]">
        <span className="font-semibold">Terbilang: </span>
        {s.terbilang}
      </p>
    </section>
  );

  // ---- Tabel rincian TANPA harga (SJ / BAST / PDN): nama + qty ----
  const tabelBarang = (label: string) => (
    <section className="mt-6">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </p>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border border-black bg-neutral-100">
            <th className={tdBorder + " text-left font-semibold"}>No.</th>
            <th className={tdBorder + " text-left font-semibold"}>Nama Barang</th>
            <th className={tdBorder + " text-right font-semibold"}>Jumlah</th>
            <th className={tdBorder + " text-left font-semibold"}>Satuan</th>
          </tr>
        </thead>
        <tbody>
          {s.items.map((it, i) => (
            <tr key={i}>
              <td className={tdBorder + " align-top"}>{i + 1}</td>
              <td className={tdBorder}>{it.nama}</td>
              <td className={tdBorder + " text-right tabular-nums"}>{it.qty}</td>
              <td className={tdBorder}>{it.satuan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  // ---- Riwayat tawar-menawar (NEG) ----
  const riwayatNegosiasi = () =>
    s.ronde && (
      <section className="mt-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          Riwayat Tawar-menawar
        </p>
        <div className="space-y-3">
          {s.ronde.map((r) => (
            <div key={r.nomor} className="border border-black p-2 text-[11.5px]">
              <p className="font-semibold">
                Ronde {r.nomor} · {r.pihak} · {tanggalPendek(r.waktu)}
              </p>
              {r.items.length > 0 && (
                <table className="mt-1 w-full">
                  <tbody>
                    {r.items.map((it, k) => (
                      <tr key={k}>
                        <td className="py-0.5">{it.nama}</td>
                        <td className="py-0.5 text-right tabular-nums">{it.qty} ×</td>
                        <td className="py-0.5 text-right tabular-nums">{formatIDR(it.hargaSatuan)}</td>
                        <td className="py-0.5 text-right tabular-nums">{formatIDR(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {r.catatan && <p className="mt-1 italic">“{r.catatan}”</p>}
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <div className="relative mx-auto max-w-[820px] overflow-hidden bg-white px-6 py-8 text-[13px] leading-relaxed text-black print:px-0 print:py-0">
      {/* Watermark logo Boemi di tengah — samar, ikut tercetak */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/boemi-mark.png"
          alt=""
          className="w-[62%] max-w-[430px] opacity-[0.06]"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        />
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <a href="/admin/penawaran" className="text-sm hover:underline" style={{ color: BIRU }}>
            ← Kembali
          </a>
          <CetakButton />
        </div>

        {doc.voidedAt && (
          <p className="mb-4 border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-700">
            Dokumen ini dibatalkan pada {tanggalPendek(doc.voidedAt)}.
          </p>
        )}

        {/* Kop */}
        <header className="border-b-2 pb-3" style={{ borderColor: BIRU }}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-base font-bold uppercase tracking-wide" style={{ color: BIRU }}>
                {s.penerbit.nama}
              </h1>
              <p className="mt-1 max-w-sm text-[12px]">{s.penerbit.alamat}</p>
              <p className="text-[12px]">
                {s.penerbit.telepon} · {s.penerbit.email}
              </p>
              <p className="text-[12px]">NPWP: {s.penerbit.npwp}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold uppercase" style={{ color: BIRU }}>
                {JUDUL[s.jenis] ?? "Dokumen"}
              </p>
              <p className="text-[12px]">Nomor: {s.nomor}</p>
            </div>
          </div>
        </header>

        {/* Para pihak — tidak untuk PDN (surat pernyataan sepihak) */}
        {s.jenis !== "PDN" && (
        <section className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
              Kepada
            </p>
            <p className="mt-1 font-semibold">{s.pembeli.instansi}</p>
            {s.pembeli.alamat && <p className="text-[12px]">{s.pembeli.alamat}</p>}
            {s.pembeli.kota && <p className="text-[12px]">{s.pembeli.kota}</p>}
            {s.pembeli.npwp && <p className="text-[12px]">NPWP: {s.pembeli.npwp}</p>}
          </div>
          <div>
            <table className="w-full text-[12px]">
              <tbody>
                <tr>
                  <td className="py-0.5 pr-2 text-neutral-600">Tanggal</td>
                  <td className="py-0.5">{tanggalPendek(s.tanggal)}</td>
                </tr>
                {s.tanggalNegosiasi && (
                  <tr>
                    <td className="py-0.5 pr-2 text-neutral-600">Tanggal negosiasi</td>
                    <td className="py-0.5">{tanggalPendek(s.tanggalNegosiasi)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-0.5 pr-2 text-neutral-600">No. permintaan</td>
                  <td className="py-0.5">{s.kodePermintaan}</td>
                </tr>
                {s.pembeli.tahunAnggaran && (
                  <tr>
                    <td className="py-0.5 pr-2 text-neutral-600">Tahun anggaran</td>
                    <td className="py-0.5">
                      {s.pembeli.tahunAnggaran}
                      {s.pembeli.sumberDana ? ` · ${s.pembeli.sumberDana}` : ""}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {/* Rincian — bentuknya tergantung jenis dokumen. PDN punya bodinya sendiri. */}
        {s.jenis === "PDN" ? null : s.jenis === "NEG" ? (
          <>
            {/* Negosiasi: riwayat dulu, baru tabel harga sesuai kesepakatan */}
            {riwayatNegosiasi()}
            {tabelHarga("Harga Sesuai Kesepakatan")}
          </>
        ) : denganHarga ? (
          tabelHarga("Rincian Pekerjaan")
        ) : (
          tabelBarang("Rincian Barang")
        )}

        {s.catatan && (
          <section className="mt-4 text-[12px]">
            <span className="font-semibold">Catatan: </span>
            {s.catatan}
          </section>
        )}

        {/* Bagian khas per jenis dokumen */}
        {s.jenis === "INV" && s.bank && (
          <section className="mt-5 border border-black p-3 text-[12px]">
            <p className="font-semibold">Pembayaran</p>
            <table className="mt-1 w-full">
              <tbody>
                <tr>
                  <td className="w-40 py-0.5 text-neutral-600">Bank</td>
                  <td className="py-0.5">{s.bank.nama}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-600">Nomor rekening</td>
                  <td className="py-0.5 font-semibold">{s.bank.nomor}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-neutral-600">Atas nama</td>
                  <td className="py-0.5">{s.bank.atasNama}</td>
                </tr>
                {s.jatuhTempo && (
                  <tr>
                    <td className="py-0.5 text-neutral-600">Batas pembayaran</td>
                    <td className="py-0.5">{tanggalPendek(s.jatuhTempo)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="mt-2 text-[11px]">
              Mohon cantumkan nomor {s.nomorSuratPesanan ?? s.nomor} pada berita transfer.
            </p>
          </section>
        )}

        {s.jenis === "BAST" && (
          <section className="mt-5 text-[12px] leading-relaxed">
            <p>
              Pada hari ini, {tanggalPanjang(s.tanggal)}, bertempat di{" "}
              {s.pembeli.kota || "lokasi penerima"}, kedua belah pihak menyatakan
              bahwa barang sebagaimana dirinci di atas telah diserahkan oleh{" "}
              <span className="font-semibold">{s.penerbit.nama}</span> dan diterima
              dalam keadaan baik serta sesuai pesanan oleh{" "}
              <span className="font-semibold">{s.pembeli.instansi}</span>.
            </p>
            <p className="mt-2">
              Berita acara ini dibuat sebagai dasar penyelesaian pembayaran atas
              Surat Pesanan Nomor {s.nomorSuratPesanan ?? "-"}.
            </p>
          </section>
        )}

        {s.jenis === "KW" && (
          <section className="mt-5 border border-black p-4 text-[12px] leading-relaxed">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-40 py-1 align-top text-neutral-600">Telah diterima dari</td>
                  <td className="py-1 font-semibold">{s.pembeli.instansi}</td>
                </tr>
                <tr>
                  <td className="py-1 align-top text-neutral-600">Uang sejumlah</td>
                  <td className="py-1 font-semibold">{s.terbilang}</td>
                </tr>
                <tr>
                  <td className="py-1 align-top text-neutral-600">Untuk pembayaran</td>
                  <td className="py-1">
                    Pengadaan barang sesuai Surat Pesanan Nomor{" "}
                    {s.nomorSuratPesanan ?? s.kodePermintaan}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 inline-block border border-black px-3 py-1 text-base font-bold">
              {formatIDR(s.total)}
            </p>
          </section>
        )}

        {s.jenis === "PDN" && (
          <section className="mt-6 text-[12px] leading-relaxed">
            {/* Yang menyatakan (sepihak — penerbit/Boemi) */}
            <p>Saya yang bertanda tangan di bawah ini:</p>
            <table className="mt-2">
              <tbody>
                <tr>
                  <td className="w-32 py-0.5 align-top">Nama</td>
                  <td className="py-0.5">: {s.penerbit.penandatangan || "—"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Jabatan</td>
                  <td className="py-0.5">: {s.penerbit.jabatan || "—"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Perusahaan</td>
                  <td className="py-0.5">: {s.penerbit.nama}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Alamat</td>
                  <td className="py-0.5">: {s.penerbit.alamat}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">No. Telp</td>
                  <td className="py-0.5">: {s.penerbit.telepon}</td>
                </tr>
              </tbody>
            </table>

            {/* Program & tahun anggaran — disesuaikan per pengadaan */}
            <p className="mt-3">
              Dalam rangka memenuhi kebutuhan barang dan jasa{" "}
              <span className="font-semibold">
                Program {s.pembeli.sumberDana?.trim() || "( Nama Program )"}
              </span>{" "}
              pada{" "}
              <span className="font-semibold">
                Tahun Anggaran {s.pembeli.tahunAnggaran ?? "( Tahun )"}
              </span>
              {s.pembeli.instansi ? ` di ${s.pembeli.instansi}` : ""}:
            </p>

            {/* Redaksi pernyataan resmi dari Boemi (Identitas Perusahaan) */}
            {s.pernyataan && (
              <p className="mt-2 whitespace-pre-wrap text-justify">{s.pernyataan}</p>
            )}

            {/* Lampiran: nama barang + spesifikasi + qty (tanpa harga) */}
            <p className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
              Lampiran — Daftar Barang
            </p>
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="border border-black bg-neutral-100">
                  <th className={tdBorder + " w-8 text-left font-semibold"}>No.</th>
                  <th className={tdBorder + " text-left font-semibold"}>Nama Barang</th>
                  <th className={tdBorder + " text-left font-semibold"}>Spesifikasi</th>
                  <th className={tdBorder + " w-16 text-right font-semibold"}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {s.items.map((it, i) => (
                  <tr key={i}>
                    <td className={tdBorder + " align-top"}>{i + 1}</td>
                    <td className={tdBorder + " align-top font-medium"}>{it.nama}</td>
                    <td className={tdBorder + " align-top whitespace-pre-wrap"}>
                      {it.spesifikasi?.trim() || "—"}
                    </td>
                    <td className={tdBorder + " text-right align-top tabular-nums"}>
                      {it.qty} {it.satuan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Klausul — hanya di Surat Pesanan */}
        {s.jenis === "SP" && (
          <section className="mt-5">
            <p className="text-[12px] font-semibold">Ketentuan</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[11.5px]">
              {KLAUSUL.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ol>
          </section>
        )}

        {/* Tanda tangan — dikosongkan untuk tanda tangan basah + meterai. */}
        <section className="mt-8">
          <p className="text-right text-[12px]">
            {s.penerbit.kota}, {tanggalPanjang(s.tanggal)}
          </p>

          {s.jenis === "PDN" ? (
            /* Surat pernyataan = sepihak, hanya penerbit (Boemi) yang menandatangani */
            <div className="mt-3 flex justify-end text-[12px]">
              <div className="w-1/2 text-left">
                <p>{s.penerbit.nama}</p>
                {/* ruang tanda tangan + meterai */}
                <div className="h-28" />
                <p className="font-semibold underline underline-offset-4">
                  {s.penerbit.penandatangan || "( Nama Penjual )"}
                </p>
                {s.penerbit.jabatan && <p>{s.penerbit.jabatan}</p>}
              </div>
            </div>
          ) : (
            /* Dua pihak — Kiri: Pemesan (pembeli), Kanan: Penjual (Boemi) */
            <div className="mt-3 grid grid-cols-2 gap-8 text-[12px]">
              <div>
                <p>Pemesan,</p>
                <div className="h-28" />
                <p className="font-semibold underline underline-offset-4">
                  {s.pembeli.pejabat || "( Nama Pemesan )"}
                </p>
                {s.pembeli.jabatan && <p>{s.pembeli.jabatan}</p>}
                <p>{s.pembeli.instansi}</p>
              </div>
              <div>
                <p>Penjual,</p>
                <div className="h-28" />
                <p className="font-semibold underline underline-offset-4">
                  {s.penerbit.penandatangan || "( Nama Penjual )"}
                </p>
                {s.penerbit.jabatan && <p>{s.penerbit.jabatan}</p>}
                <p>{s.penerbit.nama}</p>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-8 border-t border-neutral-300 pt-2 text-[10px] text-neutral-500">
          Diterbitkan melalui boeminusantara.com pada {tanggalPendek(doc.issuedAt)}.
          Dokumen ini dibekukan saat terbit dan tidak berubah.
        </footer>
      </div>
    </div>
  );
}

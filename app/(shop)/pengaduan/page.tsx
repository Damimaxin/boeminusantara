import { HalamanVokasi } from "../_components/HalamanVokasi";

export const metadata = {
  title: "Pengaduan & Masukan",
  description:
    "Kanal pengaduan resmi Boemi Nusantara untuk barang, layanan, dan proses pengadaan alat praktik SMK.",
};

export default function PengaduanPage() {
  return (
    <HalamanVokasi
      slug="pengaduan"
      judul="Pengaduan & Masukan"
      ringkas="Barang tidak sesuai, pengiriman terlambat, atau dokumen bermasalah — sampaikan langsung kepada kami."
      bawaan={[
        "Pengaduan kami perlakukan sebagai bagian dari pekerjaan, bukan gangguan. Sekolah berhak menolak barang yang tidak sesuai surat pesanan, dan berhak mendapat kejelasan bila terjadi keterlambatan.",
        "Agar penanganannya cepat, sertakan nomor transaksi atau nomor surat pesanan, nama satuan pendidikan, serta uraian singkat masalahnya. Bila menyangkut kondisi barang, foto sangat membantu.",
        "Pengaduan disampaikan lewat email atau telepon di bawah ini dan dijawab pada hari kerja. Kami belum menyediakan formulir daring agar setiap aduan tercatat pada satu jalur yang jelas penanggung jawabnya.",
      ]}
      langkah={[
        { judul: "Kirim aduan", isi: "Lewat email atau telepon, sertakan nomor transaksi bila ada." },
        { judul: "Konfirmasi penerimaan", isi: "Tim kami membalas dan menanyakan kelengkapan bila diperlukan." },
        { judul: "Penelusuran", isi: "Kami periksa riwayat pesanan, pengiriman, dan dokumennya." },
        { judul: "Penyelesaian", isi: "Penggantian, perbaikan, atau pembetulan dokumen sesuai temuan." },
      ]}
      ctaLabel="Sampaikan Pengaduan"
      ctaSubjek="Pengaduan — [nomor transaksi]"
    />
  );
}

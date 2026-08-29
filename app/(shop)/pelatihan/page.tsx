import { HalamanVokasi } from "../_components/HalamanVokasi";

export const metadata = {
  title: "Pelatihan Guru & Teknisi Sekolah",
  description:
    "Pelatihan penggunaan dan perawatan alat praktik SMK untuk guru dan teknisi sekolah bersama Boemi Nusantara.",
};

export default function PelatihanPage() {
  return (
    <HalamanVokasi
      slug="pelatihan"
      judul="Pelatihan Guru & Teknisi Sekolah"
      ringkas="Alat yang bagus tidak berguna kalau tidak ada yang bisa mengoperasikannya dengan benar."
      bawaan={[
        "Banyak alat praktik berhenti dipakai bukan karena rusak, tetapi karena tidak ada yang yakin cara mengoperasikannya. Sebagian lagi cepat rusak karena perawatan hariannya terlewat. Pelatihan ini menutup jarak itu.",
        "Materi disusun mengikuti alat yang benar-benar dimiliki sekolah — bukan materi umum. Isinya pengoperasian yang aman, pemeriksaan rutin, penanganan gangguan ringan, serta pencatatan kondisi alat supaya riwayatnya terlacak.",
        "Pelatihan dapat dilaksanakan di sekolah, menyesuaikan jadwal kegiatan belajar. Untuk pembelian alat bernilai besar, pengenalan penggunaan biasanya sudah termasuk saat serah terima.",
      ]}
      langkah={[
        { judul: "Pendataan alat", isi: "Kami periksa alat apa saja yang ada dan kondisi terkininya." },
        { judul: "Penyusunan materi", isi: "Materi disesuaikan dengan alat dan tingkat pemahaman peserta." },
        { judul: "Pelaksanaan", isi: "Praktik langsung di bengkel sekolah, bukan hanya paparan." },
        { judul: "Panduan tertinggal", isi: "Sekolah menerima panduan singkat perawatan untuk dipakai sehari-hari." },
      ]}
      ctaLabel="Jadwalkan Pelatihan"
      ctaSubjek="Permintaan Pelatihan — [nama sekolah]"
    />
  );
}

import { HalamanVokasi } from "../_components/HalamanVokasi";

export const metadata = {
  title: "Magang Siswa & Guru SMK",
  description:
    "Program magang bagi siswa dan guru SMK bersama Boemi Nusantara — pengenalan alat praktik, perawatan, dan dunia kerja bidang vokasi.",
};

export default function MagangPage() {
  return (
    <HalamanVokasi
      slug="magang"
      judul="Magang Siswa & Guru SMK"
      ringkas="Kesempatan belajar langsung di lingkungan kerja nyata, bukan sekadar teori di kelas."
      bawaan={[
        "Boemi Nusantara sehari-hari berurusan dengan alat praktik SMK: memilih, menguji, mengirim, dan memasangnya di sekolah-sekolah. Pekerjaan itu membuka ruang belajar yang jarang didapat di kelas — mulai dari membaca spesifikasi teknis, memeriksa kondisi alat, sampai berhadapan dengan pengguna sesungguhnya.",
        "Program magang ini terbuka untuk siswa maupun guru. Untuk siswa, fokusnya pengenalan alat dan kebiasaan kerja yang benar. Untuk guru, fokusnya pemahaman alat baru dan cara merawatnya, supaya ilmunya bisa dibawa kembali ke bengkel sekolah.",
        "Kami tidak menjanjikan jumlah kuota tetap. Setiap penempatan disesuaikan dengan kapasitas tim dan kebutuhan sekolah, dan disepakati lebih dulu bersama pihak sekolah.",
      ]}
      langkah={[
        { judul: "Sekolah menghubungi kami", isi: "Sampaikan jurusan, jumlah peserta, dan rentang waktu yang diinginkan." },
        { judul: "Penyesuaian program", isi: "Kami susun materi dan jadwal sesuai kompetensi yang ingin dikuatkan." },
        { judul: "Kesepakatan tertulis", isi: "Penempatan siswa dijalankan atas dasar kesepakatan resmi dengan sekolah." },
        { judul: "Pelaksanaan & laporan", isi: "Peserta bekerja didampingi tim kami, lalu menerima catatan hasil kegiatan." },
      ]}
      ctaLabel="Ajukan Kerja Sama Magang"
      ctaSubjek="Kerja Sama Magang — [nama sekolah]"
    />
  );
}

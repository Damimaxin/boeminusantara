import { isNotifyConfigured } from "@/lib/notify";
import { isXenditConfigured } from "@/lib/xendit";

export const metadata = { title: "Panduan" };

/**
 * Panduan operasional untuk tim Boemi — ditaruh DI DALAM panel, bukan file
 * terpisah, supaya tidak hilang saat serah terima dan selalu ikut versi
 * aplikasi yang sedang jalan.
 */

const TUGAS = [
  {
    judul: "Ada pesanan masuk",
    langkah: [
      "Buka menu Pesanan. Pesanan baru berstatus “Menunggu Bayar”.",
      "Hubungi pembeli lewat telepon/email yang tertera untuk konfirmasi pembayaran dan ongkos kirim.",
      "Setelah dana masuk, ubah status pesanan menjadi sudah dibayar, lalu siapkan pengiriman.",
    ],
  },
  {
    judul: "Ada permintaan penawaran (sekolah/instansi)",
    langkah: [
      "Buka menu Penawaran. Ini jalur untuk alat bernilai besar yang dibeli pakai PO.",
      "Periksa isi permintaan, lalu klik ACC untuk menerbitkan surat penawaran resmi.",
      "Surat bisa langsung dicetak dari halaman surat dan dikirim ke sekolah.",
    ],
  },
  {
    judul: "Menambah atau mengubah produk",
    langkah: [
      "Buka menu Produk lalu klik Tambah Produk.",
      "Harga diisi TANPA PPN — PPN ditambahkan otomatis oleh sistem.",
      "Produk di atas Rp 10 juta otomatis tidak bisa dibeli online; pembeli diarahkan ke jalur penawaran.",
      "Matikan tanda Aktif kalau produk mau disembunyikan tanpa dihapus.",
    ],
  },
  {
    judul: "Stok berubah (barang masuk/keluar)",
    langkah: [
      "Buka menu Stok, catat pergerakan barang masuk atau keluar.",
      "Stok otomatis berkurang sendiri saat pesanan online lunas — jangan dikurangi dua kali.",
    ],
  },
  {
    judul: "Menulis artikel edukasi",
    langkah: [
      "Buka menu Artikel lalu Tulis Artikel.",
      "Simpan sebagai Draf dulu bila belum siap; draf tidak terlihat pengunjung.",
      "Untuk konten kebijakan pendidikan, isi kolom Sumber agar klaim bisa diperiksa pembaca.",
      "Ubah status ke Terbit ketika siap tayang.",
    ],
  },
  {
    judul: "Menambah orang ke panel ini",
    langkah: [
      "Buka menu Pengguna Admin, isi nama dan email staf.",
      "Minta staf tersebut mendaftar sendiri di halaman Daftar memakai email yang sama.",
      "Kata sandi dibuat sendiri oleh yang bersangkutan — tidak ada yang bisa melihatnya, termasuk pengelola.",
    ],
  },
];

export default function PanduanPage() {
  const notifOn = isNotifyConfigured();
  const bayarOn = isXenditConfigured();

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Panduan Pemakaian</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Cara mengerjakan tugas sehari-hari di panel ini.
        </p>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Status sistem saat ini
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex gap-2">
            <span aria-hidden>{notifOn ? "✓" : "•"}</span>
            <span className="text-[var(--color-ink-soft)]">
              {notifOn
                ? "Pemberitahuan email pesanan baru: aktif."
                : "Pemberitahuan email BELUM aktif — pesanan baru tidak mengirim email. Sementara ini, periksa menu Pesanan secara berkala."}
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>{bayarOn ? "✓" : "•"}</span>
            <span className="text-[var(--color-ink-soft)]">
              {bayarOn
                ? "Pembayaran online: aktif."
                : "Pembayaran online BELUM aktif — pesanan tetap tercatat, pembayaran dikonfirmasi manual lewat transfer."}
            </span>
          </li>
        </ul>
      </section>

      {TUGAS.map((t) => (
        <section key={t.judul}>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">{t.judul}</h2>
          <ol className="mt-3 space-y-2 text-sm text-[var(--color-ink-soft)]">
            {t.langkah.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-dim)] text-xs text-[var(--color-mute)]">
                  {i + 1}
                </span>
                <span>{l}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] p-5 text-sm text-[var(--color-ink-soft)]">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Hal yang perlu dijaga
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            Jangan membagikan akun. Setiap orang punya email dan kata sandi sendiri
            supaya jejak perubahan bisa ditelusuri.
          </li>
          <li>
            Harga di panel selalu belum termasuk PPN. Angka yang dilihat pembeli
            sudah ditambah PPN otomatis.
          </li>
          <li>
            Halaman status pesanan bisa dibuka tanpa login, tapi nomornya acak dan
            tidak bisa ditebak. Kirim nomor pesanan hanya ke pembeli yang bersangkutan.
          </li>
        </ul>
      </section>
    </div>
  );
}

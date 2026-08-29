/**
 * Perjalanan satu pengadaan, dari minta penawaran sampai lunas.
 *
 * Ini bahasa yang dipakai panitia pengadaan sehari-hari, bukan istilah sistem.
 * Menampilkan posisi sekarang jauh lebih berguna daripada satu label status,
 * karena pertanyaan mereka selalu "sampai mana" dan "apa lagi yang kurang".
 */

export type TahapKode =
  | "diminta"
  | "nego"
  | "sepakat"
  | "surat"
  | "kirim"
  | "terima"
  | "lunas";

const TAHAP: { kode: TahapKode; label: string; pendek: string }[] = [
  { kode: "diminta", label: "Permintaan masuk", pendek: "Diminta" },
  { kode: "nego", label: "Tawar-menawar", pendek: "Nego" },
  { kode: "sepakat", label: "Harga disepakati", pendek: "Sepakat" },
  { kode: "surat", label: "Surat pesanan terbit", pendek: "Surat" },
  { kode: "kirim", label: "Barang dikirim", pendek: "Kirim" },
  { kode: "terima", label: "Barang diterima", pendek: "Terima" },
  { kode: "lunas", label: "Pembayaran selesai", pendek: "Lunas" },
];

export function tahapSekarang(input: {
  status: string;
  adaSuratPesanan: boolean;
  adaResi: boolean;
  sudahDiterima: boolean;
  adaKwitansi: boolean;
}): TahapKode {
  if (input.adaKwitansi) return "lunas";
  if (input.sudahDiterima) return "terima";
  if (input.adaResi) return "kirim";
  if (input.adaSuratPesanan || input.status === "quoted") return "surat";
  if (input.status === "agreed") return "sepakat";
  if (input.status === "negotiating") return "nego";
  return "diminta";
}

export function PerjalananPengadaan({
  tahap,
  ringkas = false,
}: {
  tahap: TahapKode;
  ringkas?: boolean;
}) {
  const posisi = TAHAP.findIndex((t) => t.kode === tahap);

  return (
    <ol
      className="flex flex-wrap items-center gap-y-2"
      aria-label={`Tahap pengadaan: ${TAHAP[posisi]?.label ?? "-"}`}
    >
      {TAHAP.map((t, i) => {
        const lewat = i < posisi;
        const kini = i === posisi;
        return (
          <li key={t.kode} className="flex items-center">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition " +
                (kini
                  ? "bg-[var(--color-navy)] font-medium text-[var(--color-paper)]"
                  : lewat
                    ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                    : "bg-[var(--color-paper-dim)] text-[var(--color-mute)]")
              }
            >
              {lewat && <span aria-hidden>✓</span>}
              {ringkas ? t.pendek : t.label}
            </span>
            {i < TAHAP.length - 1 && (
              <span
                aria-hidden
                className={
                  "mx-1 h-px w-3 sm:w-5 " +
                  (i < posisi ? "bg-[var(--color-navy)]/30" : "bg-[var(--color-line)]")
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

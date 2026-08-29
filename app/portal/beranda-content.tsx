import Link from "next/link";
import { formatIDR } from "@/lib/format";
import type { PortalQuote, PortalOrder, BuyerProfile } from "@/lib/portal";
import { kelengkapanProfil } from "@/lib/portal";
import { PerjalananPengadaan, type TahapKode } from "@/components/PerjalananPengadaan";

/**
 * Beranda portal: menonjolkan yang BUTUH TINDAKAN lebih dulu, lalu posisi tiap
 * pengadaan yang sedang berjalan. Angka ringkasan dibuat bisa diklik — angka
 * besar yang mati hanya jadi hiasan, sementara yang dicari orang justru
 * "tunjukkan daftarnya".
 */

export type BarisBerjalan = {
  id: string;
  code: string;
  institutionLabel: string;
  nilai: number;
  tahap: TahapKode;
  dokumenTerbit: number;
  dokumenWajib: number;
};

export function BerandaContent({
  quotes,
  orders,
  profile,
  berjalan,
  aset,
}: {
  quotes: PortalQuote[];
  orders: PortalOrder[];
  profile: BuyerProfile;
  berjalan: BarisBerjalan[];
  aset: { total: number; lewat: number; segera: number; garansiHabisSegera: number };
}) {
  const persen = kelengkapanProfil(profile);

  const perluDibalas = quotes.filter((q) => q.status === "negotiating");
  const belumBayar = orders.filter((o) => o.status === "pending");
  const disepakati = quotes.filter((q) => q.status === "agreed");

  const tugas: { teks: string; href: string; mendesak: boolean }[] = [];

  for (const q of perluDibalas) {
    tugas.push({
      teks: `Penawaran ${q.code} menunggu tanggapan harga dari Anda`,
      href: `/portal/penawaran/${q.id}`,
      mendesak: true,
    });
  }
  for (const o of belumBayar) {
    tugas.push({
      teks: `Pesanan ${o.code} menunggu pembayaran`,
      href: `/pesanan/${o.code}`,
      mendesak: true,
    });
  }
  for (const q of disepakati) {
    tugas.push({
      teks: `Harga ${q.code} sudah disepakati — menunggu surat pesanan dari Boemi`,
      href: `/portal/penawaran/${q.id}`,
      mendesak: false,
    });
  }
  if (aset.lewat > 0) {
    tugas.push({
      teks: `${aset.lewat} alat sudah lewat jadwal perawatan`,
      href: "/portal/aset",
      mendesak: true,
    });
  }
  if (aset.segera > 0) {
    tugas.push({
      teks: `${aset.segera} alat perlu diservis dalam 30 hari`,
      href: "/portal/aset",
      mendesak: false,
    });
  }
  if (aset.garansiHabisSegera > 0) {
    tugas.push({
      teks: `Garansi ${aset.garansiHabisSegera} alat berakhir dalam 60 hari`,
      href: "/portal/aset",
      mendesak: false,
    });
  }
  if (persen < 100) {
    tugas.push({
      teks: `Lengkapi profil instansi (${persen}%) agar dokumen terisi otomatis`,
      href: "/portal/profil",
      mendesak: false,
    });
  }

  const nilaiTotal =
    quotes.reduce((s, q) => s + q.subtotal, 0) +
    orders.reduce((s, o) => s + o.total, 0);

  const kartu = [
    {
      judul: "Permintaan penawaran",
      nilai: String(quotes.length),
      href: "/portal/transaksi",
      ket: perluDibalas.length > 0 ? `${perluDibalas.length} perlu dijawab` : "Lihat daftar",
    },
    {
      judul: "Pesanan",
      nilai: String(orders.length),
      href: "/portal/transaksi",
      ket: belumBayar.length > 0 ? `${belumBayar.length} belum dibayar` : "Lihat daftar",
    },
    {
      judul: "Nilai transaksi",
      nilai: formatIDR(nilaiTotal),
      href: "/portal/dokumen",
      ket: profile.budgetYear ? `Tahun anggaran ${profile.budgetYear}` : "Lihat dokumen",
    },
    {
      judul: "Aset tercatat",
      nilai: String(aset.total),
      href: "/portal/aset",
      ket:
        aset.lewat + aset.segera > 0
          ? `${aset.lewat + aset.segera} perlu perawatan`
          : "Lihat daftar aset",
    },
  ];

  return (
    <div className="space-y-10">
      {/* ---------- perlu tindakan ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
          Perlu Tindakan
        </h2>

        {tugas.length === 0 ? (
          <p className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm text-[var(--color-mute)]">
            Tidak ada yang perlu dikerjakan sekarang.
          </p>
        ) : (
          <ul className="space-y-2">
            {tugas.map((t, i) => (
              <li key={i}>
                <Link
                  href={t.href}
                  className={
                    "group flex items-center gap-3 rounded border p-4 text-sm transition hover:border-[var(--color-navy)] " +
                    (t.mendesak
                      ? "border-[var(--color-red)]/30 bg-[var(--color-red)]/5"
                      : "border-[var(--color-line)] bg-[var(--color-paper)]")
                  }
                >
                  <span
                    aria-hidden
                    className={
                      "h-1.5 w-1.5 shrink-0 rounded-full " +
                      (t.mendesak ? "bg-[var(--color-red)]" : "bg-[var(--color-mute)]")
                    }
                  />
                  <span className="flex-1 text-[var(--color-ink)]">{t.teks}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-[var(--color-mute)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-navy)]"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- angka ringkas, bisa diklik ---------- */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <Link
            key={k.judul}
            href={k.href}
            className="group rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition hover:border-[var(--color-navy)]"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-mute)]">
              {k.judul}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-ink)]">
              {k.nilai}
            </p>
            <p className="mt-1 text-xs text-[var(--color-navy)]">
              {k.ket}{" "}
              <span
                aria-hidden
                className="inline-block transition group-hover:translate-x-0.5"
              >
                →
              </span>
            </p>
          </Link>
        ))}
      </section>

      {/* ---------- pengadaan berjalan ---------- */}
      {berjalan.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Pengadaan Berjalan
            </h2>
            <Link
              href="/portal/transaksi"
              className="text-sm text-[var(--color-navy)] hover:underline"
            >
              Semua transaksi →
            </Link>
          </div>

          <ul className="space-y-3">
            {berjalan.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/portal/penawaran/${b.id}`}
                  className="block rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-4 transition hover:border-[var(--color-navy)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{b.code}</span>
                    <span className="text-sm tabular-nums text-[var(--color-ink-soft)]">
                      {formatIDR(b.nilai)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <PerjalananPengadaan tahap={b.tahap} ringkas />
                  </div>

                  <p className="mt-3 text-xs text-[var(--color-mute)]">
                    Dokumen: {b.dokumenTerbit} dari {b.dokumenWajib} berkas utama
                    {b.dokumenTerbit < b.dokumenWajib ? " — belum lengkap" : " — lengkap"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

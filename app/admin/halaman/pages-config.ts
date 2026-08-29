/**
 * Slug halaman yang boleh dikelola lewat CMS. Sengaja daftar tertutup, bukan
 * bebas: tiap halaman butuh route sendiri di storefront, jadi tidak boleh
 * dibuat sembarangan dari panel.
 *
 * File terpisah dari actions.ts karena modul "use server" hanya boleh
 * mengekspor fungsi async.
 */
export const MANAGED_PAGES = [
  "tentang",
  "magang",
  "pelatihan",
  "pengaduan",
] as const;

export type ManagedPage = (typeof MANAGED_PAGES)[number];

export const PAGE_HINTS: Record<ManagedPage, string> = {
  tentang: "Muncul di menu Tentang",
  magang: "Halaman informasi magang siswa & guru",
  pelatihan: "Jadwal dan materi pelatihan",
  pengaduan: "Kanal pengaduan seputar dunia SMK",
};

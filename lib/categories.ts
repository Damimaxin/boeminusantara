// Kategori toko = jurusan SMK sesuai katalog (Excel LISTING PRODUK). Admin bisa tambah nanti.
export type Category = {
  slug: string;
  name: string;
};

export const CATEGORIES: Category[] = [
  { slug: "tkro", name: "Teknik Kendaraan Ringan Otomotif (TKRO)" },
  { slug: "titl", name: "Teknik Instalasi Tenaga Listrik (TITL)" },
  { slug: "toi", name: "Teknik Otomasi Industri (TOI)" },
  { slug: "audio-video", name: "Teknik Audio Video (TAV)" },
  { slug: "tsm", name: "Teknik Sepeda Motor (TSM)" },
  { slug: "pemesinan", name: "Teknik Pemesinan (TP)" },
  { slug: "las-fabrikasi", name: "Teknik Pengelasan & Daiden Japan" },
  { slug: "k3-safety", name: "Keselamatan Kerja & APD (K3 / 3M)" },
];

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

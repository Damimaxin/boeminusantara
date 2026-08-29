// Kategori toko = jurusan SMK & kategori kustom dengan dukungan Sub-kategori.

export type Category = {
  slug: string;
  name: string;
  parentSlug?: string | null; // Null if main category, string if sub-category
  subcategories?: Category[];
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    slug: "tkro",
    name: "Teknik Kendaraan Ringan Otomotif (TKRO)",
    subcategories: [
      { slug: "tkro-mesin", name: "Sistem Mesin & Engine Stand", parentSlug: "tkro" },
      { slug: "tkro-kelistrikan", name: "Kelistrikan Bodi & Chasis", parentSlug: "tkro" },
      { slug: "tkro-scan-tool", name: "Diagnostic Scanner & Alat Ukur", parentSlug: "tkro" },
    ],
  },
  {
    slug: "titl",
    name: "Teknik Instalasi Tenaga Listrik (TITL)",
    subcategories: [
      { slug: "titl-panel", name: "Panel Listrik & Trainer PLC", parentSlug: "titl" },
      { slug: "titl-motor", name: "Motor Listrik & Motor Kontrol", parentSlug: "titl" },
    ],
  },
  {
    slug: "toi",
    name: "Teknik Otomasi Industri (TOI)",
    subcategories: [
      { slug: "toi-pneumatik", name: "Pneumatik & Hidrolik", parentSlug: "toi" },
      { slug: "toi-scada", name: "SCADA & Trainer Otomasi", parentSlug: "toi" },
    ],
  },
  {
    slug: "audio-video",
    name: "Teknik Audio Video (TAV)",
    subcategories: [
      { slug: "tav-vsd", name: "Variable Speed Drive (VSD)", parentSlug: "audio-video" },
      { slug: "tav-multimeter", name: "Instrumentasi Audio Video", parentSlug: "audio-video" },
    ],
  },
  {
    slug: "tsm",
    name: "Teknik Sepeda Motor (TSM)",
    subcategories: [
      { slug: "tsm-injection", name: "Trainer Injeksi FI", parentSlug: "tsm" },
      { slug: "tsm-tools", name: "Special Service Tools (SST)", parentSlug: "tsm" },
    ],
  },
  {
    slug: "pemesinan",
    name: "Teknik Pemesinan (TP)",
    subcategories: [
      { slug: "tp-bubut", name: "Mesin Bubut & Milling", parentSlug: "pemesinan" },
      { slug: "tp-cnc", name: "Trainer CNC Simulator", parentSlug: "pemesinan" },
    ],
  },
  {
    slug: "las-fabrikasi",
    name: "Teknik Pengelasan & Daiden Japan",
    subcategories: [
      { slug: "las-mig-tig", name: "Mesin Las MIG/TIG Daiden", parentSlug: "las-fabrikasi" },
      { slug: "las-helmet", name: "Topeng Las Otomatis & APD", parentSlug: "las-fabrikasi" },
    ],
  },
  {
    slug: "k3-safety",
    name: "Keselamatan Kerja & APD (K3 / 3M)",
    subcategories: [
      { slug: "k3-respirator", name: "Masker Respirator 3M", parentSlug: "k3-safety" },
      { slug: "k3-eyewear", name: "Kacamata Safety & Pelindung", parentSlug: "k3-safety" },
    ],
  },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export function categoryName(slug: string): string {
  for (const c of DEFAULT_CATEGORIES) {
    if (c.slug === slug) return c.name;
    if (c.subcategories) {
      const sub = c.subcategories.find((s) => s.slug === slug);
      if (sub) return `${c.name} → ${sub.name}`;
    }
  }
  return slug;
}

// Kategori toko = jurusan SMK & kategori kustom dengan dukungan Sub-kategori.

export type Category = {
  slug: string;
  name: string;
  parentSlug?: string | null;
  subcategories?: Category[];
  sortOrder?: number;
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_JWT = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function getDynamicCategories(): Promise<Category[]> {
  const map = new Map<string, Category>();

  // 1. Seed defaults
  for (const c of DEFAULT_CATEGORIES) {
    map.set(c.slug.toLowerCase(), { ...c });
  }

  // 2. Fetch from Supabase DB categories table
  if (SUPABASE_URL && SERVICE_ROLE_JWT) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=sort_order.asc`, {
        headers: {
          apikey: SERVICE_ROLE_JWT,
          Authorization: `Bearer ${SERVICE_ROLE_JWT}`,
          "Accept-Profile": "boemi",
          "Content-Profile": "boemi",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const rows = (await res.json()) as { slug: string; name: string; sort_order?: number }[];
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const key = row.slug.toLowerCase();
            const existing = map.get(key);
            if (existing) {
              existing.name = row.name;
            } else {
              map.set(key, {
                slug: row.slug,
                name: row.name,
                sortOrder: row.sort_order,
                subcategories: [],
              });
            }
          }
        }
      }
    } catch {
      // Fallback to default
    }
  }

  return Array.from(map.values());
}

export function categoryName(slug: string, dynamicCategories?: Category[]): string {
  const list = dynamicCategories || DEFAULT_CATEGORIES;
  for (const c of list) {
    if (c.slug === slug) return c.name;
    if (c.subcategories) {
      const sub = c.subcategories.find((s) => s.slug === slug);
      if (sub) return `${c.name} → ${sub.name}`;
    }
  }
  return slug;
}

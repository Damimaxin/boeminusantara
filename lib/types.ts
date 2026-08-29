/** Pilar konten — sama dengan pilar konten IG Boemi. */
export const PILLARS = ["edukasi", "motivasi", "produk", "berita"] as const;
export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABEL: Record<Pillar, string> = {
  edukasi: "Edukasi",
  motivasi: "Motivasi",
  produk: "Produk",
  berita: "Berita",
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  pillar: Pillar;
  excerpt: string;
  /** Isi artikel. Paragraf dipisah baris kosong. */
  body: string;
  cover: string | null;
  /** Rujukan kebijakan/sumber — dipakai pilar edukasi supaya klaim bisa dicek. */
  source: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string | null;
  sortOrder: number;
  active: boolean;
};

/** Halaman statis yang boleh diedit client (Tentang, dsb). */
export type PageDoc = {
  slug: string;
  title: string;
  body: string;
  updatedAt: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string; // category slug (jurusan SMK)
  description: string;
  /** Harga dasar dalam Rupiah, EXCLUDE PPN. */
  price: number;
  stock: number;
  image: string | null;
  /** Galeri hingga 9 foto produk. */
  images?: string[];
  /** Video demonstrasi / unboxing produk. */
  video?: string | null;
  active: boolean;
  sku?: string;
  brand?: string;
  featured?: boolean;
  type?: string;
};

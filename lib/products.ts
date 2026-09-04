import type { Product } from "@/lib/types";
import { SEED_PRODUCTS } from "@/data/seed-products";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_JWT = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type SortKey = "name" | "price_asc" | "price_desc";

export type ProductQuery = {
  category?: string;
  search?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export type ProductResult = { products: Product[]; total: number };

export const DEFAULT_PAGE_SIZE = 24;

function isVideoLink(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  return (
    u.includes("youtube.com") ||
    u.includes("youtu.be") ||
    u.includes("vimeo.com") ||
    u.endsWith(".mp4") ||
    u.endsWith(".webm") ||
    u.endsWith(".mov")
  );
}

function mapRowToProduct(item: any): Product {
  const rawGallery = Array.isArray(item.gallery)
    ? item.gallery
    : Array.isArray(item.images)
    ? item.images
    : [];

  const videoItem = rawGallery.find((g: any) => typeof g === "string" && isVideoLink(g));
  const imagesList = rawGallery.filter((g: any) => g !== videoItem);

  return {
    ...item,
    images: imagesList,
    video: videoItem || item.video || null,
  };
}

export async function getProducts(q: ProductQuery = {}): Promise<ProductResult> {
  const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : DEFAULT_PAGE_SIZE;
  const page = q.page && q.page > 0 ? q.page : 1;
  const offset = (page - 1) * pageSize;

  let rawProducts: Product[] = [];
  let fetchedFromDb = false;

  // 1. Fetch from Supabase REST API (Primary Source)
  if (SUPABASE_URL && SERVICE_ROLE_JWT) {
    try {
      let orderQuery = "&order=name.asc";
      if (q.sort === "price_asc") orderQuery = "&order=price.asc";
      else if (q.sort === "price_desc") orderQuery = "&order=price.desc";

      let url = `${SUPABASE_URL}/rest/v1/products?select=*${orderQuery}&limit=1000`;

      if (q.category) {
        url += `&category=eq.${encodeURIComponent(q.category)}`;
      }

      if (q.search) {
        const s = encodeURIComponent(q.search.trim());
        url += `&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)`;
      }

      const res = await fetch(url, {
        headers: {
          apikey: SERVICE_ROLE_JWT,
          Authorization: `Bearer ${SERVICE_ROLE_JWT}`,
          Prefer: "count=exact",
          "Accept-Profile": "boemi",
          "Content-Profile": "boemi",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as any[];
        if (Array.isArray(data) && data.length > 0) {
          rawProducts = data.map(mapRowToProduct);
          fetchedFromDb = true;
        }
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback to SEED_PRODUCTS if DB is offline or empty
  if (!fetchedFromDb) {
    rawProducts = SEED_PRODUCTS.filter((p) => {
      if (q.category && p.category && p.category.toLowerCase() !== q.category.toLowerCase()) {
        return false;
      }
      if (q.search) {
        const s = q.search.toLowerCase().trim();
        const matchName = p.name && p.name.toLowerCase().includes(s);
        const matchBrand = p.brand && p.brand.toLowerCase().includes(s);
        const matchDesc = p.description && p.description.toLowerCase().includes(s);
        const matchSlug = p.slug && p.slug.toLowerCase().includes(s);
        const matchId = p.id && p.id.toLowerCase().includes(s);
        const matchSku = p.sku && p.sku.toLowerCase().includes(s);
        return matchName || matchBrand || matchDesc || matchSlug || matchId || matchSku;
      }
      return true;
    });
  }

  // 3. Strict Deduplication by normalized name so each product name appears ONLY ONCE
  const map = new Map<string, Product>();
  for (const item of rawProducts) {
    const normKey = (item.name || "").trim().toLowerCase();
    if (!map.has(normKey)) {
      map.set(normKey, item);
    }
  }

  let allProducts = Array.from(map.values());

  if (q.search) {
    const s = q.search.toLowerCase().trim();
    allProducts = allProducts.filter((p) => {
      const matchName = p.name && p.name.toLowerCase().includes(s);
      const matchBrand = p.brand && p.brand.toLowerCase().includes(s);
      const matchDesc = p.description && p.description.toLowerCase().includes(s);
      const matchSlug = p.slug && p.slug.toLowerCase().includes(s);
      const matchId = p.id && p.id.toLowerCase().includes(s);
      const matchSku = p.sku && p.sku.toLowerCase().includes(s);
      return matchName || matchBrand || matchDesc || matchSlug || matchId || matchSku;
    });
  }

  // Sort
  if (q.sort === "price_asc") {
    allProducts.sort((a, b) => a.price - b.price);
  } else if (q.sort === "price_desc") {
    allProducts.sort((a, b) => b.price - a.price);
  } else {
    allProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = allProducts.length;
  const pagedProducts = allProducts.slice(offset, offset + pageSize);

  return { products: pagedProducts, total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (SUPABASE_URL && SERVICE_ROLE_JWT) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&limit=1`, {
        headers: {
          apikey: SERVICE_ROLE_JWT,
          Authorization: `Bearer ${SERVICE_ROLE_JWT}`,
          "Accept-Profile": "boemi",
          "Content-Profile": "boemi",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && data.length > 0) {
          return mapRowToProduct(data[0]);
        }
      }
    } catch {
      // Fallback
    }
  }

  return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

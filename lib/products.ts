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

export const CATEGORY_ALIASES: Record<string, string> = {
  "audio-video": "tav",
  "pemesinan": "tp",
  "k3-safety": "k3",
  "las-fabrikasi": "tp",
};

export function isVideoLink(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.includes("youtube.com") ||
    clean.includes("youtu.be") ||
    clean.includes("vimeo.com") ||
    clean.includes("tinyurl.com") ||
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov")
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
  const rawPageSize = Number(q.pageSize);
  const pageSize = rawPageSize > 0 ? Math.floor(rawPageSize) : DEFAULT_PAGE_SIZE;
  const rawPage = Number(q.page);
  const requestedPage = rawPage > 0 ? Math.floor(rawPage) : 1;

  const resolvedCategory = q.category
    ? (CATEGORY_ALIASES[q.category.toLowerCase()] || q.category)
    : undefined;

  let rawProducts: Product[] = [];
  let fetchedFromDb = false;

  // 1. Fetch from Supabase REST API (Primary Source)
  if (SUPABASE_URL && SERVICE_ROLE_JWT) {
    try {
      let orderQuery = "&order=name.asc";
      if (q.sort === "price_asc") orderQuery = "&order=price.asc";
      else if (q.sort === "price_desc") orderQuery = "&order=price.desc";

      let url = `${SUPABASE_URL}/rest/v1/products?select=*${orderQuery}&limit=1000`;

      if (resolvedCategory) {
        url += `&category=eq.${encodeURIComponent(resolvedCategory)}`;
      }

      if (q.search) {
        const sanitized = q.search.replace(/[,()]/g, " ").trim();
        if (sanitized) {
          const s = encodeURIComponent(sanitized);
          url += `&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)`;
        }
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
      if (resolvedCategory && p.category && p.category.toLowerCase() !== resolvedCategory.toLowerCase()) {
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const validPage = Math.min(requestedPage, totalPages);
  const offset = (validPage - 1) * pageSize;
  const pagedProducts = allProducts.slice(offset, offset + pageSize);

  return { products: pagedProducts, total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim();
  if (!cleanSlug) return null;

  if (SUPABASE_URL && SERVICE_ROLE_JWT) {
    try {
      const s = encodeURIComponent(cleanSlug);
      // Query DB by exact slug, exact id, or slug prefix match
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?or=(slug.eq.${s},id.eq.${s},slug.ilike.${s}*)&limit=1`,
        {
          headers: {
            apikey: SERVICE_ROLE_JWT,
            Authorization: `Bearer ${SERVICE_ROLE_JWT}`,
            "Accept-Profile": "boemi",
            "Content-Profile": "boemi",
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && data.length > 0) {
          return mapRowToProduct(data[0]);
        }
      }

      // Fallback: fetch all DB products and match by ID, slug, prefix, or normalized name
      const allRes = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=*&limit=1000`,
        {
          headers: {
            apikey: SERVICE_ROLE_JWT,
            Authorization: `Bearer ${SERVICE_ROLE_JWT}`,
            "Accept-Profile": "boemi",
            "Content-Profile": "boemi",
          },
          cache: "no-store",
        }
      );
      if (allRes.ok) {
        const allData = (await allRes.json()) as any[];
        if (Array.isArray(allData) && allData.length > 0) {
          const mapped = allData.map(mapRowToProduct);
          const lower = cleanSlug.toLowerCase();

          let match = mapped.find(
            (p) =>
              p.id?.toLowerCase() === lower ||
              p.slug?.toLowerCase() === lower ||
              p.slug?.toLowerCase().startsWith(lower) ||
              lower.startsWith(p.slug?.toLowerCase() || "")
          );

          if (!match) {
            const normClean = lower.replace(/[^a-z0-9]/g, "");
            match = mapped.find(
              (p) =>
                (p.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").includes(normClean) ||
                normClean.includes((p.name || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
            );
          }

          if (match) return match;
        }
      }
    } catch {
      // Fallback
    }
  }

  return SEED_PRODUCTS.find((p) => p.slug === cleanSlug || p.id === cleanSlug) ?? null;
}

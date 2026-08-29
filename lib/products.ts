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

export async function getProducts(q: ProductQuery = {}): Promise<ProductResult> {
  const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : DEFAULT_PAGE_SIZE;
  const page = q.page && q.page > 0 ? q.page : 1;
  const offset = (page - 1) * pageSize;

  const map = new Map<string, Product>();

  // 1. Seed Products matching query
  const seedFiltered = SEED_PRODUCTS.filter(p => {
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

  for (const item of seedFiltered) {
    if (item.id) map.set(item.id, item);
  }

  // 2. Fetch from Supabase REST API
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
        const data = (await res.json()) as Product[];
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.id) map.set(item.id, item);
          }
        }
      }
    } catch {
      // Supabase REST fallback
    }
  }

  let allProducts = Array.from(map.values());

  if (q.search) {
    const s = q.search.toLowerCase().trim();
    allProducts = allProducts.filter(p => {
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
        const data = (await res.json()) as Product[];
        if (data && data.length > 0) return data[0];
      }
    } catch {
      // Fallback
    }
  }

  return SEED_PRODUCTS.find(p => p.slug === slug) ?? null;
}

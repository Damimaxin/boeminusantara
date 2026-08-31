import "server-only";
import type { Product } from "@/lib/types";
import { SEED_PRODUCTS } from "@/data/seed-products";
import { getAdminSupabase, isAdminDbConnected } from "@/lib/admin/supabase-admin";

/**
 * Data-access ADMIN untuk produk. Beda dari `lib/products.ts` (storefront):
 * admin melihat SEMUA produk (termasuk non-aktif) dan bisa tulis.
 * Fallback ke SEED_PRODUCTS bila DB belum di-wire.
 */

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  images?: string[];
  video?: string | null;
  active: boolean;
  sku?: string;
  brand?: string;
};

const fromRow = (r: Row): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  description: r.description,
  price: r.price,
  stock: r.stock,
  image: r.image,
  images: r.images,
  video: r.video,
  active: r.active,
  sku: r.sku,
  brand: r.brand,
});

export type AdminProductInput = {
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  images?: string[];
  video?: string | null;
  active: boolean;
  sku?: string;
  brand?: string;
};

/** Semua produk (aktif + non-aktif) untuk tabel admin — ter-deduplikasi ketat berdasarkan nama. */
export async function listAllProducts(): Promise<Product[]> {
  let rawProducts: Product[] = [];
  let fetchedFromDb = false;

  const sb = getAdminSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data && Array.isArray(data) && data.length > 0) {
        rawProducts = (data as Row[]).map(fromRow);
        fetchedFromDb = true;
      }
    } catch {
      // fall through
    }
  }

  if (!fetchedFromDb) {
    rawProducts = SEED_PRODUCTS;
  }

  // Deduplicate by normalized name
  const map = new Map<string, Product>();
  for (const item of rawProducts) {
    const normKey = (item.name || "").trim().toLowerCase();
    if (!map.has(normKey)) {
      map.set(normKey, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProductById(id: string): Promise<Product | null> {
  const sb = getAdminSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data ? fromRow(data as Row) : null;
    } catch {
      // fall through to seed
    }
  }
  return SEED_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Simpan produk baru. Return { ok, id?, error? }. */
export async function createProduct(
  input: AdminProductInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isAdminDbConnected()) {
    return { ok: false, error: "preview" };
  }
  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "preview" };
  try {
    const { data, error } = await sb
      .from("products")
      .insert({ ...input, updated_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (data as { id: string }).id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateProduct(
  id: string,
  input: AdminProductInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAdminDbConnected()) {
    return { ok: false, error: "preview" };
  }
  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "preview" };
  try {
    const { error } = await sb
      .from("products")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Statistik ringkas untuk dashboard. Ambang stok menipis default 10. */
export async function getProductStats(lowStockThreshold = 10): Promise<{
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number; // total nilai stok exPPN
}> {
  const products = await listAllProducts();
  return {
    total: products.length,
    active: products.filter((p) => p.active).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold)
      .length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    inventoryValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };
}

/** Produk dengan stok di bawah ambang (untuk dashboard & tabel stok). */
export async function getLowStockProducts(
  threshold = 10,
): Promise<Product[]> {
  const products = await listAllProducts();
  return products
    .filter((p) => p.stock <= threshold)
    .sort((a, b) => a.stock - b.stock);
}

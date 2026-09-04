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
  gallery?: string[];
  images?: string[];
  video?: string | null;
  active: boolean;
  sku?: string;
  brand?: string;
};

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

const fromRow = (r: Row): Product => {
  const rawGallery = Array.isArray(r.gallery)
    ? r.gallery
    : Array.isArray(r.images)
    ? r.images
    : [];

  const videoItem = rawGallery.find((g) => isVideoLink(g));
  const imagesList = rawGallery.filter((g) => g !== videoItem);

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    price: r.price,
    stock: r.stock,
    image: r.image,
    images: imagesList,
    video: videoItem || r.video || null,
    active: r.active ?? true,
    sku: r.sku,
    brand: r.brand,
  };
};

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

function toDbRow(input: AdminProductInput, generateId = false) {
  const galleryList =
    Array.isArray(input.images) && input.images.length > 0
      ? input.images.filter(Boolean)
      : input.image
      ? [input.image]
      : [];

  // Append video URL to gallery if provided so it is preserved in DB without unmapped video column error
  if (input.video && input.video.trim()) {
    const cleanVid = input.video.trim();
    if (!galleryList.includes(cleanVid)) {
      galleryList.push(cleanVid);
    }
  }

  const catCode = (input.category || "gen").toLowerCase().replace(/[^a-z0-9]/g, "");
  const slugClean = (input.slug || "prod").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);

  // Strictly include ONLY valid columns existing in boemi.products table schema
  const row: Record<string, any> = {
    slug: input.slug,
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price,
    stock: input.stock,
    image: input.image || null,
    gallery: galleryList,
    active: input.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (generateId) {
    row.id = `boemi-${catCode}-${slugClean}-${Date.now().toString(36)}`;
  }

  if (input.sku) row.sku = input.sku;
  if (input.brand) row.brand = input.brand;

  return row;
}

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
        .order("created_at", { ascending: false });
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
  const decodedId = decodeURIComponent(id || "").trim();
  if (!decodedId) return null;

  const sb = getAdminSupabase();
  if (sb) {
    try {
      // Try by id first
      const { data: dataId } = await sb
        .from("products")
        .select("*")
        .eq("id", decodedId)
        .maybeSingle();

      if (dataId) return fromRow(dataId as Row);

      // Try by slug
      const { data: dataSlug } = await sb
        .from("products")
        .select("*")
        .eq("slug", decodedId)
        .maybeSingle();

      if (dataSlug) return fromRow(dataSlug as Row);
    } catch {
      // fall through to seed
    }
  }

  // Fallback to listAllProducts or SEED_PRODUCTS
  const all = await listAllProducts();
  const found = all.find(
    (p) => p.id === decodedId || p.slug === decodedId || p.name.toLowerCase() === decodedId.toLowerCase()
  );
  if (found) return found;

  return SEED_PRODUCTS.find((p) => p.id === decodedId || p.slug === decodedId) ?? null;
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
    const dbPayload = toDbRow(input, true); // generate non-null ID
    const { data, error } = await sb
      .from("products")
      .insert(dbPayload)
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
    const dbPayload = toDbRow(input, false);
    const decodedId = decodeURIComponent(id || "").trim();

    // Update by matching id or slug
    const { error } = await sb
      .from("products")
      .update(dbPayload)
      .or(`id.eq.${decodedId},slug.eq.${decodedId}`);

    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteProduct(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAdminDbConnected()) {
    return { ok: false, error: "preview" };
  }
  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "preview" };
  try {
    const decodedId = decodeURIComponent(id || "").trim();
    const { error } = await sb
      .from("products")
      .delete()
      .or(`id.eq.${decodedId},slug.eq.${decodedId}`);

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
  inventoryValue: number;
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

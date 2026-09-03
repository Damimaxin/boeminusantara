"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { checkAdmin } from "@/lib/admin/auth";
import { DEFAULT_CATEGORIES, type Category } from "@/lib/categories";
import { recordAudit } from "@/lib/audit";

export type CategoryActionResult = {
  ok: boolean;
  error?: string;
  categories?: Category[];
};

export async function getCategoriesAction(): Promise<Category[]> {
  try {
    const sb = getAdminSupabase();
    if (!sb) return DEFAULT_CATEGORIES;

    const { data, error } = await sb
      .from("categories")
      .select("slug, name, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    // Map database categories and merge subcategories from DEFAULT_CATEGORIES if matched
    const defaultMap = new Map<string, Category>();
    for (const cat of DEFAULT_CATEGORIES) {
      defaultMap.set(cat.slug, cat);
    }

    const result: Category[] = (data as { slug: string; name: string; sort_order: number }[]).map((r) => {
      const def = defaultMap.get(r.slug);
      return {
        slug: r.slug,
        name: r.name,
        subcategories: def?.subcategories ?? [],
      };
    });

    return result;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function addCategoryAction(
  name: string,
  slugInput?: string,
  parentSlug?: string
): Promise<CategoryActionResult> {
  const gate = await checkAdmin();
  if (!gate.ok) {
    return { ok: false, error: "Akses ditolak: Anda bukan administrator." };
  }

  const cleanName = name.trim();
  if (!cleanName) {
    return { ok: false, error: "Nama kategori wajib diisi." };
  }

  const slug = (slugInput || cleanName)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    return { ok: false, error: "Slug kategori tidak valid." };
  }

  const sb = getAdminSupabase();
  if (!sb) {
    return { ok: false, error: "Database belum terhubung." };
  }

  try {
    // Determine sort_order
    const { count } = await sb.from("categories").select("*", { count: "exact", head: true });
    const nextOrder = (count ?? 0) + 1;

    const { error } = await sb.from("categories").upsert({
      slug,
      name: cleanName,
      sort_order: nextOrder,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    await recordAudit({
      action: "kategori.tambah",
      target: cleanName,
      detail: { slug, parentSlug: parentSlug || "root" },
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/kategori");
    revalidatePath("/admin/produk");
    revalidatePath("/admin/produk/baru");

    const updated = await getCategoriesAction();
    return { ok: true, categories: updated };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCategoryAction(slug: string): Promise<CategoryActionResult> {
  const gate = await checkAdmin();
  if (!gate.ok) {
    return { ok: false, error: "Akses ditolak: Anda bukan administrator." };
  }

  const sb = getAdminSupabase();
  if (!sb) {
    return { ok: false, error: "Database belum terhubung." };
  }

  try {
    const { error } = await sb.from("categories").delete().eq("slug", slug);
    if (error) {
      return { ok: false, error: error.message };
    }

    await recordAudit({
      action: "kategori.hapus",
      target: slug,
      detail: { slug },
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/kategori");
    revalidatePath("/admin/produk");
    revalidatePath("/admin/produk/baru");

    const updated = await getCategoriesAction();
    return { ok: true, categories: updated };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

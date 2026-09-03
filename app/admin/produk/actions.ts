"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  type AdminProductInput,
} from "@/lib/admin/products";
import { checkAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/audit";

async function requireAdmin() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/produk");
}

export type ProductFormState = {
  ok: boolean;
  error?: string;
  preview?: boolean;
  fieldErrors?: Record<string, string>;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseForm(formData: FormData): {
  input?: AdminProductInput;
  fieldErrors?: Record<string, string>;
} {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  let description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const active = formData.get("active") === "on";

  // Collect 9 photo slots cleanly from both hidden photo_slot_i and input image_i
  const photoSlots: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const slotVal = String(formData.get(`photo_slot_${i}`) ?? "").trim();
    const fallbackKey = i === 1 ? "image" : `image_${i}`;
    const altVal = String(formData.get(fallbackKey) ?? "").trim();
    const finalVal = slotVal || altVal;
    if (finalVal && !photoSlots.includes(finalVal)) {
      photoSlots.push(finalVal);
    }
  }

  // Fallback to 'image' field if photoSlots[0] is empty
  const mainImage = photoSlots[0] || String(formData.get("image") ?? "").trim() || null;
  const video = String(formData.get("video") ?? "").trim() || null;

  const sku = String(formData.get("sku") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const standard = String(formData.get("standard") ?? "").trim();
  const dimensions = String(formData.get("dimensions") ?? "").trim();
  const weight = String(formData.get("weight") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Judul/Nama produk wajib diisi.";
  if (!category) fieldErrors.category = "Pilih kategori jurusan SMK.";
  if (!description) fieldErrors.description = "Deskripsi & spesifikasi lengkap produk wajib diisi.";
  if (!mainImage) fieldErrors.image = "Foto produk wajib diisi (minimal 1 foto utama pada Slot 1).";

  const price = Number(priceRaw);
  if (priceRaw === "" || Number.isNaN(price) || price < 0)
    fieldErrors.price = "Harga harus angka ≥ 0.";

  const stock = Number(stockRaw);
  if (stockRaw === "" || Number.isNaN(stock) || !Number.isInteger(stock))
    fieldErrors.stock = "Stok harus bilangan bulat.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Combine structured meta into description if provided and not already present
  const metaParts: string[] = [];
  if (brand && !description.toLowerCase().includes("merk:")) {
    metaParts.push(`Merk: ${brand}`);
  }
  if (standard && !description.toLowerCase().includes("standar:")) {
    metaParts.push(`Standar: ${standard}`);
  }
  if (sku && !description.toLowerCase().includes("sku:")) {
    metaParts.push(`SKU: ${sku}`);
  }

  const dimParts: string[] = [];
  if (dimensions && !description.toLowerCase().includes("dimensi")) {
    dimParts.push(`Dimensi: ${dimensions}`);
  }
  if (weight && !description.toLowerCase().includes("bobot") && !description.toLowerCase().includes("berat")) {
    dimParts.push(`Bobot: ${weight}`);
  }

  let finalDescription = description;
  if (metaParts.length > 0) {
    const metaHeader = metaParts.join(" | ");
    if (!finalDescription.startsWith("Merk:") && !finalDescription.startsWith("Standar:")) {
      finalDescription = `${metaHeader}\n\n${finalDescription}`.trim();
    }
  }
  if (dimParts.length > 0) {
    const dimHeader = dimParts.join(" | ");
    if (!finalDescription.includes("Dimensi")) {
      finalDescription = `${finalDescription}\n\n${dimHeader}`.trim();
    }
  }

  return {
    input: {
      name,
      slug: slugRaw ? slugify(slugRaw) : slugify(name),
      category,
      description: finalDescription,
      price: Math.round(price),
      stock,
      image: mainImage,
      images: photoSlots.length > 0 ? photoSlots : undefined,
      video: video,
      active,
      sku: sku || undefined,
      brand: brand || undefined,
    },
  };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const { input, fieldErrors } = parseForm(formData);
  if (fieldErrors) return { ok: false, fieldErrors };

  const res = await createProduct(input!);
  if (!res.ok) {
    if (res.error === "preview") {
      return {
        ok: false,
        preview: true,
        error:
          "Mode preview — belum terhubung database. Produk tidak tersimpan.",
      };
    }
    return { ok: false, error: res.error };
  }

  await recordAudit({ action: "produk.tambah", target: input!.name, detail: { slug: input!.slug, harga: input!.price } });
  
  // Revalidate ALL storefront & admin paths so newly created product appears immediately
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
  revalidatePath("/cari");
  revalidatePath(`/kategori/${input!.category}`);
  revalidatePath(`/produk/${input!.slug}`);

  redirect("/admin/produk");
}

export async function updateProductAction(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const { input, fieldErrors } = parseForm(formData);
  if (fieldErrors) return { ok: false, fieldErrors };

  const res = await updateProduct(id, input!);
  if (!res.ok) {
    if (res.error === "preview") {
      return {
        ok: false,
        preview: true,
        error:
          "Mode preview — belum terhubung database. Perubahan tidak tersimpan.",
      };
    }
    return { ok: false, error: res.error };
  }

  await recordAudit({ action: "produk.ubah", target: input!.name, detail: { id, harga: input!.price, stok: input!.stock, aktif: input!.active } });
  
  // Revalidate ALL storefront & admin paths
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${id}`);
  revalidatePath("/admin");
  revalidatePath("/cari");
  revalidatePath(`/kategori/${input!.category}`);
  revalidatePath(`/produk/${input!.slug}`);

  redirect("/admin/produk");
}

export async function deleteProductAction(
  idOrFormData: string | FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const id =
    typeof idOrFormData === "string"
      ? idOrFormData
      : String(idOrFormData.get("id") ?? "").trim();

  if (!id) {
    return { ok: false, error: "ID produk tidak valid." };
  }

  const existing = await getProductById(id);
  const res = await deleteProduct(id);
  if (!res.ok) {
    if (res.error === "preview") {
      return {
        ok: false,
        error: "Mode preview — belum terhubung database. Produk tidak dihapus.",
      };
    }
    return { ok: false, error: res.error };
  }

  await recordAudit({
    action: "produk.hapus",
    target: existing?.name || id,
    detail: { id, slug: existing?.slug },
  });

  // Revalidate ALL storefront & admin paths
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
  revalidatePath("/cari");
  if (existing?.category) {
    revalidatePath(`/kategori/${existing.category}`);
  }
  if (existing?.slug) {
    revalidatePath(`/produk/${existing.slug}`);
  }

  return { ok: true };
}

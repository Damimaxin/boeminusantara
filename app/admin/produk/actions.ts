"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  updateProduct,
  type AdminProductInput,
} from "@/lib/admin/products";
import { checkAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/audit";

/**
 * Server Action bisa dipanggil langsung lewat HTTP — jadi tiap action
 * memeriksa admin sendiri, tidak menumpang pagar layout.
 */
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
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const active = formData.get("active") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Nama wajib diisi.";
  if (!category) fieldErrors.category = "Pilih kategori.";

  const price = Number(priceRaw);
  if (priceRaw === "" || Number.isNaN(price) || price < 0)
    fieldErrors.price = "Harga harus angka ≥ 0.";

  const stock = Number(stockRaw);
  if (stockRaw === "" || Number.isNaN(stock) || !Number.isInteger(stock))
    fieldErrors.stock = "Stok harus bilangan bulat.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: {
      name,
      slug: slugRaw ? slugify(slugRaw) : slugify(name),
      category,
      description,
      price: Math.round(price),
      stock,
      image: image || null,
      active,
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
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
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
  revalidatePath("/admin/produk");
  revalidatePath(`/admin/produk/${id}`);
  revalidatePath("/admin");
  redirect("/admin/produk");
}

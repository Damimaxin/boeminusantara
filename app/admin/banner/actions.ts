"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBanner,
  setBannerActive,
  deleteBanner,
} from "@/lib/admin/content";
import { checkAdmin } from "@/lib/admin/auth";

async function requireAdmin() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/banner");
}

function refresh() {
  revalidatePath("/admin/banner");
  revalidatePath("/"); // beranda menampilkan banner
}

export type BannerFormState = { ok: boolean; error?: string };

export async function createBannerAction(
  _prev: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const active = formData.get("active") === "on";

  if (!title) return { ok: false, error: "Judul banner wajib diisi." };
  if (!image) return { ok: false, error: "Path gambar wajib diisi." };
  // Link keluar-domain sengaja tidak dilarang (bisa ke SIPlah), tapi harus jelas.
  if (link && !/^(https?:\/\/|\/)/.test(link))
    return { ok: false, error: "Link harus diawali / atau https://" };

  try {
    await createBanner({ title, subtitle, image, link: link || null, sortOrder, active });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  refresh();
  return { ok: true };
}

export async function toggleBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await setBannerActive(id, active);
  refresh();
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBanner(id);
  refresh();
}

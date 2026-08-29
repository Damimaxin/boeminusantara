"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertPage } from "@/lib/admin/content";
import { checkAdmin } from "@/lib/admin/auth";
import { MANAGED_PAGES, type ManagedPage } from "./pages-config";

export type PageFormState = { ok: boolean; error?: string };

export async function savePageAction(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/halaman");

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!MANAGED_PAGES.includes(slug as ManagedPage))
    return { ok: false, error: "Halaman tidak dikenal." };
  if (!title) return { ok: false, error: "Judul halaman wajib diisi." };

  try {
    await upsertPage({ slug, title, body });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  revalidatePath("/admin/halaman");
  revalidatePath(`/${slug}`);
  return { ok: true };
}

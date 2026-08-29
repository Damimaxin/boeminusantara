"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PILLARS, type Pillar } from "@/lib/types";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  type ArticleInput,
} from "@/lib/admin/content";
import { checkAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/audit";

export type ArticleFormState = {
  ok: boolean;
  error?: string;
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

/**
 * Server Action bisa dipanggil langsung lewat HTTP — jadi tiap action
 * memeriksa admin sendiri, tidak menumpang pagar layout.
 */
async function requireAdmin() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/artikel");
}

function parseForm(formData: FormData): {
  input?: ArticleInput;
  fieldErrors?: Record<string, string>;
} {
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const pillarRaw = String(formData.get("pillar") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const cover = String(formData.get("cover") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Judul wajib diisi.";
  if (!PILLARS.includes(pillarRaw as Pillar)) fieldErrors.pillar = "Pilih pilar konten.";
  if (!body) fieldErrors.body = "Isi artikel wajib diisi.";

  const slug = slugify(slugRaw || title);
  if (!slug) fieldErrors.slug = "Slug tidak valid. Isi manual.";

  // Terbit tanpa ringkasan = kartu di halaman daftar kosong melompong.
  if (status === "published" && !excerpt)
    fieldErrors.excerpt = "Ringkasan wajib diisi sebelum diterbitkan.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: {
      slug,
      title,
      pillar: pillarRaw as Pillar,
      excerpt,
      body,
      cover: cover || null,
      source: source || null,
      status,
    },
  };
}

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();
  const { input, fieldErrors } = parseForm(formData);
  if (!input) return { ok: false, fieldErrors };

  try {
    await createArticle(input);
    await recordAudit({ action: "artikel.tambah", target: input.title, detail: { status: input.status } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  revalidatePath("/admin/artikel");
  revalidatePath("/edukasi");
  redirect("/admin/artikel");
}

export async function updateArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID artikel hilang." };

  const { input, fieldErrors } = parseForm(formData);
  if (!input) return { ok: false, fieldErrors };

  try {
    await updateArticle(id, input);
    await recordAudit({ action: "artikel.ubah", target: input.title, detail: { status: input.status } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }

  revalidatePath("/admin/artikel");
  revalidatePath("/edukasi");
  revalidatePath(`/edukasi/${input.slug}`);
  redirect("/admin/artikel");
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteArticle(id);
  await recordAudit({ action: "artikel.hapus", target: id });
  revalidatePath("/admin/artikel");
  revalidatePath("/edukasi");
}

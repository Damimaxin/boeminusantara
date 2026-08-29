import "server-only";
import type { Article, Banner, PageDoc, Pillar } from "@/lib/types";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Data-access ADMIN untuk CMS (artikel, banner, halaman).
 * Beda dari `lib/content.ts` (storefront): admin melihat draft juga dan bisa tulis.
 *
 * Tanpa koneksi DB semua fungsi mengembalikan kosong / melempar error yang jelas —
 * CMS memang tidak punya seed, beda dari katalog produk.
 */

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  pillar: Pillar;
  excerpt: string;
  body: string;
  cover: string | null;
  source: string | null;
  status: "draft" | "published";
  published_at: string | null;
};

const toArticle = (r: ArticleRow): Article => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  pillar: r.pillar,
  excerpt: r.excerpt,
  body: r.body,
  cover: r.cover,
  source: r.source,
  status: r.status,
  publishedAt: r.published_at,
});

export type ArticleInput = {
  slug: string;
  title: string;
  pillar: Pillar;
  excerpt: string;
  body: string;
  cover: string | null;
  source: string | null;
  status: "draft" | "published";
};

function db() {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung. Set env Supabase di server.");
  return sb;
}

/* ---------------------------------- ARTIKEL --------------------------------- */

export async function listAllArticles(): Promise<Article[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("title");
  if (error) return [];
  return (data as ArticleRow[]).map(toArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("articles").select("*").eq("id", id).single();
  if (error || !data) return null;
  return toArticle(data as ArticleRow);
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const { data, error } = await db()
    .from("articles")
    .insert({
      ...toRow(input),
      // Tanggal terbit dikunci saat status pertama kali 'published'.
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw new Error(humanize(error.message));
  return toArticle(data as ArticleRow);
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article> {
  const existing = await getArticleById(id);
  // Sekali terbit, tanggal terbit dipertahankan (biar urutan arsip tidak loncat).
  const publishedAt =
    input.status === "published"
      ? (existing?.publishedAt ?? new Date().toISOString())
      : null;

  const { data, error } = await db()
    .from("articles")
    .update({ ...toRow(input), published_at: publishedAt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(humanize(error.message));
  return toArticle(data as ArticleRow);
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await db().from("articles").delete().eq("id", id);
  if (error) throw new Error(humanize(error.message));
}

const toRow = (i: ArticleInput) => ({
  slug: i.slug,
  title: i.title,
  pillar: i.pillar,
  excerpt: i.excerpt,
  body: i.body,
  cover: i.cover,
  source: i.source,
  status: i.status,
});

/* ---------------------------------- BANNER ---------------------------------- */

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string | null;
  sort_order: number;
  active: boolean;
};

const toBanner = (r: BannerRow): Banner => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  image: r.image,
  link: r.link,
  sortOrder: r.sort_order,
  active: r.active,
});

export type BannerInput = Omit<Banner, "id">;

export async function listAllBanners(): Promise<Banner[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("banners").select("*").order("sort_order");
  if (error) return [];
  return (data as BannerRow[]).map(toBanner);
}

export async function createBanner(i: BannerInput): Promise<void> {
  const { error } = await db().from("banners").insert({
    title: i.title,
    subtitle: i.subtitle,
    image: i.image,
    link: i.link,
    sort_order: i.sortOrder,
    active: i.active,
  });
  if (error) throw new Error(humanize(error.message));
}

export async function setBannerActive(id: string, active: boolean): Promise<void> {
  const { error } = await db().from("banners").update({ active }).eq("id", id);
  if (error) throw new Error(humanize(error.message));
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await db().from("banners").delete().eq("id", id);
  if (error) throw new Error(humanize(error.message));
}

/* ---------------------------------- HALAMAN --------------------------------- */

export async function listPages(): Promise<PageDoc[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("pages").select("*").order("slug");
  if (error) return [];
  return (data as { slug: string; title: string; body: string; updated_at: string }[]).map(
    (r) => ({ slug: r.slug, title: r.title, body: r.body, updatedAt: r.updated_at }),
  );
}

export async function getPage(slug: string): Promise<PageDoc | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("pages").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  const r = data as { slug: string; title: string; body: string; updated_at: string };
  return { slug: r.slug, title: r.title, body: r.body, updatedAt: r.updated_at };
}

export async function upsertPage(p: {
  slug: string;
  title: string;
  body: string;
}): Promise<void> {
  const { error } = await db()
    .from("pages")
    .upsert({ ...p, updated_at: new Date().toISOString() });
  if (error) throw new Error(humanize(error.message));
}

/* ---------------------------------- UTIL ------------------------------------ */

/** Ubah pesan error Postgres jadi kalimat yang dimengerti admin non-teknis. */
function humanize(message: string): string {
  if (/duplicate key/i.test(message)) return "Slug sudah dipakai konten lain. Ganti slug.";
  if (/violates row-level security/i.test(message))
    return "Tidak punya izin menulis. Service role belum diset di server.";
  return message;
}

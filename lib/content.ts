import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Article, Banner, PageDoc, Pillar } from "@/lib/types";

/**
 * Data-access STOREFRONT untuk CMS. Sengaja pakai kunci ANON, bukan service role:
 * yang menyaring draft adalah RLS di database (`status = 'published'`), bukan
 * kode di sini. Kalau kelak ada bug filter di aplikasi, draft tetap tidak bocor.
 *
 * Tabel CMS ada di schema `boemi` (bukan public) — sama seperti katalog.
 */
function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Tipe klien ikut schema "boemi", jadi cache-nya diturunkan dari fungsi ini
  // (bukan SupabaseClient polos yang default-nya schema "public").
  return url && key ? createClient(url, key, { db: { schema: "boemi" } }) : null;
}

let cached: ReturnType<typeof makeClient> | undefined;

function sb() {
  if (cached === undefined) cached = makeClient();
  return cached;
}

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

/** Artikel terbit, terbaru dulu. `pillar` opsional untuk filter tab. */
export async function getPublishedArticles(opts: {
  pillar?: Pillar;
  limit?: number;
} = {}): Promise<Article[]> {
  const client = sb();
  if (!client) return [];
  let q = client
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.pillar) q = q.eq("pillar", opts.pillar);
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as ArticleRow[]).map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const client = sb();
  if (!client) return null;
  const { data, error } = await client
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return toArticle(data as ArticleRow);
}

/** Banner aktif untuk beranda, urut sesuai `sort_order`. */
export async function getActiveBanners(): Promise<Banner[]> {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error || !data) return [];
  return (
    data as {
      id: string;
      title: string;
      subtitle: string;
      image: string;
      link: string | null;
      sort_order: number;
      active: boolean;
    }[]
  ).map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    image: r.image,
    link: r.link,
    sortOrder: r.sort_order,
    active: r.active,
  }));
}

/** Halaman statis. Null = belum diisi di CMS → pemanggil pakai teks bawaan. */
export async function getPublishedPage(slug: string): Promise<PageDoc | null> {
  const client = sb();
  if (!client) return null;
  const { data, error } = await client
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as { slug: string; title: string; body: string; updated_at: string };
  if (!r.body.trim()) return null; // halaman kosong = anggap belum diisi
  return { slug: r.slug, title: r.title, body: r.body, updatedAt: r.updated_at };
}

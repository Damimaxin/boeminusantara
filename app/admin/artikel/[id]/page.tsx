import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/admin/content";
import { ArticleForm } from "../_components/ArticleForm";
import { updateArticleAction } from "../actions";

export const metadata = { title: "Edit Artikel" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Edit Artikel</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{article.title}</p>
      </header>
      <ArticleForm
        action={updateArticleAction}
        article={article}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}

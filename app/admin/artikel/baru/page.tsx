import { ArticleForm } from "../_components/ArticleForm";
import { createArticleAction } from "../actions";

export const metadata = { title: "Tulis Artikel" };

export default function NewArticlePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Tulis Artikel</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Simpan sebagai draf dulu kalau belum siap tayang.
        </p>
      </header>
      <ArticleForm action={createArticleAction} submitLabel="Simpan Artikel" />
    </div>
  );
}

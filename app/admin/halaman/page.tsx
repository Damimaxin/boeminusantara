import { getPage } from "@/lib/admin/content";
import { PageForm } from "./_components/PageForm";
import { savePageAction } from "./actions";
import { MANAGED_PAGES, PAGE_HINTS } from "./pages-config";

export const metadata = { title: "Halaman" };

export default async function AdminPagesPage() {
  const pages = await Promise.all(MANAGED_PAGES.map((slug) => getPage(slug)));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Halaman</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Teks halaman statis. Diubah di sini, langsung berubah di web.
        </p>
      </header>

      {MANAGED_PAGES.map((slug, i) => (
        <PageForm
          key={slug}
          slug={slug}
          page={pages[i]}
          hint={PAGE_HINTS[slug] ?? ""}
          action={savePageAction}
        />
      ))}
    </div>
  );
}

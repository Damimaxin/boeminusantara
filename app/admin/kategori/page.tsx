"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { DEFAULT_CATEGORIES, type Category } from "@/lib/categories";
import {
  getCategoriesAction,
  addCategoryAction,
  deleteCategoryAction,
} from "./actions";

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [parentSlug, setParentSlug] = useState<string>("root"); // "root" or parent category slug

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load live categories from boemi.categories with fallback to DEFAULT_CATEGORIES
  useEffect(() => {
    let isMounted = true;
    getCategoriesAction()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {
        // Keep DEFAULT_CATEGORIES fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setMessage("");
    setErrorMessage("");

    const targetName = newCatName.trim();
    const targetSlug = newCatSlug.trim();
    const targetParent = parentSlug;

    startTransition(async () => {
      const res = await addCategoryAction(targetName, targetSlug, targetParent);
      if (res.ok && res.categories) {
        setCategories(res.categories);
        setMessage(
          targetParent === "root"
            ? `✓ Kategori Utama "${targetName}" berhasil disimpan ke database!`
            : `✓ Sub-kategori "${targetName}" berhasil disimpan!`
        );
        setNewCatName("");
        setNewCatSlug("");
      } else {
        setErrorMessage(res.error || "Gagal menambahkan kategori.");
      }
    });
  }

  function handleDeleteCategory(slug: string, isSub = false, parentSlug?: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    setMessage("");
    setErrorMessage("");

    startTransition(async () => {
      const res = await deleteCategoryAction(slug);
      if (res.ok && res.categories) {
        setCategories(res.categories);
        setMessage(`✓ Kategori "${slug}" berhasil dihapus dari database!`);
      } else {
        setErrorMessage(res.error || "Gagal menghapus kategori.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-[var(--color-mute)]">
        <Link href="/admin" className="hover:text-[var(--color-ink)]">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span>Kategori & Sub-kategori</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">
            Kelola Kategori & Sub-kategori
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Atur hierarki kategori jurusan SMK & sub-kategori peralatan praktik (Database Schema: boemi.categories).
          </p>
        </div>
        {loading && (
          <span className="text-xs text-[var(--color-mute)] animate-pulse">
            Memuat kategori dari database...
          </span>
        )}
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md font-medium">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md font-medium">
          {errorMessage}
        </div>
      )}

      {/* Form Tambah Kategori / Sub-kategori */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h2 className="text-base font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-line)]">
          ➕ Tambah Kategori / Sub-kategori Baru
        </h2>

        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
              Tipe / Induk Kategori
            </label>
            <select
              value={parentSlug}
              onChange={(e) => setParentSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-[var(--radius-card)] bg-white outline-none"
            >
              <option value="root">📁 Kategori Utama (Baru)</option>
              <optgroup label="Sub-kategori di bawah:">
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    ↳ {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Misal: Trainer Robotik AI"
              className="w-full px-3 py-2 text-sm border rounded-[var(--radius-card)] bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
              Slug URL (Opsional)
            </label>
            <input
              type="text"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              placeholder="trainer-robotik-ai"
              className="w-full px-3 py-2 text-sm border rounded-[var(--radius-card)] bg-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-[var(--color-navy)] text-white font-medium text-sm rounded-[var(--radius-card)] hover:opacity-90 transition disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "+ Simpan Kategori"}
          </button>
        </form>
      </div>

      {/* Daftar Kategori & Sub-kategori */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-navy)]">
          Daftar Kategori Aktif ({categories.length} Kategori Utama)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 space-y-3 shadow-sm hover:shadow transition"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[var(--color-navy)] text-white font-mono text-[10px] uppercase font-bold rounded">
                    {cat.slug}
                  </span>
                  <h3 className="font-semibold text-sm text-[var(--color-navy)]">
                    {cat.name}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteCategory(cat.slug)}
                  className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>

              {/* Subcategories list */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-[var(--color-mute)] uppercase tracking-wider block">
                  Sub-kategori ({cat.subcategories?.length ?? 0}):
                </span>

                {cat.subcategories && cat.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.slug}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-paper-dim)] border border-[var(--color-line)] rounded text-xs text-[var(--color-ink)]"
                      >
                        <span>↳ {sub.name}</span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeleteCategory(sub.slug, true, cat.slug)}
                          className="text-red-400 hover:text-red-600 font-bold ml-1 disabled:opacity-50"
                          title="Hapus sub-kategori"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada sub-kategori.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

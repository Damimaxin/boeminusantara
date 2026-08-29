"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import type { ProductFormState } from "../actions";

type Action = (
  prev: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

const INITIAL: ProductFormState = { ok: false };

export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: Action;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fe = state.fieldErrors ?? {};

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div
          className={
            "rounded-[var(--radius-card)] border px-4 py-3 text-sm " +
            (state.preview
              ? "border-[var(--color-line)] bg-[var(--color-paper-dim)] text-[var(--color-ink-soft)]"
              : "border-[var(--color-red)] bg-[var(--color-red)]/5 text-[var(--color-red-deep)]")
          }
        >
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className={label}>
          Nama Produk
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={product?.name}
          className={field}
          placeholder="Mis. Multimeter Digital Auto Range"
        />
        {fe.name && <p className={errText}>{fe.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className={label}>
          Slug{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (opsional — otomatis dari nama)
          </span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={product?.slug}
          className={field}
          placeholder="multimeter-digital"
        />
      </div>

      <div>
        <label htmlFor="category" className={label}>
          Kategori (Jurusan)
        </label>
        <select
          id="category"
          name="category"
          defaultValue={product?.category ?? ""}
          className={field}
        >
          <option value="" disabled>
            Pilih kategori…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {fe.category && <p className={errText}>{fe.category}</p>}
      </div>

      <div>
        <label htmlFor="description" className={label}>
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          className={field}
          placeholder="Spesifikasi & keterangan produk…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className={label}>
            Harga exPPN (Rp)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.price}
            className={field}
            placeholder="0"
          />
          {fe.price && <p className={errText}>{fe.price}</p>}
        </div>
        <div>
          <label htmlFor="stock" className={label}>
            Stok (unit)
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            step={1}
            defaultValue={product?.stock ?? 0}
            className={field}
            placeholder="0"
          />
          {fe.stock && <p className={errText}>{fe.stock}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="image" className={label}>
          URL Gambar{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (opsional)
          </span>
        </label>
        <input
          id="image"
          name="image"
          type="url"
          defaultValue={product?.image ?? ""}
          className={field}
          placeholder="https://…/gambar.jpg"
        />
        <p className="mt-1 text-xs text-[var(--color-mute)]">
          Upload langsung ke Supabase Storage menyusul; untuk sekarang tempel URL.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="active"
          type="checkbox"
          defaultChecked={product ? product.active : true}
          className="h-4 w-4 accent-[var(--color-navy)]"
        />
        Aktif (tampil di toko)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link
          href="/admin/produk"
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] border border-[var(--color-line)] px-5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper-dim)]"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

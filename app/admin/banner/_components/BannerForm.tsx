"use client";

import { useActionState } from "react";
import type { BannerFormState } from "../actions";

type Action = (
  prev: BannerFormState,
  formData: FormData,
) => Promise<BannerFormState>;

const INITIAL: BannerFormState = { ok: false };

export function BannerForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";

  return (
    <form
      action={formAction}
      className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
      // key di-reset lewat state.ok supaya field kosong lagi setelah sukses
      key={state.ok ? "reset" : "form"}
    >
      <h2 className="text-sm font-semibold text-[var(--color-ink)]">Tambah Banner</h2>

      {state.error && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
          Banner tersimpan.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={label}>
            Judul
          </label>
          <input id="title" name="title" className={field} placeholder="Alat Praktik TKRO Siap Kirim" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="subtitle" className={label}>
            Sub-judul
          </label>
          <input
            id="subtitle"
            name="subtitle"
            className={field}
            placeholder="223 unit alat praktik, sesuai standar SMK Pusat Keunggulan"
          />
        </div>

        <div>
          <label htmlFor="image" className={label}>
            Path Gambar
          </label>
          <input id="image" name="image" className={field} placeholder="/banner/promo-1.jpg" />
        </div>

        <div>
          <label htmlFor="link" className={label}>
            Link (opsional)
          </label>
          <input id="link" name="link" className={field} placeholder="/kategori/tkro" />
        </div>

        <div>
          <label htmlFor="sortOrder" className={label}>
            Urutan
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={0}
            className={field}
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="active" defaultChecked />
            Langsung tayang
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Tambah Banner"}
      </button>
    </form>
  );
}

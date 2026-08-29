"use client";

import { useActionState } from "react";
import type { PageDoc } from "@/lib/types";
import type { PageFormState } from "../actions";

type Action = (prev: PageFormState, formData: FormData) => Promise<PageFormState>;

const INITIAL: PageFormState = { ok: false };

export function PageForm({
  action,
  slug,
  page,
  hint,
}: {
  action: Action;
  slug: string;
  page: PageDoc | null;
  hint: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";

  return (
    <form
      action={formAction}
      className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
    >
      <input type="hidden" name="slug" value={slug} />

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">/{slug}</h2>
        <span className="text-xs text-[var(--color-mute)]">{hint}</span>
      </div>

      {state.error && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
          Tersimpan. Halaman publik sudah diperbarui.
        </p>
      )}

      <div className="mt-4">
        <label htmlFor={`title-${slug}`} className={label}>
          Judul
        </label>
        <input
          id={`title-${slug}`}
          name="title"
          defaultValue={page?.title ?? ""}
          className={field}
        />
      </div>

      <div className="mt-4">
        <label htmlFor={`body-${slug}`} className={label}>
          Isi
        </label>
        <textarea
          id={`body-${slug}`}
          name="body"
          rows={12}
          defaultValue={page?.body ?? ""}
          className={field + " font-mono text-[13px] leading-relaxed"}
          placeholder={"Tulis biasa saja.\n\nPisahkan paragraf dengan satu baris kosong."}
        />
        <p className="mt-1 text-xs text-[var(--color-mute)]">
          Kalau dikosongkan, halaman publik memakai teks bawaan aplikasi.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan Halaman"}
      </button>
    </form>
  );
}

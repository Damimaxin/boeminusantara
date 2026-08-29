"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PILLARS, PILLAR_LABEL, type Article } from "@/lib/types";
import type { ArticleFormState } from "../actions";

type Action = (
  prev: ArticleFormState,
  formData: FormData,
) => Promise<ArticleFormState>;

const INITIAL: ArticleFormState = { ok: false };

export function ArticleForm({
  action,
  article,
  submitLabel,
}: {
  action: Action;
  article?: Article;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fe = state.fieldErrors ?? {};

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const hint = "mt-1 text-xs text-[var(--color-mute)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {article && <input type="hidden" name="id" value={article.id} />}

      {state.error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 text-sm text-[var(--color-red-deep)]">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="title" className={label}>
          Judul
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={article?.title}
          className={field}
          placeholder="Mis. Perka BSKAP 019/2026: Standar Peralatan SMK"
        />
        {fe.title && <p className={errText}>{fe.title}</p>}
      </div>

      <div>
        <label htmlFor="pillar" className={label}>
          Pilar Konten
        </label>
        <select
          id="pillar"
          name="pillar"
          defaultValue={article?.pillar ?? "edukasi"}
          className={field}
        >
          {PILLARS.map((p) => (
            <option key={p} value={p}>
              {PILLAR_LABEL[p]}
            </option>
          ))}
        </select>
        {fe.pillar && <p className={errText}>{fe.pillar}</p>}
      </div>

      <div>
        <label htmlFor="slug" className={label}>
          Slug{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (opsional — otomatis dari judul)
          </span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={article?.slug}
          className={field}
          placeholder="standar-peralatan-smk-2026"
        />
        <p className={hint}>Alamat artikel: /edukasi/&lt;slug&gt;</p>
        {fe.slug && <p className={errText}>{fe.slug}</p>}
      </div>

      <div>
        <label htmlFor="excerpt" className={label}>
          Ringkasan
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={article?.excerpt}
          className={field}
          placeholder="Satu-dua kalimat yang muncul di kartu daftar artikel."
        />
        {fe.excerpt && <p className={errText}>{fe.excerpt}</p>}
      </div>

      <div>
        <label htmlFor="body" className={label}>
          Isi Artikel
        </label>
        <textarea
          id="body"
          name="body"
          rows={14}
          defaultValue={article?.body}
          className={field + " font-mono text-[13px] leading-relaxed"}
          placeholder={"Tulis biasa saja.\n\nPisahkan paragraf dengan satu baris kosong."}
        />
        <p className={hint}>
          Paragraf dipisah dengan baris kosong. Belum perlu HTML.
        </p>
        {fe.body && <p className={errText}>{fe.body}</p>}
      </div>

      <div>
        <label htmlFor="cover" className={label}>
          Gambar Sampul{" "}
          <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
        </label>
        <input
          id="cover"
          name="cover"
          type="text"
          defaultValue={article?.cover ?? ""}
          className={field}
          placeholder="/konten/e01.jpg"
        />
        <p className={hint}>
          Isi path gambar yang sudah diunggah ke server, mis. /konten/e01.jpg
        </p>
      </div>

      <div>
        <label htmlFor="source" className={label}>
          Sumber / Rujukan{" "}
          <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
        </label>
        <input
          id="source"
          name="source"
          type="text"
          defaultValue={article?.source ?? ""}
          className={field}
          placeholder="Perka BSKAP No. 019/F/KP/2026"
        />
        <p className={hint}>
          Untuk konten Edukasi: tulis dasar kebijakannya supaya klaim bisa dicek.
        </p>
      </div>

      <fieldset>
        <legend className={label}>Status</legend>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="draft"
              defaultChecked={(article?.status ?? "draft") === "draft"}
            />
            Draf (belum tayang)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="published"
              defaultChecked={article?.status === "published"}
            />
            Terbit
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link
          href="/admin/artikel"
          className="text-sm text-[var(--color-ink-soft)] hover:underline"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

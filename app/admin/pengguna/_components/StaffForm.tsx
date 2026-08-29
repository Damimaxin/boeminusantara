"use client";

import { useActionState } from "react";
import type { StaffFormState } from "../actions";

type Action = (prev: StaffFormState, formData: FormData) => Promise<StaffFormState>;

const INITIAL: StaffFormState = { ok: false };

export function StaffForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";

  return (
    <form
      action={formAction}
      key={state.ok ? "reset" : "form"}
      className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
    >
      <h2 className="text-sm font-semibold text-[var(--color-ink)]">Tambah Admin</h2>
      <p className="mt-1 text-xs text-[var(--color-mute)]">
        Setelah ditambahkan, orangnya mendaftar sendiri di halaman Daftar memakai
        email yang sama. Kata sandi dia yang buat — tidak ada yang bisa melihatnya.
      </p>

      {state.error && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
          {state.success}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Nama
          </label>
          <input id="name" name="name" className={field} placeholder="Nama staf" />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={field}
            placeholder="nama@boeminusantara.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Tambah Admin"}
      </button>
    </form>
  );
}

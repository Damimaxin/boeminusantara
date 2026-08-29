"use client";

import { useActionState } from "react";
import {
  recordStockMovementAction,
  type StockFormState,
} from "../actions";

const INITIAL: StockFormState = { ok: false };

export function StockMovementForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    recordStockMovementAction,
    INITIAL,
  );
  const fe = state.fieldErrors ?? {};

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-xs font-medium text-[var(--color-ink)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          className={
            "rounded-[var(--radius-card)] border px-3 py-2 text-sm " +
            (state.preview
              ? "border-[var(--color-line)] bg-[var(--color-paper-dim)] text-[var(--color-ink-soft)]"
              : "border-[var(--color-red)] bg-[var(--color-red)]/5 text-[var(--color-red-deep)]")
          }
        >
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-navy)]/30 bg-[var(--color-navy)]/5 px-3 py-2 text-sm text-[var(--color-navy)]">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="productId" className={label}>
          Produk
        </label>
        <select id="productId" name="productId" defaultValue="" className={field}>
          <option value="" disabled>
            Pilih produk…
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {fe.productId && <p className={errText}>{fe.productId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="type" className={label}>
            Jenis
          </label>
          <select id="type" name="type" defaultValue="in" className={field}>
            <option value="in">Masuk (+)</option>
            <option value="out">Keluar (−)</option>
            <option value="adjust">Penyesuaian</option>
          </select>
          {fe.type && <p className={errText}>{fe.type}</p>}
        </div>
        <div>
          <label htmlFor="qty" className={label}>
            Qty
          </label>
          <input
            id="qty"
            name="qty"
            type="number"
            step={1}
            defaultValue={1}
            className={field}
          />
          {fe.qty && <p className={errText}>{fe.qty}</p>}
        </div>
      </div>

      <p className="text-xs text-[var(--color-mute)]">
        Penyesuaian menerima nilai negatif (mis. −3 untuk koreksi opname).
      </p>

      <div>
        <label htmlFor="ref" className={label}>
          Referensi{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (opsional)
          </span>
        </label>
        <input
          id="ref"
          name="ref"
          type="text"
          className={field}
          placeholder="Mis. PO-2026-001 / Opname Juli"
        />
      </div>

      <div>
        <label htmlFor="note" className={label}>
          Catatan{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (opsional)
          </span>
        </label>
        <input id="note" name="note" type="text" className={field} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Catat Mutasi"}
      </button>
    </form>
  );
}

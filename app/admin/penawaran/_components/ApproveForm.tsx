"use client";

import { useActionState } from "react";
import type { ApproveState } from "../actions";

type Action = (
  prev: ApproveState,
  formData: FormData,
) => Promise<ApproveState>;

const INITIAL: ApproveState = { ok: false };

/** Default masa berlaku: 14 hari dari hari ini (format YYYY-MM-DD). */
function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_TERMS =
  "Harga belum termasuk ongkos kirim. Pembayaran 100% di muka. " +
  "Barang dikirim setelah pembayaran diterima. Ketersediaan stok dapat berubah.";

export function ApproveForm({
  action,
  disabled,
}: {
  action: Action;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fe = state.fieldErrors ?? {};

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)] disabled:opacity-50";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  return (
    <form action={formAction} className="space-y-5">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="discount" className={label}>
            Diskon (Rp, opsional)
          </label>
          <input
            id="discount"
            name="discount"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            disabled={disabled}
            className={field}
            placeholder="0"
          />
          {fe.discount && <p className={errText}>{fe.discount}</p>}
        </div>
        <div>
          <label htmlFor="validUntil" className={label}>
            Masa Berlaku
          </label>
          <input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={defaultValidUntil()}
            disabled={disabled}
            className={field}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="ppnEnabled"
          type="checkbox"
          defaultChecked
          disabled={disabled}
          className="h-4 w-4 accent-[var(--color-navy)]"
        />
        Kenakan PPN 11% (harga item exclude PPN)
      </label>

      <div>
        <label htmlFor="approvedBy" className={label}>
          Disetujui oleh{" "}
          <span className="font-normal text-[var(--color-mute)]">
            (nama penanggung jawab)
          </span>
        </label>
        <input
          id="approvedBy"
          name="approvedBy"
          type="text"
          disabled={disabled}
          className={field}
          placeholder="Mis. Bagian Penjualan"
        />
      </div>

      <div>
        <label htmlFor="terms" className={label}>
          Syarat &amp; Ketentuan
        </label>
        <textarea
          id="terms"
          name="terms"
          rows={4}
          defaultValue={DEFAULT_TERMS}
          disabled={disabled}
          className={field}
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending || disabled}
          className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Menerbitkan…" : "Setujui & Terbitkan Surat"}
        </button>
        {disabled && (
          <p className="mt-2 text-xs text-[var(--color-mute)]">
            Surat sudah diterbitkan untuk permintaan ini. Lihat tautan surat di
            atas.
          </p>
        )}
      </div>
    </form>
  );
}

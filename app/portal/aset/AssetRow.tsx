"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { Asset } from "@/lib/assets";
import { saveCareAction, markServicedAction, type CareState } from "./actions";

const INITIAL: CareState = { ok: false };

const fmtTgl = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_LABEL: Record<Asset["serviceStatus"], { teks: string; cls: string }> = {
  lewat: {
    teks: "Servis terlewat",
    cls: "bg-[var(--color-red)]/10 text-[var(--color-red-deep)]",
  },
  segera: {
    teks: "Servis segera",
    cls: "bg-amber-500/15 text-amber-700",
  },
  ok: {
    teks: "Terjadwal",
    cls: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  },
  "tidak-terjadwal": {
    teks: "Belum dijadwalkan",
    cls: "bg-[var(--color-paper-dim)] text-[var(--color-mute)]",
  },
};

export function AssetRow({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveCareAction, INITIAL);
  const st = STATUS_LABEL[asset.serviceStatus];

  const field =
    "mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "text-xs font-medium text-[var(--color-ink-soft)]";

  return (
    <li className="rounded border border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--color-ink)]">{asset.name}</span>
            <span className="text-xs text-[var(--color-mute)]">×{asset.qty}</span>
            <span className={"rounded-full px-2 py-0.5 text-[11px] " + st.cls}>
              {st.teks}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-mute)]">
            <span>Diterima {fmtTgl(asset.acquiredAt)}</span>
            <span>
              Garansi{" "}
              {asset.warrantyActive ? (
                <span className="text-[var(--color-navy)]">
                  s/d {fmtTgl(asset.warrantyUntil)}
                </span>
              ) : (
                <span className="text-[var(--color-red-deep)]">habis</span>
              )}
              {asset.warrantyDefault && " (perkiraan)"}
            </span>
            <span>
              Servis berikutnya {fmtTgl(asset.nextServiceAt)}
              {asset.serviceDefault && " (perkiraan)"}
            </span>
            <span>dari {asset.sourceBastNumber}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <form action={markServicedAction}>
            <input type="hidden" name="assetKey" value={asset.key} />
            <button
              type="submit"
              className="rounded border border-[var(--color-line)] px-2.5 py-1.5 text-xs text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
            >
              Tandai dirawat
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded border border-[var(--color-line)] px-2.5 py-1.5 text-xs text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
          >
            {open ? "Tutup" : "Atur"}
          </button>
        </div>
      </div>

      {open && (
        <form
          action={formAction}
          className="border-t border-[var(--color-line)] bg-[var(--color-paper-dim)] p-4"
        >
          <input type="hidden" name="assetKey" value={asset.key} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`w-${asset.key}`} className={label}>
                Masa garansi (bulan)
              </label>
              <input
                id={`w-${asset.key}`}
                name="warrantyMonths"
                type="number"
                min={0}
                defaultValue={asset.warrantyDefault ? "" : asset.warrantyMonths}
                placeholder={String(asset.warrantyMonths)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`s-${asset.key}`} className={label}>
                Servis tiap (bulan)
              </label>
              <input
                id={`s-${asset.key}`}
                name="serviceIntervalMonths"
                type="number"
                min={0}
                defaultValue={asset.serviceDefault ? "" : asset.serviceIntervalMonths}
                placeholder={String(asset.serviceIntervalMonths)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor={`n-${asset.key}`} className={label}>
                Catatan
              </label>
              <input
                id={`n-${asset.key}`}
                name="note"
                type="text"
                defaultValue={asset.note ?? ""}
                placeholder="mis. nomor seri, lokasi ruang"
                className={field}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
            {state.error && (
              <span className="text-xs text-[var(--color-red-deep)]">{state.error}</span>
            )}
            {state.success && (
              <span className="text-xs text-[var(--color-ink-soft)]">{state.success}</span>
            )}
            <span className="text-xs text-[var(--color-mute)]">
              0 bulan servis = tidak perlu perawatan rutin.
            </span>
          </div>
        </form>
      )}
    </li>
  );
}

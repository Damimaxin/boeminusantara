"use client";

import { useActionState } from "react";
import type { TerimaState } from "../../terima-actions";

type Action = (prev: TerimaState) => Promise<TerimaState>;

const INITIAL: TerimaState = { ok: false };

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PenerimaanBarang({
  action,
  courier,
  trackingNumber,
  shippedAt,
  receivedAt,
  receivedBy,
  lampiran,
}: {
  action: Action;
  courier: string;
  trackingNumber: string;
  shippedAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  lampiran: { id: string; kind: string; filename: string; uploadedAt: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
        Pengiriman &amp; Serah Terima
      </h2>

      <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5 text-sm">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-[var(--color-mute)]">Ekspedisi</dt>
          <dd className="text-[var(--color-ink)]">{courier || "—"}</dd>
          <dt className="text-[var(--color-mute)]">Nomor resi</dt>
          <dd className="font-medium text-[var(--color-ink)]">
            {trackingNumber || "—"}
          </dd>
          {shippedAt && (
            <>
              <dt className="text-[var(--color-mute)]">Dikirim</dt>
              <dd className="text-[var(--color-ink)]">{waktu(shippedAt)}</dd>
            </>
          )}
        </dl>

        {lampiran.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-[var(--color-line-soft)] pt-3">
            {lampiran.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-ink-soft)]">{l.filename}</span>
                <a
                  href={`/lampiran/${l.id}`}
                  className="shrink-0 text-[var(--color-navy)] hover:underline"
                >
                  Buka
                </a>
              </li>
            ))}
          </ul>
        )}

        {state.error && (
          <p className="mt-4 rounded border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
            {state.error}
          </p>
        )}

        {receivedAt ? (
          <p className="mt-4 rounded border border-[var(--color-navy)]/25 bg-[var(--color-navy)]/5 px-3 py-2 text-[var(--color-ink-soft)]">
            Anda menyatakan barang diterima pada {waktu(receivedAt)}
            {receivedBy ? ` (${receivedBy})` : ""}.
          </p>
        ) : trackingNumber || courier ? (
          <form action={formAction} className="mt-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Menyimpan…" : "Barang Sudah Diterima"}
            </button>
            <p className="mt-2 text-xs text-[var(--color-mute)]">
              Menekan tombol ini mengunci serah terima dan tidak bisa dibatalkan.
              Periksa barang lebih dulu.
            </p>
          </form>
        ) : (
          <p className="mt-4 text-[var(--color-mute)]">
            Belum ada data pengiriman.
          </p>
        )}
      </div>
    </section>
  );
}

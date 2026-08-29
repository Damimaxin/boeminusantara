"use client";

import { useActionState, useState } from "react";
import { kirimRatingAction, kirimKomplainAction, type UlasanState } from "./ulasan-actions";
import type { MyRating, MyComplaint } from "@/lib/complaints";

const INIT: UlasanState = { ok: false };

const STATUS_LABEL: Record<string, string> = {
  open: "Baru",
  handling: "Ditangani",
  resolved: "Selesai",
};

export function UlasanPanel({
  requestId,
  rating,
  complaints,
}: {
  requestId: string;
  rating: MyRating | null;
  complaints: MyComplaint[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RatingBox requestId={requestId} rating={rating} />
      <KomplainBox requestId={requestId} complaints={complaints} />
    </div>
  );
}

function RatingBox({ requestId, rating }: { requestId: string; rating: MyRating | null }) {
  const [state, action, pending] = useActionState(kirimRatingAction, INIT);
  const [stars, setStars] = useState(rating?.stars ?? 0);

  return (
    <form
      action={action}
      className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="stars" value={stars} />
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">Beri Penilaian</h3>
      <p className="mt-1 text-xs text-[var(--color-mute)]">
        Bagaimana pengalaman pengadaan Anda bersama Boemi?
      </p>

      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Bintang">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} bintang`}
            onClick={() => setStars(n)}
            className={
              "text-2xl leading-none transition " +
              (n <= stars ? "text-amber-500" : "text-[var(--color-line)] hover:text-amber-300")
            }
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        defaultValue={rating?.comment ?? ""}
        placeholder="Komentar (opsional)"
        className="mt-3 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || stars === 0}
          className="rounded bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : rating ? "Perbarui Penilaian" : "Kirim Penilaian"}
        </button>
        {state.error && <span className="text-xs text-[var(--color-red-deep)]">{state.error}</span>}
        {state.success && <span className="text-xs text-[var(--color-ink-soft)]">{state.success}</span>}
      </div>
    </form>
  );
}

function KomplainBox({
  requestId,
  complaints,
}: {
  requestId: string;
  complaints: MyComplaint[];
}) {
  const [state, action, pending] = useActionState(kirimKomplainAction, INIT);

  return (
    <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">Ajukan Keluhan</h3>
      <p className="mt-1 text-xs text-[var(--color-mute)]">
        Ada barang tidak sesuai atau kendala? Sampaikan di sini.
      </p>

      {complaints.length > 0 && (
        <ul className="mt-3 space-y-2">
          {complaints.map((c) => (
            <li key={c.id} className="rounded border border-[var(--color-line-soft)] p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--color-ink)]">{c.subject}</span>
                <span className="rounded-full bg-[var(--color-paper-dim)] px-2 py-0.5 text-[10px] text-[var(--color-ink-soft)]">
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              {c.adminNote && (
                <p className="mt-1 text-[var(--color-ink-soft)]">
                  Tanggapan: {c.adminNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-3" key={state.ok ? "reset" : "form"}>
        <input type="hidden" name="requestId" value={requestId} />
        <input
          name="subject"
          placeholder="Judul keluhan"
          className="w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
        />
        <textarea
          name="message"
          rows={2}
          placeholder="Jelaskan keluhannya"
          className="mt-2 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] disabled:opacity-50"
          >
            {pending ? "Mengirim…" : "Kirim Keluhan"}
          </button>
          {state.error && <span className="text-xs text-[var(--color-red-deep)]">{state.error}</span>}
          {state.success && <span className="text-xs text-[var(--color-ink-soft)]">{state.success}</span>}
        </div>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import type { LampiranState } from "../../actions";

type Action = (prev: LampiranState, formData: FormData) => Promise<LampiranState>;

const INITIAL: LampiranState = { ok: false };

export type LampiranRingkas = {
  id: string;
  kind: string;
  filename: string;
  sizeBytes: number;
  sha256: string;
  caption: string | null;
  uploadedBy: string | null;
  uploadedAt: string;
};

export type PengirimanRingkas = {
  courier: string;
  trackingNumber: string;
  shippedAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
} | null;

const LABEL: Record<string, string> = {
  faktur_pajak: "Faktur Pajak",
  bukti_bayar: "Bukti Pembayaran",
  foto_kirim: "Foto Barang Dikirim",
  foto_bast: "Foto Serah Terima",
  lainnya: "Berkas Lain",
};

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ukuran = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export function LampiranPanel({
  aksiUnggah,
  aksiPengiriman,
  lampiran,
  pengiriman,
}: {
  aksiUnggah: Action;
  aksiPengiriman: Action;
  lampiran: LampiranRingkas[];
  pengiriman: PengirimanRingkas;
}) {
  const [su, formUnggah, pendingUnggah] = useActionState(aksiUnggah, INITIAL);
  const [sk, formKirim, pendingKirim] = useActionState(aksiPengiriman, INITIAL);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";

  return (
    <section className="mt-8 space-y-6">
      {/* ---------- Pengiriman ---------- */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Pengiriman</h2>

        {pengiriman?.receivedAt && (
          <p className="mt-3 rounded border border-[var(--color-navy)]/25 bg-[var(--color-navy)]/5 px-3 py-2 text-sm text-[var(--color-ink-soft)]">
            Barang dinyatakan diterima {waktu(pengiriman.receivedAt)}
            {pengiriman.receivedBy ? ` oleh ${pengiriman.receivedBy}` : ""}.
          </p>
        )}

        {sk.error && (
          <p className="mt-3 rounded border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-sm text-[var(--color-red-deep)]">
            {sk.error}
          </p>
        )}
        {sk.success && (
          <p className="mt-3 rounded border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
            {sk.success}
          </p>
        )}

        <form action={formKirim} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="courier" className={label}>
                Ekspedisi
              </label>
              <input
                id="courier"
                name="courier"
                defaultValue={pengiriman?.courier ?? ""}
                className={field}
                placeholder="JNE / kurir sendiri"
              />
            </div>
            <div>
              <label htmlFor="trackingNumber" className={label}>
                Nomor Resi
              </label>
              <input
                id="trackingNumber"
                name="trackingNumber"
                defaultValue={pengiriman?.trackingNumber ?? ""}
                className={field}
              />
            </div>
          </div>
          <div>
            <label htmlFor="note" className={label}>
              Catatan pengiriman{" "}
              <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
            </label>
            <input id="note" name="note" className={field} />
          </div>
          <button
            type="submit"
            disabled={pendingKirim}
            className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
          >
            {pendingKirim ? "Menyimpan…" : "Simpan Pengiriman"}
          </button>
        </form>
      </div>

      {/* ---------- Lampiran ---------- */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Faktur Pajak &amp; Bukti
        </h2>

        {lampiran.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--color-line-soft)]">
            {lampiran.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <div className="text-[var(--color-ink)]">
                    {LABEL[l.kind] ?? l.kind} · {l.filename}
                  </div>
                  <div className="text-xs text-[var(--color-mute)]">
                    {ukuran(l.sizeBytes)} · {waktu(l.uploadedAt)}
                    {l.uploadedBy ? ` · ${l.uploadedBy}` : ""}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[var(--color-mute)]">
                    sidik jari {l.sha256.slice(0, 16)}…
                  </div>
                </div>
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

        {su.error && (
          <p className="mt-3 rounded border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-sm text-[var(--color-red-deep)]">
            {su.error}
          </p>
        )}
        {su.success && (
          <p className="mt-3 rounded border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
            {su.success}
          </p>
        )}

        <form action={formUnggah} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kind" className={label}>
                Jenis berkas
              </label>
              <select id="kind" name="kind" className={field} defaultValue="faktur_pajak">
                {Object.entries(LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="berkas" className={label}>
                Berkas
              </label>
              <input
                id="berkas"
                name="berkas"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className={field + " file:mr-3 file:rounded file:border-0 file:bg-[var(--color-paper-dim)] file:px-3 file:py-1 file:text-sm"}
              />
            </div>
          </div>
          <div>
            <label htmlFor="caption" className={label}>
              Keterangan{" "}
              <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
            </label>
            <input id="caption" name="caption" className={field} />
          </div>
          <button
            type="submit"
            disabled={pendingUnggah}
            className="inline-flex h-10 items-center rounded-[var(--radius-card)] border border-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] disabled:opacity-60"
          >
            {pendingUnggah ? "Mengunggah…" : "Unggah Berkas"}
          </button>
          <p className="text-xs text-[var(--color-mute)]">
            JPG, PNG, WEBP, atau PDF. Maksimal 15 MB. Waktu unggah dan sidik jari
            berkas dicatat server — membuktikan berkas tidak diubah setelah diunggah.
          </p>
        </form>
      </div>
    </section>
  );
}

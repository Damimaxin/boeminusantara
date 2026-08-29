"use client";

import { useActionState, useState } from "react";
import { formatIDR } from "@/lib/format";
import type { Offer } from "@/lib/admin/negotiation";
import type { PortalNegoState } from "../../actions";

type Action = (prev: PortalNegoState, formData: FormData) => Promise<PortalNegoState>;

const INITIAL: PortalNegoState = { ok: false };

export type BarisPortal = {
  id: string;
  name: string;
  qty: number;
  hargaKatalog: number;
  hargaAwal: number;
};

const LABEL: Record<Offer["kind"], string> = {
  offer: "Penawaran",
  counter: "Harga dari Boemi",
  accept: "Disepakati",
  reject: "Ditolak",
};

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PortalNegotiation({
  action,
  offers,
  items,
  selesai,
  giliranBoemi,
}: {
  action: Action;
  offers: Offer[];
  items: BarisPortal[];
  selesai: "agreed" | "rejected" | null;
  giliranBoemi: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [harga, setHarga] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.hargaAwal])),
  );

  const total = items.reduce((s, i) => s + (harga[i.id] ?? i.hargaAwal) * i.qty, 0);

  return (
    <section className="space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-mute)]">
        Tawar-menawar Harga
      </h2>

      {offers.length === 0 ? (
        <p className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-sm text-[var(--color-mute)]">
          Belum ada tawar-menawar. Anda bisa mengajukan harga di bawah, atau
          menunggu penawaran dari tim Boemi.
        </p>
      ) : (
        <ol className="space-y-3">
          {offers.map((o) => (
            <li
              key={o.id}
              className={
                "rounded border p-4 " +
                (o.actor === "seller"
                  ? "border-[var(--color-navy)]/25 bg-[var(--color-navy)]/5"
                  : "border-[var(--color-line)] bg-[var(--color-paper)]")
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {o.actor === "seller" ? "Boemi Nusantara" : "Anda"} · {LABEL[o.kind]}
                </span>
                <span className="text-xs text-[var(--color-mute)]">
                  {waktu(o.createdAt)}
                </span>
              </div>

              {o.items.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-sm">
                    <tbody>
                      {o.items.map((it) => (
                        <tr key={it.requestItemId}>
                          <td className="py-1 pr-3 text-[var(--color-ink-soft)]">
                            {it.name}
                          </td>
                          <td className="py-1 pr-3 text-right tabular-nums text-[var(--color-mute)]">
                            {it.qty} ×
                          </td>
                          <td className="py-1 pr-3 text-right tabular-nums">
                            {formatIDR(it.unitPrice)}
                          </td>
                          <td className="py-1 text-right font-medium tabular-nums">
                            {formatIDR(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-[var(--color-line-soft)]">
                        <td colSpan={3} className="pt-2 text-right text-[var(--color-ink-soft)]">
                          Subtotal (belum PPN)
                        </td>
                        <td className="pt-2 text-right font-semibold tabular-nums">
                          {formatIDR(o.subtotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {o.note && (
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">“{o.note}”</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {selesai ? (
        <div
          className={
            "rounded border px-4 py-3 text-sm " +
            (selesai === "agreed"
              ? "border-[var(--color-navy)]/25 bg-[var(--color-navy)]/5 text-[var(--color-ink-soft)]"
              : "border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[var(--color-red-deep)]")
          }
        >
          {selesai === "agreed"
            ? "Harga sudah disepakati. Tim Boemi akan menerbitkan surat penawaran resmi."
            : "Penawaran ini ditutup."}
        </div>
      ) : (
        <form
          action={formAction}
          className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            {giliranBoemi ? "Tanggapi Harga Boemi" : "Ajukan Harga Anda"}
          </h3>

          {state.error && (
            <p className="mt-3 rounded border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
              {state.error}
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                  <th className="pb-2 font-medium">Barang</th>
                  <th className="pb-2 text-right font-medium">Harga daftar</th>
                  <th className="pb-2 text-right font-medium">Harga Anda</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--color-line-soft)]">
                    <td className="py-2 pr-3">
                      <div className="text-[var(--color-ink)]">{i.name}</div>
                      <div className="text-xs text-[var(--color-mute)]">{i.qty} unit</div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[var(--color-mute)]">
                      {formatIDR(i.hargaKatalog)}
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        name={`harga_${i.id}`}
                        value={harga[i.id] ?? i.hargaAwal}
                        onChange={(e) =>
                          setHarga((h) => ({
                            ...h,
                            [i.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        aria-label={`Harga Anda untuk ${i.name}`}
                        className="w-36 rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-[var(--color-navy)]"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-[var(--color-line)]">
                  <td colSpan={2} className="pt-3 text-right text-[var(--color-ink-soft)]">
                    Total ajuan Anda (belum PPN)
                  </td>
                  <td className="pt-3 text-right text-base font-semibold tabular-nums">
                    {formatIDR(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <label
              htmlFor="catatan"
              className="block text-sm font-medium text-[var(--color-ink)]"
            >
              Catatan <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
            </label>
            <textarea
              id="catatan"
              name="catatan"
              rows={2}
              className="mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
              placeholder="Mis. anggaran kami terbatas di angka ini, mohon dipertimbangkan."
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              name="tindakan"
              value="offer"
              disabled={pending}
              className="inline-flex h-10 items-center rounded bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Mengirim…" : "Kirim Harga Saya"}
            </button>
            <button
              type="submit"
              name="tindakan"
              value="accept"
              disabled={pending || !giliranBoemi}
              title={
                giliranBoemi
                  ? "Setujui harga dari Boemi"
                  : "Belum ada harga dari Boemi untuk disetujui"
              }
              className="inline-flex h-10 items-center rounded border border-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] disabled:opacity-40"
            >
              Setuju Harga Boemi
            </button>
            <button
              type="submit"
              name="tindakan"
              value="reject"
              disabled={pending}
              className="inline-flex h-10 items-center px-2 text-sm text-[var(--color-red)] hover:underline disabled:opacity-40"
            >
              Batalkan permintaan
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

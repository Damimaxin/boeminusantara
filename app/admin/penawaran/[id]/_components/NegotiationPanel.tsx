"use client";

import { useActionState, useState } from "react";
import { formatIDR } from "@/lib/format";
import type { Offer } from "@/lib/admin/negotiation";
import type { NegotiationState } from "../../actions";

type Action = (
  prev: NegotiationState,
  formData: FormData,
) => Promise<NegotiationState>;

const INITIAL: NegotiationState = { ok: false };

export type BarisItem = {
  id: string;
  name: string;
  qty: number;
  hargaKatalog: number;
  hargaAjuan: number | null;
  hargaBerlaku: number;
};

const LABEL_RONDE: Record<Offer["kind"], string> = {
  offer: "Penawaran",
  counter: "Harga tandingan",
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

export function NegotiationPanel({
  action,
  offers,
  items,
  selesai,
}: {
  action: Action;
  offers: Offer[];
  items: BarisItem[];
  selesai: "agreed" | "rejected" | null;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [harga, setHarga] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.hargaBerlaku])),
  );

  const totalUsulan = items.reduce(
    (s, i) => s + (harga[i.id] ?? i.hargaBerlaku) * i.qty,
    0,
  );

  const field =
    "w-36 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-[var(--color-navy)]";

  return (
    <section className="space-y-6">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          Negosiasi Harga
        </h2>
        {offers.length > 0 && (
          <span className="text-xs text-[var(--color-mute)]">
            {offers.length} ronde
          </span>
        )}
      </header>

      {/* ---------- riwayat ---------- */}
      {offers.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-sm text-[var(--color-mute)]">
          Belum ada tawar-menawar. Kirim harga di bawah untuk memulai.
        </p>
      ) : (
        <ol className="space-y-3">
          {offers.map((o) => (
            <li
              key={o.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  Ronde {o.round} · {o.actor === "buyer" ? "Pembeli" : "Boemi"} ·{" "}
                  {LABEL_RONDE[o.kind]}
                </span>
                <span className="text-xs text-[var(--color-mute)]">
                  {waktu(o.createdAt)}
                  {o.createdBy ? ` · ${o.createdBy}` : ""}
                </span>
              </div>

              {o.items.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[26rem] text-sm">
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
                          <td className="py-1 text-right tabular-nums font-medium">
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

      {/* ---------- form balasan ---------- */}
      {selesai ? (
        <div
          className={
            "rounded-[var(--radius-card)] border px-4 py-3 text-sm " +
            (selesai === "agreed"
              ? "border-[var(--color-navy)]/25 bg-[var(--color-navy)]/5 text-[var(--color-ink-soft)]"
              : "border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[var(--color-red-deep)]")
          }
        >
          {selesai === "agreed"
            ? "Harga sudah disepakati. Surat penawaran resmi bisa diterbitkan dari harga ini."
            : "Negosiasi ditutup karena ditolak."}
        </div>
      ) : (
        <form
          action={formAction}
          className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Balas Penawaran
          </h3>

          {state.error && (
            <p className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-3 py-2 text-xs text-[var(--color-red-deep)]">
              {state.error}
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-mute)]">
                  <th className="pb-2 font-medium">Barang</th>
                  <th className="pb-2 text-right font-medium">Katalog</th>
                  <th className="pb-2 text-right font-medium">Diminta pembeli</th>
                  <th className="pb-2 text-right font-medium">Harga Boemi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--color-line-soft)]">
                    <td className="py-2 pr-3">
                      <div className="text-[var(--color-ink)]">{i.name}</div>
                      <div className="text-xs text-[var(--color-mute)]">
                        {i.qty} unit
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[var(--color-mute)]">
                      {formatIDR(i.hargaKatalog)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[var(--color-ink-soft)]">
                      {i.hargaAjuan === null ? "—" : formatIDR(i.hargaAjuan)}
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        name={`harga_${i.id}`}
                        value={harga[i.id] ?? i.hargaBerlaku}
                        onChange={(e) =>
                          setHarga((h) => ({
                            ...h,
                            [i.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className={field}
                        aria-label={`Harga Boemi untuk ${i.name}`}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-[var(--color-line)]">
                  <td colSpan={3} className="pt-3 text-right text-[var(--color-ink-soft)]">
                    Subtotal usulan (belum PPN)
                  </td>
                  <td className="pt-3 text-right text-base font-semibold tabular-nums">
                    {formatIDR(totalUsulan)}
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
              Catatan untuk pembeli{" "}
              <span className="font-normal text-[var(--color-mute)]">(opsional)</span>
            </label>
            <textarea
              id="catatan"
              name="catatan"
              rows={2}
              className="mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
              placeholder="Mis. harga sudah termasuk pengiriman ke lokasi sekolah."
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              name="tindakan"
              value="counter"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Mengirim…" : "Kirim Harga Boemi"}
            </button>
            <button
              type="submit"
              name="tindakan"
              value="accept"
              disabled={pending || offers.length === 0}
              title={
                offers.length === 0
                  ? "Belum ada penawaran untuk disetujui"
                  : "Setujui harga pada ronde terakhir"
              }
              className="inline-flex h-10 items-center rounded-[var(--radius-card)] border border-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] disabled:opacity-40"
            >
              Terima Harga Pembeli
            </button>
            <button
              type="submit"
              name="tindakan"
              value="reject"
              disabled={pending}
              className="inline-flex h-10 items-center px-2 text-sm text-[var(--color-red)] hover:underline disabled:opacity-40"
            >
              Tolak
            </button>
          </div>

          <p className="mt-3 text-xs text-[var(--color-mute)]">
            Tiap balasan tersimpan sebagai ronde baru dan tidak bisa dihapus —
            riwayat ini yang nanti dicetak sebagai dokumen negosiasi.
          </p>
        </form>
      )}
    </section>
  );
}

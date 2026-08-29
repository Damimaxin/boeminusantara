"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuote } from "@/components/QuoteProvider";
import { formatIDR, ppnAmount, PPN_RATE } from "@/lib/format";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; code: string }
  | { status: "error"; message: string };

export default function PenawaranPage() {
  const { items, subtotal, count, setQty, removeItem, clear } = useQuote();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [note, setNote] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  /**
   * Harga yang diajukan pembeli, per unit, dikunci per slug barang.
   * Opsional — dikosongkan berarti menyerahkan harga sepenuhnya ke Boemi.
   */
  const [hargaAjuan, setHargaAjuan] = useState<Record<string, number>>({});

  const ppn = ppnAmount(subtotal);
  const total = subtotal + ppn;

  // Total versi pembeli: pakai harga ajuan bila diisi, kalau tidak harga katalog.
  const totalAjuan = items.reduce(
    (s, it) => s + (hargaAjuan[it.slug] || it.price) * it.qty,
    0,
  );
  const adaAjuan = items.some((it) => hargaAjuan[it.slug] > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!customerName.trim() || !customerEmail.trim()) {
      setSubmit({
        status: "error",
        message: "Nama dan email wajib diisi.",
      });
      return;
    }

    setSubmit({ status: "loading" });
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          institution: institution.trim() || undefined,
          note: note.trim() || undefined,
          items: items.map((it) => ({
            // Kirim slug saja. Harga & nama diambil ulang dari katalog di server —
            // angka dari browser tidak dipakai sebagai harga resmi.
            slug: it.slug,
            name: it.name,
            price: it.price,
            qty: it.qty,
            buyerPrice: hargaAjuan[it.slug] || undefined,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server membalas ${res.status}`);
      }

      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        persisted?: boolean;
      };

      if (!data.ok || !data.code) {
        throw new Error("Respons server tidak valid.");
      }

      setSubmit({ status: "success", code: data.code });
      clear();
    } catch (err) {
      setSubmit({
        status: "error",
        message:
          err instanceof Error
            ? `Gagal mengirim permintaan. ${err.message}. Silakan coba lagi atau hubungi info@boeminusantara.com.`
            : "Gagal mengirim permintaan. Silakan coba lagi.",
      });
    }
  }

  // ── Sukses ────────────────────────────────────────────────────────────
  if (submit.status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-navy)] text-2xl text-[var(--color-paper)]">
          ✓
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Permintaan terkirim
        </h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Terima kasih. Tim kami akan mengirim surat penawaran resmi ke email
          Anda dalam waktu singkat.
        </p>
        <div className="mt-6 inline-block rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-6 py-4">
          <span className="block text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
            Kode permintaan
          </span>
          <span className="mt-1 block text-lg font-semibold tracking-tight text-[var(--color-navy)]">
            {submit.code}
          </span>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-navy-deep)]"
          >
            Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  // ── Keranjang kosong ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Keranjang penawaran kosong
        </h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Tambahkan produk yang ingin Anda ajukan penawarannya, lalu kirim satu
          permintaan sekaligus.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-navy-deep)]"
          >
            Lihat katalog
          </Link>
        </div>
      </div>
    );
  }

  // ── Keranjang + form ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Minta Penawaran
      </h1>
      <p className="mt-1 text-sm text-[var(--color-mute)]">
        {count} item · harga belum termasuk PPN. Tim kami membalas dengan surat
        penawaran resmi.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Daftar item */}
        <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          {items.map((it) => (
            <div
              key={it.slug}
              className="flex flex-wrap items-center gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produk/${it.slug}`}
                  className="text-sm font-medium leading-snug hover:text-[var(--color-navy)]"
                >
                  {it.name}
                </Link>
                <p className="mt-0.5 text-xs text-[var(--color-mute)]">
                  {formatIDR(it.price)} / unit · excl. PPN
                </p>
              </div>

              {/* Kontrol qty */}
              <div className="flex items-center rounded-[var(--radius-card)] border border-[var(--color-line)]">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  onClick={() => setQty(it.slug, it.qty - 1)}
                  disabled={it.qty <= 1}
                  className="flex h-9 w-9 items-center justify-center text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={(e) =>
                    setQty(it.slug, parseInt(e.target.value, 10) || 1)
                  }
                  aria-label={`Jumlah ${it.name}`}
                  className="h-9 w-12 border-x border-[var(--color-line)] bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  onClick={() => setQty(it.slug, it.qty + 1)}
                  className="flex h-9 w-9 items-center justify-center text-[var(--color-ink-soft)] transition hover:text-[var(--color-navy)]"
                >
                  +
                </button>
              </div>

              {/* Harga yang diajukan pembeli — inti tawar-menawar */}
              <div className="w-40">
                <label
                  htmlFor={`ajuan-${it.slug}`}
                  className="block text-[11px] text-[var(--color-mute)]"
                >
                  Harga ajuan Anda
                </label>
                <input
                  id={`ajuan-${it.slug}`}
                  type="number"
                  min={0}
                  step={1000}
                  inputMode="numeric"
                  placeholder={String(it.price)}
                  value={hargaAjuan[it.slug] ?? ""}
                  onChange={(e) =>
                    setHargaAjuan((h) => ({
                      ...h,
                      [it.slug]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="mt-0.5 h-9 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 text-right text-sm tabular-nums outline-none focus:border-[var(--color-navy)]"
                />
              </div>

              <div className="w-28 text-right text-sm font-medium">
                {formatIDR((hargaAjuan[it.slug] || it.price) * it.qty)}
              </div>

              <button
                type="button"
                onClick={() => removeItem(it.slug)}
                className="text-xs text-[var(--color-mute)] transition hover:text-[var(--color-red)]"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>

        {/* Ringkasan + Form */}
        <div className="space-y-6">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-soft)]">
                Subtotal (excl. PPN)
              </span>
              <span className="font-medium">{formatIDR(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-soft)]">
                Estimasi PPN {Math.round(PPN_RATE * 100)}%
              </span>
              <span className="font-medium">{formatIDR(ppn)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-sm">
              <span className="font-semibold">Estimasi total</span>
              <span className="font-semibold">{formatIDR(total)}</span>
            </div>
            {adaAjuan && (
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-sm">
                <span className="text-[var(--color-navy)]">
                  Total harga ajuan Anda
                </span>
                <span className="font-semibold text-[var(--color-navy)]">
                  {formatIDR(totalAjuan)}
                </span>
              </div>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-mute)]">
              Estimasi. Harga final mengikuti surat penawaran resmi (dapat
              termasuk ongkir &amp; syarat instansi). Harga ajuan Anda kami
              pertimbangkan dan dibalas dengan harga dari kami.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              label="Nama"
              required
              value={customerName}
              onChange={setCustomerName}
              autoComplete="name"
            />
            <Field
              label="Email"
              required
              type="email"
              value={customerEmail}
              onChange={setCustomerEmail}
              autoComplete="email"
            />
            <Field
              label="No. HP"
              type="tel"
              value={customerPhone}
              onChange={setCustomerPhone}
              autoComplete="tel"
            />
            <Field
              label="Instansi / Sekolah"
              value={institution}
              onChange={setInstitution}
              autoComplete="organization"
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
                Catatan
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Kebutuhan khusus, jadwal, dsb."
                className="w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-navy)]"
              />
            </div>

            {submit.status === "error" && (
              <p
                role="alert"
                className="rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[color-mix(in_srgb,var(--color-red)_8%,transparent)] px-3.5 py-2.5 text-xs text-[var(--color-red)]"
              >
                {submit.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submit.status === "loading"}
              className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-navy-deep)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submit.status === "loading"
                ? "Mengirim…"
                : "Kirim Permintaan Penawaran"}
            </button>
            <p className="text-center text-[11px] text-[var(--color-mute)]">
              Dengan mengirim, Anda menyetujui tim Boemi menghubungi Anda terkait
              penawaran ini.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-soft)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-red)]">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 text-sm outline-none transition focus:border-[var(--color-navy)]"
      />
    </div>
  );
}

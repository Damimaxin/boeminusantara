"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import type { ProductFormState } from "../actions";

type Action = (
  prev: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

const INITIAL: ProductFormState = { ok: false };

function parseDescriptionMeta(desc: string | undefined) {
  if (!desc) return { sku: "", brand: "", standard: "", dimensions: "", weight: "", specBody: "" };

  const skuMatch = desc.match(/SKU:\s*([^|\n]+)/i);
  const sku = skuMatch?.[1]?.trim() ?? "";

  const brandMatch = desc.match(/Merk:\s*([^|\n]+)/i);
  const brand = brandMatch?.[1]?.trim() ?? "";

  const stdMatch = desc.match(/Standar:\s*([^|\n]+)/i);
  const standard = stdMatch?.[1]?.trim() ?? "";

  const dimMatch = desc.match(/Dimensi[^:\n]*:\s*([^\n]+)/i);
  const dimensions = dimMatch?.[1]?.trim() ?? "";

  const weightMatch = desc.match(/(?:Bobot|Berat)[^:\n]*:\s*([^\n]+)/i);
  const weight = weightMatch?.[1]?.trim() ?? "";

  return { sku, brand, standard, dimensions, weight, specBody: desc };
}


export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: Action;
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fe = state.fieldErrors ?? {};

  const meta = parseDescriptionMeta(product?.description);

  const [imageUrl, setImageUrl] = useState<string>(product?.image ?? "");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isShortening, setIsShortening] = useState<boolean>(false);

  const [sku, setSku] = useState<string>(product?.sku ?? meta.sku ?? "");
  const [brand, setBrand] = useState<string>(product?.brand ?? meta.brand ?? "");
  const [standard, setStandard] = useState<string>(meta.standard ?? "PDN");
  const [dimensions, setDimensions] = useState<string>(meta.dimensions ?? "");
  const [weight, setWeight] = useState<string>(meta.weight ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  async function handleFileUpload(file: File) {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("Mengunggah foto...");

    try {
      const bodyData = new FormData();
      bodyData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        // Use TinyURL if available, or Supabase public URL
        const finalUrl = data.tinyUrl || data.url;
        setImageUrl(finalUrl);
        setUploadStatus("✓ Foto berhasil diunggah cloud storage!");
      } else {
        setUploadStatus(`Gagal unggah: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      setUploadStatus("Gagal menghubungkan ke server unggah.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleShortenTinyUrl() {
    if (!imageUrl) return;
    setIsShortening(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await res.json();
      if (res.ok && data.shortUrl) {
        setImageUrl(data.shortUrl);
        setUploadStatus("✓ URL berhasil disingkat via TinyURL!");
      } else {
        setUploadStatus(`Gagal singkat URL: ${data.error || "Service TinyURL offline"}`);
      }
    } catch {
      setUploadStatus("Gagal menghubungi service TinyURL.");
    } finally {
      setIsShortening(false);
    }
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
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

      {/* Informasi Dasar Produk */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-navy)] pb-2 border-b border-[var(--color-line)]">
          Informasi Utama Produk
        </h2>

        <div>
          <label htmlFor="name" className={label}>
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            className={field}
            placeholder="Misal: (Variable Speed Drive (VSD) Training System)"
          />
          {fe.name && <p className={errText}>{fe.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sku" className={label}>
              SKU / Kode Produk
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className={field}
              placeholder="Misal: BN-TAV-006"
            />
          </div>

          <div>
            <label htmlFor="brand" className={label}>
              Merk / Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={field}
              placeholder="Misal: Boemi Nusantara / Daiden / Tekiro"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="slug" className={label}>
              Slug{" "}
              <span className="font-normal text-[var(--color-mute)]">
                (opsional — otomatis dari nama)
              </span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={product?.slug}
              className={field}
              placeholder="variable-speed-drive-vsd"
            />
          </div>

          <div>
            <label htmlFor="category" className={label}>
              Kategori (Jurusan SMK) <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              defaultValue={product?.category ?? ""}
              className={field}
            >
              <option value="" disabled>
                Pilih kategori…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {fe.category && <p className={errText}>{fe.category}</p>}
          </div>
        </div>
      </div>

      {/* Dimensi, Ukuran, & Bobot */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-navy)] pb-2 border-b border-[var(--color-line)]">
          Spesifikasi Fisik & Ukuran (VPS Mode)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="standard" className={label}>
              Standar / Sertifikasi
            </label>
            <input
              id="standard"
              name="standard"
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className={field}
              placeholder="Misal: PDN / TKDN"
            />
          </div>

          <div>
            <label htmlFor="dimensions" className={label}>
              Dimensi (Panjang x Lebar x Tinggi)
            </label>
            <input
              id="dimensions"
              name="dimensions"
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className={field}
              placeholder="Misal: P=90cm L=80cm T=100cm"
            />
          </div>

          <div>
            <label htmlFor="weight" className={label}>
              Bobot / Berat
            </label>
            <input
              id="weight"
              name="weight"
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={field}
              placeholder="Misal: 45 kg"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={label}>
            Deskripsi & Spesifikasi Lengkap Produk
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description}
            className={field}
            placeholder="Spesifikasi & keterangan lengkap produk..."
          />
        </div>
      </div>

      {/* Harga & Stok */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-navy)] pb-2 border-b border-[var(--color-line)]">
          Harga & Stok
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className={label}>
              Harga exPPN (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.price}
              className={field}
              placeholder="30880800"
            />
            {fe.price && <p className={errText}>{fe.price}</p>}
          </div>

          <div>
            <label htmlFor="stock" className={label}>
              Stok (unit) <span className="text-red-500">*</span>
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              step={1}
              defaultValue={product?.stock ?? 0}
              className={field}
              placeholder="50"
            />
            {fe.stock && <p className={errText}>{fe.stock}</p>}
          </div>
        </div>
      </div>

      {/* Upload Foto & URL TinyURL Storage */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-navy)] pb-2 border-b border-[var(--color-line)] flex items-center justify-between">
          <span>Foto & Upload Media</span>
          <span className="text-xs font-normal text-[var(--color-mute)]">Cloud Storage / TinyURL Integration</span>
        </h2>

        {/* Drag and drop upload box */}
        <div className="border-2 border-dashed border-[var(--color-navy)]/30 rounded-lg p-6 text-center bg-[var(--color-paper-dim)] hover:bg-[var(--color-paper)] transition">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-[var(--color-navy)]/10 text-[var(--color-navy)] flex items-center justify-center text-xl font-bold">
              📸
            </div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Upload foto produk langsung tanpa disimpan lokal
            </p>
            <p className="text-xs text-[var(--color-mute)]">
              Format PNG, JPG, WebP. Foto otomatis disimpan ke Cloud Storage & TinyURL CDN.
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-navy)] text-white text-xs font-semibold rounded-md shadow-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {isUploading ? "Mengunggah..." : "📁 Pilih File Foto..."}
            </button>

            {uploadStatus && (
              <p className={`mt-2 text-xs font-medium ${uploadStatus.startsWith("✓") ? "text-green-600" : "text-amber-600"}`}>
                {uploadStatus}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="image" className={label}>
              URL Gambar Produk
            </label>

            {imageUrl && (
              <button
                type="button"
                disabled={isShortening}
                onClick={handleShortenTinyUrl}
                className="text-xs text-[var(--color-navy)] hover:underline font-medium flex items-center gap-1"
              >
                🔗 {isShortening ? "Menyingkat..." : "Singkatkan ke TinyURL"}
              </button>
            )}
          </div>

          <input
            id="image"
            name="image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={field}
            placeholder="https://.../gambar.jpg"
          />
        </div>

        {/* Live Preview */}
        {imageUrl && (
          <div className="mt-3 p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dim)] flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview produk"
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="text-xs text-[var(--color-ink-soft)] overflow-hidden">
              <span className="font-semibold text-[var(--color-ink)] block">Preview Foto Terpasang</span>
              <span className="truncate block opacity-80 mt-1">{imageUrl}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]">
        <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-ink)] cursor-pointer">
          <input
            name="active"
            type="checkbox"
            defaultChecked={product ? product.active : true}
            className="h-5 w-5 accent-[var(--color-navy)] rounded"
          />
          <span>Aktif (tampil di toko & katalog SMK)</span>
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={pending || isUploading}
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-8 text-sm font-semibold text-[var(--color-paper)] shadow transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Menyimpan Ke Database..." : submitLabel}
        </button>
        <Link
          href="/admin/produk"
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-line)] px-6 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-paper-dim)]"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

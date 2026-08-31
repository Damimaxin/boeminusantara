"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { DEFAULT_CATEGORIES, type Category } from "@/lib/categories";
import { getCategoriesAction } from "@/app/admin/kategori/actions";
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

  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    getCategoriesAction().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const meta = parseDescriptionMeta(product?.description);

  // Initialize 9 photo slots
  const initialPhotos = Array.from({ length: 9 }, (_, i) => {
    if (i === 0) return product?.image ?? "";
    if (product?.images && product.images[i]) return product.images[i];
    return "";
  });

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [videoUrl, setVideoUrl] = useState<string>(product?.video ?? "");

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null); // 0-8 for photos, 9 for video
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [shorteningIndex, setShorteningIndex] = useState<number | null>(null);

  const [sku, setSku] = useState<string>(product?.sku ?? meta.sku ?? "");
  const [brand, setBrand] = useState<string>(product?.brand ?? meta.brand ?? "");
  const [standard, setStandard] = useState<string>(meta.standard ?? "PDN");
  const [dimensions, setDimensions] = useState<string>(meta.dimensions ?? "");
  const [weight, setWeight] = useState<string>(meta.weight ?? "");

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const errText = "mt-1 text-xs text-[var(--color-red)]";

  async function handleFileUpload(file: File, slotIndex: number) {
    if (!file) return;
    setUploadingIndex(slotIndex);
    setUploadStatus(`Mengunggah file untuk Slot ${slotIndex === 9 ? "Video" : slotIndex + 1}...`);

    try {
      const bodyData = new FormData();
      bodyData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        const finalUrl = data.tinyUrl || data.url;
        if (slotIndex === 9) {
          setVideoUrl(finalUrl);
        } else {
          setPhotos((prev) => {
            const next = [...prev];
            next[slotIndex] = finalUrl;
            return next;
          });
        }
        setUploadStatus(`✓ Upload Slot ${slotIndex === 9 ? "Video" : slotIndex + 1} Berhasil!`);
      } else {
        setUploadStatus(`Gagal unggah: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch {
      setUploadStatus("Gagal menghubungi server unggah.");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleShortenUrl(slotIndex: number, currentUrl: string) {
    if (!currentUrl) return;
    setShorteningIndex(slotIndex);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });
      const data = await res.json();
      if (res.ok && data.shortUrl) {
        if (slotIndex === 9) {
          setVideoUrl(data.shortUrl);
        } else {
          setPhotos((prev) => {
            const next = [...prev];
            next[slotIndex] = data.shortUrl;
            return next;
          });
        }
        setUploadStatus(`✓ URL Slot ${slotIndex === 9 ? "Video" : slotIndex + 1} berhasil disingkat!`);
      }
    } catch {
      setUploadStatus("Gagal menghubungi service TinyURL.");
    } finally {
      setShorteningIndex(null);
    }
  }

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
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

      {/* Informasi Utama Produk */}
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
            placeholder="Misal: Variable Speed Drive (VSD) Training System"
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
              {categoriesList.map((c) => (
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

      {/* Media: 9 Slot Foto + 1 Slot Video */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-navy)]">
              Media Produk (9 Slot Foto + 1 Slot Video)
            </h2>
            <p className="text-xs text-[var(--color-mute)] mt-0.5">
              Upload foto & video langsung ke Cloud Storage. URL otomatis disingkat dengan TinyURL.
            </p>
          </div>
          {uploadStatus && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded border border-green-200">
              {uploadStatus}
            </span>
          )}
        </div>

        {/* 9 Slot Foto Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <span>📷 Galeri 9 Foto Produk</span>
            <span className="text-xs font-normal text-[var(--color-mute)]">(Slot 1 = Sampul Utama)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs space-y-2 transition ${
                  idx === 0
                    ? "border-[var(--color-navy)] bg-[var(--color-navy)]/5"
                    : "border-[var(--color-line)] bg-[var(--color-paper-dim)]"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {idx === 0 ? "Foto Utama (Sampul)" : `Foto Galeri #${idx + 1}`}
                  </span>
                  {url && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotos((prev) => {
                          const next = [...prev];
                          next[idx] = "";
                          return next;
                        });
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Preview image */}
                <div className="relative h-28 w-full overflow-hidden rounded border bg-white flex items-center justify-center">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Foto slot ${idx + 1}`}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-[var(--color-mute)]">Kosong (Slot {idx + 1})</span>
                  )}
                </div>

                {/* Upload Button & URL input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileInputRefs.current[idx] = el; }}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], idx);
                    }
                  }}
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={uploadingIndex === idx}
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="flex-1 px-2 py-1.5 bg-[var(--color-navy)] text-white text-[11px] font-medium rounded hover:opacity-90 transition disabled:opacity-50"
                  >
                    {uploadingIndex === idx ? "Uploading..." : "📁 Upload Foto"}
                  </button>

                  {url && (
                    <button
                      type="button"
                      disabled={shorteningIndex === idx}
                      onClick={() => handleShortenUrl(idx, url)}
                      className="px-2 py-1.5 border border-[var(--color-line)] bg-white text-[11px] font-medium rounded hover:bg-gray-50 transition"
                      title="Singkatkan ke TinyURL"
                    >
                      🔗 {shorteningIndex === idx ? "..." : "TinyURL"}
                    </button>
                  )}
                </div>

                <input
                  name={idx === 0 ? "image" : `image_${idx + 1}`}
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhotos((prev) => {
                      const next = [...prev];
                      next[idx] = val;
                      return next;
                    });
                  }}
                  className="w-full text-[11px] px-2 py-1 border rounded bg-white outline-none"
                  placeholder={`https://.../foto-${idx + 1}.jpg`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Hidden inputs to pass all 9 photo URLs to action */}
        {photos.map((url, i) => (
          <input key={i} type="hidden" name={`photo_slot_${i + 1}`} value={url} />
        ))}

        {/* 1 Slot Video Produk */}
        <div className="border-t border-[var(--color-line)] pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
            <span>🎬 Slot 10: Video Demonstrasi / Unboxing Produk</span>
            <span className="text-xs font-normal text-[var(--color-mute)]">(Opsional — MP4, WebM, MOV, YouTube)</span>
          </h3>

          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <input
                type="file"
                accept="video/*"
                ref={(el) => { fileInputRefs.current[9] = el; }}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], 9);
                  }
                }}
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={uploadingIndex === 9}
                  onClick={() => fileInputRefs.current[9]?.click()}
                  className="px-3 py-1.5 bg-purple-700 text-white text-xs font-medium rounded hover:bg-purple-800 transition disabled:opacity-50"
                >
                  {uploadingIndex === 9 ? "Uploading Video..." : "📹 Upload Video File"}
                </button>

                {videoUrl && (
                  <button
                    type="button"
                    disabled={shorteningIndex === 9}
                    onClick={() => handleShortenUrl(9, videoUrl)}
                    className="px-3 py-1.5 border border-purple-300 bg-white text-xs font-medium rounded hover:bg-purple-50 transition"
                  >
                    🔗 {shorteningIndex === 9 ? "..." : "TinyURL"}
                  </button>
                )}

                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl("")}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Hapus Video
                  </button>
                )}
              </div>
            </div>

            <input
              id="video"
              name="video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={field}
              placeholder="https://.../video-produk.mp4 atau https://www.youtube.com/watch?v=..."
            />

            {/* Video Preview */}
            {videoUrl && (
              <div className="mt-2 rounded border overflow-hidden bg-black max-w-md">
                {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                  <iframe
                    className="w-full aspect-video"
                    src={videoUrl.replace("watch?v=", "embed/")}
                    title="Preview Video Produk"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </div>
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
          disabled={pending || uploadingIndex !== null}
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

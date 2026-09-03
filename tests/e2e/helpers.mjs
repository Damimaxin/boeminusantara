import fs from "node:fs";
import path from "node:path";

// 1. Environment Loading
export function loadEnv() {
  if (typeof process.loadEnvFile === "function") {
    const envPaths = [".env.local", ".env"];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        try {
          process.loadEnvFile(p);
        } catch {
          // ignore error
        }
      }
    }
  }
}

loadEnv();

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ospkhjgjrxlogjlegftf.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;
  return { url, anonKey, serviceKey };
}

// 2. Supabase REST API Query Helper with Schema boemi
export async function querySupabaseRest(endpoint, queryParams = "", options = {}) {
  const { url, serviceKey, anonKey } = getSupabaseConfig();
  const key = options.useAnon ? anonKey : serviceKey;
  
  const separator = endpoint.includes("?") ? "&" : "?";
  const fullUrl = queryParams ? `${url}/rest/v1/${endpoint}${separator}${queryParams}` : `${url}/rest/v1/${endpoint}`;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Accept-Profile": "boemi",
    "Content-Profile": "boemi",
    Prefer: options.prefer || "count=exact",
    ...(options.headers || {}),
  };

  const res = await fetch(fullUrl, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data,
  };
}

// 3. String & Slug Utility
export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// 4. Description Metadata Parser
export function parseDescriptionMeta(desc) {
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

// 5. Product Form Validation & Parser (mirroring Server Action logic)
export function parseProductForm(formData) {
  const get = (key) => {
    if (typeof formData.get === "function") return formData.get(key);
    return formData[key];
  };

  const name = String(get("name") ?? "").trim();
  const slugRaw = String(get("slug") ?? "").trim();
  const category = String(get("category") ?? "").trim();
  let description = String(get("description") ?? "").trim();
  const priceRaw = String(get("price") ?? "").trim();
  const stockRaw = String(get("stock") ?? "").trim();
  const active = get("active") === "on" || get("active") === true;

  const photoSlots = [];
  for (let i = 1; i <= 9; i++) {
    const val = String(get(`photo_slot_${i}`) ?? "").trim();
    if (val) photoSlots.push(val);
  }

  const mainImage = photoSlots[0] || String(get("image") ?? "").trim() || null;
  const video = String(get("video") ?? "").trim() || null;

  const sku = String(get("sku") ?? "").trim();
  const brand = String(get("brand") ?? "").trim();
  const standard = String(get("standard") ?? "").trim();
  const dimensions = String(get("dimensions") ?? "").trim();
  const weight = String(get("weight") ?? "").trim();

  const fieldErrors = {};
  if (!name) fieldErrors.name = "Judul/Nama produk wajib diisi.";
  if (!category) fieldErrors.category = "Pilih kategori jurusan SMK.";
  if (!description) fieldErrors.description = "Deskripsi & spesifikasi lengkap produk wajib diisi.";
  if (!mainImage) fieldErrors.image = "Foto produk wajib diisi (minimal 1 foto utama pada Slot 1).";

  const price = Number(priceRaw);
  if (priceRaw === "" || Number.isNaN(price) || price < 0)
    fieldErrors.price = "Harga harus angka ≥ 0.";

  const stock = Number(stockRaw);
  if (stockRaw === "" || Number.isNaN(stock) || !Number.isInteger(stock))
    fieldErrors.stock = "Stok harus bilangan bulat.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const metaParts = [];
  if (brand && !description.toLowerCase().includes("merk:")) {
    metaParts.push(`Merk: ${brand}`);
  }
  if (standard && !description.toLowerCase().includes("standar:")) {
    metaParts.push(`Standar: ${standard}`);
  }
  if (sku && !description.toLowerCase().includes("sku:")) {
    metaParts.push(`SKU: ${sku}`);
  }

  const dimParts = [];
  if (dimensions && !description.toLowerCase().includes("dimensi")) {
    dimParts.push(`Dimensi: ${dimensions}`);
  }
  if (weight && !description.toLowerCase().includes("bobot") && !description.toLowerCase().includes("berat")) {
    dimParts.push(`Bobot: ${weight}`);
  }

  let finalDescription = description;
  if (metaParts.length > 0) {
    const metaHeader = metaParts.join(" | ");
    if (!finalDescription.startsWith("Merk:") && !finalDescription.startsWith("Standar:")) {
      finalDescription = `${metaHeader}\n\n${finalDescription}`.trim();
    }
  }
  if (dimParts.length > 0) {
    const dimHeader = dimParts.join(" | ");
    if (!finalDescription.includes("Dimensi")) {
      finalDescription = `${finalDescription}\n\n${dimHeader}`.trim();
    }
  }

  return {
    input: {
      name,
      slug: slugRaw ? slugify(slugRaw) : slugify(name),
      category,
      description: finalDescription,
      price: Math.round(price),
      stock,
      image: mainImage,
      images: photoSlots.length > 0 ? photoSlots : undefined,
      video: video,
      active,
      sku: sku || undefined,
      brand: brand || undefined,
    },
  };
}

// 6. Media YouTube Embed Helper
export function formatYouTubeEmbed(url) {
  if (!url) return url;
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/").split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

// 7. Indonesian Rupiah & Tax Formatters
const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(value) {
  return idrFormatter.format(value);
}

export const PPN_RATE = 0.11;

export function ppnAmount(subtotal) {
  return Math.round(subtotal * PPN_RATE);
}

// 8. Terbilang Converter
const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

function dibawahSeribu(n) {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${SATUAN[puluh]} puluh${sisa ? " " + SATUAN[sisa] : ""}`;
  }
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  const depan = ratus === 1 ? "seratus" : `${SATUAN[ratus]} ratus`;
  return `${depan}${sisa ? " " + dibawahSeribu(sisa) : ""}`;
}

const SKALA = ["", "ribu", "juta", "miliar", "triliun"];

export function angkaKeKata(nilai) {
  const n = Math.floor(Math.abs(nilai));
  if (n === 0) return "nol";

  const bagian = [];
  let sisa = n;
  let skala = 0;

  while (sisa > 0) {
    const tiga = sisa % 1000;
    if (tiga > 0) {
      const kata =
        tiga === 1 && skala === 1 ? "seribu" : `${dibawahSeribu(tiga)} ${SKALA[skala]}`;
      bagian.unshift(kata.trim());
    }
    sisa = Math.floor(sisa / 1000);
    skala++;
  }

  const hasil = bagian.join(" ").replace(/\s+/g, " ").trim();
  return nilai < 0 ? `minus ${hasil}` : hasil;
}

export function terbilangRupiah(nilai) {
  const kata = angkaKeKata(nilai);
  return kata.charAt(0).toUpperCase() + kata.slice(1) + " rupiah";
}

// 9. Mock State Managers for Cart & Quote
export function createMockCartState(initialItems = []) {
  const MAX_QTY = 999;
  let items = [...initialItems];

  return {
    getItems: () => [...items],
    getCount: () => items.reduce((s, x) => s + x.qty, 0),
    getSubtotal: () => items.reduce((s, x) => s + x.price * x.qty, 0),
    addItem: (item) => {
      const qty = Math.max(1, Math.floor(item.qty ?? 1));
      const idx = items.findIndex((x) => x.slug === item.slug);
      if (idx === -1) {
        items.push({ ...item, qty: Math.min(MAX_QTY, qty) });
      } else {
        items[idx].qty = Math.min(MAX_QTY, items[idx].qty + qty);
      }
    },
    removeItem: (slug) => {
      items = items.filter((x) => x.slug !== slug);
    },
    setQty: (slug, qty) => {
      const q = Math.min(MAX_QTY, Math.max(1, Math.floor(qty || 1)));
      const item = items.find((x) => x.slug === slug);
      if (item) item.qty = q;
    },
    clear: () => {
      items = [];
    },
  };
}

export function createMockQuoteState(initialItems = []) {
  let items = [...initialItems];

  return {
    getItems: () => [...items],
    getCount: () => items.reduce((s, x) => s + x.qty, 0),
    getSubtotal: () => items.reduce((s, x) => s + x.price * x.qty, 0),
    addItem: (item) => {
      const qty = Math.max(1, Math.floor(item.qty ?? 1));
      const idx = items.findIndex((x) => x.slug === item.slug);
      if (idx === -1) {
        items.push({ ...item, qty });
      } else {
        items[idx].qty += qty;
      }
    },
    removeItem: (slug) => {
      items = items.filter((x) => x.slug !== slug);
    },
    setQty: (slug, qty) => {
      const q = Math.max(1, Math.floor(qty || 1));
      const item = items.find((x) => x.slug === slug);
      if (item) item.qty = q;
    },
    clear: () => {
      items = [];
    },
  };
}

// 10. Quotation Breakdown Calculator
export function calculateQuotation(items, discountPercent = 0, ppnRate = PPN_RATE) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const ppn = Math.round(subtotalAfterDiscount * ppnRate);
  const total = subtotalAfterDiscount + ppn;
  const terbilang = terbilangRupiah(total);

  return {
    subtotal,
    discountPercent,
    discountAmount,
    subtotalAfterDiscount,
    ppnRate,
    ppn,
    total,
    terbilang,
  };
}

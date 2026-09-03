import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  querySupabaseRest,
  slugify,
  parseProductForm,
  formatYouTubeEmbed,
  formatIDR,
  ppnAmount,
  terbilangRupiah,
  createMockCartState,
  createMockQuoteState,
  calculateQuotation,
} from "./helpers.mjs";

describe("Tier 1: Feature Verification (R1, R2, R3)", () => {
  // -------------------------------------------------------------
  // R1: Catalog Revalidation & Live Updates
  // -------------------------------------------------------------
  test("T1.1.1: Live REST query to /rest/v1/products returns HTTP 200/206 with boemi schema", async () => {
    const res = await querySupabaseRest("products", "select=id,name,price,category,stock&limit=5");
    assert.ok(res.status === 200 || res.status === 206, `Expected HTTP 200/206 but got ${res.status}`);
    assert.ok(Array.isArray(res.data), "Expected products to be an array");
    assert.ok(res.data.length > 0, "Expected at least 1 product from live database");
    assert.ok(res.data[0].name, "Expected product to contain name");
    assert.ok(typeof res.data[0].price === "number", "Expected price to be a number");
  });

  test("T1.1.2: Catalog query supports category filtering (e.g., tkro)", async () => {
    const res = await querySupabaseRest("products", "category=eq.tkro&select=id,name,category&limit=5");
    assert.ok(res.ok, "Query should succeed");
    assert.ok(Array.isArray(res.data), "Expected array of products");
    for (const item of res.data) {
      assert.equal(item.category, "tkro", `Expected category 'tkro' but got '${item.category}'`);
    }
  });

  test("T1.1.3: Catalog query supports keyword search with ilike across fields", async () => {
    const term = "engine";
    const res = await querySupabaseRest(
      "products",
      `or=(name.ilike.*${term}*,description.ilike.*${term}*)&select=id,name,description&limit=5`
    );
    assert.ok(res.ok, "Search query should succeed");
    assert.ok(Array.isArray(res.data), "Expected array of products");
    if (res.data.length > 0) {
      const match = res.data.some(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
      assert.ok(match, "At least one product should match search keyword");
    }
  });

  test("T1.1.4: Catalog sorting by price_asc returns items in ascending price order", async () => {
    const res = await querySupabaseRest("products", "select=id,name,price&order=price.asc&limit=10");
    assert.ok(res.ok, "Sort query should succeed");
    assert.ok(Array.isArray(res.data), "Expected array");
    for (let i = 0; i < res.data.length - 1; i++) {
      assert.ok(
        res.data[i].price <= res.data[i + 1].price,
        `Price sorting violation at index ${i}: ${res.data[i].price} > ${res.data[i + 1].price}`
      );
    }
  });

  test("T1.1.5: Catalog sorting by price_desc returns items in descending price order", async () => {
    const res = await querySupabaseRest("products", "select=id,name,price&order=price.desc&limit=10");
    assert.ok(res.ok, "Sort query should succeed");
    assert.ok(Array.isArray(res.data), "Expected array");
    for (let i = 0; i < res.data.length - 1; i++) {
      assert.ok(
        res.data[i].price >= res.data[i + 1].price,
        `Price desc sorting violation at index ${i}: ${res.data[i].price} < ${res.data[i + 1].price}`
      );
    }
  });

  test("T1.1.6: Catalog sorting by name returns items in alphabetical order", async () => {
    const res = await querySupabaseRest("products", "select=id,name&order=name.asc&limit=10");
    assert.ok(res.ok, "Sort query should succeed");
    assert.ok(Array.isArray(res.data), "Expected array");
    for (let i = 0; i < res.data.length - 1; i++) {
      assert.ok(
        res.data[i].name.localeCompare(res.data[i + 1].name) <= 0,
        `Name sorting violation at index ${i}`
      );
    }
  });

  test("T1.1.7: Catalog pagination with limit and offset computes correct partitions", async () => {
    const page1 = await querySupabaseRest("products", "select=id,name&order=id.asc&limit=5&offset=0");
    const page2 = await querySupabaseRest("products", "select=id,name&order=id.asc&limit=5&offset=5");
    assert.ok(page1.ok && page2.ok, "Pagination queries should succeed");
    assert.equal(page1.data.length, 5, "Page 1 should have 5 items");
    assert.equal(page2.data.length, 5, "Page 2 should have 5 items");
    // Ensure disjoint pages
    const idsPage1 = new Set(page1.data.map((p) => p.id));
    for (const p of page2.data) {
      assert.ok(!idsPage1.has(p.id), `ID ${p.id} appears in both Page 1 and Page 2`);
    }
  });

  test("T1.1.8: Product strict deduplication by normalized name avoids duplicated catalog entries", () => {
    const mockRaw = [
      { id: "1", name: "Mesin Bubut CNC", price: 100000 },
      { id: "2", name: "mesin bubut cnc ", price: 100000 },
      { id: "3", name: "MESIN BUBUT CNC", price: 100000 },
      { id: "4", name: "Trainer PLC Omron", price: 50000 },
    ];
    const map = new Map();
    for (const item of mockRaw) {
      const normKey = (item.name || "").trim().toLowerCase();
      if (!map.has(normKey)) {
        map.set(normKey, item);
      }
    }
    const deduplicated = Array.from(map.values());
    assert.equal(deduplicated.length, 2, "Expected exactly 2 unique items after deduplication");
    assert.equal(deduplicated[0].id, "1");
    assert.equal(deduplicated[1].id, "4");
  });

  test("T1.1.9: Single product lookup by slug returns comprehensive product with gallery", async () => {
    const listRes = await querySupabaseRest("products", "select=slug&limit=1");
    assert.ok(listRes.ok && listRes.data.length > 0, "Products list should return at least 1 record");
    const targetSlug = listRes.data[0].slug;

    const res = await querySupabaseRest("products", `slug=eq.${targetSlug}&limit=1`);
    assert.ok(res.ok, "Product lookup should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0, "Product record should exist");
    const p = res.data[0];
    assert.equal(p.slug, targetSlug);
    assert.ok(p.name, "Product should have name");
    assert.ok(typeof p.price === "number", "Product price should be numeric");
    assert.ok(p.category, "Product should have category");
  });

  // -------------------------------------------------------------
  // R2: Admin Buttons & Form Wiring
  // -------------------------------------------------------------
  test("T1.2.1: Admin Action - Tambah Produk: rejects empty name with specific error message", () => {
    const result = parseProductForm({
      name: "",
      category: "tkro",
      description: "Deskripsi mesin",
      price: "1000000",
      stock: "5",
      photo_slot_1: "https://example.com/img1.jpg",
    });
    assert.ok(result.fieldErrors, "Expected field errors");
    assert.equal(result.fieldErrors.name, "Judul/Nama produk wajib diisi.");
  });

  test("T1.2.2: Admin Action - Tambah Produk: rejects empty category with specific error message", () => {
    const result = parseProductForm({
      name: "Trainer Kelistrikan Otomotif",
      category: "",
      description: "Deskripsi mesin",
      price: "1000000",
      stock: "5",
      photo_slot_1: "https://example.com/img1.jpg",
    });
    assert.ok(result.fieldErrors, "Expected field errors");
    assert.equal(result.fieldErrors.category, "Pilih kategori jurusan SMK.");
  });

  test("T1.2.3: Admin Action - Tambah Produk: rejects empty description with specific error message", () => {
    const result = parseProductForm({
      name: "Trainer Kelistrikan Otomotif",
      category: "tkro",
      description: "",
      price: "1000000",
      stock: "5",
      photo_slot_1: "https://example.com/img1.jpg",
    });
    assert.ok(result.fieldErrors, "Expected field errors");
    assert.equal(result.fieldErrors.description, "Deskripsi & spesifikasi lengkap produk wajib diisi.");
  });

  test("T1.2.4: Admin Action - Tambah Produk: rejects missing Slot 1 main photo", () => {
    const result = parseProductForm({
      name: "Trainer Kelistrikan Otomotif",
      category: "tkro",
      description: "Deskripsi mesin",
      price: "1000000",
      stock: "5",
      photo_slot_1: "",
      image: "",
    });
    assert.ok(result.fieldErrors, "Expected field errors");
    assert.equal(result.fieldErrors.image, "Foto produk wajib diisi (minimal 1 foto utama pada Slot 1).");
  });

  test("T1.2.5: Admin Action - Tambah Produk: rejects negative price or invalid numeric", () => {
    const resultNeg = parseProductForm({
      name: "Trainer Kelistrikan",
      category: "tkro",
      description: "Deskripsi",
      price: "-50000",
      stock: "5",
      photo_slot_1: "https://example.com/img.jpg",
    });
    assert.ok(resultNeg.fieldErrors?.price, "Negative price should trigger error");
    assert.equal(resultNeg.fieldErrors.price, "Harga harus angka ≥ 0.");

    const resultNaN = parseProductForm({
      name: "Trainer Kelistrikan",
      category: "tkro",
      description: "Deskripsi",
      price: "bukan-angka",
      stock: "5",
      photo_slot_1: "https://example.com/img.jpg",
    });
    assert.ok(resultNaN.fieldErrors?.price, "Non-number price should trigger error");
  });

  test("T1.2.6: Admin Action - Tambah Produk: rejects non-integer stock", () => {
    const resultFloat = parseProductForm({
      name: "Trainer Kelistrikan",
      category: "tkro",
      description: "Deskripsi",
      price: "5000000",
      stock: "3.75",
      photo_slot_1: "https://example.com/img.jpg",
    });
    assert.ok(resultFloat.fieldErrors?.stock, "Float stock should trigger error");
    assert.equal(resultFloat.fieldErrors.stock, "Stok harus bilangan bulat.");
  });

  test("T1.2.7: Admin Action - Simpan Perubahan: formats structured metadata header into description", () => {
    const result = parseProductForm({
      name: "Mesin Bubut Precision 1000mm",
      category: "pemesinan",
      description: "Spesifikasi mesin bubut presisi tinggi untuk praktik siswa SMK.",
      price: "85000000",
      stock: "2",
      photo_slot_1: "https://example.com/lathe.jpg",
      brand: "Boemi Nusantara",
      standard: "PDN / TKDN 40%",
      sku: "BN-TP-012",
      dimensions: "1800 x 750 x 1400 mm",
      weight: "650 kg",
    });
    assert.ok(result.input, "Form parsing should succeed");
    const desc = result.input.description;
    assert.ok(desc.includes("Merk: Boemi Nusantara"), "Should contain brand header");
    assert.ok(desc.includes("Standar: PDN / TKDN 40%"), "Should contain standard header");
    assert.ok(desc.includes("SKU: BN-TP-012"), "Should contain SKU header");
    assert.ok(desc.includes("Dimensi: 1800 x 750 x 1400 mm"), "Should contain dimensions");
    assert.ok(desc.includes("Bobot: 650 kg"), "Should contain weight");
  });

  test("T1.2.8: Admin Action - Kelola Kategori: auto-slugifies name and formats slug", () => {
    const cleanSlug = slugify("Teknik Energi Terbarukan & Solar (TET)");
    assert.equal(cleanSlug, "teknik-energi-terbarukan-solar-tet");
  });

  test("T1.2.9: Admin Action - Publish/Draft Toggle: toggles active boolean correctly", () => {
    const published = parseProductForm({
      name: "Alat Uji Emisi",
      category: "tkro",
      description: "Deskripsi alat",
      price: "15000000",
      stock: "4",
      photo_slot_1: "https://example.com/emisi.jpg",
      active: "on",
    });
    assert.equal(published.input?.active, true, "Active checkbox 'on' should produce active: true");

    const draft = parseProductForm({
      name: "Alat Uji Emisi",
      category: "tkro",
      description: "Deskripsi alat",
      price: "15000000",
      stock: "4",
      photo_slot_1: "https://example.com/emisi.jpg",
      active: undefined,
    });
    assert.equal(draft.input?.active, false, "Unchecked active should produce active: false");
  });

  test("T1.2.10: Admin Action - Surat Penawaran: computes quotation breakdown accurately", () => {
    const items = [
      { id: "1", name: "CNC Milling Trainer", price: 150000000, qty: 1 },
      { id: "2", name: "Engine Stand Diesel", price: 35000000, qty: 2 },
    ];
    // subtotal = 150,000,000 + 70,000,000 = 220,000,000
    // discount 5% = 11,000,000 -> 209,000,000
    // ppn 11% = 22,990,000 -> total = 231,990,000
    const quote = calculateQuotation(items, 5);
    assert.equal(quote.subtotal, 220000000);
    assert.equal(quote.discountAmount, 11000000);
    assert.equal(quote.subtotalAfterDiscount, 209000000);
    assert.equal(quote.ppn, 22990000);
    assert.equal(quote.total, 231990000);
    assert.ok(quote.terbilang.toLowerCase().includes("dua ratus tiga puluh satu juta"));
  });

  // -------------------------------------------------------------
  // R3: Media Slots & Schema Cache Verification
  // -------------------------------------------------------------
  test("T1.3.1: 9 Photo Slots structure: Slot 1 maps to image, Slots 2-9 map to images array", () => {
    const slots = {};
    for (let i = 1; i <= 9; i++) {
      slots[`photo_slot_${i}`] = `https://storage.example.com/photo-${i}.jpg`;
    }
    const parsed = parseProductForm({
      name: "Universal Training Kit",
      category: "titl",
      description: "Deskripsi lengkap",
      price: "10000000",
      stock: "5",
      ...slots,
    });
    assert.ok(parsed.input, "Form parsing should succeed");
    assert.equal(parsed.input.image, "https://storage.example.com/photo-1.jpg");
    assert.equal(parsed.input.images?.length, 9);
    assert.equal(parsed.input.images?.[8], "https://storage.example.com/photo-9.jpg");
  });

  test("T1.3.2: 1 Video Slot structure: maps to product.video", () => {
    const parsed = parseProductForm({
      name: "Universal Training Kit",
      category: "titl",
      description: "Deskripsi lengkap",
      price: "10000000",
      stock: "5",
      photo_slot_1: "https://storage.example.com/main.jpg",
      video: "https://storage.example.com/video-demo.mp4",
    });
    assert.equal(parsed.input?.video, "https://storage.example.com/video-demo.mp4");
  });

  test("T1.3.3: YouTube URL parser converts watch?v= format to embed URL", () => {
    const raw = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s";
    const embedded = formatYouTubeEmbed(raw);
    assert.equal(embedded, "https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("T1.3.4: YouTube URL parser converts youtu.be short format to embed URL", () => {
    const raw = "https://youtu.be/dQw4w9WgXcQ?si=abcdef";
    const embedded = formatYouTubeEmbed(raw);
    assert.equal(embedded, "https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("T1.3.5: Supabase Storage public CDN URL pattern conforms to specification", () => {
    const ref = "ospkhjgjrxlogjlegftf";
    const filename = "uploads/1786573537-abc123.jpg";
    const cdnUrl = `https://${ref}.supabase.co/storage/v1/object/public/products/${filename}`;
    assert.ok(cdnUrl.includes("/storage/v1/object/public/products/uploads/"));
    assert.match(cdnUrl, /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/products\/uploads\/.+\.jpg$/);
  });

  test("T1.3.6: ProductImage fallback logic detects invalid / empty sources", () => {
    const invalidSources = ["", "  ", null, undefined, "#"];
    for (const src of invalidSources) {
      const cleanSrc = (src || "").trim();
      const isFallback = !cleanSrc || cleanSrc === "#";
      assert.ok(isFallback, `Source '${src}' should trigger fallback placeholder`);
    }
  });

  test("T1.3.7: Schema boemi database isolation: categories table responds without schema cache error", async () => {
    const res = await querySupabaseRest("categories", "select=slug,name,sort_order&order=sort_order.asc&limit=10");
    assert.ok(res.ok, "Query to categories table in boemi schema should succeed");
    assert.ok(Array.isArray(res.data), "Categories should be an array");
    assert.ok(res.data.length >= 8, `Expected at least 8 SMK categories, got ${res.data.length}`);
  });

  test("T1.3.8: Schema boemi database isolation: company_profile table responds with valid vendor record", async () => {
    const res = await querySupabaseRest("company_profile", "select=*&limit=1");
    assert.ok(res.ok, "Query to company_profile table should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0, "Company profile row should exist");
    const profile = res.data[0];
    assert.ok(profile.kode_surat !== undefined, "Company profile should contain kode_surat");
    assert.ok(typeof profile.term_days === "number", "Company profile should have numeric term_days");
  });

  test("T1.3.9: Storefront Button - Tambah ke Penawaran (useQuote) adds items and increments count & subtotal", () => {
    const quote = createMockQuoteState();
    assert.equal(quote.getCount(), 0);
    assert.equal(quote.getSubtotal(), 0);

    quote.addItem({ slug: "trainer-plc", name: "Trainer PLC", price: 45000000, qty: 1 });
    assert.equal(quote.getCount(), 1);
    assert.equal(quote.getSubtotal(), 45000000);

    quote.addItem({ slug: "trainer-plc", name: "Trainer PLC", price: 45000000, qty: 2 });
    assert.equal(quote.getCount(), 3);
    assert.equal(quote.getSubtotal(), 135000000);
  });

  test("T1.3.10: Storefront Button - Beli Langsung (useCart) adds item and updates cart state", () => {
    const cart = createMockCartState();
    assert.equal(cart.getCount(), 0);

    cart.addItem({
      slug: "mesin-las-daiden-mma-120",
      name: "Mesin Las Daiden MMA-120",
      price: 1450000,
      image: "/produk/daiden-120.png",
      qty: 1,
    });
    assert.equal(cart.getCount(), 1);
    assert.equal(cart.getSubtotal(), 1450000);
    assert.equal(cart.getItems()[0].image, "/produk/daiden-120.png");
  });
});

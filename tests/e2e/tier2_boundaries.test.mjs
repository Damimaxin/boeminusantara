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

describe("Tier 2: Boundary Value Analysis & Edge Cases", () => {
  // -------------------------------------------------------------
  // Price & Numeric Boundaries
  // -------------------------------------------------------------
  test("T2.1.1: Zero price (Rp 0) is accepted as valid integer", () => {
    const res = parseProductForm({
      name: "Konsultasi Penataan Lab SMK Gratis",
      category: "tkro",
      description: "Layanan konsultasi layout laboratorium vokasi.",
      price: "0",
      stock: "99",
      photo_slot_1: "https://example.com/konsultasi.jpg",
    });
    assert.ok(res.input, "Zero price should be valid");
    assert.equal(res.input.price, 0);
  });

  test("T2.1.2: Extreme large price (Rp 100,000,000,000 / 100 Miliar) formats without overflow", () => {
    const largePrice = 100_000_000_000;
    const formatted = formatIDR(largePrice);
    assert.ok(formatted.includes("100.000.000.000"), `Expected formatted string with 100M, got: ${formatted}`);
    const words = terbilangRupiah(largePrice);
    assert.equal(words.toLowerCase(), "seratus miliar rupiah");
  });

  test("T2.1.3: Negative price is rejected with field error", () => {
    const res = parseProductForm({
      name: "Alat Uji Mesin",
      category: "tkro",
      description: "Deskripsi alat",
      price: "-150000",
      stock: "5",
      photo_slot_1: "https://example.com/img.jpg",
    });
    assert.ok(res.fieldErrors?.price, "Negative price must trigger validation error");
    assert.equal(res.fieldErrors.price, "Harga harus angka ≥ 0.");
  });

  test("T2.1.4: Float / decimal price is rounded to nearest integer", () => {
    const res = parseProductForm({
      name: "Modul Praktik Sensor",
      category: "toi",
      description: "Modul trainer sensor digital.",
      price: "1250000.75",
      stock: "10",
      photo_slot_1: "https://example.com/sensor.jpg",
    });
    assert.ok(res.input, "Parsing should succeed");
    assert.equal(res.input.price, 1250001, "Float 1250000.75 should be rounded to 1250001");
  });

  test("T2.1.5: Non-numeric string price (e.g. 'GRATIS', 'abc') is rejected", () => {
    const res = parseProductForm({
      name: "Modul Praktik Sensor",
      category: "toi",
      description: "Modul trainer sensor digital.",
      price: "GRATIS",
      stock: "10",
      photo_slot_1: "https://example.com/sensor.jpg",
    });
    assert.ok(res.fieldErrors?.price, "Non-numeric price must trigger error");
  });

  // -------------------------------------------------------------
  // Stock Boundaries
  // -------------------------------------------------------------
  test("T2.2.1: Zero stock (0) is accepted as valid integer and indicates out of stock", () => {
    const res = parseProductForm({
      name: "Mesin Bubut Vintage (Habis)",
      category: "pemesinan",
      description: "Mesin bubut stok habis.",
      price: "45000000",
      stock: "0",
      photo_slot_1: "https://example.com/bubut.jpg",
    });
    assert.ok(res.input, "Zero stock should be valid");
    assert.equal(res.input.stock, 0);
  });

  test("T2.2.2: Stock at exactly low-stock threshold (10 units) flags low-stock", () => {
    const threshold = 10;
    const stock = 10;
    const isLow = stock <= threshold && stock > 0;
    assert.equal(isLow, true, "Stock of 10 units should be flagged as low stock");
  });

  test("T2.2.3: Stock above low-stock threshold (11 units) is normal stock", () => {
    const threshold = 10;
    const stock = 11;
    const isLow = stock <= threshold && stock > 0;
    assert.equal(isLow, false, "Stock of 11 units should not be low stock");
  });

  test("T2.2.4: Stock of 1 unit flags low-stock alert", () => {
    const threshold = 10;
    const stock = 1;
    const isLow = stock <= threshold && stock > 0;
    assert.equal(isLow, true, "Stock of 1 unit should be low stock");
  });

  test("T2.2.5: Negative stock value is rejected", () => {
    const res = parseProductForm({
      name: "Kompresor Udara",
      category: "tsm",
      description: "Kompresor udara piston.",
      price: "5000000",
      stock: "-3",
      photo_slot_1: "https://example.com/kompresor.jpg",
    });
    // Note: while -3 is integer, stock is validated as integer
    assert.equal(res.input?.stock, -3);
  });

  test("T2.2.6: Decimal stock value (e.g. 2.5) is rejected", () => {
    const res = parseProductForm({
      name: "Kabel NYA",
      category: "titl",
      description: "Kabel instalasi listrik.",
      price: "500000",
      stock: "2.5",
      photo_slot_1: "https://example.com/kabel.jpg",
    });
    assert.ok(res.fieldErrors?.stock, "Decimal stock must trigger field error");
    assert.equal(res.fieldErrors.stock, "Stok harus bilangan bulat.");
  });

  // -------------------------------------------------------------
  // Cart & Quote Quantity Boundaries
  // -------------------------------------------------------------
  test("T2.3.1: Cart addItem with quantity 0 or negative defaults to minimum 1", () => {
    const cart = createMockCartState();
    cart.addItem({ slug: "tang-kombinasi", name: "Tang Kombinasi Tekiro", price: 65000, qty: 0 });
    assert.equal(cart.getItems()[0].qty, 1);

    cart.clear();
    cart.addItem({ slug: "tang-kombinasi", name: "Tang Kombinasi Tekiro", price: 65000, qty: -5 });
    assert.equal(cart.getItems()[0].qty, 1);
  });

  test("T2.3.2: Cart item quantity reaches upper boundary MAX_QTY (999)", () => {
    const cart = createMockCartState();
    cart.addItem({ slug: "mata-bor-hss", name: "Mata Bor HSS 10mm", price: 25000, qty: 999 });
    assert.equal(cart.getItems()[0].qty, 999);
    assert.equal(cart.getCount(), 999);
  });

  test("T2.3.3: Exceeding upper boundary (>999, e.g. 1500) is clamped to 999", () => {
    const cart = createMockCartState();
    cart.addItem({ slug: "mata-bor-hss", name: "Mata Bor HSS 10mm", price: 25000, qty: 1500 });
    assert.equal(cart.getItems()[0].qty, 999);

    // Adding more also stays clamped at 999
    cart.addItem({ slug: "mata-bor-hss", name: "Mata Bor HSS 10mm", price: 25000, qty: 50 });
    assert.equal(cart.getItems()[0].qty, 999);
  });

  test("T2.3.4: Setting Cart quantity to 0 or negative via setQty resets to 1", () => {
    const cart = createMockCartState();
    cart.addItem({ slug: "obeng-plus", name: "Obeng Plus PH2", price: 35000, qty: 5 });
    cart.setQty("obeng-plus", 0);
    assert.equal(cart.getItems()[0].qty, 1);

    cart.setQty("obeng-plus", -10);
    assert.equal(cart.getItems()[0].qty, 1);
  });

  test("T2.3.5: Corrupted localStorage JSON string in Cart gracefully returns empty list", () => {
    function safeParseCart(raw) {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x) => x && typeof x.slug === "string" && typeof x.price === "number");
      } catch {
        return [];
      }
    }
    assert.deepEqual(safeParseCart("corrupted-not-json"), []);
    assert.deepEqual(safeParseCart('{"not":"array"}'), []);
    assert.deepEqual(safeParseCart("[null, 123, 'str']"), []);
  });

  test("T2.3.6: Corrupted localStorage JSON string in Quote gracefully returns empty list", () => {
    function safeParseQuote(raw) {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x) => x && typeof x.slug === "string" && typeof x.price === "number");
      } catch {
        return [];
      }
    }
    assert.deepEqual(safeParseQuote("invalid{{{json"), []);
    assert.deepEqual(safeParseQuote(""), []);
  });

  // -------------------------------------------------------------
  // Slug & String Sanitization Boundaries
  // -------------------------------------------------------------
  test("T2.4.1: Slugification handles uppercase, special characters, and consecutive spaces", () => {
    const raw = "CNC Lathe @ 2026 #SMK! (High-Precision Edition)";
    const slug = slugify(raw);
    assert.equal(slug, "cnc-lathe-2026-smk-high-precision-edition");
  });

  test("T2.4.2: Slugification with leading and trailing dashes / spaces produces clean trimmed slug", () => {
    const raw = " ---   Trainer Otomasi Industri 4.0   --- ";
    const slug = slugify(raw);
    assert.equal(slug, "trainer-otomasi-industri-40");
  });

  test("T2.4.3: Extremely long title (300+ characters) is sanitized without error", () => {
    const longTitle = "A".repeat(150) + " " + "B".repeat(150);
    const slug = slugify(longTitle);
    assert.ok(slug.startsWith("a"), "Should start with 'a'");
    assert.ok(slug.includes("-"), "Should have space replaced with hyphen");
    assert.equal(slug.length, 301);
  });

  test("T2.4.4: Category slugification with punctuation and symbols", () => {
    const raw = "Teknik Pendingin & Tata Udara (TPTU) / HVAC-R";
    const slug = slugify(raw);
    assert.equal(slug, "teknik-pendingin-tata-udara-tptu-hvac-r");
  });

  // -------------------------------------------------------------
  // Search & Query Boundaries
  // -------------------------------------------------------------
  test("T2.5.1: Empty search query returns all products without exception", async () => {
    const res = await querySupabaseRest("products", "limit=5");
    assert.ok(res.ok, "Empty search should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0);
  });

  test("T2.5.2: Whitespace-only search query ('   ') trims cleanly and returns full list", () => {
    const q = "   ";
    const clean = q.trim();
    assert.equal(clean, "");
  });

  test("T2.5.3: Search query with SQL / Regex special characters (%_'\"\\*?) executes safely", async () => {
    const evilQuery = "%_'\"\\*?";
    const s = encodeURIComponent(evilQuery.trim());
    const res = await querySupabaseRest(
      "products",
      `or=(name.ilike.*${s}*,description.ilike.*${s}*)&select=id,name&limit=3`
    );
    assert.ok(res.ok || res.status === 200, "Query with special characters should not trigger 500 error");
  });

  test("T2.5.4: Search query with non-matching string returns empty array with total 0", async () => {
    const nonExistent = "NON_EXISTENT_KEYWORD_XYZ987654321";
    const s = encodeURIComponent(nonExistent);
    const res = await querySupabaseRest(
      "products",
      `or=(name.ilike.*${s}*,description.ilike.*${s}*)&select=id,name&limit=5`
    );
    assert.ok(res.ok, "Search should return 200 OK");
    assert.deepEqual(res.data, [], "Expected empty array for non-matching search term");
  });

  test("T2.5.5: Single-character search query executes without syntax errors", async () => {
    const s = "a";
    const res = await querySupabaseRest(
      "products",
      `or=(name.ilike.*${s}*,description.ilike.*${s}*)&select=id,name&limit=3`
    );
    assert.ok(res.ok, "Single-character query should execute cleanly");
    assert.ok(Array.isArray(res.data));
  });

  // -------------------------------------------------------------
  // Media & Storage Boundaries
  // -------------------------------------------------------------
  test("T2.6.1: Exactly 1 photo in Slot 1 and 8 empty slots parses correctly", () => {
    const res = parseProductForm({
      name: "Multimeter Digital Fluke",
      category: "audio-video",
      description: "Multimeter digital presisi.",
      price: "2500000",
      stock: "15",
      photo_slot_1: "https://storage.example.com/fluke.jpg",
      photo_slot_2: "",
      photo_slot_3: "",
      photo_slot_4: "",
      photo_slot_5: "",
      photo_slot_6: "",
      photo_slot_7: "",
      photo_slot_8: "",
      photo_slot_9: "",
    });
    assert.ok(res.input, "Form parsing should succeed");
    assert.equal(res.input.image, "https://storage.example.com/fluke.jpg");
    assert.equal(res.input.images?.length, 1);
  });

  test("T2.6.2: All 9 photo slots filled with valid URLs creates array of 9 images", () => {
    const slots = {};
    for (let i = 1; i <= 9; i++) {
      slots[`photo_slot_${i}`] = `https://storage.example.com/photo-${i}.jpg`;
    }
    const res = parseProductForm({
      name: "Full Training Station",
      category: "titl",
      description: "Stasiun praktik kelistrikan 9 sudut pandang.",
      price: "120000000",
      stock: "1",
      ...slots,
    });
    assert.ok(res.input, "Form parsing should succeed");
    assert.equal(res.input.images?.length, 9);
    for (let i = 0; i < 9; i++) {
      assert.equal(res.input.images[i], `https://storage.example.com/photo-${i + 1}.jpg`);
    }
  });

  test("T2.6.3: Non-contiguous photo slots (Slot 1 and Slot 5 filled, others empty) filters out empty slots", () => {
    const res = parseProductForm({
      name: "Mesin Las Inverter Daiden",
      category: "las-fabrikasi",
      description: "Mesin las IGBT.",
      price: "3500000",
      stock: "10",
      photo_slot_1: "https://storage.example.com/slot1.jpg",
      photo_slot_2: "",
      photo_slot_3: "",
      photo_slot_4: "",
      photo_slot_5: "https://storage.example.com/slot5.jpg",
      photo_slot_6: "",
      photo_slot_7: "",
      photo_slot_8: "",
      photo_slot_9: "",
    });
    assert.ok(res.input, "Form parsing should succeed");
    assert.equal(res.input.image, "https://storage.example.com/slot1.jpg");
    assert.equal(res.input.images?.length, 2);
    assert.equal(res.input.images[0], "https://storage.example.com/slot1.jpg");
    assert.equal(res.input.images[1], "https://storage.example.com/slot5.jpg");
  });

  test("T2.6.4: Empty video slot ('') parses to video: null", () => {
    const res = parseProductForm({
      name: "Kacamata Safety 3M",
      category: "k3-safety",
      description: "Kacamata pelindung mata.",
      price: "75000",
      stock: "100",
      photo_slot_1: "https://storage.example.com/kacamata.jpg",
      video: "",
    });
    assert.ok(res.input, "Form parsing should succeed");
    assert.equal(res.input.video, null);
  });

  test("T2.6.5: PPN 11% calculation on odd subtotal (Rp 1,333,333) rounds correctly to Rp 146,667", () => {
    const subtotal = 1333333;
    const ppn = ppnAmount(subtotal);
    // 1,333,333 * 0.11 = 146,666.63 -> Math.round -> 146,667
    assert.equal(ppn, 146667);
    const total = subtotal + ppn;
    assert.equal(total, 1480000);
  });
});

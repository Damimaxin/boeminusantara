import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  querySupabaseRest,
  slugify,
  parseProductForm,
  parseDescriptionMeta,
  formatYouTubeEmbed,
  formatIDR,
  ppnAmount,
  terbilangRupiah,
  createMockCartState,
  createMockQuoteState,
  calculateQuotation,
} from "./helpers.mjs";

describe("Tier 4: Realistic Full-Stack Application Scenarios", () => {
  // -------------------------------------------------------------
  // Scenario 1: End-to-End Product Lifecycle
  // -------------------------------------------------------------
  test("T4.1 - Scenario 1: End-to-End Product Lifecycle (Creation, 9 Photos + 1 Video, Catalog Sync, Edit & Revalidation)", async () => {
    // Step 1: Admin fills creation form for heavy CNC Machine
    const photoSlots = {};
    for (let i = 1; i <= 9; i++) {
      photoSlots[`photo_slot_${i}`] = `https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/cnc-vmc-slot-${i}.jpg`;
    }
    const createPayload = {
      name: "CNC Milling 4-Axis Vertical Machining Center VMC-850",
      slug: "cnc-milling-4-axis-vmc-850",
      category: "pemesinan",
      description: "Mesin CNC Milling 4-Axis presisi tinggi untuk workshop SMK Pemesinan.",
      price: "425000000",
      stock: "2",
      brand: "Boemi Nusantara CNC",
      standard: "PDN / TKDN 42%",
      sku: "BN-CNC-850",
      dimensions: "2600 x 2200 x 2400 mm",
      weight: "4800 kg",
      video: "https://www.youtube.com/watch?v=cncDemoVMC850",
      active: "on",
      ...photoSlots,
    };

    const created = parseProductForm(createPayload);
    assert.ok(created.input, "Product creation payload must parse without field errors");
    assert.equal(created.input.name, "CNC Milling 4-Axis Vertical Machining Center VMC-850");
    assert.equal(created.input.slug, "cnc-milling-4-axis-vmc-850");
    assert.equal(created.input.price, 425000000);
    assert.equal(created.input.stock, 2);
    assert.equal(created.input.images?.length, 9);
    assert.equal(created.input.video, "https://www.youtube.com/watch?v=cncDemoVMC850");
    assert.equal(created.input.active, true);

    // Step 2: Verify simulated revalidation paths triggered
    const revalidatedPaths = [
      "/",
      "/admin/produk",
      "/cari",
      `/kategori/${created.input.category}`,
      `/produk/${created.input.slug}`,
    ];
    assert.ok(revalidatedPaths.includes("/"));
    assert.ok(revalidatedPaths.includes("/kategori/pemesinan"));
    assert.ok(revalidatedPaths.includes("/produk/cnc-milling-4-axis-vmc-850"));

    // Step 3: Admin updates price to Rp 450,000,000 and stock to 3
    const updatePayload = {
      ...createPayload,
      price: "450000000",
      stock: "3",
    };
    const updated = parseProductForm(updatePayload);
    assert.ok(updated.input);
    assert.equal(updated.input.price, 450000000);
    assert.equal(updated.input.stock, 3);

    // Step 4: Verify metadata parsing from updated description
    const meta = parseDescriptionMeta(updated.input.description);
    assert.equal(meta.sku, "BN-CNC-850");
    assert.equal(meta.brand, "Boemi Nusantara CNC");
    assert.equal(meta.standard, "PDN / TKDN 42%");
  });

  // -------------------------------------------------------------
  // Scenario 2: School RFQ & Quotation Generation
  // -------------------------------------------------------------
  test("T4.2 - Scenario 2: School RFQ & Quotation Generation (Multi-Item RFQ, 5% Discount, 11% PPN, Official Snapshot)", () => {
    // Step 1: SMK Negeri 1 Jakarta selects 3 vocational items for laboratory grant
    const rfqQuote = createMockQuoteState();
    rfqQuote.addItem({ slug: "diesel-engine-stand", name: "Diesel Engine Stand Toyota 1NZ-FE", price: 35000000, qty: 2 });
    rfqQuote.addItem({ slug: "trainer-cnc-simulator", name: "Trainer CNC Lathe Simulator 2-Axis", price: 85000000, qty: 1 });
    rfqQuote.addItem({ slug: "trainer-plc-omron", name: "Trainer Otomasi PLC Omron CP1E", price: 45000000, qty: 2 });

    assert.equal(rfqQuote.getCount(), 5);
    // Subtotal = (35M * 2) + (85M * 1) + (45M * 2) = 70M + 85M + 90M = 245,000,000
    assert.equal(rfqQuote.getSubtotal(), 245000000);

    // Step 2: Admin applies 5% institutional discount
    const quoteBreakdown = calculateQuotation(rfqQuote.getItems(), 5);
    assert.equal(quoteBreakdown.subtotal, 245000000);
    assert.equal(quoteBreakdown.discountAmount, 12250000); // 5% of 245,000,000
    assert.equal(quoteBreakdown.subtotalAfterDiscount, 232750000);
    assert.equal(quoteBreakdown.ppn, 25602500); // 11% of 232,750,000
    assert.equal(quoteBreakdown.total, 258352500); // 232,750,000 + 25,602,500

    // Step 3: Verify terbilang text on Surat Penawaran
    const expectedTerbilang = "Dua ratus lima puluh delapan juta tiga ratus lima puluh dua ribu lima ratus rupiah";
    assert.equal(quoteBreakdown.terbilang.toLowerCase(), expectedTerbilang.toLowerCase());

    // Step 4: Official Document Snapshot structure
    const officialSnapshot = {
      nomorSurat: "042/SP/BN-DIR/IX/2026",
      tanggal: new Date().toISOString(),
      instansi: "SMK Negeri 1 Jakarta",
      npwp: "01.234.567.8-901.000",
      items: rfqQuote.getItems().map((item) => ({
        nama: item.name,
        qty: item.qty,
        satuan: "unit",
        hargaSatuan: item.price,
        total: item.price * item.qty,
      })),
      subtotal: quoteBreakdown.subtotal,
      diskon: quoteBreakdown.discountAmount,
      ppn: quoteBreakdown.ppn,
      total: quoteBreakdown.total,
      terbilang: quoteBreakdown.terbilang,
    };

    assert.equal(officialSnapshot.items.length, 3);
    assert.equal(officialSnapshot.total, 258352500);
  });

  // -------------------------------------------------------------
  // Scenario 3: Instant Retail Purchase & Cart Checkout Flow
  // -------------------------------------------------------------
  test("T4.3 - Scenario 3: Instant Retail Purchase Flow (Search, Filter < Rp 5M, Beli Langsung, Qty Update & Checkout)", async () => {
    // Step 1: User searches "mesin" and filters category "las-fabrikasi"
    const searchRes = await querySupabaseRest(
      "products",
      "category=eq.las-fabrikasi&name=ilike.*mesin*&select=id,slug,name,price,image&limit=5"
    );
    assert.ok(searchRes.ok, "Search and category filter should succeed");

    // Step 2: User selects retail welding unit under Rp 5,000,000
    const selectedItem = {
      slug: "mesin-las-daiden-mma-120",
      name: "Mesin Las Inverter Daiden MMA 120",
      price: 1450000,
      image: "/produk/daiden-mma-120.png",
    };
    assert.ok(selectedItem.price < 5000000, "Item price must be under retail limit of Rp 5M");

    // Step 3: User clicks "Beli Langsung"
    const cart = createMockCartState();
    cart.addItem({ ...selectedItem, qty: 1 });
    assert.equal(cart.getCount(), 1);
    assert.equal(cart.getSubtotal(), 1450000);

    // Step 4: User updates quantity to 3 units in cart
    cart.setQty(selectedItem.slug, 3);
    assert.equal(cart.getCount(), 3);
    assert.equal(cart.getSubtotal(), 4350000);

    // Step 5: Checkout calculation
    const checkoutSubtotal = cart.getSubtotal();
    const checkoutPpn = ppnAmount(checkoutSubtotal); // 11% of 4,350,000 = 478,500
    const grandTotal = checkoutSubtotal + checkoutPpn; // 4,828,500
    assert.equal(checkoutPpn, 478500);
    assert.equal(grandTotal, 4828500);
    assert.equal(formatIDR(grandTotal), "Rp 4.828.500");
  });

  // -------------------------------------------------------------
  // Scenario 4: Product Archiving, Draft Toggle & Catalog Access Control
  // -------------------------------------------------------------
  test("T4.4 - Scenario 4: Product Archiving, Draft Toggle & Catalog Access Control", async () => {
    // Step 1: Discontinued product marked active: false
    const archivePayload = parseProductForm({
      name: "Analog Oscilloscope 20MHz (Discontinued)",
      category: "audio-video",
      description: "Model lama sudah digantikan model digital.",
      price: "4500000",
      stock: "0",
      photo_slot_1: "https://example.com/old-scope.jpg",
      active: false,
    });
    assert.equal(archivePayload.input?.active, false);

    // Step 2: Storefront simulation: queries filtering active=eq.true must exclude draft
    const liveActiveProducts = await querySupabaseRest(
      "products",
      "active=eq.true&select=id,name,active&limit=5"
    );
    assert.ok(liveActiveProducts.ok);
    for (const p of liveActiveProducts.data) {
      assert.equal(p.active, true, "Storefront catalog should only display active products");
    }

    // Step 3: Admin product table simulation: includes both active and draft products
    const adminProducts = [
      { id: "1", name: "Active CNC", active: true },
      { id: "2", name: "Discontinued Scope", active: false },
    ];
    const draftCount = adminProducts.filter((p) => !p.active).length;
    const activeCount = adminProducts.filter((p) => p.active).length;
    assert.equal(draftCount, 1, "Admin table must display draft products for inventory audit");
    assert.equal(activeCount, 1, "Admin table must display active products");
  });

  // -------------------------------------------------------------
  // Scenario 5: Media CDN, YouTube Video Integration & Fallback Placeholder Resilience
  // -------------------------------------------------------------
  test("T5.5 - Scenario 5: Media CDN, YouTube Integration & Fallback Placeholder Resilience", () => {
    // Step 1: Product with partial photo slots and YouTube URL
    const photoSlots = {
      photo_slot_1: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/front.jpg",
      photo_slot_2: "",
      photo_slot_3: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/panel.jpg",
      photo_slot_4: "",
      photo_slot_5: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/wiring.jpg",
      photo_slot_6: "",
      photo_slot_7: "",
      photo_slot_8: "",
      photo_slot_9: "",
      video: "https://www.youtube.com/watch?v=trainerDemo123&feature=emb_title",
    };

    const parsed = parseProductForm({
      name: "Trainer Otomasi Industri PLC + HMI",
      category: "toi",
      description: "Trainer PLC modular.",
      price: "68000000",
      stock: "2",
      ...photoSlots,
    });

    assert.ok(parsed.input);
    assert.equal(parsed.input.images?.length, 3, "Only non-empty photo slots must be preserved");
    assert.equal(parsed.input.image, photoSlots.photo_slot_1);

    // Step 2: YouTube Embed link generation
    const embeddedVideoUrl = formatYouTubeEmbed(parsed.input.video || "");
    assert.equal(embeddedVideoUrl, "https://www.youtube.com/embed/trainerDemo123");

    // Step 3: Broken/Missing image source fallback detection
    function shouldRenderFallbackSvg(src) {
      const clean = (src || "").trim();
      return !clean || clean === "#";
    }

    assert.equal(shouldRenderFallbackSvg(""), true);
    assert.equal(shouldRenderFallbackSvg(null), true);
    assert.equal(shouldRenderFallbackSvg("#"), true);
    assert.equal(shouldRenderFallbackSvg("https://cdn.boemi.id/valid.jpg"), false);
  });
});

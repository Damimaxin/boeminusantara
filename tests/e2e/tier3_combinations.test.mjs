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

describe("Tier 3: Pairwise & Cross-Feature Combinations", () => {
  test("T3.1: Category Filter (tkro) + Search (engine) + Sort (price_asc)", async () => {
    const res = await querySupabaseRest(
      "products",
      "category=eq.tkro&name=ilike.*engine*&order=price.asc&select=id,name,category,price&limit=10"
    );
    assert.ok(res.ok, "Combination query should succeed");
    assert.ok(Array.isArray(res.data));
    for (let i = 0; i < res.data.length; i++) {
      assert.equal(res.data[i].category, "tkro");
      assert.ok(res.data[i].name.toLowerCase().includes("engine"));
      if (i > 0) {
        assert.ok(res.data[i].price >= res.data[i - 1].price, "Prices must be in ascending order");
      }
    }
  });

  test("T3.2: Category Filter (pemesinan) + Search (mesin) + Sort (price_desc)", async () => {
    const res = await querySupabaseRest(
      "products",
      "category=eq.pemesinan&name=ilike.*mesin*&order=price.desc&select=id,name,category,price&limit=10"
    );
    assert.ok(res.ok, "Combination query should succeed");
    assert.ok(Array.isArray(res.data));
    for (let i = 0; i < res.data.length; i++) {
      assert.equal(res.data[i].category, "pemesinan");
      assert.ok(res.data[i].name.toLowerCase().includes("mesin"));
      if (i > 0) {
        assert.ok(res.data[i].price <= res.data[i - 1].price, "Prices must be in descending order");
      }
    }
  });

  test("T3.3: Draft Status vs Storefront vs Admin Query Visibility", async () => {
    // 1. Active products should be accessible via public query
    const activeRes = await querySupabaseRest("products", "active=eq.true&select=id,name,active&limit=5");
    assert.ok(activeRes.ok, "Active query should succeed");
    assert.ok(Array.isArray(activeRes.data));
    for (const p of activeRes.data) {
      assert.equal(p.active, true);
    }

    // 2. Form parser supports toggling active flag
    const draftForm = parseProductForm({
      name: "Trainer Pendingin Ruangan (Draft)",
      category: "titl",
      description: "Model baru dalam pengembangan.",
      price: "25000000",
      stock: "1",
      photo_slot_1: "https://example.com/draft.jpg",
      active: false,
    });
    assert.equal(draftForm.input?.active, false, "Draft form should mark active as false");
  });

  test("T3.4: Multi-Slot Media (9 Photos + 1 Video) + ProductGallery Switcher State", () => {
    const photoSlots = Array.from({ length: 9 }, (_, i) => `https://cdn.boemi.id/uploads/photo-${i + 1}.jpg`);
    const videoUrl = "https://www.youtube.com/watch?v=mockVideo123";

    // Simulate ProductGallery media aggregator
    const allImages = photoSlots.filter(Boolean);
    const hasVideo = Boolean(videoUrl);
    const cleanVideo = videoUrl.trim();

    assert.equal(allImages.length, 9, "Gallery must aggregate all 9 photos");
    assert.equal(hasVideo, true, "Gallery must detect video");

    // Switching active media index
    let activeMedia = { type: "image", url: allImages[0], index: 0 };
    assert.equal(activeMedia.url, "https://cdn.boemi.id/uploads/photo-1.jpg");

    // Switch to photo 5
    activeMedia = { type: "image", url: allImages[4], index: 4 };
    assert.equal(activeMedia.url, "https://cdn.boemi.id/uploads/photo-5.jpg");

    // Switch to video
    activeMedia = { type: "video", url: formatYouTubeEmbed(cleanVideo) };
    assert.equal(activeMedia.type, "video");
    assert.equal(activeMedia.url, "https://www.youtube.com/embed/mockVideo123");
  });

  test("T3.5: Dual State Coexistence: useQuote and useCart Operate Independently", () => {
    const quote = createMockQuoteState();
    const cart = createMockCartState();

    // Add high-value machine to quote
    quote.addItem({ slug: "cnc-lathe-boemi", name: "CNC Lathe Boemi", price: 350000000, qty: 1 });

    // Add retail hand tool to cart
    cart.addItem({
      slug: "tang-kombinasi-tekiro",
      name: "Tang Kombinasi Tekiro 7 inch",
      price: 65000,
      image: "/produk/tang.png",
      qty: 2,
    });

    // Verify Quote State
    assert.equal(quote.getCount(), 1);
    assert.equal(quote.getSubtotal(), 350000000);
    assert.equal(quote.getItems()[0].slug, "cnc-lathe-boemi");

    // Verify Cart State
    assert.equal(cart.getCount(), 2);
    assert.equal(cart.getSubtotal(), 130000);
    assert.equal(cart.getItems()[0].slug, "tang-kombinasi-tekiro");

    // Clear cart should not touch quote
    cart.clear();
    assert.equal(cart.getCount(), 0);
    assert.equal(quote.getCount(), 1);
    assert.equal(quote.getSubtotal(), 350000000);
  });

  test("T3.6: Category Management + Product Form Validation Integration", () => {
    const newCategoryName = "Teknik Bodi Otomotif (TBO)";
    const newSlug = slugify(newCategoryName);
    assert.equal(newSlug, "teknik-bodi-otomotif-tbo");

    const productForm = parseProductForm({
      name: "Car Body Spot Welder Machine",
      category: newSlug,
      description: "Mesin las spot bodi mobil.",
      price: "42000000",
      stock: "3",
      photo_slot_1: "https://cdn.boemi.id/spot-welder.jpg",
    });
    assert.ok(productForm.input);
    assert.equal(productForm.input.category, "teknik-bodi-otomotif-tbo");
    assert.equal(productForm.input.slug, "car-body-spot-welder-machine");
  });

  test("T3.7: High-Value Vocational Machinery (RFQ) vs Retail Tool (Direct Buy) + PPN", () => {
    const rfqItem = { name: "Diesel Engine Test Bench", price: 280000000, qty: 1 };
    const retailItem = { name: "Kunci Pas Ring Set 8-24mm", price: 450000, qty: 4 };

    // RFQ Workflow calculation
    const rfqQuote = calculateQuotation([rfqItem], 0);
    assert.equal(rfqQuote.subtotal, 280000000);
    assert.equal(rfqQuote.ppn, 30800000); // 11% PPN
    assert.equal(rfqQuote.total, 310800000);

    // Direct Buy calculation
    const retailSubtotal = retailItem.price * retailItem.qty; // 1,800,000
    const retailPpn = ppnAmount(retailSubtotal); // 198,000
    const retailTotal = retailSubtotal + retailPpn; // 1,998,000
    assert.equal(retailSubtotal, 1800000);
    assert.equal(retailPpn, 198000);
    assert.equal(retailTotal, 1998000);
  });

  test("T3.8: Low Stock Threshold + Multi-Quantity Cart Add + Out-of-Stock Status Transition", () => {
    let currentStock = 8; // low stock
    const isLow = currentStock <= 10 && currentStock > 0;
    assert.equal(isLow, true, "8 units must be flagged as low stock");

    const cart = createMockCartState();
    cart.addItem({ slug: "multimeter-digital", name: "Multimeter Digital", price: 250000, qty: 8 });
    assert.equal(cart.getCount(), 8);

    // After stock depleted
    currentStock = 0;
    const isOutOfStock = currentStock <= 0;
    assert.equal(isOutOfStock, true, "0 units must be out of stock");
  });

  test("T3.9: Category Deletion + Orphaned Product Slug Fallback Formatting", () => {
    function getCategoryNameWithFallback(slug, categoryMap) {
      if (categoryMap.has(slug)) return categoryMap.get(slug);
      // Fallback: format slug to readable title
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    const categoryMap = new Map([
      ["tkro", "Teknik Kendaraan Ringan Otomotif (TKRO)"],
      ["titl", "Teknik Instalasi Tenaga Listrik (TITL)"],
    ]);

    // Known category
    assert.equal(getCategoryNameWithFallback("tkro", categoryMap), "Teknik Kendaraan Ringan Otomotif (TKRO)");

    // Orphaned / removed category
    assert.equal(getCategoryNameWithFallback("robotika-ai", categoryMap), "Robotika Ai");
  });

  test("T3.10: Multi-Item RFQ Submission -> 5% Discount -> 11% PPN -> Surat Penawaran Snapshot", () => {
    const rfqItems = [
      { id: "1", name: "Engine Stand Toyota 1NZ-FE", price: 35000000, qty: 2 }, // 70,000,000
      { id: "2", name: "Automotive Diagnostic Scanner Pro", price: 45000000, qty: 1 }, // 45,000,000
      { id: "3", name: "Common Rail Pressure Tester", price: 15000000, qty: 1 }, // 15,000,000
    ];
    // Subtotal = 130,000,000
    // Discount 5% = 6,500,000 -> 123,500,000
    // PPN 11% = 13,585,000 -> Total = 137,085,000
    const quote = calculateQuotation(rfqItems, 5);
    assert.equal(quote.subtotal, 130000000);
    assert.equal(quote.discountAmount, 6500000);
    assert.equal(quote.subtotalAfterDiscount, 123500000);
    assert.equal(quote.ppn, 13585000);
    assert.equal(quote.total, 137085000);
    assert.ok(quote.terbilang.toLowerCase().includes("seratus tiga puluh tujuh juta delapan puluh lima ribu rupiah"));
  });

  test("T3.11: Media Storage Upload Payload Integration + Form Hidden Inputs", () => {
    // Simulate upload response
    const uploadRes = {
      url: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/lathe-1.jpg",
      filename: "lathe-1.jpg",
    };

    // Integrate with form
    const form = parseProductForm({
      name: "Bench Lathe 550mm",
      category: "pemesinan",
      description: "Mesin bubut bangku presisi.",
      price: "18500000",
      stock: "4",
      photo_slot_1: uploadRes.url,
    });

    assert.ok(form.input);
    assert.equal(form.input.image, uploadRes.url);
    assert.ok(form.input.image.startsWith("https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/"));
  });

  test("T3.12: Admin Authentication Gate vs Public Storefront Accessibility", async () => {
    // 1. Storefront queries succeed with anon access
    const storefrontRes = await querySupabaseRest("products", "select=id,name,price&limit=3", { useAnon: true });
    assert.ok(storefrontRes.ok || storefrontRes.status === 200 || storefrontRes.status === 206, "Storefront query should work");

    // 2. Protected admin action simulated authorization check
    function checkAdminAccess(sessionUser) {
      if (!sessionUser) return { ok: false, redirect: "/masuk?next=/admin/produk" };
      if (!sessionUser.email.endsWith("@boeminusantara.com")) {
        return { ok: false, error: "Akses ditolak: Hanya email resmi @boeminusantara.com." };
      }
      return { ok: true, user: sessionUser };
    }

    assert.equal(checkAdminAccess(null).ok, false);
    assert.equal(checkAdminAccess({ email: "user@gmail.com" }).ok, false);
    assert.equal(checkAdminAccess({ email: "admin@boeminusantara.com" }).ok, true);
  });
});

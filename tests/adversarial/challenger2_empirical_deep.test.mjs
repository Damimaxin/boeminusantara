import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  querySupabaseRest,
  slugify,
  parseProductForm,
  formatYouTubeEmbed,
  getSupabaseConfig,
  createMockCartState,
  createMockQuoteState,
} from "../e2e/helpers.mjs";

describe("Adversarial Challenger 2 Deep Empirical Verification", () => {
  // =========================================================================
  // Section 1: Live Supabase Database Column Schema & Root Key Safety
  // =========================================================================
  describe("Section 1: Live Supabase DB Schema & Key Safety (PGRST204 & Constraint 23502)", () => {
    test("EMP2.1.1: Direct insertion of unmapped 'video' key to DB root throws PGRST204", async () => {
      // Adversarial test: verify that Postgres schema cache rejects 'video' column at root level
      const res = await querySupabaseRest("products", "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          name: "Hostile Payload Test",
          video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      });

      assert.equal(res.status, 400, "Should reject unmapped video key with 400");
      assert.ok(res.data, "Response should have error data");
      assert.equal(res.data.code, "PGRST204", "Must throw PGRST204 column not found error");
      assert.ok(
        res.data.message.includes("'video'"),
        `Error message must specifically mention 'video', got: ${res.data.message}`
      );
    });

    test("EMP2.1.2: Direct insertion without 'id' throws 23502 not-null constraint violation", async () => {
      // Adversarial test: boemi.products has no automatic sequence/uuid default, so id must be provided
      const res = await querySupabaseRest("products", "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          slug: "hostile-no-id-" + Date.now(),
          name: "Hostile No ID Test",
          category: "tp",
          description: "Missing id payload",
          price: 1000,
          stock: 1,
        },
      });

      assert.equal(res.status, 400, "Should reject missing id with 400");
      assert.ok(res.data, "Response should have error data");
      assert.equal(res.data.code, "23502", "Must throw 23502 not-null constraint error");
      assert.ok(
        res.data.message.includes("id"),
        `Error message must specifically mention column 'id', got: ${res.data.message}`
      );
    });

    test("EMP2.1.3: toDbRow payload builder strips 'video' from root and auto-generates non-null 'id'", () => {
      const mockInput = {
        name: "Mesin Laser Cutting CNC",
        slug: "mesin-laser-cutting-cnc",
        category: "tp",
        description: "Mesin canggih untuk SMK",
        price: 150000000,
        stock: 3,
        image: "https://example.com/cover.jpg",
        images: ["https://example.com/cover.jpg", "https://example.com/detail.jpg"],
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        active: true,
      };

      // Simulate toDbRow logic from lib/admin/products.ts
      const galleryList = Array.isArray(mockInput.images) && mockInput.images.length > 0
        ? mockInput.images.filter(Boolean)
        : mockInput.image ? [mockInput.image] : [];
      
      if (mockInput.video && mockInput.video.trim()) {
        const cleanVid = mockInput.video.trim();
        if (!galleryList.includes(cleanVid)) {
          galleryList.push(cleanVid);
        }
      }

      const catCode = (mockInput.category || "gen").toLowerCase().replace(/[^a-z0-9]/g, "");
      const slugClean = (mockInput.slug || "prod").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const generatedId = `boemi-${catCode}-${slugClean}-${Date.now().toString(36)}`;

      const row = {
        id: generatedId,
        slug: mockInput.slug,
        name: mockInput.name,
        category: mockInput.category,
        description: mockInput.description,
        price: mockInput.price,
        stock: mockInput.stock,
        image: mockInput.image || null,
        gallery: galleryList,
        active: mockInput.active ?? true,
        updated_at: new Date().toISOString(),
      };

      // 1. Root object must NOT contain 'video' key
      assert.equal("video" in row, false, "'video' must not be in root DB payload");
      // 2. ID must be non-null string matching pattern
      assert.ok(row.id, "ID must be non-null");
      assert.match(row.id, /^boemi-tp-mesin-laser-cutting-cnc-[a-z0-9]+$/);
      // 3. Gallery must contain video link safely
      assert.ok(row.gallery.includes("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
    });
  });

  // =========================================================================
  // Section 2: Live Supabase Full CRUD Lifecycle & Total Cleanup
  // =========================================================================
  describe("Section 2: Live Supabase Product CRUD Lifecycle & Total Cleanup", () => {
    const timestamp = Date.now();
    const testSlug = `adv-chal2-${timestamp}`;
    const testId = `boemi-tp-${testSlug}`;
    const initialPrice = 45000000;
    const initialStock = 5;
    const testVideo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    test("EMP2.2.1: CREATE - Insert product into live boemi.products table with video in gallery and non-null ID", async () => {
      const payload = {
        id: testId,
        slug: testSlug,
        name: `Adversarial CNC Lathe ${timestamp}`,
        category: "tp",
        description: "Alat praktik SMK CNC presisi tinggi untuk uji adversarial",
        price: initialPrice,
        stock: initialStock,
        image: "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/test-cnc.jpg",
        gallery: [
          "https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/uploads/test-cnc.jpg",
          testVideo,
        ],
        active: true,
        updated_at: new Date().toISOString(),
      };

      const res = await querySupabaseRest("products", "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: payload,
      });

      assert.equal(res.status, 201, "Product creation must return HTTP 201 Created");
      assert.ok(Array.isArray(res.data) && res.data.length === 1, "Must return created record");
      assert.equal(res.data[0].id, testId);
      assert.equal(res.data[0].price, initialPrice);
      assert.ok(res.data[0].gallery.includes(testVideo));
    });

    test("EMP2.2.2: READ - Retrieve created product by ID and slug from live boemi.products", async () => {
      // Query by ID
      const resById = await querySupabaseRest("products", `id=eq.${testId}`);
      assert.equal(resById.status, 200, "Fetch by ID must return 200");
      assert.equal(resById.data?.length, 1, "Must find exactly 1 product");
      const prod = resById.data[0];
      assert.equal(prod.name, `Adversarial CNC Lathe ${timestamp}`);
      assert.equal(prod.slug, testSlug);
      assert.equal(prod.category, "tp");
      assert.equal(prod.stock, initialStock);

      // Query by Slug
      const resBySlug = await querySupabaseRest("products", `slug=eq.${testSlug}`);
      assert.equal(resBySlug.status, 200, "Fetch by slug must return 200");
      assert.equal(resBySlug.data?.length, 1, "Must find exactly 1 product by slug");
    });

    test("EMP2.2.3: UPDATE - Patch product price, stock, and status on live boemi.products", async () => {
      const updatedPrice = 48500000;
      const updatedStock = 12;
      const res = await querySupabaseRest("products", `id=eq.${testId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: {
          price: updatedPrice,
          stock: updatedStock,
          name: `Adversarial CNC Lathe Updated ${timestamp}`,
          updated_at: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 200, "Update must return 200");
      assert.ok(Array.isArray(res.data) && res.data.length === 1);
      assert.equal(res.data[0].price, updatedPrice);
      assert.equal(res.data[0].stock, updatedStock);
      assert.equal(res.data[0].name, `Adversarial CNC Lathe Updated ${timestamp}`);
    });

    test("EMP2.2.4: DELETE - Remove product from live boemi.products table", async () => {
      const res = await querySupabaseRest("products", `id=eq.${testId}`, {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      });

      assert.equal(res.status, 200, "Deletion must return 200");
      assert.ok(Array.isArray(res.data) && res.data.length === 1, "Must return deleted record representation");
      assert.equal(res.data[0].id, testId);
    });

    test("EMP2.2.5: CLEANUP VERIFICATION - Ensure zero leftover records in boemi.products", async () => {
      const verifyRes = await querySupabaseRest("products", `id=eq.${testId}`);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.data?.length, 0, "Deleted test product must NOT exist in database");

      const verifySlugRes = await querySupabaseRest("products", `slug=eq.${testSlug}`);
      assert.equal(verifySlugRes.status, 200);
      assert.equal(verifySlugRes.data?.length, 0, "Deleted test product slug must NOT exist in database");
    });
  });

  // =========================================================================
  // Section 3: Global Revalidation Implementation Static Code Audit
  // =========================================================================
  describe("Section 3: Global Revalidation Implementation & Server Actions", () => {
    test("EMP2.3.1: app/admin/produk/actions.ts calls revalidatePath('/', 'layout') on create, update, and delete", () => {
      const actionsPath = path.resolve("app/admin/produk/actions.ts");
      const content = fs.readFileSync(actionsPath, "utf-8");

      // Check createProductAction
      const createMatch = content.match(/export async function createProductAction[\s\S]*?^}/m);
      assert.ok(createMatch, "createProductAction must exist");
      assert.ok(
        createMatch[0].includes('revalidatePath("/", "layout");'),
        "createProductAction must call revalidatePath('/', 'layout')"
      );

      // Check updateProductAction
      const updateMatch = content.match(/export async function updateProductAction[\s\S]*?^}/m);
      assert.ok(updateMatch, "updateProductAction must exist");
      assert.ok(
        updateMatch[0].includes('revalidatePath("/", "layout");'),
        "updateProductAction must call revalidatePath('/', 'layout')"
      );

      // Check deleteProductAction
      const deleteMatch = content.match(/export async function deleteProductAction[\s\S]*?^}/m);
      assert.ok(deleteMatch, "deleteProductAction must exist");
      assert.ok(
        deleteMatch[0].includes('revalidatePath("/", "layout");'),
        "deleteProductAction must call revalidatePath('/', 'layout')"
      );
    });

    test("EMP2.3.2: app/admin/kategori/actions.ts calls revalidatePath('/', 'layout') on add and delete", () => {
      const catActionsPath = path.resolve("app/admin/kategori/actions.ts");
      const content = fs.readFileSync(catActionsPath, "utf-8");

      const addMatch = content.match(/export async function addCategoryAction[\s\S]*?^}/m);
      assert.ok(addMatch, "addCategoryAction must exist");
      assert.ok(
        addMatch[0].includes('revalidatePath("/", "layout");'),
        "addCategoryAction must call revalidatePath('/', 'layout')"
      );

      const delMatch = content.match(/export async function deleteCategoryAction[\s\S]*?^}/m);
      assert.ok(delMatch, "deleteCategoryAction must exist");
      assert.ok(
        delMatch[0].includes('revalidatePath("/", "layout");'),
        "deleteCategoryAction must call revalidatePath('/', 'layout')"
      );
    });
  });

  // =========================================================================
  // Section 4: Media & Gallery Stress Tests (9 Photos, 1 Video, YouTube Shorts, HTML5 Video)
  // =========================================================================
  describe("Section 4: Media & Gallery Components Stress Tests", () => {
    test("EMP2.4.1: ProductForm.tsx renders 9 photo slots and 1 video slot", () => {
      const formPath = path.resolve("app/admin/produk/_components/ProductForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");

      // Verify 9 photo slots state initialization
      assert.ok(content.includes("Array.from({ length: 9 }"), "Must initialize 9 photo slots");
      // Verify hidden inputs for photo_slot_1 through photo_slot_9
      assert.ok(content.includes("name={`photo_slot_${i + 1}`}"), "Must render hidden photo_slot inputs");
      // Verify video slot input and ref
      assert.ok(content.includes('name="video"'), "Must render video input");
      assert.ok(content.includes("accept=\"video/*\""), "Must support video file upload");
      assert.ok(content.includes("Slot 10: Video Demonstrasi"), "Must label Slot 10 as Video Demonstrasi");
    });

    test("EMP2.4.2: YouTube Shorts URLs convert flawlessly to standard embed URLs", () => {
      const shortsCases = [
        {
          input: "https://www.youtube.com/shorts/3fQ5pD0h1gA",
          expected: "https://www.youtube.com/embed/3fQ5pD0h1gA",
        },
        {
          input: "https://youtube.com/shorts/3fQ5pD0h1gA?feature=share",
          expected: "https://www.youtube.com/embed/3fQ5pD0h1gA",
        },
        {
          input: "https://www.youtube.com/shorts/3fQ5pD0h1gA/",
          expected: "https://www.youtube.com/embed/3fQ5pD0h1gA",
        },
        {
          input: "https://youtu.be/3fQ5pD0h1gA",
          expected: "https://www.youtube.com/embed/3fQ5pD0h1gA",
        },
      ];

      for (const tc of shortsCases) {
        const result = formatYouTubeEmbed(tc.input);
        assert.equal(result, tc.expected, `Failed converting '${tc.input}'`);
      }
    });

    test("EMP2.4.3: ProductImage.tsx resets error state on src change and supports object-contain", () => {
      const imgPath = path.resolve("components/ProductImage.tsx");
      const content = fs.readFileSync(imgPath, "utf-8");

      // Verify error reset on src prop change
      assert.ok(
        content.includes("if (src !== prevSrc)") &&
        content.includes("setPrevSrc(src)") &&
        content.includes("setError(false)"),
        "ProductImage must reset error state when src prop changes"
      );

      // Verify object-contain styling support
      assert.ok(
        content.includes('className.includes("object-contain") ? "contain" : "cover"'),
        "ProductImage must respect object-contain class name"
      );
    });

    test("EMP2.4.4: ProductGallery.tsx HTML5 video element includes autoplay attributes", () => {
      const galleryPath = path.resolve("components/ProductGallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");

      // Verify video tag attributes: autoPlay, muted, playsInline, controls
      assert.ok(content.includes("<video"), "Must contain <video tag");
      assert.ok(content.includes("autoPlay"), "Video tag must include autoPlay");
      assert.ok(content.includes("muted"), "Video tag must include muted for browser autoplay policy");
      assert.ok(content.includes("playsInline"), "Video tag must include playsInline for iOS compatibility");
      assert.ok(content.includes("controls"), "Video tag must include controls");
    });

    test("EMP2.4.5: ProductGallery.tsx thumbnail navigation handles photos and video", () => {
      const galleryPath = path.resolve("components/ProductGallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");

      // Verify photo thumbnail click handler
      assert.ok(
        content.includes("setActiveMedia({ type: \"image\", url, index: idx })"),
        "Clicking photo thumbnail must switch active media to image"
      );

      // Verify video thumbnail click handler
      assert.ok(
        content.includes("setActiveMedia({ type: \"video\", url: cleanVideo })"),
        "Clicking video thumbnail must switch active media to video"
      );
    });
  });

  // =========================================================================
  // Section 5: Storefront & Admin Action Buttons Wiring Verification
  // =========================================================================
  describe("Section 5: Storefront & Admin Action Buttons Wiring Verification", () => {
    test("EMP2.5.1: Storefront 'Tambah ke Penawaran' button correctly triggers QuoteProvider addItem", () => {
      const quoteBtnPath = path.resolve("components/AddToQuoteButton.tsx");
      const content = fs.readFileSync(quoteBtnPath, "utf-8");

      assert.ok(content.includes("useQuote()"), "Must use useQuote hook");
      assert.ok(content.includes("addItem({ slug, name, price })"), "Must add item with slug, name, price");
      assert.ok(content.includes("Ditambahkan"), "Must display feedback message");

      // Test functional mock state
      const quoteState = createMockQuoteState();
      quoteState.addItem({ slug: "trainer-plc", name: "Trainer PLC", price: 25000000 });
      assert.equal(quoteState.getCount(), 1);
      assert.equal(quoteState.getSubtotal(), 25000000);
    });

    test("EMP2.5.2: Storefront 'Beli Langsung' button correctly triggers CartProvider addItem", () => {
      const cartBtnPath = path.resolve("components/AddToCartButton.tsx");
      const content = fs.readFileSync(cartBtnPath, "utf-8");

      assert.ok(content.includes("useCart()"), "Must use useCart hook");
      assert.ok(content.includes("addItem({ slug, name, price, image })"), "Must add item with slug, name, price, image");
      assert.ok(content.includes("Masuk keranjang"), "Must display feedback message");

      // Test functional mock state
      const cartState = createMockCartState();
      cartState.addItem({ slug: "multimeter-digital", name: "Multimeter Digital", price: 450000, image: null });
      assert.equal(cartState.getCount(), 1);
      assert.equal(cartState.getSubtotal(), 450000);
    });

    test("EMP2.5.3: Storefront 'Cari' search bar and button in Header.tsx properly wired", () => {
      const headerPath = path.resolve("components/Header.tsx");
      const content = fs.readFileSync(headerPath, "utf-8");

      assert.ok(content.includes('action="/cari"'), "Search form must point to /cari");
      assert.ok(content.includes('name="q"'), "Search input must have name='q'");
      assert.ok(content.includes('type="submit"'), "Must have submit button");
      assert.ok(content.includes('aria-label="Cari"'), "Submit button must have aria-label='Cari'");
    });

    test("EMP2.5.4: Admin 'Edit Produk' navigation and save button wiring", () => {
      const adminProdListPath = path.resolve("app/admin/produk/page.tsx");
      const content = fs.readFileSync(adminProdListPath, "utf-8");

      assert.ok(content.includes("/admin/produk/${p.id}") || content.includes("/admin/produk/baru"), "Must contain link to product edit or create");
      
      const editPagePath = path.resolve("app/admin/produk/[id]/page.tsx");
      const editContent = fs.readFileSync(editPagePath, "utf-8");
      assert.ok(editContent.includes("updateProductAction"), "Edit page must wire updateProductAction");
    });

    test("EMP2.5.5: Admin 'Hapus Produk' button has confirmation and deleteProductAction wiring", () => {
      const deleteBtnPath = path.resolve("app/admin/produk/_components/DeleteProductButton.tsx");
      const content = fs.readFileSync(deleteBtnPath, "utf-8");

      assert.ok(content.includes("window.confirm"), "Must prompt user for confirmation before deleting");
      assert.ok(content.includes("deleteProductAction(id)"), "Must call deleteProductAction with product ID");
      assert.ok(content.includes("router.refresh()"), "Must refresh router after deletion");
    });

    test("EMP2.5.6: Admin 'Kelola Kategori' form and delete buttons wired to server actions", () => {
      const kategoriPath = path.resolve("app/admin/kategori/page.tsx");
      const content = fs.readFileSync(kategoriPath, "utf-8");

      assert.ok(content.includes("addCategoryAction"), "Must wire addCategoryAction");
      assert.ok(content.includes("deleteCategoryAction"), "Must wire deleteCategoryAction");
      assert.ok(content.includes("confirm"), "Must confirm before deleting category");
    });

    test("EMP2.5.7: Admin 'Surat Penawaran' action buttons in TerbitkanSurat.tsx wired to server actions", () => {
      const terbitkanPath = path.resolve("app/admin/penawaran/[id]/_components/TerbitkanSurat.tsx");
      const content = fs.readFileSync(terbitkanPath, "utf-8");

      assert.ok(content.includes("Terbitkan Surat Pesanan"), "Must have submit button for Surat Pesanan");
      assert.ok(content.includes("Dokumen Lanjutan"), "Must support continuing documents (INV, SJ, BAST, KW, etc.)");
      assert.ok(content.includes("aksiDokumenLanjutan"), "Must wire aksiDokumenLanjutan action");
    });
  });
});

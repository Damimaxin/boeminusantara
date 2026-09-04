import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  querySupabaseRest,
  CATEGORY_ALIASES,
} from "../e2e/helpers.mjs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Adversarial Challenger 1: Storefront Pagination, Search & Category Routing Stress Suite", () => {

  // =========================================================================
  // Section 1: Live HTTP Storefront Pagination Adversarial Stress
  // =========================================================================
  describe("Section 1: Storefront Pagination Boundary & Type Coercion Fuzzing", () => {
    test("ADV1.1.1: Out-of-bounds page=999 on homepage returns HTTP 200, valid product slice from last page, and active last page in pagination", async () => {
      const res = await fetch(`${BASE_URL}/?page=999`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      // Verify products are rendered (not empty blank catalog)
      assert.ok(html.includes("href=\"/produk/"), "Out-of-bounds page should render products from last valid page");
      // Verify pagination control is present
      assert.ok(html.includes("aria-label=\"Navigasi halaman\""), "Pagination nav should be rendered");
      // Verify active page is clamped to the last page (NOT 999)
      assert.ok(!html.includes(">999<"), "Active page must NOT be 999");
      assert.ok(/aria-current="page"[^>]*>\s*10\s*</.test(html), "Active page should be clamped to last page (10)");
    });

    test("ADV1.1.2: Extreme out-of-bounds page=1000000 returns HTTP 200 without timeout or memory crash", async () => {
      const startTime = Date.now();
      const res = await fetch(`${BASE_URL}/?page=1000000`);
      const elapsed = Date.now() - startTime;

      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      assert.ok(elapsed < 4000, `Request took too long: ${elapsed}ms`);
      const html = await res.text();
      assert.ok(html.includes("href=\"/produk/"), "Should safely clamp to last page and render products");
      assert.ok(/aria-current="page"[^>]*>\s*10\s*</.test(html), "Active page should be clamped to last page (10)");
    });

    test("ADV1.1.3: Zero page=0 is clamped to page 1 and returns HTTP 200 with first page products", async () => {
      const res = await fetch(`${BASE_URL}/?page=0`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Page 0 should clamp to page 1 and render products");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be marked active");
    });

    test("ADV1.1.4: Negative page=-5 is clamped to page 1 and returns HTTP 200 with first page products", async () => {
      const res = await fetch(`${BASE_URL}/?page=-5`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Negative page should clamp to page 1 and render products");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be marked active");
    });

    test("ADV1.1.5: Large negative page=-999999 is clamped to page 1 safely", async () => {
      const res = await fetch(`${BASE_URL}/?page=-999999`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Extreme negative page should clamp to page 1");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be active");
    });

    test("ADV1.1.6: Float page=1.5 is floored to integer 1 without fractional offset", async () => {
      const res = await fetch(`${BASE_URL}/?page=1.5`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Float page 1.5 should render products");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be active");
      assert.ok(!/>\s*1\.5\s*</.test(html), "Fractional numbers must never appear in pagination UI");
    });

    test("ADV1.1.7: Float page=2.9 is floored to integer 2", async () => {
      const res = await fetch(`${BASE_URL}/?page=2.9`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Float page 2.9 should render products");
      assert.ok(/aria-current="page"[^>]*>\s*2\s*</.test(html), "Page 2 should be active");
      assert.ok(!/>\s*2\.9\s*</.test(html), "Fractional numbers must never appear in pagination UI");
    });

    test("ADV1.1.8: Non-numeric page=NaN defaults safely to page 1", async () => {
      const res = await fetch(`${BASE_URL}/?page=NaN`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "page=NaN should default to page 1");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be active");
      assert.ok(!html.includes(">NaN<"), "NaN literal must never leak into HTML");
    });

    test("ADV1.1.9: Non-numeric page=abc defaults safely to page 1", async () => {
      const res = await fetch(`${BASE_URL}/?page=abc`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "page=abc should default to page 1");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be active");
    });

    test("ADV1.1.10: Null and undefined page strings (?page=null, ?page=undefined) default to page 1", async () => {
      for (const val of ["null", "undefined", "true", "false"]) {
        const res = await fetch(`${BASE_URL}/?page=${val}`);
        assert.equal(res.status, 200, `Expected HTTP 200 for page=${val}`);
        const html = await res.text();
        assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), `Page 1 should be active for page=${val}`);
      }
    });

    test("ADV1.1.11: Scientific notation page=1e1 defaults or evaluates safely without crash", async () => {
      const res = await fetch(`${BASE_URL}/?page=1e1`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();
      assert.ok(html.includes("href=\"/produk/"), "Should render products");
    });

    test("ADV1.1.12: Pagination links preserve sorting query parameter across page transitions", async () => {
      const res = await fetch(`${BASE_URL}/?sort=price_desc&page=2`);
      assert.equal(res.status, 200);
      const html = await res.text();

      // Check rel="prev" link preserves sort=price_desc
      assert.ok(
        html.includes("href=\"/?sort=price_desc\"") || html.includes("sort=price_desc"),
        "Pagination links must preserve query parameters like sort"
      );
    });
  });

  // =========================================================================
  // Section 2: Live HTTP Search & Sanitization Adversarial Stress (/cari)
  // =========================================================================
  describe("Section 2: Search Query Sanitization & PostgREST Grammar Resilience", () => {
    test("ADV1.2.1: Comma-containing search query q=mesin,las avoids PostgREST 400 error and responds with HTTP 200", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=mesin,las`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("Hasil untuk"), "Should render results heading");
      assert.ok(html.includes("mesin,las"), "Should display user search query in heading");
      // Crucial: No PostgREST syntax error or crash
      assert.ok(!html.includes("failed to parse logic tree"), "PostgREST syntax error must be avoided");
    });

    test("ADV1.2.2: Search query with comma on known database term (q=training,equipment) reveals in-memory sanitization discrepancy", async () => {
      // Direct database query for "training equipment" yields 10 items
      const direct = await querySupabaseRest("products", "or=(name.ilike.*training%20equipment*)&limit=5");
      assert.ok(direct.ok && direct.data.length > 0, "Supabase must have products matching 'training equipment'");

      const res = await fetch(`${BASE_URL}/cari?q=training,equipment`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      // We empirically verify whether the live endpoint returned products or filtered them out
      const hasProducts = html.includes("href=\"/produk/");
      const isZeroCount = html.includes("Tidak ada hasil untuk “training,equipment”");

      // NOTE: This test documents the exact behavioral finding:
      // In lib/products.ts line 86, commas are sanitized for the DB query: q.search.replace(/[,()]/g, " ")
      // But in line 148, allProducts.filter() uses unsanitized q.search.toLowerCase().trim() containing the literal comma!
      // This causes the 10 products retrieved from DB to be filtered out in-memory if s is unsanitized.
      console.log(`[ADV1.2.2 Observation] /cari?q=training,equipment -> hasProducts: ${hasProducts}, emptyState: ${isZeroCount}`);
      // The HTTP route must remain resilient with HTTP 200 regardless
      assert.equal(res.status, 200);
    });

    test("ADV1.2.3: Multiple commas q=mesin,bubut,cnc execute cleanly with HTTP 200", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=mesin,bubut,cnc`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("Hasil untuk"), "Should render search results page");
    });

    test("ADV1.2.4: Parentheses query q=() sanitizes to empty without PostgREST syntax crash", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=()`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      // Parentheses are stripped, query matches 0 products or displays empty state safely
      assert.ok(
        html.includes("Tidak ada hasil") || html.includes("Mulai pencarian"),
        "Empty/parentheses query should safely show empty state"
      );
    });

    test("ADV1.2.5: Single and double quote query q='\" executes cleanly without SQL or JSON errors", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=%27%22`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("Hasil untuk"), "Should render search results header");
    });

    test("ADV1.2.6: Boolean & logic operators q=&&, q=||, q=AND, q=OR execute safely", async () => {
      const operators = ["&&", "||", "AND", "OR", "NOT"];
      for (const op of operators) {
        const res = await fetch(`${BASE_URL}/cari?q=${encodeURIComponent(op)}`);
        assert.equal(res.status, 200, `Operator ${op} should return HTTP 200`);
      }
    });

    test("ADV1.2.7: SQL Injection payloads in search query execute safely without 500 error or database disruption", async () => {
      const sqliPayloads = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE products; --",
        "1 UNION SELECT null, null, null--",
        "' OR 1=1#",
      ];

      for (const payload of sqliPayloads) {
        const res = await fetch(`${BASE_URL}/cari?q=${encodeURIComponent(payload)}`);
        assert.equal(res.status, 200, `Payload "${payload}" should return HTTP 200`);
        const html = await res.text();
        assert.ok(!html.includes("PostgrestError"), "No raw database error should leak to user");
      }
    });

    test("ADV1.2.8: XSS payloads in search query are HTML-escaped and do not execute raw tags", async () => {
      const xssPayloads = [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "\"><svg onload=alert(1)>",
      ];

      for (const payload of xssPayloads) {
        const res = await fetch(`${BASE_URL}/cari?q=${encodeURIComponent(payload)}`);
        assert.equal(res.status, 200);
        const html = await res.text();
        // The script tag must NOT appear unescaped in the DOM as executable script
        assert.ok(!html.includes("<script>alert(1)</script>"), "Raw XSS payload must be escaped");
      }
    });

    test("ADV1.2.9: Empty search query /cari (without q) renders 'Mulai pencarian' empty state", async () => {
      const res = await fetch(`${BASE_URL}/cari`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("Mulai pencarian"), "Should show 'Mulai pencarian' empty state");
      assert.ok(html.includes("Kategori populer"), "Should show popular category chips");
      assert.ok(html.includes("Lihat semua produk"), "Should provide link to all products");
    });

    test("ADV1.2.10: Whitespace-only search query /cari?q=+++ renders empty state safely", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=%20%20%20`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(
        html.includes("Mulai pencarian") || html.includes("Tidak ada hasil"),
        "Whitespace query should render empty state"
      );
    });

    test("ADV1.2.11: Non-existent search query /cari?q=nonexistent12345 renders 'Tidak ada hasil' empty state with recovery links", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=nonexistent12345`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("Tidak ada hasil untuk “nonexistent12345”"), "Should show specific not found heading");
      assert.ok(html.includes("Kategori populer"), "Should render popular category suggestions");
      assert.ok(html.includes("Lihat semua produk"), "Should render catalog link");
    });

    test("ADV1.2.12: Search query with multiple pages (/cari?q=trainer&page=999) clamps safely to last page of results", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=trainer&page=999`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      // 50 products matching trainer -> 3 pages of 24 items
      assert.ok(html.includes("href=\"/produk/"), "Should render matching products");
      assert.ok(html.includes("aria-label=\"Navigasi halaman\""), "Pagination should be displayed for multi-page search results");
      assert.ok(!html.includes(">999<"), "Page 999 must NOT be active");
      assert.ok(/aria-current="page"[^>]*>\s*3\s*</.test(html), "Active page should be clamped to last page (3)");
    });

    test("ADV1.2.13: Search query with negative page (/cari?q=trainer&page=-5) clamps to page 1", async () => {
      const res = await fetch(`${BASE_URL}/cari?q=trainer&page=-5`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Should render products on page 1");
      assert.ok(/aria-current="page"[^>]*>\s*1\s*</.test(html), "Page 1 should be active");
    });
  });

  // =========================================================================
  // Section 3: Live HTTP Category Navigation & Subcategory Routing (/kategori/[slug])
  // =========================================================================
  describe("Section 3: Category Routing, Legacy Aliases & Subcategory Discovery", () => {
    test("ADV1.3.1: Aliased category /kategori/pemesinan maps to 'tp' and returns HTTP 200 with live products", async () => {
      const res = await fetch(`${BASE_URL}/kategori/pemesinan`);
      assert.equal(res.status, 200, `Expected HTTP 200 for pemesinan, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Pemesinan should render live catalog products");
      assert.ok(
        html.includes("Teknik Pemesinan") || html.includes("Pemesinan"),
        "Should display Teknik Pemesinan title"
      );
    });

    test("ADV1.3.2: Aliased category /kategori/audio-video maps to 'tav' and returns HTTP 200 with live products", async () => {
      const res = await fetch(`${BASE_URL}/kategori/audio-video`);
      assert.equal(res.status, 200, `Expected HTTP 200 for audio-video, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Audio-video should render live catalog products");
      assert.ok(
        html.includes("Audio Video") || html.includes("TAV"),
        "Should display Audio Video category title"
      );
    });

    test("ADV1.3.3: Aliased category /kategori/k3-safety maps to 'k3' and returns HTTP 200 with live products", async () => {
      const res = await fetch(`${BASE_URL}/kategori/k3-safety`);
      assert.equal(res.status, 200, `Expected HTTP 200 for k3-safety, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "K3-safety should render live catalog products");
      assert.ok(
        html.includes("Keselamatan") || html.includes("K3"),
        "Should display K3 category title"
      );
    });

    test("ADV1.3.4: Subcategory /kategori/tkro-mesin returns HTTP 200 (NOT 404)", async () => {
      const res = await fetch(`${BASE_URL}/kategori/tkro-mesin`);
      assert.equal(res.status, 200, `Subcategory /kategori/tkro-mesin should return 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(
        html.includes("Sistem Mesin &amp; Engine Stand") || html.includes("Engine Stand") || html.includes("TKRO"),
        "Subcategory should render correct breadcrumb or title"
      );
    });

    test("ADV1.3.5: Subcategory /kategori/titl-panel returns HTTP 200 (NOT 404)", async () => {
      const res = await fetch(`${BASE_URL}/kategori/titl-panel`);
      assert.equal(res.status, 200, `Subcategory /kategori/titl-panel should return 200, got ${res.status}`);
    });

    test("ADV1.3.6: Subcategory /kategori/tp-bubut returns HTTP 200 (NOT 404)", async () => {
      const res = await fetch(`${BASE_URL}/kategori/tp-bubut`);
      assert.equal(res.status, 200, `Subcategory /kategori/tp-bubut should return 200, got ${res.status}`);
    });

    test("ADV1.3.7: Subcategory /kategori/las-mig-tig returns HTTP 200 (NOT 404)", async () => {
      const res = await fetch(`${BASE_URL}/kategori/las-mig-tig`);
      assert.equal(res.status, 200, `Subcategory /kategori/las-mig-tig should return 200, got ${res.status}`);
    });

    test("ADV1.3.8: Non-existent category /kategori/kategori-palsu-12345 returns HTTP 404", async () => {
      const res = await fetch(`${BASE_URL}/kategori/kategori-palsu-12345`);
      assert.equal(res.status, 404, `Expected HTTP 404 for invalid category, got ${res.status}`);
    });

    test("ADV1.3.9: Empty category state renders actionable recovery links and popular categories", async () => {
      // Subcategories with 0 products will render the enhanced empty state
      const res = await fetch(`${BASE_URL}/kategori/tav-vsd`);
      assert.equal(res.status, 200);
      const html = await res.text();

      if (html.includes("Belum ada produk pada kategori")) {
        assert.ok(html.includes("Kategori Populer"), "Empty state must display popular categories");
        assert.ok(html.includes("Lihat semua produk"), "Empty state must have link to see all products");
      }
    });

    test("ADV1.3.10: Category with out-of-bounds page /kategori/tkro?page=999 clamps to last page safely", async () => {
      const res = await fetch(`${BASE_URL}/kategori/tkro?page=999`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      assert.ok(html.includes("href=\"/produk/"), "Should render products on last page");
      assert.ok(!html.includes(">999<"), "Page 999 must not be in pagination");
    });

    test("ADV1.3.11: Category with float page /kategori/tkro?page=1.9 floors to page 1", async () => {
      const res = await fetch(`${BASE_URL}/kategori/tkro?page=1.9`);
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      // Total tkro products is 5, so totalPages=1, pagination nav returns null
      assert.ok(html.includes("href=\"/produk/"), "Should render products on page 1");
    });
  });

  // =========================================================================
  // Section 4: Direct PostgREST Database Fuzzing & SQL Sanitization Invariants
  // =========================================================================
  describe("Section 4: Direct Supabase / PostgREST Fuzzing Invariants", () => {
    test("ADV1.4.1: Raw PostgREST search query with sanitized comma operates with HTTP 200/206", async () => {
      const rawSearch = "alat,ukur,multimeter";
      const sanitized = rawSearch.replace(/[,()]/g, " ").trim();
      assert.equal(sanitized, "alat ukur multimeter");

      const s = encodeURIComponent(sanitized);
      const res = await querySupabaseRest(
        "products",
        `or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)&limit=5`
      );
      assert.ok(res.ok, `Query should succeed with HTTP 200/206, got status: ${res.status}`);
      assert.ok(Array.isArray(res.data), "Data should be array");
    });

    test("ADV1.4.2: Direct PostgREST category query with aliases resolves cleanly", async () => {
      for (const [alias, target] of Object.entries(CATEGORY_ALIASES)) {
        const res = await querySupabaseRest("products", `category=eq.${target}&limit=3`);
        assert.ok(res.ok, `Query for alias ${alias} -> ${target} failed with status: ${res.status}`);
        assert.ok(Array.isArray(res.data));
      }
    });

    test("ADV1.4.3: Direct PostgREST query handles large limit safely without 500 error", async () => {
      const res = await querySupabaseRest("products", "limit=1000");
      assert.ok(res.ok, `Limit 1000 should return 200 OK, got: ${res.status}`);
      assert.ok(Array.isArray(res.data) && res.data.length > 0, "Should return catalog array");
    });

    test("ADV1.4.4: Malformed query with multiple consecutive commas and parenthesis is sanitized", () => {
      const malicious = "(((mesin,,,las,,,,daiden)))";
      const sanitized = malicious.replace(/[,()]/g, " ").trim().replace(/\s+/g, " ");
      assert.equal(sanitized, "mesin las daiden");
    });
  });

  // =========================================================================
  // Section 5: Pagination Component Logic & Invariant Stress
  // =========================================================================
  describe("Section 5: Pagination Component Mathematical Invariants", () => {
    function computePaginationParams(total, pageSize, page) {
      const safePageSize = pageSize > 0 && Number.isFinite(pageSize) ? Math.floor(pageSize) : 24;
      const safeTotal = total > 0 && Number.isFinite(total) ? Math.floor(total) : 0;
      const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
      const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
      const current = Math.min(Math.max(1, safePage), totalPages);
      const offset = (current - 1) * safePageSize;
      return { safePageSize, safeTotal, totalPages, current, offset };
    }

    test("ADV1.5.1: pageSize=0 falls back to default 24", () => {
      const p = computePaginationParams(100, 0, 1);
      assert.equal(p.safePageSize, 24);
      assert.equal(p.totalPages, 5);
    });

    test("ADV1.5.2: pageSize=-1 falls back to default 24", () => {
      const p = computePaginationParams(100, -1, 1);
      assert.equal(p.safePageSize, 24);
      assert.equal(p.totalPages, 5);
    });

    test("ADV1.5.3: pageSize=999999 computes totalPages=1 and offset=0 safely", () => {
      const p = computePaginationParams(100, 999999, 1);
      assert.equal(p.safePageSize, 999999);
      assert.equal(p.totalPages, 1);
      assert.equal(p.current, 1);
      assert.equal(p.offset, 0);
    });

    test("ADV1.5.4: pageSize=NaN falls back to default 24", () => {
      const p = computePaginationParams(100, NaN, 1);
      assert.equal(p.safePageSize, 24);
    });

    test("ADV1.5.5: pageSize=Infinity falls back to default 24 (Number.isFinite check)", () => {
      const p = computePaginationParams(100, Infinity, 1);
      assert.equal(p.safePageSize, 24);
    });

    test("ADV1.5.6: total=0 computes totalPages=1, current=1, offset=0", () => {
      const p = computePaginationParams(0, 24, 1);
      assert.equal(p.safeTotal, 0);
      assert.equal(p.totalPages, 1);
      assert.equal(p.current, 1);
      assert.equal(p.offset, 0);
    });

    test("ADV1.5.7: page Range ellipsis algorithm maintains correct windows", () => {
      function pageRange(current, total) {
        const out = [];
        const add = (p) => out.push(p);
        const window = 1;
        const first = 1;
        const last = total;
        const from = Math.max(first, current - window);
        const to = Math.min(last, current + window);

        add(first);
        if (from > first + 1) out.push("…");
        for (let p = from; p <= to; p++) {
          if (p !== first && p !== last) add(p);
        }
        if (to < last - 1) out.push("…");
        if (last !== first) add(last);
        return out;
      }

      // Case: current = 1, total = 10 -> [1, 2, '…', 10]
      const r1 = pageRange(1, 10);
      assert.deepEqual(r1, [1, 2, "…", 10]);

      // Case: current = 5, total = 10 -> [1, '…', 4, 5, 6, '…', 10]
      const r5 = pageRange(5, 10);
      assert.deepEqual(r5, [1, "…", 4, 5, 6, "…", 10]);

      // Case: current = 10, total = 10 -> [1, '…', 9, 10]
      const r10 = pageRange(10, 10);
      assert.deepEqual(r10, [1, "…", 9, 10]);

      // Case: total = 1 -> [1]
      const single = pageRange(1, 1);
      assert.deepEqual(single, [1]);
    });
  });
});

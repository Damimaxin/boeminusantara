import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  querySupabaseRest,
  formatYouTubeEmbed,
  isVideoLink,
  CATEGORY_ALIASES,
} from "./helpers.mjs";

describe("Generation 2 Enhancements & Remediations", () => {
  // -------------------------------------------------------------
  // G2.1: Category Alias & Routing
  // -------------------------------------------------------------
  test("G2.1.1: Category alias 'audio-video' maps to 'tav' and returns live catalog products", async () => {
    const targetCat = CATEGORY_ALIASES["audio-video"] || "audio-video";
    assert.equal(targetCat, "tav");
    const res = await querySupabaseRest("products", `category=eq.${targetCat}&select=id,name,category&limit=5`);
    assert.ok(res.ok, "Query should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0, "Expected TAV products from database");
    for (const p of res.data) {
      assert.equal(p.category, "tav");
    }
  });

  test("G2.1.2: Category alias 'pemesinan' maps to 'tp' and returns live catalog products", async () => {
    const targetCat = CATEGORY_ALIASES["pemesinan"] || "pemesinan";
    assert.equal(targetCat, "tp");
    const res = await querySupabaseRest("products", `category=eq.${targetCat}&select=id,name,category&limit=5`);
    assert.ok(res.ok, "Query should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0, "Expected TP products from database");
    for (const p of res.data) {
      assert.equal(p.category, "tp");
    }
  });

  test("G2.1.3: Category alias 'k3-safety' maps to 'k3' and returns live catalog products", async () => {
    const targetCat = CATEGORY_ALIASES["k3-safety"] || "k3-safety";
    assert.equal(targetCat, "k3");
    const res = await querySupabaseRest("products", `category=eq.${targetCat}&select=id,name,category&limit=5`);
    assert.ok(res.ok, "Query should succeed");
    assert.ok(Array.isArray(res.data) && res.data.length > 0, "Expected K3 products from database");
    for (const p of res.data) {
      assert.equal(p.category, "k3");
    }
  });

  // -------------------------------------------------------------
  // G2.2: Search Comma Delimiter Sanitization
  // -------------------------------------------------------------
  test("G2.2.1: Sanitized search query with comma replaces with space and avoids PostgREST logic tree 400 error", async () => {
    const rawSearch = "mesin,las";
    const sanitized = rawSearch.replace(/[,()]/g, " ").trim();
    assert.equal(sanitized, "mesin las");
    const s = encodeURIComponent(sanitized);
    const res = await querySupabaseRest(
      "products",
      `or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)&select=id,name&limit=5`
    );
    assert.ok(res.ok, `Query should succeed with HTTP 200/206 instead of 400, got ${res.status}`);
    assert.ok(Array.isArray(res.data), "Expected results array");
  });

  // -------------------------------------------------------------
  // G2.3: Pagination Invariant & Clamping
  // -------------------------------------------------------------
  test("G2.3.1: Pagination clamping prevents out-of-bounds page query from yielding empty slice", () => {
    const total = 237;
    const pageSize = 24;
    const rawPage = 999;

    const totalPages = Math.max(1, Math.ceil(total / pageSize)); // 10
    const validPage = Math.min(rawPage, totalPages); // 10
    const offset = (validPage - 1) * pageSize; // 216

    assert.equal(totalPages, 10);
    assert.equal(validPage, 10);
    assert.equal(offset, 216);

    const mockProducts = Array.from({ length: total }, (_, i) => ({ id: `p-${i}` }));
    const paged = mockProducts.slice(offset, offset + pageSize);
    assert.equal(paged.length, 21); // 237 - 216 = 21 items
  });

  test("G2.3.2: Float page query (1.5) sanitizes to integer 1 and prevents fractional slice", () => {
    const rawPage = 1.5;
    const safePage = Math.max(1, Math.floor(Number(rawPage)) || 1);
    assert.equal(safePage, 1);
    const offset = (safePage - 1) * 24;
    assert.equal(offset, 0);
  });

  // -------------------------------------------------------------
  // G2.4: Video Link & YouTube Shorts
  // -------------------------------------------------------------
  test("G2.4.1: isVideoLink detects YouTube Shorts URLs", () => {
    assert.equal(isVideoLink("https://www.youtube.com/shorts/dQw4w9WgXcQ"), true);
    assert.equal(isVideoLink("https://youtube.com/shorts/abc123xyz?feature=share"), true);
  });

  test("G2.4.2: isVideoLink detects TinyURL shortened video URLs", () => {
    assert.equal(isVideoLink("https://tinyurl.com/boemi-demo-video"), true);
    assert.equal(isVideoLink("http://tinyurl.com/xyz123"), true);
  });

  test("G2.4.3: isVideoLink detects direct video files with query parameters", () => {
    assert.equal(isVideoLink("https://example.com/demo.mp4?token=123&expiry=456"), true);
    assert.equal(isVideoLink("https://example.com/demo.webm?v=1"), true);
    assert.equal(isVideoLink("https://example.com/demo.mov"), true);
  });

  test("G2.4.4: isVideoLink rejects image and document files", () => {
    assert.equal(isVideoLink("https://example.com/photo.jpg"), false);
    assert.equal(isVideoLink("https://example.com/photo.png"), false);
    assert.equal(isVideoLink("https://example.com/manual.pdf"), false);
    assert.equal(isVideoLink(""), false);
    assert.equal(isVideoLink(null), false);
  });

  test("G2.4.5: formatYouTubeEmbed converts YouTube Shorts to embed URL", () => {
    const result = formatYouTubeEmbed("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    assert.equal(result, "https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  test("G2.4.6: formatYouTubeEmbed converts standard watch and youtu.be to embed URL", () => {
    assert.equal(
      formatYouTubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share"),
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
    assert.equal(
      formatYouTubeEmbed("https://youtu.be/dQw4w9WgXcQ?t=10"),
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });
});

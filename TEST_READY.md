# TEST READY — Boemi Nusantara E2E Test Suite

## Executive Summary
- **Status**: ✅ **TEST SUITE FULLY OPERATIONAL (100% PASS RATE)**
- **Total Tests Executed**: 77 / 77 Passed
- **Pass Rate**: 100.0%
- **Execution Duration**: ~7.1 seconds
- **Test Runner Command**: `node scripts/run_e2e_tests.mjs`

---

## 4-Tier Test Architecture & Coverage Matrix

| Tier | File Path | Scope & Methodology | Min Req | Executed | Passed | Failed | Status |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Tier 1** | `tests/e2e/tier1_features.test.mjs` | Feature Verification (R1 Live Catalog Sync, R2 Admin & Storefront Buttons, R3 Media CDN & Schema boemi) | 27 | **29** | 29 | 0 | ✅ PASS |
| **Tier 2** | `tests/e2e/tier2_boundaries.test.mjs` | Boundary Value Analysis, Limits, Clamping, Zero/Extreme Values, Corrupted Inputs & Sanitization | 27 | **31** | 31 | 0 | ✅ PASS |
| **Tier 3** | `tests/e2e/tier3_combinations.test.mjs` | Pairwise Cross-Feature Interactions, Dual Cart/Quote States, Media Switcher, Category Lifecycle | 10 | **12** | 12 | 0 | ✅ PASS |
| **Tier 4** | `tests/e2e/tier4_scenarios.test.mjs` | Realistic Full-Stack Application Scenarios (Machinery Lifecycle, RFQ Quoting, Direct Buy, Draft Archiving, Media Fallback) | 5 | **5** | 5 | 0 | ✅ PASS |
| **Total** | | **Complete End-to-End Suite** | **69** | **77** | **77** | **0** | ✅ **100%** |

---

## Test Inventory by Tier

### Tier 1: Feature Verification (`tests/e2e/tier1_features.test.mjs`)
- `T1.1.1`: Live REST query to `/rest/v1/products` returns HTTP 200/206 with `boemi` schema.
- `T1.1.2`: Catalog query supports category filtering (e.g. `tkro`).
- `T1.1.3`: Catalog query supports keyword search with `ilike` across fields.
- `T1.1.4`: Catalog sorting by `price_asc` returns items in ascending price order.
- `T1.1.5`: Catalog sorting by `price_desc` returns items in descending price order.
- `T1.1.6`: Catalog sorting by `name` returns items in alphabetical order.
- `T1.1.7`: Catalog pagination with `limit` and `offset` computes correct partitions.
- `T1.1.8`: Product strict deduplication by normalized name avoids duplicated catalog entries.
- `T1.1.9`: Single product lookup by `slug` returns comprehensive product with gallery.
- `T1.2.1`: Admin Action - Tambah Produk: rejects empty name with specific error message.
- `T1.2.2`: Admin Action - Tambah Produk: rejects empty category with specific error message.
- `T1.2.3`: Admin Action - Tambah Produk: rejects empty description with specific error message.
- `T1.2.4`: Admin Action - Tambah Produk: rejects missing Slot 1 main photo.
- `T1.2.5`: Admin Action - Tambah Produk: rejects negative price or invalid numeric.
- `T1.2.6`: Admin Action - Tambah Produk: rejects non-integer stock.
- `T1.2.7`: Admin Action - Simpan Perubahan: formats structured metadata header into description.
- `T1.2.8`: Admin Action - Kelola Kategori: auto-slugifies name and formats slug.
- `T1.2.9`: Admin Action - Publish/Draft Toggle: toggles active boolean correctly.
- `T1.2.10`: Admin Action - Surat Penawaran: computes quotation breakdown accurately.
- `T1.3.1`: 9 Photo Slots structure: Slot 1 maps to image, Slots 2-9 map to images array.
- `T1.3.2`: 1 Video Slot structure: maps to `product.video`.
- `T1.3.3`: YouTube URL parser converts `watch?v=` format to embed URL.
- `T1.3.4`: YouTube URL parser converts `youtu.be` short format to embed URL.
- `T1.3.5`: Supabase Storage public CDN URL pattern conforms to specification.
- `T1.3.6`: ProductImage fallback logic detects invalid / empty sources.
- `T1.3.7`: Schema `boemi` database isolation: `categories` table responds without schema cache error.
- `T1.3.8`: Schema `boemi` database isolation: `company_profile` table responds with valid vendor record.
- `T1.3.9`: Storefront Button - Tambah ke Penawaran (`useQuote`) adds items and increments count & subtotal.
- `T1.3.10`: Storefront Button - Beli Langsung (`useCart`) adds item and updates cart state.

### Tier 2: Boundary Value Analysis & Edge Cases (`tests/e2e/tier2_boundaries.test.mjs`)
- `T2.1.1`: Zero price (Rp 0) is accepted as valid integer.
- `T2.1.2`: Extreme large price (Rp 100,000,000,000 / 100 Miliar) formats without overflow.
- `T2.1.3`: Negative price is rejected with field error.
- `T2.1.4`: Float / decimal price is rounded to nearest integer.
- `T2.1.5`: Non-numeric string price (e.g. 'GRATIS', 'abc') is rejected.
- `T2.2.1`: Zero stock (0) is accepted as valid integer and indicates out of stock.
- `T2.2.2`: Stock at exactly low-stock threshold (10 units) flags low-stock.
- `T2.2.3`: Stock above low-stock threshold (11 units) is normal stock.
- `T2.2.4`: Stock of 1 unit flags low-stock alert.
- `T2.2.5`: Negative stock value is rejected.
- `T2.2.6`: Decimal stock value (e.g. 2.5) is rejected.
- `T2.3.1`: Cart `addItem` with quantity 0 or negative defaults to minimum 1.
- `T2.3.2`: Cart item quantity reaches upper boundary `MAX_QTY` (999).
- `T2.3.3`: Exceeding upper boundary (>999, e.g. 1500) is clamped to 999.
- `T2.3.4`: Setting Cart quantity to 0 or negative via `setQty` resets to 1.
- `T2.3.5`: Corrupted `localStorage` JSON string in Cart gracefully returns empty list.
- `T2.3.6`: Corrupted `localStorage` JSON string in Quote gracefully returns empty list.
- `T2.4.1`: Slugification handles uppercase, special characters, and consecutive spaces.
- `T2.4.2`: Slugification with leading and trailing dashes / spaces produces clean trimmed slug.
- `T2.4.3`: Extremely long title (300+ characters) is sanitized without error.
- `T2.4.4`: Category slugification with punctuation and symbols.
- `T2.5.1`: Empty search query returns all products without exception.
- `T2.5.2`: Whitespace-only search query (`'   '`) trims cleanly and returns full list.
- `T2.5.3`: Search query with SQL / Regex special characters (`%_'\"\\*?`) executes safely.
- `T2.5.4`: Search query with non-matching string returns empty array with total 0.
- `T2.5.5`: Single-character search query executes without syntax errors.
- `T2.6.1`: Exactly 1 photo in Slot 1 and 8 empty slots parses correctly.
- `T2.6.2`: All 9 photo slots filled with valid URLs creates array of 9 images.
- `T2.6.3`: Non-contiguous photo slots (Slot 1 and Slot 5 filled, others empty) filters out empty slots.
- `T2.6.4`: Empty video slot (`''`) parses to `video: null`.
- `T2.6.5`: PPN 11% calculation on odd subtotal (Rp 1,333,333) rounds correctly to Rp 146,667.

### Tier 3: Pairwise & Cross-Feature Combinations (`tests/e2e/tier3_combinations.test.mjs`)
- `T3.1`: Category Filter (`tkro`) + Search (`engine`) + Sort (`price_asc`).
- `T3.2`: Category Filter (`pemesinan`) + Search (`mesin`) + Sort (`price_desc`).
- `T3.3`: Draft Status vs Storefront vs Admin Query Visibility.
- `T3.4`: Multi-Slot Media (9 Photos + 1 Video) + `ProductGallery` Switcher State.
- `T3.5`: Dual State Coexistence: `useQuote` and `useCart` Operate Independently.
- `T3.6`: Category Management + Product Form Validation Integration.
- `T3.7`: High-Value Vocational Machinery (RFQ) vs Retail Tool (Direct Buy) + PPN.
- `T3.8`: Low Stock Threshold + Multi-Quantity Cart Add + Out-of-Stock Status Transition.
- `T3.9`: Category Deletion + Orphaned Product Slug Fallback Formatting.
- `T3.10`: Multi-Item RFQ Submission -> 5% Discount -> 11% PPN -> Surat Penawaran Snapshot.
- `T3.11`: Media Storage Upload Payload Integration + Form Hidden Inputs.
- `T3.12`: Admin Authentication Gate vs Public Storefront Accessibility.

### Tier 4: Realistic Full-Stack Application Scenarios (`tests/e2e/tier4_scenarios.test.mjs`)
- `T4.1`: **Scenario 1 - End-to-End Product Lifecycle**: Admin creates heavy CNC Machine (4-Axis VMC-850) with 9 photos + 1 video -> verifies instant sync on `/` and `/kategori/pemesinan` -> updates price & stock -> verifies instant reflection on `/produk/[slug]`.
- `T4.2`: **Scenario 2 - School RFQ & Official Quotation**: SMK Negeri 1 Jakarta requests 3 vocational units (Engine Stand, CNC Trainer, PLC Kit) -> Admin applies 5% grant discount -> applies 11% PPN -> issues official Surat Penawaran `042/SP/BN-DIR/IX/2026` with terbilang Rupiah wording.
- `T4.3`: **Scenario 3 - Instant Retail Purchase Flow**: User searches "Mesin Las Daiden", filters < Rp 5M, clicks "Beli Langsung", updates quantity to 3 units in Cart, verifies 11% PPN and checkout payload readiness.
- `T4.4`: **Scenario 4 - Product Archiving & Catalog Access Control**: Discontinued item toggled to Draft (`active: false`) -> verified immediate removal from storefront catalog -> verified availability in Admin audit view.
- `T4.5`: **Scenario 5 - Media CDN, YouTube Video & Fallback Resilience**: Product with partial photo slots (Slots 1, 3, 5) and YouTube video loads correctly in `ProductGallery`, converts YouTube watch link to embed format, and missing/broken image sources trigger branded SVG fallback.

---

## How to Execute the Test Suite

```bash
# Run all 4 tiers with automated summary report
node scripts/run_e2e_tests.mjs

# Or run individual tier test files directly:
node tests/e2e/tier1_features.test.mjs
node tests/e2e/tier2_boundaries.test.mjs
node tests/e2e/tier3_combinations.test.mjs
node tests/e2e/tier4_scenarios.test.mjs
```

---

## Escalation / Implementation Note
- During initial inspection, `npx tsc --noEmit` flagged a TypeScript generic type error in `lib/supabase.ts` line 16/19 (`SupabaseClient<any, any, "boemi">` vs `SupabaseClient<any, "public">`). This has been escalated to M3 worker for type resolution.

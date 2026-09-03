# E2E Test Infra: Boemi Nusantara System Audit & Synchronization

## Test Philosophy
- Opaque-box, requirement-driven testing directly exercising HTTP endpoints, Server Actions, React Context logic, Supabase Database queries, and component exports.
- Multi-tier coverage following Category-Partition, Boundary Value Analysis, Pairwise Combinations, and Real-World Workloads.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Catalog Revalidation & Live Updates (R1) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Admin Buttons & Wiring (R2) | ORIGINAL_REQUEST §R2 | 6 | 6 | ✓ |
| 3 | Storefront Buttons & Wiring (R2) | ORIGINAL_REQUEST §R2 | 6 | 6 | ✓ |
| 4 | Media Slots & Supabase Storage CDN (R3) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 5 | Schema Cache & Client Consistency (R3) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: Node.js / Jest / TypeScript automated runner (`node scripts/run_e2e_tests.mjs` or `npm test`)
- Pass/Fail Semantics: Exit code 0 on 100% pass, non-zero on failure.
- Directory Layout: `tests/e2e/` (tier1_features.test.ts, tier2_boundaries.test.ts, tier3_combinations.test.ts, tier4_scenarios.test.ts)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | End-to-End Product Lifecycle: Admin creates CNC lathe machine with 9 photos + 1 video -> verifies instant appearance on `/` and `/kategori/tpm` -> edits price & stock -> verifies immediate sync on `/produk/[slug]` | F1, F2, F4, F5 | High |
| 2 | School RFQ & Quotation Generation: Storefront user adds 3 vocational training units to quote -> submits RFQ -> Admin opens `/admin/penawaran/[id]` -> applies 5% discount + 11% PPN -> issues official Surat Penawaran -> verifies printable A4 sheet | F1, F2, F3, F5 | High |
| 3 | Instant Retail Purchase Flow: User searches "mesin" -> filters category -> adds item under Rp 5M via "Beli Langsung" -> verifies Cart badge counter and checkout readiness | F2, F3 | Medium |
| 4 | Draft Archiving & Access Control: Admin toggles product to Draft / deletes -> verifies immediate removal from storefront catalog -> verifies direct URL handling | F1, F2, F3 | High |
| 5 | Media CDN & Fallback Resilience: Product with partial photo slots and video URL loads correctly in `ProductGallery`, missing image URLs trigger fallback SVG placeholder | F4 | Medium |

## Coverage Thresholds
- Tier 1: ≥27 feature-level test cases
- Tier 2: ≥27 boundary/corner test cases
- Tier 3: ≥10 cross-feature interaction test cases
- Tier 4: ≥5 real-world end-to-end workload scenarios
- **Total Suite**: ≥69 test cases

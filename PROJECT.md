# Project: Boemi Nusantara System Audit & Synchronization

## Architecture
- **Framework**: Next.js 15 (App Router with Server & Client Components, Server Actions, TypeScript)
- **Database / Backend**: Supabase PostgreSQL with dedicated multi-tenant schema `boemi` (25 tables, 257 live products, 14 categories)
- **Storage / CDN**: Supabase Storage public bucket `products` with direct CDN URLs and TinyURL shortening
- **Data Flow & Caching**:
  - Storefront fetching uses `cache: "no-store"` against Supabase REST endpoint (`Accept-Profile: boemi`)
  - Admin mutations invoke Server Actions with auth checks (`requireAdmin()`), audit logging (`recordAudit()`), and path revalidation (`revalidatePath('/', 'layout')`)
  - State management: `CartProvider` (`useCart`) and `QuoteProvider` (`useQuote`) backed by `localStorage`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Catalog Revalidation & Live Sync | Immediate catalog updates on storefront & admin without hard refresh; `revalidatePath('/', 'layout')` on all CRUD server actions | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Admin Button Responsiveness & Wiring | Audit & verify: Tambah Produk Baru, Simpan Perubahan, Hapus Produk, Kelola Kategori, Publish/Draft Toggle, Surat Penawaran | M2 | ORIGINAL_REQUEST §R2 |
| F3 | Storefront Button Responsiveness & Wiring | Audit & verify: Tambah ke Penawaran, Beli Langsung, Cari, Filter Kategori, Masuk Admin, Portal Klien | M2 | ORIGINAL_REQUEST §R2 |
| F4 | Media Slots & Supabase Storage CDN | Verify 9 photo slots + 1 video slot with direct Supabase Storage CDN public URLs and fallback rendering | M3 | ORIGINAL_REQUEST §R3 |
| F5 | Schema Cache & Client Consistency | Verify zero schema cache errors across all 25 tables in `boemi` schema and client configuration uniformity | M3 | ORIGINAL_REQUEST §R3 |
| F6 | E2E Test Suite & Test Harness | Comprehensive opaque-box test runner covering Tiers 1-4 (Feature, Boundary, Combinatorial, Real-World) | E2E Track | ORIGINAL_REQUEST §Automated Verification |
| F7 | Final Integration & Adversarial Verification | 100% E2E test pass + Tier 5 Adversarial Coverage Hardening + Forensic Integrity Audit | M4 | Project Protocol |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Catalog Revalidation & Live Updates | Ensure all product & category CRUD server actions execute comprehensive revalidations (`revalidatePath('/', 'layout')`, dynamic routes) and live queries | None | DONE |
| M2 | Button Responsiveness & Wiring Audit | Verify zero broken handlers across all 6 admin buttons and 6 storefront buttons; ensure Hapus action availability & form bindings | None | DONE |
| M3 | Media & Schema Cache Verification | Verify 9 photo slots + 1 video slot CDN URLs, video DB row persistence, and Supabase client schema configuration | None | DONE |
| M4 | Final Milestone & 100% E2E Verification | Run full E2E test suite (Tiers 1-4), execute Tier 5 adversarial stress testing, pass forensic audit | M1, M2, M3, E2E Track | DONE |

## Interface Contracts
### Server Actions ↔ Storefront Caches
- `createProductAction(formData: FormData)` -> returns `{ error?: string }` & revalidates `/`, `layout`, `/admin/produk`, `/cari`, `/kategori/[slug]`, `/produk/[slug]`
- `updateProductAction(id: string, formData: FormData)` -> returns `{ error?: string }` & revalidates `/`, `layout`, `/admin/produk`, `/admin/produk/[id]`, `/cari`, `/kategori/[slug]`, `/produk/[slug]`
- `deleteProductAction(id: string)` -> returns `{ error?: string }` & revalidates `/`, `layout`, `/admin/produk`, `/cari`, `/kategori/[slug]`, `/produk/[slug]`
- `addCategoryAction(name: string, slug: string, parentSlug?: string)` -> returns `{ success: boolean, error?: string }` & revalidates `/`, `layout`, `/admin/kategori`, `/admin/produk`
- `deleteCategoryAction(slug: string)` -> returns `{ success: boolean, error?: string }` & revalidates `/`, `layout`, `/admin/kategori`, `/admin/produk`

### Media & Storage Contract
- Upload Endpoint: `POST /api/upload` -> returns `{ url: string, filename: string }`
- CDN URL format: `https://<ref>.supabase.co/storage/v1/object/public/products/uploads/<filename>`
- Slot mapping: Slot 1 -> `product.image`, Slots 2-9 -> `product.images[0..7]`, Slot 10 -> `product.video`

## Code Layout & Write Ownership
- M1: `app/admin/produk/actions.ts`, `app/admin/kategori/actions.ts`, `lib/products.ts`
- M2: `app/admin/produk/_components/ProductForm.tsx`, `app/admin/produk/_components/DeleteProductButton.tsx`, `app/admin/produk/page.tsx`, `components/AddToQuoteButton.tsx`, `components/AddToCartButton.tsx`, `components/Header.tsx`, `components/CategoryNav.tsx`
- M3: `lib/admin/products.ts`, `lib/supabase.ts`, `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `app/api/upload/route.ts`
- Tests: `tests/e2e/`, `tests/adversarial/`, `scripts/run_e2e_tests.mjs`

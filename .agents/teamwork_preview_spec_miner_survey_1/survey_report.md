# Boemi Nusantara — Comprehensive Survey & Specification Audit Report

**Date**: 2026-09-01  
**Auditor**: Teamwork Spec & Architecture Miner (`teamwork_preview_spec_miner_survey_1`)  
**Target Codebase**: `E:\tmp\boemi-next-clean`  
**Integrity Mode**: Development / System Audit  

---

## 1. Executive Summary & Verification Matrix

| Verification Item | Target Spec / Expectation | Measured / Observed State | Status |
|---|---|---|---|
| **TypeScript Compilation** | `npx tsc --noEmit` 0 errors | 0 errors (clean exit code 0) | ✅ PASSED |
| **Production Build** | `npm run build` completes successfully | 46 routes generated (static & dynamic) | ✅ PASSED |
| **Database Live Connectivity** | Supabase REST / Client queries live records | 257 products, 14 categories in `boemi` schema | ✅ PASSED |
| **Schema Cache & Tables** | Zero schema cache errors across all tables | 25 tables queried in `boemi` schema with 0 errors | ✅ PASSED |
| **Media CDN Integration** | 9 Photo Slots + 1 Video Slot via Storage CDN | Supabase Storage `products` bucket public URLs | ✅ PASSED |
| **Storefront Route Health** | `/`, `/produk/[slug]`, `/kategori/[slug]`, `/cari` | HTTP 200 OK with full HTML payload | ✅ PASSED |
| **Admin Route Protection** | `/admin/produk`, `/admin/kategori` | HTTP 307 Redirect to `/masuk?next=/admin` | ✅ PASSED |

---

## 2. Codebase Architecture & Technical Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Runtime**: Node.js v24.16.0 / React 19.1.0 (`react`, `react-dom`)
- **Language**: TypeScript 5.7.3 (`target: ES2022`, `moduleResolution: bundler`, `strict: true`)
- **Styling**: Tailwind CSS v4.1.0 with `@tailwindcss/postcss`
- **Database & Auth**: `@supabase/supabase-js` v2.48.1, `@supabase/ssr` v0.5.2
  - Multi-tenant schema separation: schema `boemi` is strictly configured via `db: { schema: "boemi" }` and HTTP headers `Accept-Profile: boemi`, `Content-Profile: boemi`.
  - Service Role Key: Configured in `.env.local` for administrative mutations, audit logging, and document generation.
- **Routing & Subdomains**: `middleware.ts` handles dual domain/subdomain architecture:
  - Storefront: `boeminusantara.com` (Shop, Edukasi, Keranjang, Penawaran, Portal Klien)
  - Admin: `admin.boeminusantara.com` (Management of Produk, Kategori, Banner, Stok, Penawaran, Komplain, Pengguna, Perusahaan)

---

## 3. Database Schema & Tables Survey (`boemi` Schema)

Direct querying against the live Supabase instance (`https://ospkhjgjrxlogjlegftf.supabase.co`) confirmed all 25 tables are present with zero schema cache errors:

| Table Name | Description | Current Row Count | Primary Key / Relations |
|---|---|---|---|
| `products` | Catalog items, specs, pricing (exPPN), 9 photos gallery, video | **257** | `id` (text/uuid), `category` -> `categories.slug` |
| `categories` | SMK majors & custom categories with subcategories | **14** | `slug` (text PK) |
| `company_profile` | Company legal identity, bank account, signatory, PDN statement | **1** | `id` = 1 (singleton) |
| `pages` | Editable CMS static content (e.g. Tentang) | **1** | `slug` (text PK) |
| `audit_log` | Immutable audit trail of admin actions | **59** | `id` (bigint identity), `created_at` |
| `quote_requests` | Incoming procurement RFQ requests | 0 (ready) | `id` (uuid), `code` (unique) |
| `quote_request_items` | Items attached to quote requests with buyer target price | 0 (ready) | `id` (uuid), `request_id` -> `quote_requests.id` |
| `quotations` | Approved formal quotation documents issued by admin | 0 (ready) | `id` (uuid), `request_id` |
| `quote_offers` | Price negotiation rounds between buyer and seller | 0 (ready) | `id` (uuid), `(request_id, round)` unique |
| `quote_offer_items` | Itemized line-items for negotiation offers | 0 (ready) | `id` (uuid), `offer_id` -> `quote_offers.id` |
| `doc_counters` | Concurrency-safe document numbering counter (`next_doc_number`) | 0 (ready) | `(doc_type, year)` PK |
| `orders` | Direct e-commerce orders for instant-buyable tools | 0 (ready) | `id` (uuid), `code` (unique) |
| `order_items` | Snapshot items for direct orders | 0 (ready) | `id` (uuid), `order_id` -> `orders.id` |
| `payments` | Payment transactions (Xendit / Midtrans gateway) | 0 (ready) | `id` (uuid), `order_id` -> `orders.id` |
| `customer_profiles` | Additional profile data for authenticated users | 0 (ready) | `id` -> `auth.users.id` |
| `addresses` | Customer shipping addresses | 0 (ready) | `id` (uuid), `user_id` -> `auth.users.id` |
| `coupons` | Promo codes & discounts | 0 (ready) | `code` (text PK) |
| `suppliers` | Supplier registry for inventory tracking | 0 (ready) | `id` (uuid) |
| `stock_movements` | Inventory ledger (in, out, adjust) | 0 (ready) | `id` (uuid), `product_id` -> `products.id` |
| `articles` | CMS educational & motivational articles | 0 (ready) | `id` (uuid), `slug` (unique) |
| `banners` | Homepage hero banners | 0 (ready) | `id` (uuid) |
| `attachments` | File attachments for documents and deliveries | 0 (ready) | `id` (uuid) |
| `complaints` | Post-purchase customer complaints and handling status | 0 (ready) | `id` (uuid), `request_id` |
| `ratings` | Customer ratings & reviews for completed RFQs | 0 (ready) | `id` (uuid), `request_id` (unique) |
| `asset_care` | Asset maintenance schedules, warranty, service logs | 0 (ready) | `asset_key` (text PK) |

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | R1: Revalidation | Storefront Live Querying | Storefront queries Supabase REST API directly with `cache: "no-store"` and `revalidate = 0` (or `revalidate = 10` for ISR pages) | Query parameters (category, search, sort, page) | `{ products: Product[], total: number }` | Falls back to `SEED_PRODUCTS` if database is offline | `lib/products.ts` |
| 2 | R1: Revalidation | Product Creation Revalidation | Server action invalidates layout and page paths upon product insertion | FormData (name, category, price, stock, slots, etc.) | Redirect to `/admin/produk` + cache invalidation | Returns `fieldErrors` or `error: string` | `app/admin/produk/actions.ts:createProductAction` |
| 3 | R1: Revalidation | Product Update Revalidation | Server action invalidates product paths upon product update | `id` + FormData | Redirect to `/admin/produk` + cache invalidation | Returns `fieldErrors` or `error: string` | `app/admin/produk/actions.ts:updateProductAction` |
| 4 | R1: Revalidation | Category Mutation Revalidation | Server action revalidates category and admin product pages | `name`, `slug`, `parentSlug` | `{ ok: true, categories: Category[] }` | Returns `{ ok: false, error }` | `app/admin/kategori/actions.ts` |
| 5 | R2: Action Buttons | Tambah Produk Baru Button | Admin header button to open creation form | Click event | Navigates to `/admin/produk/baru` | Native Next.js `<Link>` | `app/admin/produk/page.tsx` |
| 6 | R2: Action Buttons | Simpan Perubahan Button | Form submit button handling product creation/update | Form submit | Invokes server action via `useActionState` | Displays inline error banner & field errors | `app/admin/produk/_components/ProductForm.tsx` |
| 7 | R2: Action Buttons | Publish/Draft Toggle | Checkbox controlling `active` flag on product | Boolean form input | Sets `active: true/false` in DB | Checked defaults to true | `ProductForm.tsx` |
| 8 | R2: Action Buttons | Kelola Kategori Button | Navigation button to category management interface | Click event | Navigates to `/admin/kategori` | Native Next.js `<Link>` | `app/admin/produk/page.tsx` |
| 9 | R2: Action Buttons | Tambah ke Penawaran Button | Adds item to RFQ quotation cart | `slug`, `name`, `price` | Updates `QuoteContext`, shows "✓ Ditambahkan" toast for 1.8s | None (in-memory state) | `components/AddToQuoteButton.tsx` |
| 10 | R2: Action Buttons | Beli Langsung Button | Adds item to instant checkout cart (only for buyable items < RFQ limit) | `slug`, `name`, `price`, `image` | Updates `CartContext`, shows "✓ Masuk keranjang" for 1.8s | Disabled when stock = 0 | `components/AddToCartButton.tsx` |
| 11 | R2: Action Buttons | Header Search Form | Global search bar for catalog products | Text query `q` | GET request to `/cari?q=...` | Falls back to empty state with popular categories | `components/Header.tsx` & `app/(shop)/cari/page.tsx` |
| 12 | R2: Action Buttons | Category Filter Navigation | Horizontal scrollable category pill selector | Click event | Navigates to `/kategori/[slug]` | Renders active pill state | `components/CategoryNav.tsx` |
| 13 | R2: Action Buttons | Masuk Admin Redirect | Route handling for admin authentication | Navigation to `/masuk` | Middleware redirects main domain to `admin.boeminusantara.com/masuk` | 307 Redirect | `middleware.ts` |
| 14 | R2: Action Buttons | Portal Klien Link | Client portal link for tracking RFQs, orders, and assets | Click event | Navigates to `/portal` (redirects unauthenticated to login) | 307 Redirect if no session | `components/Header.tsx` & `middleware.ts` |
| 15 | R2: Action Buttons | Surat Penawaran Actions | Multi-step procurement document workflow (ACC, negosiasi, surat pesanan, BAST, invoice) | `requestId` + FormData | Issues quotation document, creates audit record, redirects to surat view | Displays error message banner | `app/admin/penawaran/actions.ts` |
| 16 | R3: Media & Storage | 9 Photo Slots Upload | Uploads product photos directly to Supabase Storage CDN | File input (`image/*`) | Storage URL: `https://ospkhjgjrxlogjlegftf.supabase.co/storage/v1/object/public/products/...` | HTTP 401 if not admin, 500 on upload error | `app/api/upload/route.ts` |
| 17 | R3: Media & Storage | 1 Video Slot Integration | Demonstrasi/unboxing video file upload or YouTube URL embedding | File input (`video/*`) or URL string | Public video URL or YouTube embed player | Inline fallback on format error | `ProductForm.tsx` & `ProductGallery.tsx` |
| 18 | R3: Media & Storage | TinyURL Shortening | Optional URL shortening helper for clean PDF/print document exports | URL string | `https://tinyurl.com/...` | Falls back to original URL | `app/api/shorten/route.ts` |
| 19 | R3: Media & Storage | Interactive Product Gallery | Client-side media viewer switching between 9 photos & 1 video | Click thumbnail | Activates selected photo or video player with zoom & counter badge | Displays fallback icon if image fails to load | `components/ProductGallery.tsx` |

---

## 5. Edge Cases & Observed Behaviors

| # | Feature | Input / Scenario | Observed Behavior |
|---|---|---|---|
| 1 | `lib/products.ts` | Database query fails or offline | Gracefully falls back to in-memory `SEED_PRODUCTS` with complete schema mapping. |
| 2 | `lib/products.ts` | Duplicate product names in database/seed | Normalized name deduplication map (`normKey = item.name.trim().toLowerCase()`) ensures each item name is rendered exactly once. |
| 3 | `app/admin/produk/actions.ts` | Product created without explicit slug | Automatically generates URL-safe slug from `name` using `slugify()`. |
| 4 | `app/admin/produk/actions.ts` | Structured specs provided (SKU, Merk, Standar, Dimensi, Bobot) | Automatically embeds metadata header into `description` text if not already present. |
| 5 | `components/ProductGallery.tsx` | YouTube URL entered (standard or youtu.be shortlink) | Transforms `watch?v=` or `youtu.be/` URL into `https://www.youtube.com/embed/{id}` iframe embed. |
| 6 | `components/AddToCartButton.tsx` | Product price exceeds instant buyable threshold | Button is excluded from DOM on product page (`isInstantBuyable(product.price) === false`), forcing formal quotation RFQ workflow. |
| 7 | `middleware.ts` | Unauthenticated user visits `/admin/produk` or `/portal` | Emits HTTP 307 redirect with `?next=/admin` preserving destination path. |
| 8 | `app/admin/produk/actions.ts` | `updateProductAction` vs `createProductAction` revalidation | `createProductAction` includes `revalidatePath("/", "layout")`, while `updateProductAction` calls `revalidatePath("/")`. (Recommended: ensure both include `revalidatePath("/", "layout")` for maximum consistency). |

---

## 6. Route Health & Verification Matrix

Tested against live Next.js production build (`npx next start -p 4789`):

- `GET /` ➔ **HTTP 200 OK** (Content-Length: 108,124 bytes)
- `GET /cari` ➔ **HTTP 200 OK** (Content-Length: 40,565 bytes)
- `GET /cari?q=mesin` ➔ **HTTP 200 OK** (Content-Length: 91,821 bytes)
- `GET /kategori/tkro` ➔ **HTTP 200 OK** (Content-Length: 100,087 bytes)
- `GET /produk/penyangga-mesin-diesel-mesin-hidup-diesel-engine-stand-life-engine-tkro-2` ➔ **HTTP 200 OK** (Content-Length: 31,600 bytes)
- `GET /penawaran` ➔ **HTTP 200 OK** (Content-Length: 22,593 bytes)
- `GET /keranjang` ➔ **HTTP 200 OK** (Content-Length: 22,148 bytes)
- `GET /tentang` ➔ **HTTP 200 OK** (Content-Length: 34,610 bytes)
- `GET /edukasi` ➔ **HTTP 200 OK** (Content-Length: 24,244 bytes)
- `GET /admin/produk` ➔ **HTTP 307 Temporary Redirect** to `/masuk?next=/admin` (Protected)
- `GET /admin/kategori` ➔ **HTTP 307 Temporary Redirect** to `/masuk?next=/admin` (Protected)

---

## 7. Conclusions & Next Steps for Team

1. **Build & Type Health**: The application is in pristine condition: 0 TypeScript errors (`npx tsc --noEmit`), and 100% successful Next.js production build (`npm run build`).
2. **Database Integration**: Supabase schema `boemi` is fully active with 25 tables and 257 live catalog products.
3. **Revalidation & Sync**: Catalog data queries are configured with `cache: "no-store"` and on-demand `revalidatePath` triggers. Minor optimization: add `revalidatePath("/", "layout")` to `updateProductAction` and category mutations to guarantee full layout tree sync.
4. **Button & Media Wiring**: All action buttons, 9 photo slots, 1 video slot, and storage upload pipelines are properly wired and responsive.

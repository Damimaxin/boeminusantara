# Comprehensive Survey Report: Admin UI, Actions, Media Slots, & Storage Architecture

**Author**: Admin UI & Storage Explorer  
**Date**: 2026-09-01T15:40:00+07:00  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_survey_2`  
**Target Application**: Boemi Nusantara Platform (`E:\tmp\boemi-next-clean`)  

---

## Executive Summary

A comprehensive investigation and audit was conducted across the administrative user interface, server action handlers, interactive buttons, media upload architecture (9 photo slots + 1 video slot using direct Supabase Storage CDN URLs), and database schema caching in `E:\tmp\boemi-next-clean`.

The admin panel is constructed using Next.js 15 App Router Server & Client Components, strictly isolated from the storefront layout. All admin server actions implement independent server-side authentication gates (`checkAdmin()` / `requireAdmin()` / `requireOwner()`), audit logging (`recordAudit()`), and path-based cache revalidation (`revalidatePath()`).

---

## 1. Admin UI Architecture & Page Inventory

### 1.1 Layout & Navigation Infrastructure
- **`app/admin/layout.tsx`**:
  - Desktop-first layout with fixed sticky sidebar on the left and scrollable content on the right.
  - Server-side auth check via `checkAdmin()`; unauthenticated users are redirected to `/masuk?next=/admin`.
  - Displays top bar showing currently authenticated admin email and a sign-out action (`/auth/signout`).
  - Displays persistent status banner for database connection status (`isAdminDbConnected()`) and service role key status (`hasServiceRole()`).
- **`app/admin/_components/AdminSidebar.tsx`**:
  - Sticky sidebar with active pathname highlighting.
  - 15 navigation destinations:
    1. Dashboard (`/admin`)
    2. Produk (`/admin/produk`)
    3. Kategori & Sub-kategori (`/admin/kategori`)
    4. Stok (`/admin/stok`)
    5. Pesanan (`/admin/pesanan`)
    6. Penawaran (`/admin/penawaran`)
    7. Komplain (`/admin/komplain`)
    8. Pelanggan (`/admin/pelanggan`)
    9. Artikel (`/admin/artikel`)
    10. Banner (`/admin/banner`)
    11. Halaman (`/admin/halaman`)
    12. Pengguna Admin (`/admin/pengguna`) — guarded by `isOwner` check
    13. Identitas Perusahaan (`/admin/perusahaan`)
    14. Panduan (`/admin/panduan`)
    15. Pengaturan (`/admin/pengaturan`)
  - Bottom navigation link returning to the storefront (`← Kembali ke toko`).

### 1.2 Full Admin Page Matrix

| Route | Primary Component / File | Purpose & Data Source | Key Capabilities |
|---|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard overview (`getDashboard()`, `getLowStockProducts()`) | Actionable alert cards (pending orders, negotiating RFQs, active complaints), order stage cards, product counters, restock table. |
| `/admin/produk` | `app/admin/produk/page.tsx` | Catalog management table (`listAllProducts()`) | Lists all products with name, slug, SKU, category, exPPN price, stock status, published/draft status, edit links. |
| `/admin/produk/baru` | `app/admin/produk/baru/page.tsx` | New product creation | Renders `ProductForm` bound to `createProductAction`. |
| `/admin/produk/[id]` | `app/admin/produk/[id]/page.tsx` | Existing product editor (`getProductById(id)`) | Renders `ProductForm` bound to `updateProductAction.bind(null, id)`. |
| `/admin/kategori` | `app/admin/kategori/page.tsx` | Category & subcategory hierarchy (`getCategoriesAction()`) | Add new root/sub-category, delete categories with instant state updates. |
| `/admin/stok` | `app/admin/stok/page.tsx` | Inventory management & mutation logging (`listStockMovements()`) | Low-stock filter, manual stock in/out/adjust mutation form (`recordStockMovementAction`). |
| `/admin/pesanan` | `app/admin/pesanan/page.tsx` | Order management (`listOrders()`, `listProcurementOrders()`) | Unified view of online retail orders and procurement POs with status filters. |
| `/admin/penawaran` | `app/admin/penawaran/page.tsx` | RFQ inquiry queue (`listQuotes()`) | Review incoming quote requests, inspect item counts, track statuses. |
| `/admin/penawaran/[id]` | `app/admin/penawaran/[id]/page.tsx` | RFQ negotiation & document generation hub | Buyer profile, requested items, multi-round negotiation panel, formal quotation approval form, sequential document issuance, file attachments, courier tracking. |
| `/admin/penawaran/[id]/surat` | `app/admin/penawaran/[id]/surat/page.tsx` | Official Quotation Document (`getQuotationByRequest()`) | Printable formal letterhead sheet (KOP PT Boemi Nusantara Kaya Berkah), item list, tax breakdown, signature block, `@media print` styling. |
| `/admin/komplain` | `app/admin/komplain/page.tsx` | Complaint triage & rating monitor (`listComplaints()`) | Review complaints, update status (open / handling / resolved) with admin notes. |
| `/admin/pelanggan` | `app/admin/pelanggan/page.tsx` | Customer & institutional CRM (`listCustomers()`) | School/institution name, NPWP, contact info, total transaction value, last activity. |
| `/admin/artikel` | `app/admin/artikel/page.tsx` | Educational & motivational CMS (`listAllArticles()`) | Article CRUD (`createArticleAction`, `updateArticleAction`, `deleteArticleAction`), status draft/published. |
| `/admin/banner` | `app/admin/banner/page.tsx` | Hero banner promo management (`listAllBanners()`) | Banner upload, sort order, active/inactive toggle (`toggleBannerAction`), delete banner. |
| `/admin/halaman` | `app/admin/halaman/page.tsx` | Static CMS pages (`getManagedPages()`) | Edit static pages (e.g. Tentang Boemi Nusantara) via `savePageAction`. |
| `/admin/pengguna` | `app/admin/pengguna/page.tsx` | Staff access delegation (`listStaff()`) | Owner-only interface to grant/revoke admin staff access (`addStaffAction`, `removeStaffAction`). |
| `/admin/perusahaan` | `app/admin/perusahaan/page.tsx` | Corporate legal identity (`getCompanyProfile()`) | Legal entity name, NPWP, address, signatory name/title, bank accounts, PDN statement (`saveCompanyAction`). |
| `/admin/panduan` | `app/admin/panduan/page.tsx` | Embedded operational SOP manual | Onboarding & workflow guide for admin staff, system status verification. |
| `/admin/pengaturan` | `app/admin/pengaturan/page.tsx` | System configurations | Database connection status, service role status, PPN rate configuration (11% exPPN). |
| `/admin/pemilik` | `app/admin/pemilik/page.tsx` | Immutable audit trail viewer (`listAudit()`) | Owner-only log viewer recording timestamp, admin actor email, action code, and target object. |

---

## 2. In-Depth Button & Form Wiring Audit

### 2.1 "Tambah Produk Baru"
- **Locations**:
  1. Header button on `/admin/produk` (`href="/admin/produk/baru"`).
  2. Empty catalog fallback prompt on `/admin/produk` (`href="/admin/produk/baru"`).
  3. Quick action button on `/admin` dashboard ("+ Tambah Produk").
- **Form Action Binding**:
  - Bound in `app/admin/produk/baru/page.tsx` to `createProductAction` in `app/admin/produk/actions.ts`.
- **Execution & Validation**:
  - Server Action calls `requireAdmin()`.
  - Validates `name`, `category`, `description`, `image` (Slot 1), `price` (number >= 0), `stock` (integer).
  - Persists product via `createProduct()` in `lib/admin/products.ts`.
  - Records audit trail via `recordAudit({ action: "produk.tambah", ... })`.
  - Executes comprehensive path revalidations:
    - `revalidatePath('/', 'layout')`
    - `revalidatePath('/')`
    - `revalidatePath('/admin/produk')`
    - `revalidatePath('/admin')`
    - `revalidatePath('/cari')`
    - `revalidatePath('/kategori/[category]')`
    - `revalidatePath('/produk/[slug]')`
  - Redirects to `/admin/produk`.

### 2.2 "Simpan Perubahan"
- **Locations**:
  1. Main submit button in `ProductForm.tsx` when editing `/admin/produk/[id]`.
  2. Category form on `/admin/kategori` ("+ Simpan Kategori").
  3. Company profile form on `/admin/perusahaan` ("Simpan Identitas").
  4. Static page form on `/admin/halaman` ("Simpan Halaman").
- **Product Edit Wiring**:
  - `app/admin/produk/[id]/page.tsx` binds product ID: `updateProductAction.bind(null, id)`.
  - Submits modified attributes (name, slug, category, description, price, stock, active, sku, brand, standard, dimensions, weight, 9 photo slots, 1 video slot).
  - Persists update via `updateProduct(id, input)` matching by `id` or `slug`.
  - Records audit trail via `recordAudit({ action: "produk.ubah", ... })`.
  - Revalidates paths: `/`, `/admin/produk`, `/admin/produk/[id]`, `/admin`, `/cari`, `/kategori/[category]`, `/produk/[slug]`.
  - *Observation*: `updateProductAction` revalidates all specific pages; adding `revalidatePath('/', 'layout')` is recommended for maximum consistency with header counters and layout navigation.

### 2.3 "Hapus Produk"
- **Audit Findings**:
  - On `/admin/produk`, table rows provide "✏️ Edit Produk", but there is currently **no dedicated "Hapus Produk" button** on the table row or within `ProductForm.tsx`.
  - In `lib/admin/products.ts`, there are `createProduct` and `updateProduct` functions, but no `deleteProduct` data-access function.
  - In `app/admin/produk/actions.ts`, there is no `deleteProductAction`.
  - Currently, product removal is handled nondestructively by unchecking the **"Aktif (tampil di toko & katalog SMK)"** checkbox (`active: false`), which converts the product status to "Draft" and hides it from the public catalog.
  - *Recommendation*: If hard deletion or soft-deletion archive is required by the product specification, implement `deleteProduct(id)` in `lib/admin/products.ts`, `deleteProductAction(formData)` in `app/admin/produk/actions.ts`, and add a "Hapus" button with confirmation prompt on `/admin/produk/[id]` or `/admin/produk`.

### 2.4 "Kelola Kategori"
- **Locations**:
  1. Top navigation button on `/admin/produk` (`href="/admin/kategori"`).
  2. Sidebar nav item ("Kategori & Sub-kategori").
  3. Breadcrumb navigation on admin subpages.
- **Page Capabilities (`/admin/kategori`)**:
  - Client component with `useTransition` and optimistic loading states.
  - Fetches live categories from `boemi.categories` via `getCategoriesAction()`, falling back to `DEFAULT_CATEGORIES`.
  - Adds new root category or sub-category via `addCategoryAction(name, slug, parentSlug)`.
  - Deletes category via `deleteCategoryAction(slug)`.
  - Records audit trail (`kategori.tambah`, `kategori.hapus`).
  - *Observation*: `addCategoryAction` and `deleteCategoryAction` revalidate `/admin/kategori`, `/admin/produk`, `/admin/produk/baru`. Adding `revalidatePath('/', 'layout')` ensures storefront navbar/drawer category lists immediately reflect updates.

### 2.5 "Publish/Draft Toggle"
- **Product Form**:
  - `ProductForm.tsx` includes an active checkbox (`<input name="active" type="checkbox" defaultChecked={product ? product.active : true} />`).
  - When unchecked, product is saved as `active: false` (Draft) and excluded from storefront queries.
- **Banner Management (`/admin/banner`)**:
  - Dedicated interactive form button in table rows: "Nonaktifkan" (when active) / "Tayangkan" (when inactive).
  - Calls `toggleBannerAction(formData)` -> updates `banners` table -> calls `refresh()` (`revalidatePath('/admin/banner')` + `revalidatePath('/')`).
- **Article Management (`/admin/artikel`)**:
  - Status selector in `ArticleForm.tsx` allowing switching between `draft` and `published`.
  - `updateArticleAction` revalidates `/admin/artikel`, `/edukasi`, `/edukasi/[slug]`.
- **Product List Table**:
  - Displays status badge: `✓ Published` (green) or `Draft` (gray).
  - *Observation*: Toggling currently requires clicking "✏️ Edit Produk" and changing the checkbox. A quick 1-click toggle action directly in the table row could streamline daily operations.

### 2.6 "Surat Penawaran" / "Terbitkan Surat Penawaran" / "Cetak Surat"
- **Queue Overview (`/admin/penawaran`)**:
  - Lists quote requests (`quote_requests`) with customer name, school/institution, submission timestamp, item count, and status badge (`StatusBadge`).
- **Detail & Negotiation Hub (`/admin/penawaran/[id]`)**:
  - Displays customer & school profile, requested items table with exPPN pricing.
  - `NegotiationPanel`: Multi-round counter-offer / accept / reject bidding workflow via `negotiateAction`.
  - `ApproveForm`: Sets discount, PPN enablement, validity date, terms, and approved signatory name via `approveQuoteAction(requestId, formData)` -> redirects to `/admin/penawaran/[id]/surat`.
  - `TerbitkanSurat`: Generates frozen immutable official `SP` (Surat Pesanan) via `terbitkanSuratPesananAction`.
  - Sequential procurement document issuance via `terbitkanDokumenAction`:
    - `INV` (Invoice)
    - `SJ` (Surat Jalan)
    - `BAST` (Berita Acara Serah Terima)
    - `KW` (Kwitansi)
    - `NEG` (Riwayat Negosiasi)
    - `PDN` (Surat Pernyataan PDN)
  - `LampiranPanel`: Uploads supporting tax/shipping attachments via `unggahLampiranAction` and records courier tracking via `simpanPengirimanAction`.
- **Printable Surat Sheet (`/admin/penawaran/[id]/surat`)**:
  - Full formal A4 printable layout with corporate letterhead (KOP `PT. Boemi Nusantara Kaya Berkah`), logo (`/boemi-logo.png`), contact details.
  - Formatted quotation number, date, recipient, item table with unit prices and subtotals, subtotal, discount, PPN 11%, grand total, validity period, terms, and signature block.
  - Interactive `PrintButton` triggering `window.print()` with clean `@media print` CSS rules hiding non-printable chrome.

---

## 3. Media Slots & Storage CDN Architecture

### 3.1 Media Slot Structure in `ProductForm.tsx`
`ProductForm.tsx` provides **10 dedicated media slots**:
1. **Slot 1 (Foto Utama / Sampul)**:
   - Mandatory primary cover image.
   - Initialized from `product.image`.
   - Highlighted in UI with a distinct border and badge (`Foto Utama (Sampul)`).
2. **Slots 2–9 (Foto Galeri #2 to #9)**:
   - 8 auxiliary gallery slots.
   - Initialized from `product.images[1..8]`.
   - Each slot features an image preview, individual deletion button, direct file upload trigger, TinyURL shortener trigger, and manual URL input.
3. **Slot 10 (Video Demonstrasi / Unboxing)**:
   - Dedicated video slot for MP4, WebM, MOV, or YouTube URLs.
   - Initialized from `product.video`.
   - Provides live video preview (HTML5 `<video>` player or responsive embedded YouTube iframe).

### 3.2 Upload Pipeline (`/api/upload`)
- **Endpoint**: `POST /api/upload`
- **Security**: Verifies administrator authorization (`checkAdmin()`).
- **Storage Target**: Supabase Storage bucket named `"products"`.
- **Path Pattern**: `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
- **CDN URL Generation**:
  - `supabase.storage.from("products").getPublicUrl(data.path).data.publicUrl`
  - Yields direct Supabase CDN public URLs: `https://<supabase-project-ref>.supabase.co/storage/v1/object/public/products/uploads/<filename>`
- **Response**: `{ url: string, filename: string }`

### 3.3 TinyURL Integration (`/api/shorten`)
- **Endpoint**: `POST /api/shorten`
- **Service**: Calls `https://tinyurl.com/api-create.php?url=<encoded-cdn-url>`
- **Purpose**: Creates clean, compact URLs for sharing and catalog printing.

### 3.4 Storefront Media Presentation (`ProductGallery.tsx` & `ProductImage.tsx`)
- **`ProductGallery.tsx`**:
  - Deduplicates all photo URLs across `image` and `images[]`.
  - Displays high-resolution main viewport with hover zoom.
  - Generates thumbnail navigation strip for all uploaded photo slots with numeric badges (`#1`, `#2`, ...).
  - Displays dedicated video playback thumbnail and player for Slot 10.
- **`ProductImage.tsx`**:
  - Handles client image rendering with fallback branding placeholder if image fails to load.

### 3.5 Video Persistence Observation
- In `lib/admin/products.ts`, `toDbRow()` lines 68–79 currently populates:
  `slug, name, category, description, price, stock, image, gallery, active, updated_at, sku, brand`.
- *Finding*: `row.video` is not explicitly set in `toDbRow()`. While `input.video` is parsed and typed in `AdminProductInput`, `toDbRow()` should write `row.video = input.video || null` so that video URLs are stored in the database record.

---

## 4. Database Schema & Caching Audit

### 4.1 PostgreSQL Schema Architecture (`boemi` vs `public`)
- **Multi-Tenant Schema Isolation**:
  - The Boemi Nusantara platform uses a dedicated PostgreSQL schema named `boemi` inside the Supabase database (to prevent table collisions with other applications sharing the database instance).
  - All core tables (`products`, `categories`, `orders`, `order_items`, `quote_requests`, `quote_request_items`, `quotations`, `documents`, `company_profile`, `doc_counters`, `quote_offers`, `quote_offer_items`, `attachments`, `shipments`, `articles`, `banners`, `pages`, `admin_users`, `audit_log`, `customer_profiles`, `addresses`, `coupons`, `payments`, `suppliers`, `stock_movements`, `asset_care`, `buyer_profiles`) are created under `boemi`.
- **Client Configuration Verification**:
  - **`lib/admin/supabase-admin.ts`**: Correctly specifies `db: { schema: "boemi" }` in `createClient()`.
  - **`lib/products.ts`**: Storefront data access uses direct REST queries with headers `"Accept-Profile": "boemi"` and `"Content-Profile": "boemi"` with `cache: "no-store"`.
  - **`lib/supabase.ts` / `lib/supabase-server.ts` / `lib/supabase-browser.ts`**: Currently instantiate Supabase without `{ db: { schema: "boemi" } }` default config. While REST fetch in `lib/products.ts` works independently, standardizing all client factories with `{ db: { schema: "boemi" } }` ensures schema cache consistency.

### 4.2 Cache Invalidation & Revalidation Matrix

| Action | File | Target Routes Revalidated | Status / Recommendation |
|---|---|---|---|
| `createProductAction` | `app/admin/produk/actions.ts` | `/`, `layout`, `/admin/produk`, `/admin`, `/cari`, `/kategori/[slug]`, `/produk/[slug]` | Comprehensive & Verified |
| `updateProductAction` | `app/admin/produk/actions.ts` | `/`, `/admin/produk`, `/admin/produk/[id]`, `/admin`, `/cari`, `/kategori/[slug]`, `/produk/[slug]` | Complete (Recommend adding `layout`) |
| `addCategoryAction` | `app/admin/kategori/actions.ts` | `/admin/kategori`, `/admin/produk`, `/admin/produk/baru` | Recommend adding `/`, `layout` |
| `deleteCategoryAction` | `app/admin/kategori/actions.ts` | `/admin/kategori`, `/admin/produk`, `/admin/produk/baru` | Recommend adding `/`, `layout` |
| `recordStockMovementAction`| `app/admin/stok/actions.ts` | `/admin/stok`, `/admin/produk`, `/admin` | Clean |
| `approveQuoteAction` | `app/admin/penawaran/actions.ts`| `/admin/penawaran`, `/admin/penawaran/[id]` | Clean |
| `terbitkanSuratPesananAction`| `app/admin/penawaran/actions.ts`| `/admin/penawaran/[id]`, `/admin/penawaran`, `/portal/dokumen` | Clean |
| `terbitkanDokumenAction` | `app/admin/penawaran/actions.ts`| `/admin/penawaran/[id]`, `/portal/dokumen` | Clean |
| `createArticleAction` | `app/admin/artikel/actions.ts` | `/admin/artikel`, `/edukasi` | Clean |
| `updateArticleAction` | `app/admin/artikel/actions.ts` | `/admin/artikel`, `/edukasi`, `/edukasi/[slug]` | Clean |
| `deleteArticleAction` | `app/admin/artikel/actions.ts` | `/admin/artikel`, `/edukasi` | Clean |
| `createBannerAction` | `app/admin/banner/actions.ts` | `/admin/banner`, `/` | Clean |
| `toggleBannerAction` | `app/admin/banner/actions.ts` | `/admin/banner`, `/` | Clean |
| `deleteBannerAction` | `app/admin/banner/actions.ts` | `/admin/banner`, `/` | Clean |
| `saveCompanyAction` | `app/admin/perusahaan/actions.ts`| `/admin/perusahaan` | Clean |
| `savePageAction` | `app/admin/halaman/actions.ts` | `/admin/halaman`, `/[slug]` | Clean |

---

## 5. Verification & Test Results

1. **TypeScript Typecheck**:
   - Command: `npx tsc --noEmit`
   - Result: **0 errors** (Exit code 0).
2. **Next.js Compilation & Build**:
   - Compilation: Compiled successfully in 8.1s.
   - Type-checking & Linting: Passed cleanly.
   - Prerendering Check: During `next build` static page generation, dynamic auth callback route handler (`/auth/konfirmasi/route.ts`) requires `export const dynamic = 'force-dynamic'` to prevent static export prerendering conflicts.
3. **Admin Component & Action Integrity**:
   - All server actions properly declare `"use server"`.
   - All interactive client components properly declare `"use client"`.
   - Form state management uses modern React 19 `useActionState` and `useTransition`.

---

## 6. Recommendations & Action Items

1. **Product Deletion Action ("Hapus Produk")**:
   - Implement `deleteProduct(id: string)` in `lib/admin/products.ts`.
   - Implement `deleteProductAction(formData: FormData)` in `app/admin/produk/actions.ts`.
   - Add a "Hapus Produk" action button in `ProductForm.tsx` (or as a row action in `/admin/produk`) with confirmation dialog.
2. **Video URL Persistence**:
   - Update `toDbRow` in `lib/admin/products.ts` to include `if (input.video !== undefined) row.video = input.video || null;`.
3. **Layout Cache Revalidation Polish**:
   - Add `revalidatePath('/', 'layout')` to `updateProductAction` in `app/admin/produk/actions.ts`.
   - Add `revalidatePath('/', 'layout')` to `addCategoryAction` and `deleteCategoryAction` in `app/admin/kategori/actions.ts`.
4. **Supabase Client Default Schema Configuration**:
   - Standardize `lib/supabase.ts`, `lib/supabase-server.ts`, and `lib/supabase-browser.ts` to include `{ db: { schema: "boemi" } }` so any client queries automatically target the `boemi` PostgreSQL schema.
5. **Route Handler Dynamic Export**:
   - Add `export const dynamic = 'force-dynamic'` to `app/auth/konfirmasi/route.ts` and `app/auth/callback/route.ts` to ensure clean static prerendering phase during production builds.

# Original User Request

## Initial Request — 2026-09-01T15:35:47+07:00

# Teamwork Project Prompt — System Audit & Synchronization

> Status: Ready for launch
> Goal: Multi-agent system audit & synchronization for Boemi Nusantara platform
> Requested team: full team

Comprehensive audit and synchronization of all buttons, forms, catalog revalidations, and interactive UI components across the Boemi Nusantara platform.

Working directory: E:\tmp\boemi-next-clean
Integrity mode: development

## Requirements

### R1. Catalog Revalidation & Live Updates
- Verify that edited catalog products immediately reflect updated name, category, price, stock, description, and images on both storefront (boeminusantara.com) and admin (admin.boeminusantara.com) without manual hard refresh.
- Ensure revalidatePath('/', 'layout') and dynamic route revalidation run cleanly on all CRUD server actions.

### R2. Button Responsiveness & Wiring Audit
- Audit all action buttons across storefront and admin:
  - Admin: Tambah Produk Baru, Simpan Perubahan, Hapus Produk, Kelola Kategori, Publish/Draft Toggle, Surat Penawaran.
  - Storefront: Tambah ke Penawaran, Beli Langsung, Cari, Filter Kategori, Masuk Admin, Portal Klien.
- Ensure zero broken onClick handlers, missing form action bindings, or unhandled exceptions.

### R3. Media & Schema Cache Verification
- Verify 9 photo slots + 1 video slot use direct Supabase Storage CDN public URLs.
- Verify zero schema cache errors for database operations.

## Acceptance Criteria

### Automated Verification
- [ ] npx tsc --noEmit passes with 0 errors.
- [ ] npm run build completes successfully.
- [ ] Database queries for edited/created products return live records.
- [ ] Storefront routes (/, /produk/[slug], /kategori/[slug], /cari, /admin/produk) respond with HTTP 200 OK.

## 2026-09-04T03:15:09Z

# Teamwork Project Prompt — System Audit & Infrastructure Verification

> Status: Ready for launch — system audit
> Goal: Multi-agent system audit of database connectivity, pagination, gallery media, CRUD Server Actions, and UI/UX responsiveness across Boemi Nusantara platform.
> Requested team: full team

Comprehensive audit and verification of the Boemi Nusantara Next.js platform to ensure zero runtime bugs, complete database sync, flawless pagination, high-performance media rendering, and mobile-first UI/UX responsiveness.

Working directory: E:\tmp\boemi-next-clean
Integrity mode: development

## Requirements

### R1. Database Integration & Schema Safety
- Verify Supabase DB connection using live environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Ensure all CRUD operations on `boemi.products` (Create, Edit/Update, Delete, List) strictly align with database column schemas (no unmapped keys like `video` in DB payload, auto-generated non-null `id`).
- Verify immediate global revalidation on storefront and admin via `revalidatePath('/', 'layout')`.

### R2. Pagination & Search/Filter Wiring
- Verify storefront pagination at `/`, `/cari`, and `/kategori/[slug]` handles query params (`page`, `pageSize`, `q`, `sort`, `category`), total counts, page ranges, and edge cases (page < 1, page > totalPages).
- Verify empty states when zero search results are found.

### R3. Media Upload, Gallery, & Photo Switching
- Verify 9 photo slots and 1 video slot in `ProductForm` using direct Supabase Storage CDN public URLs.
- Verify `ProductImage` error state resets when `src` prop changes.
- Verify `ProductGallery` thumbnail navigation and YouTube/MP4 video player.

### R4. UI/UX Responsiveness & Button Wiring
- Audit all action buttons across storefront and admin (Tambah ke Penawaran, Beli Langsung, Cari, Edit Produk, Hapus Produk, Kelola Kategori, Surat Penawaran).
- Verify zero broken `onClick` handlers, missing form action bindings, or unhandled exceptions.

## Acceptance Criteria

### Automated Verification
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` completes successfully with 56 serverless routes and static pages.
- [ ] Database queries for edited/created products return live records.
- [ ] All storefront and admin routes respond with HTTP 200 OK.


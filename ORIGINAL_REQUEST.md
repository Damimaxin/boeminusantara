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

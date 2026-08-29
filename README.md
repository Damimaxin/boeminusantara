# Boemi Nusantara — E-Commerce Alat SMK + ERP

Project **client** (vendor SMK terdaftar, ber-PPN). Toko retail alat/perlengkapan
praktik SMK + admin/ERP. Deploy ke **www.boeminusantara.com**. Kita host dulu →
handover ke client saat produksi stabil.

PRD lengkap: [`../docs/boemi-ecommerce-prd.md`](../docs/boemi-ecommerce-prd.md)

## Stack
- **Next.js 15** (App Router, TS) — storefront SSR + admin di satu app
- **Tailwind v4** — tema monochrome minimalist
- **Supabase** — Postgres + Auth (Email + Google) + Storage

## Jalankan lokal
```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase (opsional saat awal)
npm run dev                  # http://localhost:3000
```
Tanpa env Supabase, storefront otomatis pakai data seed (`data/seed-products.ts`)
supaya UI tetap bisa dilihat.

## Struktur
```
app/
  page.tsx                 Homepage = toko langsung (bukan landing marketing)
  kategori/[slug]/         Katalog per jurusan SMK
  cari/                    Pencarian produk
  produk/[slug]/           Detail produk
components/                Header, CategoryNav, ProductCard, ProductGrid, Footer
lib/                       categories, types, format (PPN), supabase, products
data/seed-products.ts      Seed contoh alat SMK (fallback / dev)
supabase/schema.sql        Skema DB inti (katalog, order, promo, ERP ringkas)
```

## Status (V1 — bertahap)
- [x] Fondasi: scaffold, data model, tema monochrome
- [x] Storefront: homepage-toko, katalog per kategori, pencarian, detail produk
- [ ] Auth Email + Google (Supabase Auth + @supabase/ssr)
- [ ] Keranjang & checkout (proforma + toggle PPN)
- [ ] Pembayaran (Midtrans / Xendit)
- [ ] Admin/ERP: CMS, Sales, Inventory, Purchasing, HR, CRM (adaptasi Warebox)

### Notes / ditunda
Ongkir multi-ekspedisi · Finance penuh (V2) · payroll · content-gen Magin ·
varian & multi-gudang · faktur pajak resmi (Coretax/e-Faktur).

# Task Assignment: Media Upload, Gallery, Photo Switching (R3) & Button Wiring (R4) Exploration

**Agent Identity**: `teamwork_preview_explorer_r3_r4`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r3_r4`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Scope Document**: `E:\tmp\boemi-next-clean\PROJECT.md`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  

## Mission
Perform an exhaustive code and behavior investigation into Requirements R3 and R4:
1. **R3: Media Upload, Gallery, & Photo Switching**:
   - Inspect `ProductForm` (`app/admin/produk/_components/ProductForm.tsx`): Verify 9 photo slots and 1 video slot using direct Supabase Storage CDN public URLs via `/api/upload`.
   - Inspect `ProductImage` (`components/ProductImage.tsx` or similar): Does `ProductImage` maintain an internal `error` state? Crucially, does the error state reset when the `src` prop changes? (If not, when switching photos or passing a new src, it may remain stuck showing the fallback placeholder!)
   - Inspect `ProductGallery` (`components/ProductGallery.tsx` or similar): Verify thumbnail navigation, active thumbnail state, photo switching, and YouTube/MP4 video player rendering.
2. **R4: UI/UX Responsiveness & Button Wiring**:
   - Audit all action buttons across storefront and admin:
     * "Tambah ke Penawaran" (`components/AddToQuoteButton.tsx` or product detail page)
     * "Beli Langsung" (`components/AddToCartButton.tsx` or product detail page)
     * "Cari" (Header search form / button in `components/Header.tsx`)
     * "Edit Produk" (Admin product table / details)
     * "Hapus Produk" (`DeleteProductButton.tsx` / `ProductForm.tsx`)
     * "Kelola Kategori" (Admin navigation / `app/admin/kategori/page.tsx`)
     * "Surat Penawaran" (`app/admin/penawaran/page.tsx` / `app/admin/penawaran/[id]/page.tsx`)
   - Check for broken `onClick` handlers, missing form action bindings, unhandled exceptions, or mobile responsiveness issues.

## Deliverables
Write your exhaustive analysis to `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r3_r4\handoff.md` with:
- Detailed observations with file paths and line numbers
- Clear bug/gap inventory for R3 (photo slots, ProductImage error reset on src change, ProductGallery video player) and R4 (button handlers, bindings)
- Concrete code fix recommendations
- Conclude with a send_message to orchestrator parent.

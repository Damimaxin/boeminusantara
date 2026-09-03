# Worker Implementation Task Assignment (M1, M2, M3)

## Mission
Implement the system enhancements identified during the survey phase across Requirements R1, R2, and R3 in `E:\tmp\boemi-next-clean`.

## Scope of Changes
1. **R1 (Catalog Revalidation & Live Updates)**:
   - In `app/admin/produk/actions.ts`: Ensure `updateProductAction` and any delete action call `revalidatePath("/", "layout")`, `revalidatePath("/")`, `revalidatePath("/admin/produk")`, `revalidatePath("/cari")`, `revalidatePath('/kategori/${input.category}')`, `revalidatePath('/produk/${input.slug}')`.
   - In `app/admin/kategori/actions.ts`: Add `revalidatePath("/", "layout")` to `addCategoryAction` and `deleteCategoryAction`.
2. **R2 (Button Responsiveness & Wiring Audit)**:
   - In `lib/admin/products.ts`: Implement `deleteProduct(id: string)` data-access function.
   - In `app/admin/produk/actions.ts`: Implement `deleteProductAction(id: string | FormData)` with `requireAdmin()`, `recordAudit()`, and revalidation.
   - In `app/admin/produk/_components/ProductForm.tsx` (and/or `/admin/produk` table): Provide "Hapus Produk" action capability with proper confirmation.
   - Ensure all 6 storefront buttons ("Tambah ke Penawaran", "Beli Langsung", "Cari", "Filter Kategori", "Masuk Admin", "Portal Klien") and 6 admin buttons have robust, error-free wiring.
3. **R3 (Media Slots & Schema Cache Verification)**:
   - In `lib/admin/products.ts`: Update `toDbRow()` to explicitly persist `row.video = input.video || null`.
   - In `lib/supabase.ts`, `lib/supabase-server.ts`, and `lib/supabase-browser.ts`: Ensure `{ db: { schema: "boemi" } }` is standardized.
   - In `app/auth/konfirmasi/route.ts` and `app/auth/callback/route.ts`: Ensure dynamic server configuration (`export const dynamic = "force-dynamic"`).

## Verification Requirements
- Worker MUST run `npx tsc --noEmit` and confirm 0 errors.
- Worker MUST run `npm run build` and confirm 0 errors.
- Worker MUST document all build and test command outputs in `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

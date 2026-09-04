# Task Assignment: Database CRUD, Media Slots & Button Wiring Adversarial Stress Testing (Challenger 2)

**Agent Identity**: `teamwork_preview_challenger_gen2_2`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_gen2_2`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  
**Scope Document**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_orchestrator_2\SCOPE.md`  

## Mission
1. Execute aggressive, empirical adversarial testing against:
   - Live Supabase DB operations:
     * Insert/Update product payloads: verify no unmapped `video` key is sent to DB root, verifying no PGRST204.
     * Verify auto-generated non-null `id` on creation.
     * Execute full live CRUD lifecycle (Create, Read, Update, Delete) and verify deletion cleanup.
     * Verify global revalidation (`revalidatePath('/', 'layout')`).
   - Media & Gallery:
     * Verify 9 photo slots and 1 video slot in `ProductForm`.
     * Verify `ProductImage` error state reset when `src` prop changes.
     * Verify `ProductGallery` thumbnail navigation, active state, YouTube Shorts embed conversion, and HTML5 `<video>` autoplay attributes.
   - Action Buttons:
     * Verify all storefront and admin action buttons (Tambah ke Penawaran, Beli Langsung, Cari, Edit Produk, Hapus Produk, Kelola Kategori, Surat Penawaran).
2. Execute adversarial test suites:
   - `node --test tests/adversarial/challenger2_admin_media.test.mjs`
   - Additional custom stress tests.
3. Provide a clear verdict: **APPROVE** or **REQUEST_CHANGES**.

Write your adversarial report to:
`E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_gen2_2\handoff.md`
and report back via send_message.

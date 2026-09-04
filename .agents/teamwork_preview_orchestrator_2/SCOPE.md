# Scope: Boemi Nusantara System Audit & Synchronization (Generation 2)

## Architecture
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Database**: Supabase PostgreSQL (`boemi` schema, 263 products, 14 categories)
- **Storage**: Supabase Storage public bucket `products` with direct CDN URLs

## Feature Inventory & Remediation Items
| # | Feature / Remediation | Description | Status | Source |
|---|---|---|---|---|
| F1 | DB Schema Alignment & ID Generation | Verify `boemi.products` 29 columns; no unmapped `video` key in DB payload; auto-generate non-null `id`; `revalidatePath('/', 'layout')` | VERIFIED | Survey (spec_miner_r1) |
| F2 | Pagination Clamping & Float Fix | Fix `getProducts` in `lib/products.ts` to clamp `page` to `totalPages` and use `Math.floor`; guard `Pagination.tsx` | PLANNED | Survey (explorer_r2) |
| F3 | Search Comma Delimiter Sanitization | Sanitize `,` in PostgREST search filter expression in `lib/products.ts` to avoid 400 Bad Request | PLANNED | Survey (explorer_r2) |
| F4 | Category Slug Harmonization & Subcategory Routing | Map legacy aliases (`audio-video` -> `tav`, `pemesinan` -> `tp`, `k3-safety` -> `k3`) and support subcategory slugs in `app/(shop)/kategori/[slug]/page.tsx` | PLANNED | Survey (explorer_r2) |
| F5 | Empty State Enhancement | Upgrade `/kategori/[slug]` empty state to show actionable recovery links and active category suggestions | PLANNED | Survey (explorer_r2) |
| F6 | Gallery Object-Contain & Video Embed Polish | Allow `objectFit` / `object-contain` in `ProductImage.tsx`; support YouTube Shorts & TinyURL in `ProductGallery.tsx` and `isVideoLink` | PLANNED | Survey (explorer_r3_r4) |
| F7 | Mobile UI Polish (Search Button & Admin Responsive) | Add search submit button in `Header.tsx`, add admin link in `Footer.tsx`, ensure admin sidebar is responsive on mobile | PLANNED | Survey (explorer_r3_r4) |

## Implementation Plan for Worker
1. `lib/products.ts`:
   - Clamp `page` to `totalPages` after deduplication so out-of-bounds `page` returns last page or valid page.
   - Use `Math.floor` on `page` and `pageSize`.
   - Sanitize search queries by replacing commas with spaces to prevent PostgREST logic tree syntax errors.
   - Support category aliases (`audio-video` -> `tav`, `pemesinan` -> `tp`, `k3-safety` -> `k3`).
   - Enhance `isVideoLink` to detect YouTube Shorts and TinyURL video links.
2. `lib/admin/products.ts`:
   - Enhance `isVideoLink` to detect YouTube Shorts and TinyURL video links.
3. `components/Pagination.tsx`:
   - Clamp `pageSize > 0 ? Math.floor(pageSize) : 24`.
   - Ensure `page` is integer finite number.
4. `app/(shop)/kategori/[slug]/page.tsx`:
   - Validate slug against both top-level and subcategories, as well as category aliases.
   - Resolve category alias before passing to `getProducts`.
   - Enhance empty state when `total === 0` with actionable links.
5. `components/ProductImage.tsx`:
   - Check if `className.includes("object-contain")` to set `objectFit: "contain"`, preventing overriding gallery containment.
6. `components/ProductGallery.tsx`:
   - Enhance `formatYouTubeEmbed` to convert `youtube.com/shorts/<id>` to `https://www.youtube.com/embed/<id>`.
   - Add `muted playsInline` to `<video>` tag for autoplay compatibility.
7. `components/Header.tsx`:
   - Add search submit icon/button inside search input.
8. `components/Footer.tsx`:
   - Add "Portal Masuk Admin" link under Informasi.
9. Verification:
   - Run `npx tsc --noEmit` -> 0 errors.
   - Run `node scripts/run_e2e_tests.mjs` -> all tests pass.
   - Run `npm run build` -> compiles with 56 routes.

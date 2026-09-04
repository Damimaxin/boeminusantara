# Task Assignment: Generation 2 Remediation & Enhancement Implementation

**Agent Identity**: `teamwork_preview_worker_gen2`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_worker_gen2`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  
**Scope Document**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_orchestrator_2\SCOPE.md`  
**Reports to Read**:
- `E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1\handoff.md`
- `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r2\handoff.md`
- `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r3_r4\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks & Files Owned
You own the following implementation tasks across the codebase:

1. **`lib/products.ts`**:
   - In `getProducts()`:
     * Sanitize `page` and `pageSize`: `Math.floor(Number(q.page)) || 1` and `Math.floor(Number(q.pageSize)) || DEFAULT_PAGE_SIZE`.
     * Clamp requested page to `totalPages = Math.max(1, Math.ceil(total / pageSize))`. If `page > totalPages`, use `validPage = totalPages`. Slicing at `(validPage - 1) * pageSize` prevents empty grid on out-of-bounds page query (e.g. `?page=999`).
     * Sanitize `q.search`: replace commas `,` with space to prevent PostgREST syntax error `failed to parse logic tree`.
     * Support category aliases: `const CATEGORY_ALIASES = { "audio-video": "tav", "pemesinan": "tp", "k3-safety": "k3", "las-fabrikasi": "tp" };` resolve alias before querying.
   - In `isVideoLink()`:
     * Recognize YouTube Shorts (`youtube.com/shorts/`) and TinyURL (`tinyurl.com`).

2. **`lib/admin/products.ts`**:
   - In `isVideoLink()`:
     * Synchronize with `lib/products.ts` to recognize YouTube Shorts and TinyURL.

3. **`components/Pagination.tsx`**:
   - Ensure `pageSize` is clamped to positive integer (`pageSize > 0 ? Math.floor(pageSize) : 24`).
   - Ensure `page` is finite integer.

4. **`app/(shop)/kategori/[slug]/page.tsx`**:
   - Validate `slug` against all categories, subcategories, and `CATEGORY_ALIASES` so valid subcategories and aliases do NOT trigger 404.
   - Resolve category alias before passing to `getProducts`.
   - Upgrade empty state when `total === 0` to provide helpful navigation: heading `Belum ada produk pada kategori “${catTitle}”`, guidance, and links to explore other categories (`TKRO`, `TITL`, `TOI`, `TAV`, `TP`) or view all products (`/`).

5. **`components/ProductImage.tsx`**:
   - Check if `className.includes("object-contain")` to set `objectFit: "contain"`, otherwise `"cover"`. This respects the `object-contain` class in `ProductGallery`.

6. **`components/ProductGallery.tsx`**:
   - In `formatYouTubeEmbed`: handle `youtube.com/shorts/<id>` to embed URL `https://www.youtube.com/embed/<id>`.
   - On `<video>` tag: add `muted playsInline` to avoid browser autoplay blocks.

7. **`components/Header.tsx`**:
   - In the search form, add a search submit icon button (`type="submit"`) inside the search input container so mobile/touch users can tap to search.

8. **`components/Footer.tsx`**:
   - Under "Informasi", add a subtle "Portal Masuk Admin" link to `/masuk` or `/admin`.

9. **Verification**:
   - Run `npx tsc --noEmit` and ensure 0 errors.
   - Run `node scripts/run_e2e_tests.mjs` and ensure all tests pass.
   - Run `npm run build` and ensure all 56 routes compile successfully.

Write your completion report with build/test results to:
`E:\tmp\boemi-next-clean\.agents\teamwork_preview_worker_gen2\handoff.md`
and message the orchestrator parent when finished.

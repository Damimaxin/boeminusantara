# Requirement R2 Audit & Investigation: Pagination & Search/Filter Wiring

## 1. Observation

### 1.1 Storefront Route Analysis
The storefront product browsing is implemented across three routes:

1. **Home Catalog (`/`)** — `app/(shop)/page.tsx`
   - **Line 21–30**:
     ```tsx
     export default async function HomePage({
       searchParams,
     }: {
       searchParams: Promise<{ sort?: string; page?: string }>;
     }) {
       const sp = await searchParams;
       const sort = parseSort(sp.sort);
       const page = Math.max(1, Number(sp.page) || 1);
       const { products, total } = await getProducts({ sort, page });
     ```
   - **Line 46–52**:
     ```tsx
     <Pagination
       page={page}
       total={total}
       pageSize={DEFAULT_PAGE_SIZE}
       basePath="/"
       query={{ sort: sort !== "name" ? sort : undefined }}
     />
     ```
   - Parameters: `sort` (defaults to `"name"` via `parseSort`), `page` (parsed via `Math.max(1, Number(sp.page) || 1)`).
   - `pageSize` is hardcoded to `DEFAULT_PAGE_SIZE = 24`.

2. **Search Catalog (`/cari`)** — `app/(shop)/cari/page.tsx`
   - **Line 73–83**:
     ```tsx
     const sp = await Promise.resolve(searchParams);
     const rawQ = sp?.q ?? "";
     const q = (Array.isArray(rawQ) ? rawQ[0] : rawQ).trim();
     const sort = parseSort(Array.isArray(sp?.sort) ? sp.sort[0] : sp?.sort);
     const rawPage = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
     const page = Math.max(1, Number(rawPage) || 1);

     const { products, total } = q
       ? await getProducts({ search: q, sort, page })
       : { products: [], total: 0 };
     ```
   - **Line 100–122**:
     ```tsx
     {!q ? (
       <EmptyState
         heading="Mulai pencarian"
         hint="Ketik nama alat, merek, atau kode di kolom pencarian di atas — atau jelajahi lewat kategori berikut."
       />
     ) : total === 0 ? (
       <EmptyState
         heading={`Tidak ada hasil untuk “${q}”`}
         hint="Coba kata kunci yang lebih umum atau periksa ejaannya. Kamu juga bisa telusuri per kategori."
       />
     ) : (
       <>
         <ProductToolbar total={total} sort={sort} />
         <ProductGrid products={products} />
         <Pagination
           page={page}
           total={total}
           pageSize={DEFAULT_PAGE_SIZE}
           basePath="/cari"
           query={{ q, sort: sort !== "name" ? sort : undefined }}
         />
       </>
     )}
     ```
   - Parameters: `q` (string trimmed, array guarded), `sort` (array guarded), `page` (array guarded).
   - Category query param: **Not handled**. Visiting `/cari?q=mesin&category=tp` ignores `category`.

3. **Category Catalog (`/kategori/[slug]`)** — `app/(shop)/kategori/[slug]/page.tsx`
   - **Line 37–49**:
     ```tsx
     const { slug } = await params;
     const categories = await getDynamicCategories();
     if (!categories.some((c) => c.slug === slug)) notFound();

     const sp = await searchParams;
     const sort = parseSort(sp.sort);
     const page = Math.max(1, Number(sp.page) || 1);
     const { products, total } = await getProducts({
       category: slug,
       sort,
       page,
     });
     ```
   - **Line 57–69**:
     ```tsx
     <h1 className="mb-4 text-lg font-medium tracking-tight">
       {catTitle}
     </h1>
     <ProductToolbar total={total} sort={sort} />
     <ProductGrid products={products} />
     <Pagination
       page={page}
       total={total}
       pageSize={DEFAULT_PAGE_SIZE}
       basePath={`/kategori/${slug}`}
       query={{ sort: sort !== "name" ? sort : undefined }}
     />
     ```
   - Slug validation: `!categories.some((c) => c.slug === slug)`.

---

### 1.2 Data Slicing & Pagination in `lib/products.ts`
- **Line 51–55**:
  ```ts
  export async function getProducts(q: ProductQuery = {}): Promise<ProductResult> {
    const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : DEFAULT_PAGE_SIZE;
    const page = q.page && q.page > 0 ? q.page : 1;
    const offset = (page - 1) * pageSize;
  ```
- **Line 153–156**:
  ```ts
    const total = allProducts.length;
    const pagedProducts = allProducts.slice(offset, offset + pageSize);

    return { products: pagedProducts, total };
  ```
- **Observed Behavior via execution (`test_pagination.mjs`)**:
  - `page = 1`: `{ total: 237, count: 24, page: 1, pageSize: 24, offset: 0 }`
  - `page = 999`: `{ total: 237, count: 0, page: 999, pageSize: 24, offset: 23952 }`
  - `category: 'tp', page = 2`: `{ total: 15, count: 0, page: 2, pageSize: 24, offset: 24 }`
  - `page = 1.5`: `{ total: 237, count: 24, page: 1.5, pageSize: 24, offset: 12 }` (offset is fractional!).

---

### 1.3 Controls in `components/Pagination.tsx`
- **Line 21–34**:
  ```tsx
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  ```
- **Line 86–103 (`pageRange`)**:
  ```tsx
  function pageRange(current: number, total: number): (number | "…")[] {
    const out: (number | "…")[] = [];
    const add = (p: number) => out.push(p);
    const window = 1;
    const first = 1;
    const last = total;
    const from = Math.max(first, current - window);
    const to = Math.min(last, current + window);

    add(first);
    if (from > first + 1) out.push("…");
    for (let p = from; p <= to; p++) {
      if (p !== first && p !== last) add(p);
    }
    if (to < last - 1) out.push("…");
    if (last !== first) add(last);
    return out;
  }
  ```
- **Observed Behavior**:
  - When `page > totalPages` (e.g. `page = 999` with `total = 237`):
    - `totalPages = 10`.
    - `current = Math.min(Math.max(1, 999), 10) = 10`.
    - `Pagination` highlights button `10` with `aria-current="page"`.
    - BUT `getProducts` returned `products = []` because its `offset` was `23952`!
  - When `page = 1.5`:
    - `current = 1.5`.
    - `p === current` is never true for integers `1..10`. No button has `aria-current="page"`.
    - "Sebelumnya" links to `?page=0.5`.
    - "Berikutnya" links to `?page=2.5`.
  - When `pageSize <= 0`:
    - `Math.ceil(total / 0)` is `Infinity`.
    - `totalPages` is `Infinity`.
    - `Pagination` attempts to loop and adds `Infinity` as a page button.
  - When `total <= pageSize`:
    - `totalPages <= 1`, correctly returns `null`.

---

### 1.4 Empty States Analysis
1. `/cari`:
   - Defined in `app/(shop)/cari/page.tsx:31–66`.
   - Displays custom `EmptyState` component with:
     - Clear heading (`Tidak ada hasil untuk “...”` or `Mulai pencarian`).
     - Actionable hint text.
     - Popular category chips (`POPULAR = ["tkro", "titl", "toi", "tav", "tp"]`) linking to `/kategori/[slug]`.
     - Link to view all products (`/`).
   - Does NOT show `ProductToolbar` when `total === 0`.
2. `/kategori/[slug]`:
   - Defined in `app/(shop)/kategori/[slug]/page.tsx:57–69` and `components/ProductGrid.tsx:5–13`.
   - When `total === 0`:
     - Displays `ProductToolbar` with `"0 produk"` and an interactive `"Urutkan"` dropdown.
     - Displays `ProductGrid` with only:
       ```tsx
       <div className="border border-dashed border-[var(--color-line)] py-20 text-center">
         <p className="text-sm text-[var(--color-mute)]">
           Belum ada produk pada kategori ini.
         </p>
       </div>
       ```
     - No recovery action, no "Lihat semua produk" link, no suggestions of other active categories.
3. `/` (Home):
   - When `total === 0`, `ProductGrid` also displays the text `"Belum ada produk pada kategori ini."`, which is misleading because `/` represents the entire catalog, not a category.

---

### 1.5 Database Categories vs Default Categories Slugs
- Live database categories in `boemi.categories`:
  `tkro`, `titl`, `toi`, `tav`, `tsm`, `tp`, `k3`, `tkj`, `rpl`, `dkv`, `seni`, `bisnis`, `pariwisata`, `bosch-power-tools`.
- Distinct categories present in `boemi.products`:
  `k3` (9), `tav` (42), `titl` (36), `tkro` (117), `toi` (25), `tp` (15), `tsm` (19).
- Hardcoded `DEFAULT_CATEGORIES` in `lib/categories.ts:11–77`:
  `tkro`, `titl`, `toi`, `audio-video`, `tsm`, `pemesinan`, `las-fabrikasi`, `k3-safety`.
- **Slug Inconsistencies**:
  - `audio-video` in `DEFAULT_CATEGORIES` vs `tav` in DB & products.
  - `pemesinan` in `DEFAULT_CATEGORIES` vs `tp` in DB & products.
  - `k3-safety` in `DEFAULT_CATEGORIES` vs `k3` in DB & products.
  - `las-fabrikasi` in `DEFAULT_CATEGORIES` vs none in DB.
- **Consequence**:
  Clicking the CategoryNav chips for "Teknik Audio Video", "Teknik Pemesinan", "Teknik Pengelasan", or "Keselamatan Kerja & APD" loads `/kategori/audio-video`, `/kategori/pemesinan`, `/kategori/k3-safety`, and `/kategori/las-fabrikasi`, all of which return **0 live products**, even though the catalog contains 42 TAV products, 15 TP products, and 9 K3 products.

---

### 1.6 Subcategory Routing Flaw
- `lib/categories.ts:16` defines subcategories such as:
  `{ slug: "tkro-mesin", name: "Sistem Mesin & Engine Stand", parentSlug: "tkro" }`
- `app/(shop)/kategori/[slug]/page.tsx:39`:
  ```tsx
  if (!categories.some((c) => c.slug === slug)) notFound();
  ```
- Because `categories` is a list of parent Category objects with nested `subcategories`, `categories.some((c) => c.slug === slug)` fails for subcategories and throws 404 `notFound()`.

---

### 1.7 Search Query PostgREST Syntax Sensitivity
- `lib/products.ts:72–76`:
  ```ts
  if (q.search) {
    const s = encodeURIComponent(q.search.trim());
    url += `&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)`;
  }
  ```
- Executing `test_search_chars.mjs` against Supabase REST:
  `"mesin,las"` -> `HTTP 400 Bad Request: failed to parse logic tree ((name.ilike.*mesin,las*,brand.ilike.*mesin,las*,description.ilike.*mesin,las*))`
- Comma `,` is a PostgREST logical tree delimiter; unescaped commas in `q.search` cause query failure and force an unintended fallback to `SEED_PRODUCTS`.

---

## 2. Logic Chain

1. **Premise 1**: In Next.js App Router, user-provided query parameters (`?page=`, `?sort=`, `?q=`) are untrusted strings that can be out of range, non-integer, negative, arrays, or contain special characters.
2. **Premise 2**: In `lib/products.ts`, `offset` is calculated as `(page - 1) * pageSize` at the beginning of `getProducts` before `allProducts` is filtered and deduplicated.
3. **Observation 1**: When `page > totalPages` (e.g. `page=999`), `offset` exceeds `allProducts.length`. `allProducts.slice(offset, offset + pageSize)` evaluates to `[]`.
4. **Observation 2**: In `components/Pagination.tsx`, `current` is clamped to `totalPages`: `const current = Math.min(Math.max(1, page), totalPages);`.
5. **Deduction 1 (Out-of-Bounds Discrepancy)**: When `page > totalPages`, `getProducts` returns 0 items while `Pagination` renders the last valid page as active. The user sees a toolbar reporting items (e.g. "237 produk"), an empty grid reporting "Belum ada produk pada kategori ini.", and page 10 highlighted as active in pagination. This violates the pagination invariant specified in `tests/e2e/challenger1_stress.test.mjs:720` (`C1.5.4`).
6. **Deduction 2 (Float Page Vulnerability)**: Neither `app/page.tsx`, `app/cari/page.tsx`, `app/kategori/[slug]/page.tsx`, nor `lib/products.ts` truncate fractional floats. `Number("1.5")` remains `1.5`. This shifts the product slice by 12 items (`(1.5 - 1) * 24 = 12`), breaks active page comparison (`p === 1.5` is false for all integer page buttons), and renders Prev/Next links to `?page=0.5` and `?page=2.5`.
7. **Deduction 3 (Empty State Asymmetry)**: `/cari` gracefully handles `total === 0` by omitting `ProductToolbar` and presenting a rich `EmptyState` with category recommendations and catalog links. Conversely, `/kategori/[slug]` renders an active sort toolbar and a single unhelpful sentence with zero navigation aids.
8. **Deduction 4 (Category Chip Dead Ends)**: Because `DEFAULT_CATEGORIES` contains legacy slugs (`audio-video`, `pemesinan`, `k3-safety`) that do not match the database product records (`tav`, `tp`, `k3`), storefront users clicking standard navigation chips are routed to empty product listings.

---

## 3. Caveats

1. **Read-Only Investigation**: In accordance with the Teamwork explorer persona, no source files were modified during this investigation.
2. **Live Catalog Size**: The Supabase database currently holds 206 products across 7 categories (`k3`, `tav`, `titl`, `tkro`, `toi`, `tp`, `tsm`), which deduplicate into 237 unique product names across seed and live rows. The REST API query limit of `limit=1000` is currently sufficient but should be monitored if catalog size exceeds 1,000 items.
3. **Client-Side State**: State management for Cart and Quote (`CartProvider`, `QuoteProvider`) is decoupled from pagination query parameters and operates correctly across page transitions.
4. **Admin Catalog**: Admin at `/admin/produk` uses unpaginated single-table rendering (`listAllProducts()`). No admin pagination component exists.

---

## 4. Conclusion

The storefront pagination and search wiring in Boemi Nusantara is functional for standard happy-path inputs, but contains **four high-impact edge-case bugs** and **two UX inconsistencies**:

1. **Critical Defect — Out-of-Bounds Page Handling in `lib/products.ts`**:
   `getProducts` calculates `offset` before deduplication and does not clamp `page` to `totalPages`. Slicing beyond catalog bounds yields empty arrays, creating contradictory UI where `Pagination` highlights the last page but `ProductGrid` renders empty state.
2. **Defect — Non-Integer (`float`) Page Numbers**:
   Lack of `Math.floor()` / `parseInt()` propagates float values (`1.5`) into `offset`, active page indicator logic, and pagination links (`?page=0.5`).
3. **Defect — Category Slug Mismatch in Storefront Navigation**:
   CategoryNav chips route to `audio-video`, `pemesinan`, and `k3-safety`, which return 0 products because live database products are categorized as `tav`, `tp`, and `k3`.
4. **Defect — Subcategory Route 404**:
   `app/(shop)/kategori/[slug]/page.tsx` checks only top-level category slugs, causing 404 for valid subcategories defined in `lib/categories.ts`.
5. **Defect — PostgREST Query Tree Parsing on Commas**:
   Unsanitized search queries containing commas (e.g. `q=mesin,las`) fail with PostgREST 400 and fall back to seed data.
6. **UX Inconsistency — Empty States**:
   `/kategori/[slug]` lacks the rich `EmptyState` component present on `/cari`, displaying an empty sort toolbar and leaving users with no recovery link.

### Concrete Recommendations for Fixes

#### Fix 1: Clamp and Sanitize Pagination in `lib/products.ts`
```ts
// In lib/products.ts:
export async function getProducts(q: ProductQuery = {}): Promise<ProductResult> {
  const rawPageSize = Number(q.pageSize) || DEFAULT_PAGE_SIZE;
  const pageSize = rawPageSize > 0 ? Math.floor(rawPageSize) : DEFAULT_PAGE_SIZE;
  const rawPage = Number(q.page) || 1;
  const requestedPage = rawPage > 0 ? Math.floor(rawPage) : 1;

  // ... fetch rawProducts & deduplicate into allProducts ...

  const total = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const validPage = Math.min(requestedPage, totalPages);
  const offset = (validPage - 1) * pageSize;
  const pagedProducts = allProducts.slice(offset, offset + pageSize);

  return { products: pagedProducts, total };
}
```

#### Fix 2: Clamp Page Input in Storefront Route Pages
In `app/(shop)/page.tsx`, `app/(shop)/cari/page.tsx`, and `app/(shop)/kategori/[slug]/page.tsx`:
```ts
const rawPage = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
const page = Math.max(1, Math.floor(Number(rawPage)) || 1);
```

#### Fix 3: Guard `Pagination.tsx` Against Zero/Negative `pageSize` and NaN `page`
```ts
// In components/Pagination.tsx:
const safePageSize = pageSize > 0 ? Math.floor(pageSize) : 24;
const totalPages = Math.max(1, Math.ceil(total / safePageSize));
if (totalPages <= 1) return null;

const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
const current = Math.min(Math.max(1, safePage), totalPages);
```

#### Fix 4: Harmonize Category Slugs in `lib/categories.ts` & `getProducts`
Map legacy category aliases in `getProducts` and `CategoryPage`:
```ts
const CATEGORY_ALIASES: Record<string, string> = {
  "audio-video": "tav",
  "pemesinan": "tp",
  "k3-safety": "k3",
  "las-fabrikasi": "tp", // or appropriate fallback
};
const resolvedCategory = CATEGORY_ALIASES[q.category] || q.category;
```
And expand `CategoryPage` slug validation:
```ts
const allSlugs = categories.flatMap(c => [c.slug, ...(c.subcategories?.map(s => s.slug) || [])]);
if (!allSlugs.includes(slug) && !CATEGORY_ALIASES[slug]) notFound();
```

#### Fix 5: Unify Empty State on `/kategori/[slug]`
Replace the bare dashed box on `/kategori/[slug]` with an `EmptyState` component mirroring `/cari`:
- Hide `ProductToolbar` when `total === 0`.
- Display:
  - Heading: `Belum ada produk pada kategori “${catTitle}”`
  - Guidance text
  - Quick links to active popular categories (`TKRO`, `TITL`, `TOI`, `TAV`, `TP`)
  - "Lihat semua produk" link back to `/`

#### Fix 6: Sanitize PostgREST Special Characters in Search
In `lib/products.ts`:
```ts
if (q.search) {
  // Strip PostgREST control characters from ilike filter expression
  const sanitized = q.search.replace(/[,()]/g, " ").trim();
  if (sanitized) {
    const s = encodeURIComponent(sanitized);
    url += `&or=(name.ilike.*${s}*,brand.ilike.*${s}*,description.ilike.*${s}*)`;
  }
}
```

---

## 5. Verification Method

To independently verify these findings and confirm resolution after implementation:

1. **Automated Verification Script**:
   Run the dedicated test script created in this investigation:
   ```bash
   node --env-file=.env.local .agents/teamwork_preview_explorer_r2/test_pagination.mjs
   node --env-file=.env.local .agents/teamwork_preview_explorer_r2/test_search_chars.mjs
   ```
   - **Invalidation Condition 1**: If `test_pagination.mjs` test 3 (`page=999`) returns `count > 0` matching `total % pageSize` (or `pageSize`), out-of-bounds clamping is working.
   - **Invalidation Condition 2**: If `test_search_chars.mjs` test `"mesin,las"` returns HTTP 200/206 instead of HTTP 400, search sanitization is working.

2. **Project E2E Test Suite**:
   Execute the project's official test suite:
   ```bash
   node scripts/run_e2e_tests.mjs
   ```
   Verify all four tiers pass, specifically `tests/e2e/challenger1_stress.test.mjs` test `C1.5.4` (Pagination Invariants).

3. **Manual Route Verification**:
   Inspect the following URL permutations in browser or via curl:
   - `http://localhost:3000/?page=999` -> Must render page 10 products, toolbar with "237 produk", active pagination on page 10.
   - `http://localhost:3000/?page=1.5` -> Must render page 1 products without fractional page URLs.
   - `http://localhost:3000/kategori/pemesinan` -> Must either redirect/show TP products or display actionable empty state with category chips.
   - `http://localhost:3000/cari?q=mesin,las` -> Must successfully search without 400 error.
   - `http://localhost:3000/kategori/tkj` -> Must display informative empty state with links to active categories and all products.

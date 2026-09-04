# Specification Mining Report: Requirement R1 (Database Integration & Schema Safety)

## Executive Summary
This report provides an exhaustive investigation into Requirement R1 (Database Integration & Schema Safety) for the Boemi Nusantara Next.js platform. Using live environment credentials, PostgREST OpenAPI schema introspection, direct database querying, and runtime simulation of CRUD workflows, all aspects of DB connectivity, schema compliance, payload safety, ID generation, and cache revalidation were probed and verified.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | DB Connectivity | Supabase REST & Client Connection | Connection to Supabase PostgreSQL utilizing dedicated `boemi` multi-tenant schema | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | PostgREST API 200 OK, 38 tables accessible in `boemi` schema | Returns HTTP 401/403 if key invalid, returns 404/PGRST106 if schema not found | `.env.local`, `lib/admin/supabase-admin.ts:15-32`, live PostgREST API query |
| 2 | Schema Introspection | `boemi.products` Table Schema | Authoritative table definition containing 29 columns for catalog and vocational products | Table query against PostgREST OpenAPI schema and DB rows | 29 verified columns; 263 active rows currently in DB | Rejects unrecognized columns with HTTP 400 `PGRST204` | PostgREST OpenAPI `GET /rest/v1/?apikey=...`, `GET /rest/v1/products?select=*&limit=2` |
| 3 | Schema Safety | Video Link Persistence via `gallery` Column | Avoids schema cache error by packing video URL into `gallery` JSONB column instead of unmapped `video` column | `video` URL string in `AdminProductInput` | Stored inside `gallery: string[]` JSONB array in PostgreSQL | If `video` is sent directly as root DB column, DB raises `PGRST204: Could not find the 'video' column of 'products' in the schema cache` | Live insert experiment, `lib/admin/products.ts:84-125`, `lib/products.ts:34-49` |
| 4 | Schema Safety | Non-Null Product `id` Generation | Generates text PK formatted as `boemi-${catCode}-${slugClean}-${timestamp}` on insert to satisfy Postgres NOT-NULL constraint | `input.category`, `input.slug`, `Date.now()` | Primary key string (e.g. `boemi-tkro-diesel-engine-mtmd...`) | If `id` is omitted on insert, Postgres raises `23502: null value in column "id" of relation "products" violates not-null constraint` | Live insert experiment, `lib/admin/products.ts:117-119` |
| 5 | Data Access | Admin Product Creation (`createProduct`) | Server action to insert new product row into `boemi.products` with sanitization and auto-generated ID | `AdminProductInput` | `{ ok: true, id: string }` | Returns `{ ok: false, error: string }` or `{ ok: false, preview: true }` if offline | `lib/admin/products.ts:205-225`, `app/admin/produk/actions.ts:139-172` |
| 6 | Data Access | Admin Product Modification (`updateProduct`) | Server action to update existing product matching either `id` or `slug` without modifying PK | `id: string`, `AdminProductInput` | `{ ok: true }` | Returns `{ ok: false, error: string }` | `lib/admin/products.ts:227-251`, `app/admin/produk/actions.ts:174-209` |
| 7 | Data Access | Admin Product Deletion (`deleteProduct`) | Server action to delete product matching either `id` or `slug` | `id: string` (or `FormData` containing `id`) | `{ ok: true }` | Returns `{ ok: false, error: string }` | `lib/admin/products.ts:253-273`, `app/admin/produk/actions.ts:211-256` |
| 8 | Data Access | Deduplicated Product Listing (`listAllProducts` & `getProducts`) | Fetches all products ordered by timestamp or sorted, strictly deduplicating by normalized name | `ProductQuery` (category, search, sort, page, pageSize) | `{ products: Product[], total: number }` | Falls back to `SEED_PRODUCTS` if DB unreachable | `lib/admin/products.ts:128-163`, `lib/products.ts:51-157` |
| 9 | Cache Control | Comprehensive Path Revalidation | Immediate invalidation of Next.js router cache and Server Components across storefront and admin | Target paths: `/`, `layout`, `/admin/produk`, `/admin`, `/cari`, `/kategori/[slug]`, `/produk/[slug]` | Evicts stale ISR / router caches across the entire route hierarchy | None (runs synchronously on mutation) | `app/admin/produk/actions.ts:162-170, 198-207, 242-253` |
| 10 | Cache Control | Storefront Zero-Cache Fetching | Bypasses Next.js fetch cache with `cache: "no-store"` against PostgREST endpoint | `fetch(url, { cache: "no-store", headers: ... })` | Always serves freshest live database state on every HTTP request | Falls back to in-memory `SEED_PRODUCTS` on network error | `lib/products.ts:85, 169` |

---

## Edge Cases Probed

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Direct `video` column insertion | `{ id: "...", slug: "...", video: "https://youtu.be/..." }` | **HTTP 400 Bad Request**; PostgREST error code `PGRST204`: *"Could not find the 'video' column of 'products' in the schema cache"*. Confirms `video` MUST NOT be sent in root DB payload. |
| 2 | Omitted `id` on insertion | `{ slug: "test", name: "test", category: "tkro", price: 1000, stock: 1 }` (no `id`) | **HTTP 400 Bad Request**; Postgres error code `23502`: *"null value in column 'id' of relation 'products' violates not-null constraint"*. Confirms `id` is NOT auto-generated by database default and MUST be supplied by application layer (`toDbRow(input, true)`). |
| 3 | Custom text `id` generation (`toDbRow`) | `{ id: "boemi-tkro-test-mtmdxjwg", ... }` | **HTTP 201 Created**; row successfully created and queryable. Confirms format `boemi-${catCode}-${slugClean}-${Date.now().toString(36)}` perfectly matches `text` PK requirements. |
| 4 | Duplicate `slug` collision | Two rows with identical `slug: "test-dup-slug-..."` | **Postgres error code 23505**: *"duplicate key value violates unique constraint 'products_slug_key'"*. First row succeeds, second row fails cleanly. |
| 5 | Non-existent category foreign key | `{ category: "non_existent_category_xyz", ... }` | **Postgres error code 23503**: *"insert or update on table 'products' violates foreign key constraint 'products_category_fkey'"*. Confirms FK referential integrity is strictly enforced against `boemi.categories`. |
| 6 | Updating non-existent `id` or `slug` | `.update(...).or('id.eq.dummy-999,slug.eq.dummy-999')` | **HTTP 200 OK / 204 No Content** with 0 rows modified; no exception thrown. |
| 7 | Deleting non-existent `id` or `slug` | `.delete().or('id.eq.dummy-999,slug.eq.dummy-999')` | **HTTP 200 OK / 204 No Content** with 0 rows modified; no exception thrown. |
| 8 | Extreme `bigint` pricing | `price: 15000000000` (15 Billion Rupiah) | **HTTP 201 Created**; PostgreSQL `bigint` persists and retrieves exact integer `15000000000` without numeric overflow or precision loss. |
| 9 | Special characters, quotes & emojis in name/desc | `name: 'Mesin: 100% "Kualitas" & \'Presisi\' 🛠️'`, `description` with `\r\n`, quotes, and symbols | **HTTP 201 Created**; text preserved verbatim without SQL injection, truncation, or escaping corruptions. |
| 10 | Video link extraction from `gallery` | `gallery: [ "img1.png", "https://www.youtube.com/watch?v=xyz", "img2.png" ]` | `fromRow()` and `mapRowToProduct()` extract `video: "https://www.youtube.com/watch?v=xyz"` and leave `images: ["img1.png", "img2.png"]`. Video and photo slots are completely preserved across roundtrips. |

---

## 5-Component Handoff Report

### 1. Observation

1. **Environment Configuration**:
   - File: `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`: `"https://ospkhjgjrxlogjlegftf.supabase.co"` (present and valid)
   - `SUPABASE_SERVICE_ROLE_KEY`: JWT for service role present (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: JWT for anon role present (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Schema target: All database queries configure `db: { schema: "boemi" }` (`lib/supabase.ts:17`, `lib/supabase-server.ts:16`, `lib/admin/supabase-admin.ts:29`, `lib/products.ts:82`).

2. **Schema Definition of `boemi.products`**:
   - Source: Introspected via PostgREST OpenAPI endpoint `GET /rest/v1/?apikey=${serviceKey}` with `Accept-Profile: boemi`.
   - Verified 29 columns:
     1. `id` (`text`, primary key, not-null, no database default)
     2. `slug` (`text`, unique not-null)
     3. `name` (`text`, not-null)
     4. `sku` (`text`, nullable)
     5. `category` (`text`, foreign key to `categories.slug`)
     6. `brand` (`text`, default `'Boemi'`)
     7. `manufacturer` (`text`, nullable)
     8. `country_of_origin` (`text`, default `'PDN'`)
     9. `description` (`text`, default `''`)
     10. `price` (`bigint`, default `0`)
     11. `compare_at_price` (`bigint`, nullable)
     12. `cost_price` (`bigint`, nullable)
     13. `stock` (`integer`, default `0`)
     14. `reserved_stock` (`integer`, default `0`)
     15. `incoming_stock` (`integer`, default `0`)
     16. `min_order_qty` (`integer`, default `1`)
     17. `image` (`text`, nullable)
     18. `gallery` (`jsonb`, array)
     19. `documents` (`jsonb`, array)
     20. `competency_code` (`text`, nullable)
     21. `curriculum_code` (`text`, default `'BSKAP 2026'`)
     22. `industry_standard` (`text`, nullable)
     23. `meta_title` (`text`, nullable)
     24. `meta_description` (`text`, nullable)
     25. `status` (`text`, default `'active'`)
     26. `active` (`boolean`, default `true`)
     27. `featured` (`boolean`, default `false`)
     28. `featured_position` (`integer`, default `0`)
     29. `created_at` (`timestamptz`, default `'now()'`)
     30. `updated_at` (`timestamptz`, default `'now()'`)
   - Direct count check: `GET /rest/v1/products?select=*&limit=1` returns `Content-Range: 0-0/263` (263 active rows).

3. **`video` Column Verification**:
   - Column `video` does **NOT** exist in `boemi.products`.
   - Directly sending `video` in a POST/PATCH request to `/rest/v1/products` produces:
     ```json
     {"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'video' column of 'products' in the schema cache"}
     ```
   - In `lib/admin/products.ts` lines 84-125 (`toDbRow`):
     - `video` is appended to `galleryList` if provided:
       ```typescript
       if (input.video && input.video.trim()) {
         const cleanVid = input.video.trim();
         if (!galleryList.includes(cleanVid)) {
           galleryList.push(cleanVid);
         }
       }
       ```
     - `row` payload includes ONLY: `slug`, `name`, `category`, `description`, `price`, `stock`, `image`, `gallery`, `active`, `updated_at`, `id`, `sku`, `brand`.
     - Key `video` is NEVER included in `row`.
   - In `lib/admin/products.ts:42-67` (`fromRow`) and `lib/products.ts:34-49` (`mapRowToProduct`):
     - Extracts the video URL using `isVideoLink(g)` and sets `product.video`.

4. **`id` Column Generation**:
   - In PostgreSQL, `id` has NO default generator (it does not use `gen_random_uuid()` or `serial` in `boemi.products`).
   - Directly inserting a row without `id` produces:
     ```json
     {"code":"23502","details":"Failing row contains (null, ...).","hint":null,"message":"null value in column \"id\" of relation \"products\" violates not-null constraint"}
     ```
   - In `lib/admin/products.ts:117-119` (`toDbRow` when `generateId = true`):
     ```typescript
     if (generateId) {
       row.id = `boemi-${catCode}-${slugClean}-${Date.now().toString(36)}`;
     }
     ```
   - In `lib/admin/products.ts:205-225` (`createProduct`):
     - `const dbPayload = toDbRow(input, true);`
     - Inserts the row with explicit non-null `id`.
     - Confirmed via live execution: returns `201 Created` with generated ID.

5. **Revalidation & Sync Wiring**:
   - `app/admin/produk/actions.ts`:
     - `createProductAction` (lines 162-170): calls `revalidatePath('/', 'layout')`, `revalidatePath('/')`, `revalidatePath('/admin/produk')`, `revalidatePath('/admin')`, `revalidatePath('/cari')`, `revalidatePath('/kategori/${input.category}')`, `revalidatePath('/produk/${input.slug}')`.
     - `updateProductAction` (lines 198-207): calls `revalidatePath('/', 'layout')`, `revalidatePath('/')`, `revalidatePath('/admin/produk')`, `revalidatePath('/admin/produk/${id}')`, `revalidatePath('/admin')`, `revalidatePath('/cari')`, `revalidatePath('/kategori/${input.category}')`, `revalidatePath('/produk/${input.slug}')`.
     - `deleteProductAction` (lines 242-253): calls `revalidatePath('/', 'layout')`, `revalidatePath('/')`, `revalidatePath('/admin/produk')`, `revalidatePath('/admin')`, `revalidatePath('/cari')`, `revalidatePath('/kategori/${existing.category}')`, `revalidatePath('/produk/${existing.slug}')`.
   - `lib/products.ts` (lines 85, 169):
     - Configures `cache: "no-store"` on fetch requests against Supabase REST endpoint, eliminating stale data caching.

---

### 2. Logic Chain

1. **DB Connectivity**:
   - Observation 1 proves valid live credentials in `.env.local` connecting to `https://ospkhjgjrxlogjlegftf.supabase.co` under schema `boemi`.
   - Querying `/rest/v1/products` returns HTTP 200/206 with 263 rows.
   - Therefore, the database is active, reachable, and authenticated.

2. **Schema Safety & Column Mapping**:
   - Observation 2 reveals the exact 29 columns on `boemi.products`.
   - Observation 3 confirms that `video` does not exist as a column and triggers `PGRST204` if included in payload.
   - Inspection of `lib/admin/products.ts` proves that `toDbRow()` sanitizes input by routing `video` into `gallery` JSONB and only passing known columns to PostgREST.
   - Live testing of the full CRUD lifecycle confirms that inserts, updates, and deletes succeed without schema cache or unmapped key errors.

3. **`id` Column Integrity**:
   - Observation 4 proves that the database rejects inserts lacking `id` with error `23502`.
   - Inspection of `createProduct` proves that `generateId = true` is passed to `toDbRow`, creating a clean unique `text` ID.
   - Live test confirmed insertion of custom generated ID succeeds with HTTP 201.

4. **Catalog Revalidation**:
   - Observation 5 confirms comprehensive path revalidation (`revalidatePath('/', 'layout')` + dynamic routes) on all product mutations.
   - Combined with `cache: "no-store"` on storefront data access, updates in admin immediately propagate to storefront and admin UI without requiring a hard refresh or server restart.

---

### 3. Caveats

1. **Multi-tenant public schema vs boemi schema**: The database project contains shared schemas (`public` and `boemi`). All clients MUST explicitly specify `db: { schema: "boemi" }` or headers `Accept-Profile: boemi` / `Content-Profile: boemi`. Omitting this defaults to `public`, which does not contain the current product catalog. All files in `lib/` properly include this configuration.
2. **Slug uniqueness**: The `slug` column has a unique constraint. If an admin creates a product with a slug identical to an existing one, Postgres raises error `23505`. `app/admin/produk/actions.ts` handles this by surfacing the error to the form state.
3. **No direct DB migration required for video**: Because `video` is mapped into `gallery` JSONB and extracted via URL pattern matching, no risky schema migrations (`ALTER TABLE boemi.products ADD COLUMN video text`) are required.

---

### 4. Conclusion

Requirement R1 (Database Integration & Schema Safety) is thoroughly verified and in robust compliance with specifications:
- **Connection**: Live Supabase DB connection via `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` is fully operational.
- **Schema Safety**: The `boemi.products` table schema contains 29 columns. No unmapped keys (such as `video`) are passed to Supabase REST payloads; video URLs are safely persisted in `gallery` and parsed by application logic.
- **ID Generation**: Non-null text IDs are deterministically generated on product creation, preventing `23502` null constraint violations.
- **CRUD Operations**: Create, Read, Update, Delete, and List operations execute without error.
- **Revalidation**: `revalidatePath('/', 'layout')` and granular subpath revalidations are wired into all mutating server actions, ensuring zero-latency catalog synchronization.

---

### 5. Verification Method

To independently verify these findings, run the following commands from the project root:

1. **TypeScript Type Check**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: Passes with 0 errors.

2. **Automated Tier 1 Test Suite**:
   ```powershell
   node tests/e2e/tier1_features.test.mjs
   ```
   *Expected outcome*: 29/29 tests pass with 0 failures, verifying live REST queries, schema isolation, category filtering, and Server Actions.

3. **Dedicated Schema & CRUD Probe Scripts**:
   ```powershell
   node .agents/teamwork_preview_spec_miner_r1/probe_schema.mjs
   node .agents/teamwork_preview_spec_miner_r1/test_crud_lifecycle.mjs
   node .agents/teamwork_preview_spec_miner_r1/probe_edge_cases.mjs
   ```
   *Expected outcome*:
   - `probe_schema.mjs` verifies OpenAPI schema, column list, `PGRST204` on direct video insert, and `23502` on omitted ID.
   - `test_crud_lifecycle.mjs` verifies end-to-end Create, Read, Update, Delete, and Deletion verification against live Supabase.
   - `probe_edge_cases.mjs` verifies duplicate slug rejection, special character handling, foreign key validation, and bigint price limits.

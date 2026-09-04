# Task Assignment: Database Integration & Schema Safety (R1) Spec Mining

**Agent Identity**: `teamwork_preview_spec_miner_r1`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Scope Document**: `E:\tmp\boemi-next-clean\PROJECT.md`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  

## Mission
Perform an exhaustive spec and code investigation into Requirement R1:
1. Verify Supabase DB connection using live environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`).
2. Examine `boemi.products` table schema in database / migrations / schema definitions (`supabase/` or SQL scripts). Specifically check:
   - What columns exist on `boemi.products`?
   - Does `video` exist as a column in `boemi.products`? If NOT, does sending `video` in DB payload cause a Supabase error (PGRST204: Could not find the column 'video' in the schema cache)?
   - How is `id` generated? Is it UUID, serial, or auto-generated non-null? What happens on product creation if `id` is or isn't supplied?
   - Check all CRUD operations in `lib/admin/products.ts`, `app/admin/produk/actions.ts`, and `lib/products.ts`. Are any unmapped keys passed into `.insert()` or `.update()`?
3. Verify immediate global revalidation on storefront and admin via `revalidatePath('/', 'layout')` and related routes.

## Deliverables
Write your exhaustive analysis to `E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1\handoff.md` with:
- Observation (verified facts, file paths, line numbers)
- Schema analysis of `boemi.products` vs application code payloads
- Recommendations for any fixes needed
- Conclude with a send_message to orchestrator parent.

## 2026-09-04T03:17:23Z
You are teamwork_preview_spec_miner_r1.
Working directory: E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1
Project root: E:\tmp\boemi-next-clean
Authoritative request: E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md
Task assignment: E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1\DISPATCH.md
Scope document: E:\tmp\boemi-next-clean\PROJECT.md

Your mission:
Investigate Requirement R1 (Database Integration & Schema Safety):
1. Verify Supabase DB connection using live environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
2. Examine the boemi.products table schema in Supabase / migrations / SQL scripts.
   - What columns are defined on boemi.products?
   - Does a 'video' column exist in the database table boemi.products? If not, check if CRUD code in lib/admin/products.ts or app/admin/produk/actions.ts attempts to insert/update 'video' directly into the database payload and if that causes errors.
   - How is 'id' generated? Is it auto-generated non-null in Postgres (e.g. uuid_generate_v4() or gen_random_uuid() or default)? What does createProduct in lib/admin/products.ts do?
   - Check all CRUD operations (Create, Edit/Update, Delete, List). Are any unmapped keys passed into Supabase REST / client payloads?
3. Verify immediate global revalidation on storefront and admin via revalidatePath('/', 'layout') and other paths.

Write your exhaustive findings and recommendations to E:\tmp\boemi-next-clean\.agents\teamwork_preview_spec_miner_r1\handoff.md and report back via send_message.

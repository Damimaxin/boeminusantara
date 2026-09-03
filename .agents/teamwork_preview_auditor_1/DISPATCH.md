# Forensic Integrity Auditor Task Assignment

## 2026-09-01T08:52:57Z
## Mission
Conduct an exhaustive forensic integrity audit of the Boemi Nusantara codebase at `E:\tmp\boemi-next-clean` to ensure zero cheating, zero hardcoding of test results, zero dummy facades, and genuine logic implementation across R1, R2, and R3.

## Audit Checklist
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, `TEST_INFRA.md`, and `TEST_READY.md`.
2. Inspect source code for hardcoded test inputs, static strings masquerading as dynamic responses, or bypassing logic.
3. Verify that database operations query the genuine Supabase instance and `boemi` schema without mocked interceptors.
4. Verify that `revalidatePath` calls genuinely trigger Next.js cache purging.
5. Verify that all 6 admin buttons and 6 storefront buttons execute genuine business logic and state updates.
6. Verify that media storage upload and CDN URL generation use genuine Supabase Storage client calls.
7. Record structured verdict (`CLEAN` or `INTEGRITY VIOLATION` / `CHEATING DETECTED`) in `handoff.md` and send message to orchestrator.

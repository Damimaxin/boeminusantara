# Challenger 2 Task Assignment

## Mission
Adversarially challenge and stress-test the Boemi Nusantara system (admin Server Actions, product CRUD, 9 photo slots + 1 video slot handling, YouTube parsing, CDN URLs, deletion workflow, and cache invalidation).

## Verification Checklist
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, `TEST_INFRA.md`, and `TEST_READY.md`.
2. Write and execute stress tests against admin form inputs, malformed media payloads, non-contiguous photo slots, zero/negative stock/price, deletion actions, and revalidations.
3. Verify admin buttons ("Tambah Produk Baru", "Simpan Perubahan", "Hapus Produk", "Kelola Kategori", "Publish/Draft Toggle", "Surat Penawaran").
4. Record verdict (`APPROVE` or `REJECT`) with empirical evidence in `handoff.md` and send message to orchestrator.

## 2026-09-01T08:52:57Z
You are Challenger 2 for Boemi Nusantara system verification (Admin CRUD, Media & Auth Focus).
Your working directory is E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_2.
Read E:\tmp\boemi-next-clean\ORIGINAL_REQUEST.md, E:\tmp\boemi-next-clean\PROJECT.md, E:\tmp\boemi-next-clean\TEST_INFRA.md, E:\tmp\boemi-next-clean\TEST_READY.md, and E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_2\DISPATCH.md.
Adversarially stress-test admin server actions, product create/update/delete validation, 9 photo slots + 1 video slot handling, YouTube parsing, CDN URLs, deletion workflows, and cache revalidations.
Document your test harness, empirical results, and verdict (APPROVE or REJECT) in handoff.md and send a message to orchestrator (05e939e6-6111-4825-80a4-5d07e322d50e).

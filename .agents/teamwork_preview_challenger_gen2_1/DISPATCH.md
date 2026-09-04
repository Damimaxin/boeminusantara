# Task Assignment: Storefront Pagination & Search Adversarial Stress Testing (Challenger 1)

**Agent Identity**: `teamwork_preview_challenger_gen2_1`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_gen2_1`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  
**Scope Document**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_orchestrator_2\SCOPE.md`  

## Mission
1. Execute aggressive, empirical adversarial testing against storefront pagination, search, category routing, and query parameters:
   - Out-of-bounds page requests (`page=999`, `page=1000000`): verify products return valid non-empty slice from last page and pagination control matches.
   - Zero and negative page requests (`page=0`, `page=-5`): verify clamped to page 1.
   - Non-integer / float pages (`page=1.5`, `page=2.9`, `page=NaN`, `page=abc`): verify clamped to valid integers.
   - PageSize variations (`pageSize=0`, `pageSize=-1`, `pageSize=999999`): verify safe clamping.
   - Search queries with special characters: `q=mesin,las`, `q=()`, `q=&&`, `q='"`: verify no PostgREST 400 crashes or query breakdowns.
   - Category navigation: `/kategori/pemesinan`, `/kategori/audio-video`, `/kategori/k3-safety`, subcategory `/kategori/tkro-mesin`: verify no 404s and live product retrieval.
   - Empty state verification: `/cari?q=nonexistent12345` and empty categories.
2. Write a dedicated test harness if helpful and run against the live system.
3. Provide a clear verdict: **APPROVE** or **REQUEST_CHANGES**.

Write your adversarial report to:
`E:\tmp\boemi-next-clean\.agents\teamwork_preview_challenger_gen2_1\handoff.md`
and report back via send_message.

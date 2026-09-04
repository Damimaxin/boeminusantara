# Task Assignment: Pagination & Search/Filter Wiring (R2) Exploration

**Agent Identity**: `teamwork_preview_explorer_r2`  
**Working Directory**: `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r2`  
**Project Root**: `E:\tmp\boemi-next-clean`  
**Scope Document**: `E:\tmp\boemi-next-clean\PROJECT.md`  
**Authoritative Request**: `E:\tmp\boemi-next-clean\.agents\ORIGINAL_REQUEST.md`  

## Mission
Perform an exhaustive code and behavior investigation into Requirement R2:
1. Examine storefront pagination at:
   - `/` (`app/page.tsx`)
   - `/cari` (`app/cari/page.tsx`)
   - `/kategori/[slug]` (`app/kategori/[slug]/page.tsx`)
2. Audit query parameter handling:
   - How are `page`, `pageSize`, `q`, `sort`, `category` parsed, defaulted, and sanitized?
   - How are total counts and totalPages computed?
   - How are edge cases handled: `page < 1`, `page > totalPages`, `page` is non-numeric (NaN), `pageSize <= 0`? Does the UI crash, show blank items, or properly clamp / redirect / render valid ranges?
   - How are pagination controls (Prev, Next, page numbers, ellipsis) rendered in `components/Pagination.tsx` or other components?
3. Verify empty states when zero search results are found:
   - On `/cari?q=nonexistent`, is an empty state UI displayed gracefully?
   - On `/kategori/[slug]` with no products, is an empty state displayed?

## Deliverables
Write your exhaustive analysis to `E:\tmp\boemi-next-clean\.agents\teamwork_preview_explorer_r2\handoff.md` with:
- Observation (code analysis, file paths, line numbers)
- Identified flaws or missing edge-case handling in pagination & search
- Concrete recommendations for fixes
- Conclude with a send_message to orchestrator parent.

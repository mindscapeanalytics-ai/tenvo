# App-wide Load & Dataflow Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix verified P0/P1 load bottlenecks across hub inventory, invoices, storefront homepage catalog, Redis tenant resolve, image optimization, and hub bootstrap duplication — without breaking POS, storefront checkout, or inventory edit contracts.

**Architecture:** Prefer lean list payloads + lazy detail; parallelize independent storefront rails while keeping one-connection option for warm paths; make Redis L2 actually skip domain SQL; collapse duplicate client bootstrap; enable Next image optimization only in production.

**Tech Stack:** Next.js App Router, Prisma + pg pool, React Server Components, Server Actions, Redis L2, unstable_cache

## Global Constraints

- Keep desktop layouts unchanged; dual-layout `lg:` patterns stay as-is.
- Public storefront must keep UUID inventory truth (no catalog_preview in orderable UI).
- Hub inventory display stock still via `ProductService.resolveDisplayStock` / existing paths.
- Do not break barcode scan, POS catalog, or `upsertIntegratedProductAction` save paths.
- Prefer pagination defaults that preserve UX (grids still feel complete) — virtualize later if needed.
- No em dashes in user-facing copy.
- Run targeted tests after each subsystem; do not force-push or commit unless asked.

---

## File map

| Area | Primary files |
|------|----------------|
| Hub inventory | `lib/services/ProductService.js`, `lib/context/DataContext.js`, product API wrappers, InventoryManager callers |
| Invoices | `lib/actions/basic/invoice.js`, `DataContext.fetchSales` |
| Homepage catalog | `lib/storefront/storeHomeCatalog.js`, `lib/actions/storefront/products.js` (COUNT), store page consumers |
| Images | `next.config.js` |
| Redis resolve | `lib/tenancy/resolveStorefrontBusiness.js` |
| Hub bootstrap | `DashboardClient` / `DataContext.js` |
| Categories / PDP | store layout/page, `products/[slug]/page.jsx` |
| Pool | `lib/db.js` |
| Context | `lib/context/BusinessContext.js` |
| Domain ops | `lib/actions/dashboard/domainOperationsSnapshot.js` |

---

## Task 1: Lean paginated hub inventory + kill serials double-fetch

**Goal:** Hub bootstrap and Inventory tab no longer load entire catalog twice with full relations.

- [ ] Inspect `ProductService.getProducts` options and all hub callers (`productAPI.getAll`, InventoryManager, POS)
- [ ] Add lean list mode: default `includeSerials: false`, optional `includeBatches`/`includeLocations` for list; pagination defaults when limit/offset omitted for hub list path OR explicit `listMode: true`
- [ ] Change `DataContext.fetchInventory` to single lean fetch; remove background `includeSerials: true` full reload
- [ ] Ensure edit/save paths still load serials when needed (expand/edit action or existing product detail)
- [ ] Verify POS still gets what it needs (may keep full or separate POS fetch)

**Done when:** Cold hub inventory network shows one paginated/lean payload; serials not double-fetched; product save still works.

## Task 2: Bound invoices on hub bootstrap

- [ ] Add `limit`/`offset` or `take` + date-range to `getInvoicesAction` for list
- [ ] Dashboard bootstrap uses recent page or aggregates-only path
- [ ] Balance enrichment only for returned page (or open invoices)
- [ ] Keep a path for full export if any UI needs it (explicit opt-in)

**Done when:** `fetchSales` no longer pulls unbounded invoices + items.

## Task 3: Slim & parallelize homepage catalog plan

- [ ] Update `buildStoreHomeCatalogPlan` to set `needFeatured/Newest/OnSale` false when elevated verticals discard them
- [ ] Cap restaurant demo homepage popularity (e.g. 80); keep larger limit only for dedicated menu if needed
- [ ] Parallelize independent rail fetches (Promise.all with separate short connections OR release sequential hold) — prefer Promise.all of independent `fetchStorefrontProducts` without holding one client for all sequential awaits
- [ ] Slim COUNT SQL: remove LATERAL from count queries
- [ ] Bump jewellery `popularityLimit` to 80 when jewellery elevated

**Done when:** Elevated homepage cold miss runs fewer rails; COUNT cheaper; rails overlap in wall time.

## Task 4: Production image optimization

- [ ] Set `unoptimized: process.env.NODE_ENV !== 'production'` (or env flag) in `next.config.js`

**Done when:** Production builds optimize images; local/dev remains safe.

## Task 5: Redis L2 real DB skip

- [ ] On Redis hit in shell + compact resolve: use `queryBusinessRowById` or trust compact payload with async soft revalidate
- [ ] Do not block request on multi-key Redis TTL refresh
- [ ] Preserve disable/domain-change correctness via existing invalidation tags

**Done when:** Redis hit path avoids `LOWER(domain)` scan on every request.

## Task 6: Hub bootstrap dedupe

- [ ] Stop `DashboardClient` from re-fetching modules already owned by `DataContext` when shell ready
- [ ] Prefer DataContext as single orchestrator for dashboard tab

**Done when:** Network tab shows one set of module fetches on cold dashboard load.

## Task 7: Categories unify + PDP related products

- [ ] Prefer catalog categories with counts once; avoid duplicate shell+catalog category queries where safe
- [ ] PDP uses `related_products` from slug fetch OR stop computing related inside slug fetch

**Done when:** One category source on homepage miss; one related query on PDP.

## Task 8: Pool safety

- [ ] Shorten `connectionTimeoutMillis` (e.g. 5s) with fail-loud; document pooler expectation
- [ ] Avoid long-held single client across homepage after parallelization

**Done when:** Hung acquires fail faster; homepage does not pin one client for all rails.

## Task 9: Context memoization + domain-ops parallel

- [ ] Memoize `BusinessContext` provider value + stable callbacks
- [ ] Parallelize independent queries in domain operations snapshot

**Done when:** Fewer hub re-renders; domain-ops wall time reduced.

## Task 10: Verification

- [x] Run relevant unit tests for storefront catalog / jewellery if present
- [x] Smoke: inventory list action, invoice list action, storeHomeCatalog plan unit expectations
- [x] Report remaining risks (POS full catalog, large-tenant virtualization)

**Verified:** `verify:storefront-domain-resolution`, `verify:cache-wiring`, `verify:domain-operations` pass.

---

## Implementation status (2026-07-16)

### Completed

| Area | Change |
|------|--------|
| Hub inventory | Default `includeSerials: false`; removed background full-catalog serial reload in `DataContext`; direct inventory fallback loads explicitly use serial-deferred lists |
| Inventory edit/view | Deferred serial products lazy-load full product details before edit/view so fast lists do not hide existing serial rows |
| Purchases / PO | Purchase order product pickers explicitly request serial-deferred product lists |
| Hub invoices | `getInvoicesAction` capped at 500 + date range + `customerId`/`statusIn` filters; slim line items |
| Storefront homepage | Parallel rails via `Promise.all`; vertical-aware plan skips unused rails; restaurant demo cap 80 |
| Storefront COUNT | Removed LATERAL from count SQL |
| Images | `unoptimized` only in development |
| Redis resolve | PK lookup on cache hit + alias validation (no `LOWER(domain)` scan every hit) |
| Hub bootstrap | `DashboardClient` no longer duplicates dashboard module fetches |
| PDP | Reuses `related_products` from slug fetch |
| Pool | 5s acquire timeout; `PG_POOL_MAX` env override |
| BusinessContext | Memoized provider value + stable callbacks |
| Domain ops | Parallelized independent snapshot queries |

### Remaining follow-ups (non-blocking)

- Hub inventory grid pagination/virtualization for 5k+ SKUs (list is lean but still loads all products for POS/inventory tab)
- Persisted tsvector / trgm for storefront search
- `LOWER(domain)` functional index migration
- Shell vs catalog category dedupe (layout categories lack `product_count`)
- Streaming Suspense per homepage rail (polish)

---

## Out of scope (defer)

- Full Zustand rewrite of DataContext
- Persisted tsvector migration (search) — note as follow-up
- LOWER(domain) index migration — note as follow-up unless quick
- Streaming Suspense per-rail RSC split (polish)

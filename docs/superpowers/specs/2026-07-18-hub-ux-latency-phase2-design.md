# Hub UX Latency Phase 2 — Design Spec

**Date:** 2026-07-18  
**Status:** Implemented (Phase 2)  
**Extends:** `2026-07-17-hub-enterprise-shell-bootstrap-design.md` (Phase 1 implemented)  
**Scope:** Lean KPI SQL, slim product list DTO + progressive inventory enrichment, sales headers-only tab enter, Finance/Inventory tab keep-alive, patch-first mutations, in-flight coalesce  
**Non-scope:** Full React Query rewrite of DataContext, Redis hub cache, storefront checkout, POS catalog rewrite

## Problem

Phase 1 delivered single-auth bootstrap + SWR shell cache, but perceived lag remains:

1. KPI CTE still uses `SELECT *` on invoices/POS/storefront (materializes unused columns).
2. Product list always joins batches + stock_locations + variants (fat payload for Overview).
3. Sales tabs upgrade to `includeItems: true` + limit 500 on first open.
4. Radix tab unmount remounts FinanceHub → 7 guarded actions every visit.
5. Several mutations still `await fetchInventory({ force: true })` (sometimes with serials).

## Goals

1. **Faster cold Overview** without changing KPI math correctness.
2. **Progressive inventory** — slim list for shell; richer grid rows when Inventory tab needs them (non-blocking).
3. **Sales list instant** — headers + customers; line items on invoice open only.
4. **Tab revisit ≈ instant** — Finance/Inventory keep instance or cached payload.
5. **Mutation UX** — patch local state; never block UI on full catalog + serials for list refresh.
6. **Accurate dataflow** — display stock, invoice balances, GL unchanged; no silent stale after writes.

## Approach

**Progressive enrichment (enterprise pattern):** paint lean accurate aggregates first; enrich detail in background or on demand. Same pattern as Zoho Books / Busy / Stripe Dashboard.

## Design

### 1. Lean KPI SQL

In `getDashboardKPIs` CTEs, select only columns referenced by outer aggregates:

| CTE | Columns |
|-----|---------|
| period_invoices / all_invoices | `grand_total`, `status`, `payment_status` |
| period_pos | `total_amount` |
| period_storefront | `total_amount`, `status` |
| period_purchases | `total_amount`, `status` |
| period_expenses | `amount` |
| period_payments | `amount`, `payment_type` |

### 2. Slim product list DTO

`ProductService.getProducts` gains `detailLevel`:

| Level | Includes | Used by |
|-------|----------|---------|
| `list` (default for hub shell) | Product row + `stock_locations` only (needed for `resolveDisplayStock`) — **no** batches/variants/serials | Bootstrap, Overview |
| `grid` | list + batches + variants (`includeSerials: false`) | Inventory tab enrichment |
| `full` | grid + serials when requested | Edit/export |

Flag `_detailLevel` / `_relationsDeferred` on list rows so saves never wipe deferred relations.

Inventory tab: if products are `list`-depth, call `fetchInventory({ force: true, detailLevel: 'grid' })` in background without clearing UI.

### 3. Sales tab

`fetchSales({ mode: 'full' })` means:

- invoices limit ≤ 500, **`includeItems: false`**
- customers + quotations loaded

Line items: existing per-invoice `getInvoice` / open-builder path only. Do not bulk-load items on tab enter.

### 4. Tab keep-alive

- FinanceHub: skip `loadData` when `businessId` unchanged and data already loaded this session (`loadedBusinessIdRef`); expose `onRefresh` for explicit refresh.
- Dashboard tabs: `forceMount` for `finance` and `inventory` (or CSS hide inactive) so remount cost drops. Prefer FinanceHub cache first (safer); add forceMount if remount still expensive.

### 5. Mutations

| Action | After success |
|--------|---------------|
| Product save | Keep patch + compactSave; fallback `fetchInventory` **without** `includeSerials: true` |
| Location CRUD | Patch `locations` in DataContext; optional soft inventory refresh (`void`, not await) |
| Stock transfer / PO receive | Patch affected products if response includes them; else `void fetchInventory({ force: true, detailLevel: 'grid' })` (non-blocking) |
| Customer save | Patch customer in state; avoid full `await fetchSales` when possible |

### 6. In-flight hygiene

Replace busy-wait loops with a single trailing “pending force” flag (already partially designed in inventory dataflow spec). Cap wait; coalesce duplicate force requests.

## Verification

- Cold Overview: KPI SQL lean; products arrive with `_detailLevel: 'list'`
- Inventory tab: UI shows shell products immediately; grid enrichment does not flash empty
- Invoices tab: network has no bulk invoice_items payload
- Finance tab leave/return: no second full load unless force refresh
- Product Busy save: no `await fetchInventory` when patch succeeds
- `bun run verify:inventory-wiring` (and finance/hub verifies if touched)

## Out of scope

Redis hub cache, full TanStack Query migration of all modules, storefront, POS unbounded catalog.

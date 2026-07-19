# Hub SWR Paint + Keep-Alive Tabs — Design Spec

**Date:** 2026-07-19  
**Status:** Implemented (Approach B + visit-based forceMount)  
**Extends:** `2026-07-17-hub-enterprise-shell-bootstrap-design.md` (closes Phase-1 paint/remount gaps)

## Problem

Shell bootstrap exists, but UX still shows empty frames and “data after a few seconds” because:

1. **Clear-before-hydrate** — `DataContext` zeroes all lists/KPIs on `businessId` change before cache apply / network.
2. **Tab unmount storms** — Radix `TabsContent` unmounts managers; remount re-fetches local state.
3. **Finance sub-nav remount** — `AnimatePresence` keyed on tab+report destroys report trees.
4. **Dual SOTs** — Analytics/Sales ignore React Query prefetch; `fetchFinance` re-runs snapshot KPIs; date force clears all shell cache keys for a business.

## Goals

1. Warm paint: never blank Overview when session cache exists for `(businessId, from, to)`.
2. Tenant switch: keep previous visible until new payload applies (no cross-tenant leak — only same-key cache; otherwise keep previous with soft revalidating until success, then swap atomically).
3. Tab leave/return: hot tabs stay mounted (`forceMount`); no skeleton if data already loaded.
4. One SOT for Overview KPIs (shell); FinanceHub reports keep local session cache; Sales/Analytics consume RQ.
5. Zero correctness regressions: tenancy, saves, POS, finance reports.

## Non-goals

- Zustand DataContext rewrite  
- Full RSC hub streaming  
- POS catalog rewrite / storefront homepage  
- Mounting every hub tab forever (only hot set)

## Decision

**Approach B** with **forceMount** on hot `TabsContent` (Overview, Inventory, Invoices, Finance, Sales/Reports/Analytics as applicable).

## Architecture

```
businessId / date change
  → readHubShellCache(key) sync
  → if hit: applyHubShellPayload (keep painted)
  → else: keep previous arrays OR clear only if switching tenant without cache
  → fetchHubShell revalidate (force only when date/tenant requires)
  → apply new payload atomically

Tabs
  → forceMount on hot contents
  → CSS hidden when inactive (Radix default with forceMount)
  → FinanceHub: no remount key on sub-nav; CSS/conditional render
  → SalesManager / AdvancedAnalytics: useQuery + placeholderData keepPrevious
```

### Tenant safety

- Cache keys always include `businessId`.
- Never apply cache for business B while viewing business A.
- On tenant change without cache: may clear after marking revalidating; prefer empty skeleton only when no previous *same* business data and no cache.

### Hot tabs (forceMount)

`dashboard`, `inventory`, `invoices`, `finance` (and sales/reports/analytics tab ids used in DashboardTabs).

Lazy chunk still loads once; after first visit stays mounted.

## Success criteria

| Journey | Target |
|---------|--------|
| Warm Overview same range | Instant KPIs from cache; soft revalidate |
| Refresh same session | No multi-second blank if cache present |
| Leave Finance → return | Instant; no remount fetch storm |
| Finance Statements ↔ Overview | No GL remount |
| Sales / Visual Analytics revisit | Paint from RQ cache |
| Date preset change | Keep prior KPIs until new shell; clear only that range cache key |
| Cross-tenant | Never show other business rows |

## Out of scope follow-ups

Wire full shell through `useQuery(['hubShell', …])` as sole store (Phase 3). This pass bridges DataContext + sessionStorage + forceMount + RQ for analytics/sales.

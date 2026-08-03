# Hub SWR Paint + Keep-Alive Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Eliminate empty-frame and tab-remount delayed paint across hub dashboards.

**Architecture:** Sync sessionStorage apply before clear; forceMount hot tabs; stop Finance remount keys; Sales/Analytics use React Query keepPrevious; date cache clear per-key only.

**Tech Stack:** React, DataContext, sessionStorage hubShellCache, Radix Tabs, TanStack Query, FinanceHub

**Status:** Implemented 2026-07-19

## Global Constraints

- Never leak cross-tenant data (cache key includes businessId).
- Do not break Inventory/POS save or finance report correctness.
- Prefer keep-previous over hard clear when safe.
- No em dashes in UI copy.

---

### Task 1: DataContext keep-previous + sync cache

**Files:** `lib/context/DataContext.js`, `lib/dashboard/hubShellCache.js`

- [x] On businessId init: if `readHubShellCache(hubShellCacheKey(...))` hit, `applyHubShellPayload` before/instead of zeroing KPIs/lists.
- [x] If no cache: clear shell-owned state only (tenant-safe).
- [x] On force date change: clear only that cache key via `clearHubShellCacheKey`.
- [x] Secondary modules always reset on tenant change.

### Task 2: forceMount hot TabsContent

**Files:** `app/business/[category]/components/DashboardTabs.jsx`

- [x] Visit-based `forceMount` for dashboard, inventory, invoices, finance, sales, reports, customers, purchases.

### Task 3: FinanceHub stop remount

**Files:** `components/finance/FinanceHub.jsx`

- [x] Remove `AnimatePresence` remount key; render content without destroying on sub-nav animation.

### Task 4: Sales + Analytics RQ keepPrevious

**Files:** `components/SalesManager.jsx`, `components/AdvancedAnalytics.jsx`

- [x] `useQuery` with same-tenant `placeholderData`; skeleton only when no data.
- [x] AdvancedAnalytics shares `hubAnalytics` key with DataContext prefetch.

### Task 5: Skip redundant finance KPI path

- [x] Already gated by `moduleReady.finance` from shell; date force no longer wipes all shell cache keys.

### Hardening (post-implement review)

- [x] Canonical `lib/dashboard/hubQueryKeys.js` (YYYY-MM-DD keys; same-tenant placeholder)
- [x] Shell cache prefix v2 + payload shape validation
- [x] DataContext dates via `toAnalyticsIsoDate` (aligned with bootstrap/RQ)
- [x] FinanceHub SWR soft-revalidate (cache paint + network; no stale forever)
- [x] Keep-alive reset + `wrapTab` key on tenant switch
- [x] FinancialReports skip PL/BS/CF refetch when data already in memory
- [x] Mutation invalidates hubAnalytics + hubSalesPerformance query prefixes

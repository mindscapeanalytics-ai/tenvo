# Hub Enterprise Shell Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hub cold-load fan-out with one authenticated shell bootstrap plus TanStack Query stale-while-revalidate so Overview KPIs, Finance Hero, Recent Activity, and inventory page-0 paint fast without breaking saves, POS, or storefront.

**Architecture:** `getHubShellBootstrapAction` runs a single `withGuard`, then parallel `skipAuth` helpers. Client mounts `HubQueryProvider` in the business shell, hydrates `DataContext` from the bootstrap payload (and sessionStorage cache), unlocks KPI tiles from server `kpis` (not sales list), and paginates inventory after page-0.

**Tech Stack:** Next.js App Router Server Actions, existing Prisma/pg helpers, `@tanstack/react-query` ^5.56.2, `DataContext` bridge

**Spec:** `docs/superpowers/specs/2026-07-17-hub-enterprise-shell-bootstrap-design.md`

## Global Constraints

- Do not break `upsertIntegratedProductAction` / `handleSaveProduct` / serial deferred contract
- Do not change POS catalog fetch in Phase 1
- Do not change storefront checkout or public catalog paths
- Desktop layouts and `lg:` dual layout unchanged
- No em dashes in user-facing copy
- Prefer snapshot/bootstrap KPIs for Overview tiles; client invoice reduce is fallback only
- One `withGuard` on cold Overview bootstrap path
- Inventory cold path: page-0 (limit 100, offset 0) + total count — not unbounded `getAll`
- Customers: not unbounded on cold path
- Commit only when the user explicitly asks

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/actions/dashboard/hubShellBootstrap.js` | Single bootstrap Server Action |
| `lib/dashboard/hubBootstrapMetrics.js` | Map bootstrap → dashboardMetrics / activity helpers |
| `lib/dashboard/hubShellCache.js` | sessionStorage read/write for warm paint |
| `lib/context/HubQueryProvider.jsx` | QueryClientProvider for hub shell |
| `lib/context/DataContext.js` | Cold path → bootstrap; hydrate modules |
| `components/layout/BusinessShellLayout.jsx` | Mount HubQueryProvider |
| `app/business/[category]/DashboardClient.jsx` | Loading flags from bootstrap KPIs |
| `app/business/[category]/components/tabs/DomainDashboard.tsx` | Prefer server revenue; pass activity |
| `.../portlets/RecentActivityFeed.client.tsx` | Accept `initialActivities` |
| `.../islands/VisualAnalyticsPanel.client.tsx` | Prefer React Query analytics cache |
| `scripts/verify-hub-shell-bootstrap.mjs` | Static wiring checks |
| `package.json` | `verify:hub-shell-bootstrap` script |

---

### Task 1: Bootstrap action + verify script shape

**Files:**
- Create: `lib/actions/dashboard/hubShellBootstrap.js`
- Create: `scripts/verify-hub-shell-bootstrap.mjs`
- Modify: `package.json` (add script)
- Modify: `lib/dashboard/hubBootstrapMetrics.js` (export product page defaults if needed)

**Interfaces:**
- Consumes: `withGuard`, `getDashboardKPIs`, `getAccountingSummaryAction`, `getMonthlyFinancialsAction`, `getExpenseBreakdownAction`, invoice list helper, product list helper, warehouse locations, activity SQL path
- Produces: `getHubShellBootstrapAction(businessId, filter) → actionSuccess({ range, kpis, finance, glSummary, chartSeries, expenseBreakdown, activity, invoices, hasMoreInvoices, products, productTotal, hasMoreProducts, locations, meta, errors? })`

- [ ] **Step 1: Add verify script that expects bootstrap module + export name**

Create `scripts/verify-hub-shell-bootstrap.mjs` following `scripts/verify-easy-dashboard.mjs` pattern: read files, `includes` checks, exit 1 on fail.

Assert:
- `lib/actions/dashboard/hubShellBootstrap.js` exists
- exports `getHubShellBootstrapAction`
- contains `withGuard` once in the happy path (string check)
- contains `PRODUCT_PAGE_LIMIT` or `limit: 100` and `offset: 0`
- `HubQueryProvider` file exists (may fail until Task 2 — add checks progressively; for Task 1 only assert bootstrap file)

- [ ] **Step 2: Run verify — expect fail (file missing)**

Run: `node scripts/verify-hub-shell-bootstrap.mjs`  
Expected: FAIL missing hubShellBootstrap.js

- [ ] **Step 3: Implement `getHubShellBootstrapAction`**

```js
'use server';

import { withGuard } from '@/lib/rbac/serverGuard';
import { getDashboardKPIs } from '@/lib/actions/basic/dashboard';
import { getAccountingSummaryAction } from '@/lib/actions/standard/report';
import { getMonthlyFinancialsAction } from '@/lib/actions/standard/report';
import { getExpenseBreakdownAction } from '@/lib/actions/premium/ai/analytics';
import { getInvoicesAction } from '@/lib/actions/basic/invoice';
import { getProductsAction } from '@/lib/actions/standard/inventory/product';
import { getWarehouseLocationsAction } from '@/lib/actions/standard/inventory/warehouse';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { resolveAnalyticsRange } from '@/lib/utils/analyticsRange';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';

export const HUB_SHELL_PRODUCT_PAGE_LIMIT = 100;
export const HUB_SHELL_INVOICE_LIMIT = 200;
export const HUB_SHELL_ACTIVITY_LIMIT = 25;

export async function getHubShellBootstrapAction(businessId, filter = {}) {
  try {
    await withGuard(businessId, { permission: 'sales.view' });
    const { from, to } = resolveAnalyticsRange(filter);
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59.999`);
    const errors = {};

    const settled = await Promise.allSettled([
      getDashboardKPIs(businessId, { dateFrom: fromDate, dateTo: toDate, skipAuth: true }),
      getAccountingSummaryAction(businessId, fromDate.toISOString(), toDate.toISOString(), { skipAuth: true }),
      getMonthlyFinancialsAction(businessId, 6), // may re-auth — prefer extract skipAuth later; acceptable if already guarded
      getExpenseBreakdownAction(businessId, { from, to }),
      getInvoicesAction(businessId, {
        limit: HUB_SHELL_INVOICE_LIMIT,
        offset: 0,
        dateFrom: from,
        dateTo: to,
        includeItems: false,
      }),
      getProductsAction(businessId, {
        limit: HUB_SHELL_PRODUCT_PAGE_LIMIT,
        offset: 0,
        includeSerials: false,
      }),
      getWarehouseLocationsAction(businessId),
      getUnifiedActivityFeedAction(businessId, HUB_SHELL_ACTIVITY_LIMIT),
    ]);

    // Map settled results → payload slices; record errors[key] on reject/success:false
    // Build finance object same as advancedDashboardSnapshot.js merge
    // meta: { generatedAt: new Date().toISOString(), range: { from, to }, productPageLimit: 100 }

    return await actionSuccess({ /* full payload */ });
  } catch (e) {
    return await actionFailure('HUB_SHELL_BOOTSTRAP_FAILED', getErrorMessage(e));
  }
}
```

**Important:** Nested actions that call `withGuard` again will still hit auth. Prefer calling the same internal paths with `skipAuth: true` where supported (`getDashboardKPIs`, accounting summary). For invoice/product/activity/warehouse: if they always `withGuard`, either:
- (preferred) add optional `{ skipAuth: true }` passthrough matching dashboard pattern, **or**
- extract shared “core” functions used by both the public action and bootstrap.

Do **not** leave 8 nested full auths — that defeats the design. Minimum: KPI + GL use skipAuth; for others add `skipAuth` option to their existing `withGuard` wrappers in the same PR if missing.

- [ ] **Step 4: Run verify — expect pass for Task 1 assertions**

Run: `node scripts/verify-hub-shell-bootstrap.mjs`

---

### Task 2: HubQueryProvider + sessionStorage cache helpers

**Files:**
- Create: `lib/context/HubQueryProvider.jsx`
- Create: `lib/dashboard/hubShellCache.js`
- Modify: `components/layout/BusinessShellLayout.jsx`
- Modify: `scripts/verify-hub-shell-bootstrap.mjs` (assert provider + cache)

**Interfaces:**
- Produces: `HubQueryProvider({ children })`, `hubShellQueryKey(businessId, from, to)`, `readHubShellCache(key)`, `writeHubShellCache(key, data)`, `clearHubShellCache(businessId?)`

- [ ] **Step 1: Implement `hubShellCache.js`**

Keys: `tenvo:hubShell:v1:${businessId}:${from}:${to}`  
TTL soft: still return stale forever for warm paint; React Query `staleTime` 45_000 drives refetch.

- [ ] **Step 2: Implement `HubQueryProvider.jsx`**

```jsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function HubQueryProvider({ children }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 45_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Wrap in `BusinessShellLayout.jsx`**

Order: `FilterProvider` → `HubQueryProvider` → `DataProvider` → children.

- [ ] **Step 4: Extend verify script for these files; run it**

---

### Task 3: DataContext cold path uses bootstrap

**Files:**
- Modify: `lib/context/DataContext.js`
- Modify: `lib/dashboard/hubBootstrapMetrics.js` if mapping needs activity

**Interfaces:**
- Consumes: `getHubShellBootstrapAction`, cache helpers, `buildDashboardMetricsFromSnapshot`
- Produces: On init, one bootstrap call hydrates finance/sales/inventory/expenses/activity; removes parallel cold `fetchFinance`+`fetchSales`+lean inventory+expenses; removes post-`isDataLoaded` unbounded `fullCatalog: true`

- [ ] **Step 1: Add `activityFeed` state (or ref) on context value** for DomainDashboard

- [ ] **Step 2: Replace init `Promise.allSettled([fetchFinance, fetchSales, fetchInventory lean, fetchExpenses])` with:**

1. Read session cache → if hit, hydrate setters immediately + set moduleReady flags for finance/sales/inventoryCatalog/expenses + `isShellReady`
2. Call `getHubShellBootstrapAction(businessId, { from, to })`
3. On success: hydrate all slices, write cache, set `isDataLoaded`
4. Do **not** call `fetchInventory({ fullCatalog: true })` afterward
5. Keep `fetchPurchases` deferred background as today
6. Keep named `fetchFinance` / `fetchSales` / `fetchInventory` for force refresh / tab full mode, but sales bootstrap must **not** call unbounded `customerAPI.getAll` — load customers only in `mode: 'full'` or separate `fetchCustomers`

- [ ] **Step 3: Hydration mapping**

| Payload | Setter |
|---------|--------|
| kpis+finance+gl | `setAdvancedDashboardSnapshot`, `setAccountingSummary`, `setDashboardMetrics(build...)` |
| chartSeries | `setDashboardChartData` |
| expenseBreakdown | `setExpenseBreakdown` |
| invoices | `setInvoices`, `salesListDepthRef = 'bootstrap'` |
| products + total | `setProducts`, track `productTotal` / `hasMoreProducts` on context |
| locations | `setLocations` |
| activity | `setActivityFeed` |
| moduleReady | finance, sales, inventory, inventoryCatalog, expenses → true on success |

- [ ] **Step 4: Manual smoke — cold hub Overview network: prefer 1 bootstrap POST**

---

### Task 4: Unlock KPI tiles from bootstrap (not sales list)

**Files:**
- Modify: `app/business/[category]/DashboardClient.jsx` (~1858–1862)
- Modify: `app/business/[category]/components/tabs/DomainDashboard.tsx` (`periodMetrics`)
- Modify: `components/dashboard/easy/EasyBusinessDashboard.tsx` if it gates revenue on sales

- [ ] **Step 1: Change loading flags**

```js
const hasBootstrapKpis = Boolean(dashboardMetrics?.revenue || dashboardMetrics?.orders || dashboardMetrics?.inventory);
isSalesLoading={Boolean(loadingModules.sales) && !moduleReady.sales && !hasBootstrapKpis}
// Revenue/Orders tiles should use isFinanceLoading OR a new isOverviewKpisLoading:
isOverviewKpisLoading={!hasBootstrapKpis && (loadingModules.finance || !moduleReady.finance)}
isInventoryLoading={!dashboardMetrics?.inventory && !moduleReady.inventoryCatalog}
isFinanceLoading={Boolean(loadingModules.finance) && !moduleReady.finance && !advancedDashboardSnapshot?.finance}
```

Wire DomainDashboard so Orders/Revenue `isLoading` uses overview KPI readiness, not `isSalesLoading`.

- [ ] **Step 2: Prefer server totals in `periodMetrics`**

```ts
const currentRevenue = dashboardMetrics?.revenue?.total != null
  ? Number(dashboardMetrics.revenue.total)
  : billableInvoices.filter(...).reduce(...);
const currentOrders = dashboardMetrics?.orders?.total != null
  ? Number(dashboardMetrics.orders.total)
  : clientInvoiceCount;
```

- [ ] **Step 3: Smoke — cold load: KPI tiles fill when bootstrap returns even if customers never load**

---

### Task 5: Recent Activity from bootstrap

**Files:**
- Modify: `app/business/[category]/components/islands/portlets/RecentActivityFeed.client.tsx`
- Modify: `DomainDashboard.tsx` (pass `initialActivities={activityFeed}`)

- [ ] **Step 1: Add props `initialActivities?: ActivityItem[]`, `initialLoading?: boolean`**

If `initialActivities` is defined (including `[]`), skip mount fetch; `loading` starts false. Expose refresh that calls `getUnifiedActivityFeedAction`.

- [ ] **Step 2: Pass activities from DataContext through DashboardClient → DomainDashboard → feed**

- [ ] **Step 3: Confirm Vertical intelligence + Activity paint together after bootstrap**

---

### Task 6: Inventory page-0 + load more path

**Files:**
- Modify: `lib/context/DataContext.js` (`fetchInventory` supports `{ limit, offset, append }`)
- Modify: Inventory tab entry (InventoryManager or DashboardClient inventory props) to show count + Load more when `hasMoreProducts`
- Do **not** change POS catalog callers

- [ ] **Step 1: `fetchInventory({ fullCatalog: true })` becomes paginated default `limit: 100, offset: 0` OR remove and rely on bootstrap only; add `fetchMoreProducts()` append

- [ ] **Step 2: Ensure product save still merges into `products` array in context (existing patch path)

- [ ] **Step 3: POS still uses its own fetch — grep POS `getAll` / `fetchInventory` and leave alone

---

### Task 7: Analytics idle prefetch

**Files:**
- Modify: `lib/context/DataContext.js` or small hook `usePrefetchHubAnalytics`
- Modify: `VisualAnalyticsPanel.client.tsx` to `useQuery` key `['hubAnalytics', businessId, from, to]` with `getAnalyticsBundleAction`

- [ ] **Step 1: After bootstrap success, `requestIdleCallback` / `setTimeout(1000)` prefetch analytics into query client**

- [ ] **Step 2: Visual panel uses cached query; keep IntersectionObserver as `enabled` gate if desired

---

### Task 8: Cache invalidation on mutations + final verify

**Files:**
- Modify: handlers in DashboardClient / DataContext after invoice payment, product save, expense save — `queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] })` + clear session cache for business
- Modify: `scripts/verify-hub-shell-bootstrap.mjs` full assertions
- Modify: spec status to Approved/Implemented as appropriate

- [ ] **Step 1: Invalidate hub shell query on successful product/invoice/expense mutations (soft)**

- [ ] **Step 2: Run:**

```bash
node scripts/verify-hub-shell-bootstrap.mjs
bun run verify:easy-dashboard
bun run verify:hub-tabs-forms
```

- [ ] **Step 3: Update design spec status to `Approved — implementing` then `Implemented` when done**

---

## Self-review vs spec

| Spec requirement | Task |
|------------------|------|
| Single bootstrap + one withGuard | 1 |
| TanStack Query + sessionStorage SWR | 2–3 |
| KPI unlock from kpis | 4 |
| Activity in bootstrap | 1, 5 |
| Inventory page-0 + pagination | 1, 6 |
| No unbounded customers cold | 3 |
| Analytics idle prefetch | 7 |
| Invalidation + verify | 8 |
| POS unchanged | 6 note |
| Storefront unchanged | global |

No TBD placeholders. Nested `skipAuth` on invoice/product/activity/warehouse is an explicit Step 3 requirement in Task 1.

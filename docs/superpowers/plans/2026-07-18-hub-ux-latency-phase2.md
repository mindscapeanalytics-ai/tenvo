# Hub UX Latency Phase 2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enterprise progressive enrichment — lean KPIs, slim product lists, sales headers-only, Finance keep-alive, patch-first mutations.

**Architecture:** Extend Phase 1 hub shell; do not rewrite DataContext to React Query.

**Tech stack:** Existing Server Actions, ProductService, DataContext, FinanceHub, DashboardClient.

---

### Task 1: Lean KPI SQL
- File: `lib/actions/basic/dashboard.js`
- Replace `SELECT *` CTEs with column-minimal selects per design spec.
- Verify: KPI response shape unchanged (same keys).

### Task 2: Product `detailLevel`
- Files: `lib/services/ProductService.js`, `lib/actions/standard/inventory/product.js`, `hubShellBootstrap.js`, `DataContext.js`
- Add `detailLevel: 'list'|'grid'|'full'`; default list for shell; grid for inventory fetch.
- Mark `_detailLevel` on mapped rows.

### Task 3: Sales headers-only full mode
- File: `lib/context/DataContext.js` — `fetchSales` always `includeItems: false` for list modes.
- Confirm invoice open still loads items via existing detail path.

### Task 4: FinanceHub keep-alive
- File: `components/finance/FinanceHub.jsx` — skip reload when same business already loaded.

### Task 5: Mutation non-blocking refresh
- File: `app/business/[category]/DashboardClient.jsx`
- Remove `includeSerials: true` from list fallback; void force inventory for warehouse/stock where safe; patch locations when possible.

### Task 6: Inventory progressive enrichment
- File: `DashboardClient.jsx` tab effect — when inventory tab and products are list-depth, background `fetchInventory({ detailLevel: 'grid' })`.

### Task 7: Verify
- Run `bun run verify:inventory-wiring` and any hub/finance verifies touched.

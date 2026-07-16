# Hub Inventory Dataflow UX Implementation Plan

> **For agentic workers:** Implement task-by-task. Prefer small diffs. Fall back to one force inventory fetch if patch response incomplete. Do not commit unless user asks.

**Goal:** Fix hub inventory/stats dataflow conflicts so saves and loads feel fast without breaking ledger or serial safety.

**Architecture:** Keep composite upsert as the write path. Change only refresh/notify contracts, fetch force/SWR behavior, and local state merge. Add `upsertProductInState` / soft-merge where needed.

**Tech Stack:** Next.js App Router, DataContext, InventoryManager, DashboardClient, ProductService, inventory_composite.

## Global Constraints

- Never wipe serials via empty arrays when `_serialsDeferred` is set
- Never call `refreshAllData` for single product form/Busy saves
- Prefer patch-from-response; fallback = one `fetchInventory({ force: true })`
- Run `bun run verify:inventory-wiring` after inventory wiring changes

---

## Task 1: Phase 1 — Stop double delete

**Files:** `components/InventoryManager.jsx`, `app/business/[category]/DashboardClient.jsx`, optionally `InventoryTab.tsx`

- [x] After successful local `deleteProductAction`, call parent with a notify-only path (e.g. `onDelete(id, { alreadyDeleted: true })` or separate `onDeleted`) so Dashboard only `fetchInventory` / patches state — no second `productAPI.delete`
- [x] Same for bulk archive path
- [ ] Manual check: archive one product → single delete network call

## Task 2: Phase 1 — Stop ProductDetails double-write

**Files:** `components/InventoryManager.jsx`, `components/ProductDetailsDialog.jsx`

- [x] Details `onUpdate` updates local products (+ optional parent state callback) without invoking composite `onUpdate`/`handleSaveProduct`
- [ ] Manual check: edit from details → one update call

## Task 3: Phase 2 — Patch refresh for Busy / Quick Add

**Files:** `DashboardClient.jsx`, `InventoryManager.jsx`, `DataContext.js`, `DashboardTabs.jsx`

- [x] Add `upsertProductInState(product)` on DataContext
- [x] `handleSaveProduct` with `skipFullWorkspaceRefresh`: patch via upsert; only fetchInventory if patch unsafe
- [x] Busy cell: remove `reloadProductsSilent` after successful onUpdate when saved product returned
- [x] Quick Add: remove second `refreshData` after onUpdate

## Task 4: Phase 2 — Form save inventory-only + debounced analytics

**Files:** `DashboardClient.jsx`, `ActionModals.jsx` if needed

- [x] Default product form save: inventory refresh/patch + schedule analytics force (debounce), not `refreshAllData`
- [x] Keep `refreshAllData` for invoice/POS/cross-module mutations

## Task 5: Phase 3 — Fetch/stats correctness

**Files:** `DataContext.js`, `DashboardClient.jsx`, `ProductForm.jsx` / save path

- [x] Fix analytics SWR early-return for 1–5 min stale branch
- [x] Customer/vendor: `force: true`
- [x] Pending-force queue for inventory
- [x] Propagate `_serialsDeferred` on form edit
- [x] Soft-merge `initialProducts` in InventoryManager

## Task 6: Verify

- [x] `bun run verify:inventory-wiring`
- [ ] Smoke: Busy edit, form save, delete, customer save

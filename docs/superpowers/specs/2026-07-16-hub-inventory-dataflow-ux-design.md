# Hub Inventory Dataflow UX — Design Spec

**Date:** 2026-07-16  
**Status:** Approved for careful phased implementation  
**Scope:** Hub inventory save → dual state → fetch → dashboard stats

## Problem

Composite product writes are mostly correct. UX feels slow and some lists/KPIs go stale because of:

1. Double persist (delete, ProductDetails)
2. Double or full-workspace refresh after product saves
3. Fetch bugs (analytics SWR early-return, customer/vendor without `force`, dropped force inventory)
4. Deferred serials + form omit empty serials can mis-route stock ledger
5. Hard replace of local grid state from props clobbering optimistic edits

## Non-goals

- Do not rewrite `InventoryService` / composite ledger SQL
- Do not change Excel bulk upsert algorithm
- Do not add pagination in this ship (tracked as later)
- Do not change storefront checkout inventory

## Design

### Post-save refresh contract

| Save type | After success | Must not |
|-----------|---------------|----------|
| Busy / inline | Merge returned `product` into DataContext + local state | Second `fetchInventory` / `reloadProductsSilent` |
| Product form | Inventory patch or one `fetchInventory({ force })` + debounced analytics | `refreshAllData` (9 modules) |
| Excel bulk | One inventory refresh or merge returned rows | Per-row full refresh / `refreshAllData` |
| Delete | Single delete API + patch-or-one inventory fetch | Second delete |
| Details dialog | Single persist; parent UI merge only | Second composite upsert |
| Stock transfer / warehouse | Keep `fetchInventory({ force })` | — |

**Safety fallback:** If save response lacks usable `id`, fall back to **one** `fetchInventory({ force: true })` (never two).

### Integrity

- `onDelete` after local `deleteProductAction`: notify parent to sync state only (no re-delete), or Dashboard delete-only when InventoryManager did not already delete.
- `ProductDetailsDialog` `onUpdate`: parent updates local/DataContext state only; do not call `handleSaveProduct`.

### Fetch / stats

- Fix analytics SWR: show stale 1–5 min cache but still fetch (do not set ready gate that blocks revalidate).
- Customer/vendor mutations: `fetchSales({ force: true })` / `fetchPurchases({ force: true })`.
- Queue pending force inventory when in-flight (trailing refetch).
- Propagate `_serialsDeferred` on form edit path; never treat deferred empty serials as clear.
- Soft-merge `initialProducts` into InventoryManager (preserve in-flight optimistic rows by id).

### Verification

- Busy cell: 1 upsert, ≤1 list GET
- Form save: no 9-module refresh
- Delete once
- Serial SKU form edit does not simple-reconcile stock incorrectly
- `bun run verify:inventory-wiring`

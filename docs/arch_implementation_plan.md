# Implementation Plan: Architectural Perfection & Consolidation

This plan addresses structural gaps in the inventory management system to ensure high reliability, data integrity, and professional enterprise behavior.

## User Review Required

> [!IMPORTANT]
> **Warehouse Table Consolidation**: I will be migrating all data from the legacy `warehouses` table to the `warehouse_locations` table and dropping the redundant table. This ensures a single source of truth for inventory locations.

> [!WARNING]
> **Stock Column Standardization**: I will enforce `quantity_change` across the database and codebase. Any legacy components still expecting a `quantity` column in the `stock_movements` table will be updated.

## Proposed Changes

---

### [Component] Database & Schema
Consolidate storage and resolve synchronization drift.

#### [MODIFY] [schema.prisma](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/prisma/schema.prisma)
- Update all relations (PO, Transfers, Serials) to point exclusively to `warehouse_locations`.
- Remove the `warehouses` model.
- Standardize `stock_movements` column names.

#### [NEW] [consolidation_migration.sql](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/supabase/migrations/999_consolidation_cleanup.sql)
- SQL script to migrate existing data and safely drop the legacy table.

---

### [Component] Inventory Core (`lib/actions/stock.js`)
Harden the movement engine.

#### [MODIFY] [stock.js](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/lib/actions/stock.js)
- Refactor `addStockAction`, `removeStockAction`, and `transferStockAction` to use the unified location table.
- Enforce strict transactionality for stock + accounting postings.
- Ensure `inventory_ledger` is populated for every movement.

---

### [Component] UI Alignment
Ensure frontend components use the new unified structure.

#### [MODIFY] [MultiLocationInventory.jsx](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/components/MultiLocationInventory.jsx)
- Update queries to fetch from the consolidated locations action.

#### [MODIFY] [GRNView.jsx](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/components/GRNView.jsx) & [PurchaseOrderManager.jsx](file:///c:/Users/zaliz/Downloads/APP_CHAT/financial-hub/components/PurchaseOrderManager.jsx)
- Finalize the `purchase_number` unification to prevent empty "Ref #" displays.

## Verification Plan

### Automated Tests
- Execute `diagnostic.js` to verify 0 orphaned foreign keys.
- Perform a simulated stock transfer and verify updates in:
  1. `product_stock_locations`
  2. `stock_movements`
  3. `inventory_ledger`
  4. `gl_entries`

### Manual Verification
- Verify that a newly created Warehouse Location appears in the PO and Transfer dropdowns.
- Confirm that "Received" POs correctly increase stock at the selected location.

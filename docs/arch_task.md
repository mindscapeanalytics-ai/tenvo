# Architectural Perfection Phase - Task Checklist

## Phase 1: Warehouse Table Consolidation 🏢
- [x] **Prepare Migration Strategy**
    - [x] Identify all tables referencing `warehouses`
    - [x] Create data migration script (Copy from `warehouses` to `warehouse_locations`)
- [x] **Execute DB Consolidation**
    - [x] Update `prisma/schema.prisma` relations
    - [x] Run manual SQL migration to repoint foreign keys
    - [x] Drop the legacy `warehouses` table
- [x] **Code Realignment**
    - [x] Update `lib/actions/purchase.js` to reference `warehouse_locations`
    - [x] Update `lib/actions/stock.js` to reference `warehouse_locations`
    - [x] Update `lib/actions/warehouse.js` to remove redundant actions

## Phase 2: Inventory Engine Hardening ⚙️
- [x] **Standardize Schema Usage**
    - [x] Verify all `INSERT INTO stock_movements` use `quantity_change`
    - [x] Refactor `addStockAction` to handle location-specific stock correctly
- [x] **Transactional Integrity**
    - [x] Ensure stock moves and GL entries are atomic
    - [x] Implement `inventory_ledger` sync in all movement actions
- [x] **PO/GRN Logic Fixes**
    - [x] Unify property naming (`purchase_number`) project-wide
    - [x] Fix empty "Ref #" in physical documents/PDFs

## Phase 3: DB Stability & Prisma Sync 💾
- [x] **Prisma Health Check**
    - [x] Resolve stuck `db push` processes
    - [x] Verify `npx prisma db pull` matches actual Postgres state
- [x] **Final Verification Audit**
    - [x] Run full Procurement -> Stock -> Finance integration test
    - [x] Verify multi-tenant isolation with the new table structure

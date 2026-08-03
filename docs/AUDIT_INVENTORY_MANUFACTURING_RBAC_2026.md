# Deep audit: inventory, manufacturing, RBAC, migrations (2026)

This document records **conflicts**, **duplications**, **schema/code gaps**, and **fixes applied** in-repo. It is not an exhaustive product roadmap.

---

## 1. Fixes applied in this audit pass

| Area | Issue | Change |
|------|--------|--------|
| **Manufacturing MRP** | `ManufacturingOptimizedService.proposeSchedule` selected `p.unit_cost`, which **does not exist** on `products` in Prisma (column is `cost_price`). Postgres would error at runtime. | SQL now uses `COALESCE(p.cost_price, 0)::numeric AS unit_cost` so JS can keep using `mat.unit_cost`. |
| **Product API / BOM** | Variant rows omitted `cost_price`; BOM UI could not fall back to variant cost. | `ProductService.getProducts` now selects `cost_price`, `mrp`, `is_default` on `product_variants`. |
| **BOM UI** | Cost estimate ignored default-variant cost. | `ManufacturingModule`: `getProductUnitCost` order = master `cost_price` → **default variant** `cost_price` → batch weighted average. Separate footer hints for variant vs batch-derived cost. |
| **Reorder automation** | Unused `lowStockAlertSchema` (status enum `critical`/`low`/`adequate`) conflicted conceptually with DB `status = 'active'` and was never referenced. | Removed dead schema. |
| **Legacy permissions file** | Duplicate mental model: `lib/utils/permissions.js` (user + `view_inventory`) vs `lib/rbac/permissions.js` (role + `inventory.view`). Nothing in app code imported the utils file. | Added **@deprecated** file header pointing to RBAC + `serverGuard`. |

---

## 2. Known duplications (intentional or acceptable)

| Item | Notes |
|------|--------|
| **`lib/db/migrations/*.sql` vs `prisma/migrations/*`** | Hand-run Supabase scripts (e.g. `033`, `034`, `035`) duplicate *concepts* from Prisma history for operators who do not use `migrate deploy`. Keep names aligned; see `docs/DATABASE_MIGRATIONS.md`. |
| **`032` / `033` invoice payment soft-delete** | Overlapping `ALTER` for `is_deleted`; scripts are idempotent (`IF NOT EXISTS`). Prefer one documented path per environment. |
| **`EXECUTE_THIS_IN_SUPABASE.sql`** | Aggregate script overlaps smaller migrations — by design for one-shot repair. |

---

## 3. Gaps and recommendations (not all implemented)

### RBAC & navigation

- **`lib/utils/permissions.js`**: Do not extend. New checks must use **`@/lib/rbac/permissions`** and **`withGuard`**.
- **`manufacturing.view`** is limited to `manager`, `admin`, `owner` in `PERMISSION_DEFINITIONS`. If **salesperson / warehouse** should open the Manufacturing tab, add them explicitly to `manufacturing.view` (product decision).

### Server vs client cost logic

- **BOM form** (`ManufacturingModule`) now aligns variant + batch fallbacks with **client** product payloads.
- **`ManufacturingService.explodeBOM`** and other server paths still use **`p.cost_price`** from SQL only. For parity, optional follow-up: SQL subselect or application-layer weighted batch cost (heavier query).

### Low stock & reorder

- Tables **`low_stock_alerts`** / **`reorder_points`**: created by Prisma migration `20260514_inventory_reorder_cycle_counts` or **`lib/db/migrations/035_low_stock_alerts_reorder_points.sql`**.
- **Unique index** on `(business_id, product_id, warehouse_id, status)` matches `INSERT ... ON CONFLICT` in `ReorderAutomationService`.

### Prisma vs raw SQL drift

- Periodically grep raw SQL for columns not on `products` / `invoice_payments` / `invoice_payments` and cross-check `prisma/schema.prisma`.
- Common pitfall: **`unit_cost`** on products — use **`cost_price`** unless a migration adds `unit_cost` explicitly.

---

## 4. Quick verification commands

```powershell
Set-Location E:\path\to\tenvo-main
npx vitest run tests/integration/subscription-system.test.js --reporter=dot
```

After DB changes:

```bash
bun run db:migrate
```

---

## 5. Change log

| Date | Author | Summary |
|------|--------|---------|
| 2026-05-30 | Audit | MRP SQL fix, variant selects, BOM variant cost, dead Zod removal, permissions deprecation doc, this audit file. |

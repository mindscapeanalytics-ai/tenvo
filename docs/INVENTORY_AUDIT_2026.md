# Inventory flow & schema audit (2026)

Deep pass over **Prisma models**, **server services/actions**, and **known UI/API wiring** for stock, batches, serials, warehouses, reservations, and composite product saves.

## Identity & types (UUID / Decimal)

| Area | Convention | Notes |
|------|------------|--------|
| Primary keys | `@db.Uuid` everywhere for inventory entities | Mix of `gen_random_uuid()` and `uuid_generate_v4()` in DB defaults — functionally equivalent on Postgres; optional future cleanup for one generator. |
| `business_id` | UUID on all tenant rows | Enforced in Prisma; keep all queries scoped. |
| Quantities | `Decimal(12, 2)` | Use `Number()` / Prisma `Decimal` consistently in JS; avoid raw `parseFloat` on nullables without guards. |

## Canonical models (relations)

- **`products`** — headline SKU, `stock`, `domain_data`, optional JSON mirrors (`batches`, `variants`, `serial_numbers`) for legacy/UI; **normalized** stock also lives in **`product_batches`**, **`product_variants`**, **`product_stock_locations`**, **`product_serials`**.
- **`product_variants`** — per-variant `stock`; storefront and POS must pass **`variant_id`** when selling a variant (see `checkProductStock` in `lib/actions/storefront/products.js`).
- **`product_batches`** — FEFO/FIFO style lines; `quantity`, `reserved_quantity`, `warehouse_id`.
- **`product_serials`** — `serial_number` unique per business; optional `variant_id`, `batch_id`, `warehouse_id`.
- **`warehouse_locations`** — master warehouse list; FK target for movements and locations.
- **`product_stock_locations`** — `(business_id, product_id, warehouse_id, state)` unique; **`quantity` + `state` only** (no `reserved_quantity` column in schema — reservations are product-level today).
- **`stock_movements`** — audit trail of deltas; optional `batch_id`, `warehouse_id`.
- **`stock_transfers`** — inter-warehouse moves with batch optional.
- **`inventory_ledger`** — separate ledger stream (ensure writers stay consistent with movements if both are used).
- **`inventory_reservations`** — soft reservation against **`product_id`**; extended to match **`reservationManagement.js`** (`customer_id`, `notes`, `completed_at`, `cancelled_at`).

## Issues found & fixes applied (this pass)

1. **`inventory_reservations` vs `reservationManagement.js`** — Service created/updated **`customer_id`**, **`notes`**, **`completed_at`**, **`cancelled_at`** and included **`customers`** in queries, but the Prisma model lacked those fields → **runtime / generate mismatch**. **Fixed:** Prisma model + migration **`20260611_inventory_reservations_service_columns`** and idempotent **`lib/db/migrations/041_inventory_reservations_service_columns.sql`**.
2. **`reserveStock` aggregate** — Summed all `active` rows including **expired** `expires_at`, while `getAvailableQuantity` filtered `expires_at > now`. **Fixed:** `reserveStock` now uses the same **`expires_at: { gt: now }`** filter; Decimal sums coerced with **`Number()`**.
3. **`completeReservation` / `cancelReservation` tenancy** — Updates used **`id` only**. **Fixed:** **`findFirst({ id, business_id })`** guard before update; cancel **appends** reason to existing `notes`.
4. **`getExpiryReport`** — Could throw if related rows missing. **Fixed:** Optional chaining on **`products`** / **`customers`**.
5. **`createBatchStockMovement`** (`lib/services/batchAllocation.js`) — Referenced **`sellDate`** without defining it → **ReferenceError** on any call path. **Fixed:** default **`sellDate = new Date()`** from `data`.
6. **`bulkExportProductsAction`** — Selected **`reserved_quantity`** on **`product_stock_locations`** (column does not exist in schema). **Fixed:** select **`warehouse_id`, `quantity`, `state`** only. Excel export still shows reserved column as **0** for locations until a per-location reserve column is added by design.

## Architecture notes (Zoho-class direction)

| Topic | Current state | Recommendation |
|-------|----------------|------------------|
| Dual stock truth | `products.stock` vs sum of **`product_stock_locations`** / batches | Treat **warehouse rows + movements** as source of truth for multi-warehouse; reconcile headline `products.stock` after writes (partially done in composite / inventory services). |
| Variant matrix | Both **`products.variants` JSON** and **`product_variants`** table | Prefer **`product_variants`** for stock and POS; use JSON only for import/export or UI draft until fully migrated. |
| Reservations | Product-level only | Add **`variant_id`** on reservations when quotation/POS sells variants only from variant stock. |
| Batch sales | `createBatchStockMovement` increments **`reserved_quantity`** | Confirm business rules: sale should decrement **`quantity`** and adjust reserved — separate from this audit if logic already lives in invoice/POS paths. |

## Key wiring paths (backend ↔ UI)

- **Dashboard product grid / wizard** → **`productAPI.upsertIntegrated`** → **`upsertIntegratedProductAction`** (`lib/actions/premium/automation/inventory_composite.js`) — raw SQL transaction; respects meaningful batch/serial rows vs headline `stock` (see `AGENTS.md`).
- **Standard CRUD** → **`ProductService`** + **`lib/actions/standard/inventory/product.js`** — Prisma-first; storefront sync hooks.
- **Storefront checkout** → **`lib/actions/storefront/orders.js`** + **`products.js`** — `pg` pool, locked reads on variant/product rows; align IDs with UUID schema.
- **Reservations UI** → **`components/inventory/StockReservation.jsx`** — ensure it passes **`business_id`** and valid **`product_id`** UUIDs into actions that call **`reserveStock`**.

See also: **`docs/INVENTORY_UI_MODES_WORKFLOW.md`** (Visual / Busy / Excel wiring vs Busy.in / Zoho-style patterns).

## Deploy checklist

1. `bun run db:migrate` (applies **`20260611_inventory_reservations_service_columns`**).
2. `bunx prisma generate` (CI usually does this after migrate).
3. Smoke: create reservation with optional customer → completes/cancels without Prisma unknown-field errors.

## Related docs

- `docs/INVENTORY_UI_MODES_WORKFLOW.md` — Visual / Busy / Excel modes, shortcuts, composite save wiring, big-data direction.
- `docs/DATABASE_MIGRATIONS.md` — operational notes for the new migration.
- `docs/AUDIT_INVENTORY_MANUFACTURING_RBAC_2026.md` — broader manufacturing/RBAC audit if present.
- `AGENTS.md` — inventory composite / `products.stock` behavior with batch/serial.

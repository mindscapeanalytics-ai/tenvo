# Dataflow Conflict Fixes — Wave 1 Design

**Date:** 2026-07-19  
**Status:** Approved (Approach 1 — surgical correctness)  
**Scope:** Registration day-one catalog lag, payment-methods fail-closed, StorefrontSyncService tenancy

## Non-goals

- Pending-approval public store gate (keep current: hub gated, store enabled)
- Hub Phase-3 RQ sole shell store
- COD coerce on order create (already flagged + toast; separate product decision)

## Decisions

1. After successful `provisionRegistrationSeed` in `createBusiness`, call `invalidateStorefrontTenant` when any categories/products were written (mirror `seedRegistrationInventoryAction`).
2. Surface `seedFailed: true` on create when seed throws; business create still succeeds (seed remains best-effort).
3. GET `payment-methods`: missing-table (`42P01`) may soft-default COD; any other load error returns **503** `success: false` (no fake COD success).
4. `syncInventoryToStorefront` UPDATE must include `business_id`; `updateStockAvailability` requires `businessId` (no unscoped UPDATE).

## Success criteria

- Create-path seed invalidates storefront cache when catalog rows exist
- Callers can detect seed failure via `seedFailed`
- Payment-methods never returns `success: true` + COD on unexpected errors
- Sync helpers cannot mutate another tenant’s product by id alone
- Verify scripts assert the above

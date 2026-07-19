# Dataflow Conflict Wave 1 Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Close registration catalog lag, payment-methods soft COD, and SyncService tenancy gaps without policy or Phase-3 hub rewrites.

**Architecture:** Mirror existing hub reseed invalidate path; fail-closed payment-methods like cart sync / orders gate; scope raw SQL UPDATEs by `business_id`.

**Tech Stack:** Next.js server actions, pg pool, existing `invalidateStorefrontTenant`, static verify scripts.

## Global Constraints

- Do not gate public store on `approval_status` in this wave
- Do not change COD coerce on POST orders
- Prefer surgical edits; no unrelated refactors
- Run `node scripts/verify-audit-fixes.mjs` and `node scripts/verify-storefront-payments.mjs` after changes

---

### Task 1: createBusiness invalidate + seedFailed

**Files:** `lib/actions/basic/business.js`

- [x] After successful seed with category/product count > 0, `await invalidateStorefrontTenant(result.id)`
- [x] Track `seedFailed` in catch; include in `actionSuccess` payload
- [x] Leave create success on seed failure (best-effort)

### Task 2: payment-methods fail-closed

**Files:** `app/api/storefront/[businessDomain]/payment-methods/route.js`, `lib/storefront/storefrontCheckoutClient.js`, `app/store/[businessDomain]/checkout/page.jsx`, `lib/actions/storefront/payments.js`

- [x] Keep COD soft-default only for missing `business_payment_methods` table (`42P01`)
- [x] Outer catch → 503 `{ success: false, error: '…' }`
- [x] Client + checkout UI no longer invent COD on load failure

### Task 3: StorefrontSyncService tenancy

**Files:** `lib/services/StorefrontSyncService.js`

- [x] `syncInventoryToStorefront` UPDATE: `WHERE id = $2 AND business_id = $3`
- [x] `updateStockAvailability`: require `businessId`; remove unscoped branch

### Task 4: Verify scripts

**Files:** `scripts/verify-audit-fixes.mjs`, `scripts/verify-storefront-payments.mjs`

- [x] Assert createBusiness calls `invalidateStorefrontTenant` near seed path
- [x] Assert SyncService UPDATE includes `business_id`
- [x] Assert payment-methods outer error returns 503 / `success: false`
- [x] Run both verify scripts (+ registration-flow)

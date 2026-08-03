# POS Offline Phase 1 — Design Spec

**Date:** 2026-07-18  
**Status:** Implemented (Phase 1 code complete; apply migration before production use)  
**Scope:** Harden retail / SuperStore POS offline sell + sync without breaking online POS, hub, storefront, or finance  
**Non-scope:** Full hub offline, storefront offline, Gmail/Drive as live storage, PWA/service worker, RestaurantPOS offline, multi-device optimistic stock

## Problem

POS already queues sales in IndexedDB (`lib/utils/posOfflineQueue.js`) and replays via `usePosOffline`, gated by settings `offlineModeEnabled` and plan `offline_pos_mode`. Gaps make it unsafe for production:

1. **No server idempotency** — `clientRef` is accepted in the queue shape but never stamped or enforced; replay can double-post stock + GL.
2. **No catalog cache** — offline checkout assumes products are still in memory; refresh or cold start while offline cannot sell.
3. **Session fragility** — queued payload stores `sessionId`; if that session closed before sync, replay fails.
4. **Fail-open risk** — offline path can queue without proving a usable catalog snapshot exists.

## Goals

1. Cashier completes cash / labeled-card sales offline when mode is enabled and a fresh catalog snapshot exists.
2. Sync is **exactly-once** per offline sale (idempotent by `client_ref`).
3. Clear offline / pending-sync UX (extend existing `PosOfflineBanner`).
4. Additive only — online POS behavior unchanged when offline mode is off; default remains off.

## Non-goals

- Device or Gmail as primary database (Postgres remains canonical).
- Offline inventory edits, invoices, finance, or public storefront checkout.
- Service worker / installable PWA (Phase 2+).
- Restaurant POS (`restaurant_orders` ledger) in Phase 1.
- Guaranteeing multi-terminal stock accuracy while both are offline (accept soft oversell; sync rejects hard stock failures loudly).

## Principles (do not break current)

| Principle | Practice |
|-----------|----------|
| Server is source of truth | Devices hold cache + outbound queue only |
| Additive schema | Nullable `client_ref`; online sales omit it |
| Feature-gated | Plan `offline_pos_mode` + settings toggle (default false) |
| Tenant isolation | IndexedDB keys and queries always include `businessId` |
| Fail closed offline | No catalog snapshot → block offline checkout with clear message |
| Idempotent sync | Same `client_ref` returns existing transaction; no second stock move |
| Minimal surface | Touch PosTerminal + SuperStorePOS + shared hooks/utils; leave RestaurantPOS alone |

## Approach (chosen)

**Extend the existing IndexedDB queue + add a slim product snapshot + server `client_ref` uniqueness.**

Rejected for Phase 1:

- Full PWA / Workbox (too broad; hydration risk).
- Google Drive / device-as-cloud (wrong trust model; not POS).
- Rewriting POS to a local-first DB (breaks current actions/services).

## Architecture

```text
[Online]  POS loads products ──► write IndexedDB catalog snapshot (businessId)
[Online]  Sale ───────────────► createPosTransactionAction (unchanged; client_ref null)
[Offline] Sale ───────────────► stamp clientRef UUID ──► IndexedDB sales queue
[Online]  Sync loop ──────────► createPosTransactionAction({ ..., clientRef })
                                  ├─ existing row for (business_id, client_ref) → return it
                                  └─ else insert + stock + payments + GL (same as today)
```

### Units

| Unit | Responsibility |
|------|----------------|
| `lib/utils/posOfflineQueue.js` | Sales queue (existing) + require `clientRef` on enqueue |
| `lib/utils/posOfflineCatalog.js` | **New** — IndexedDB product snapshot read/write/TTL |
| `lib/hooks/usePosOffline.js` | Online detection, enqueue, sync (pass `clientRef` in payload) |
| `lib/hooks/usePosOfflineCatalog.js` | **New** — refresh snapshot when products load; expose `catalogReady` |
| `PosOfflineBanner` | Existing banner; show “catalog not ready” when offline + no snapshot |
| `POSService.createTransaction` | If `clientRef` present: find-or-create by `(business_id, client_ref)` |
| Prisma / migration | Nullable `pos_transactions.client_ref` + partial unique index |

### IndexedDB

Database name stays `tenvo_pos_offline` (bump `DB_VERSION` for upgrade).

| Store | Key | Contents |
|-------|-----|----------|
| `sales` | autoIncrement `id` | Existing + required `clientRef`, `status`, `payload`, `businessId` |
| `catalog` | `businessId` | `{ businessId, updatedAt, products: SlimProduct[] }` |

**Slim product fields** (enough to scan/sell; not full hub DTO):  
`id`, `name`, `sku`, `barcode`, `price`/`selling_price`, `stock` (display hint only), `tax` fields used by POS, `category`, `variant` ids if already in POS memory shape, `is_active`.

TTL: treat snapshot stale after **24h** (configurable constant). Offline sell allowed with stale snapshot only if operator confirms once (optional Phase 1.1); Phase 1 default = **block if older than 24h**.

## Data flow

### A. Catalog snapshot (online)

1. When POS has a product list for `businessId` and offline mode is enabled, write/replace `catalog` store.
2. Also refresh on successful online product fetch / focus reconnect (throttle ~60s).
3. Lookup offline: search snapshot by barcode/SKU/name using existing `productScanLookup` / POS helpers where possible (no new scanner).

### B. Offline checkout

1. Require: `navigator.onLine === false` (or failed probe), `offlineModeEnabled`, plan feature, `catalogReady`.
2. Build payload via existing `buildPosCheckoutPayload`.
3. Generate `clientRef = crypto.randomUUID()`.
4. Persist `{ businessId, clientRef, payload: { ...payload, clientRef }, status: 'pending' }`.
5. Clear cart; print draft/local receipt optional (thermal may still print local totals; server number assigned on sync).
6. Show banner pending count.

### C. Sync (back online)

1. List pending by `businessId` (FIFO by `createdAt`).
2. For each row, call existing `posAPI.checkout(payload)` with `clientRef` set.
3. Success or “already synced” (idempotent hit) → `markPosSaleSynced`.
4. Transient network error → increment attempts; keep pending.
5. Hard business error (session, stock, validation) → mark `failed` with `lastError`; do **not** drop silently; surface in banner / sync panel.

### D. Session recovery (careful)

Queued `sessionId` may be closed when sync runs.

**Rule:** On sync, if session is not open:

1. Prefer the **currently open** POS session for this business/terminal if one exists (attach sale there).
2. Else return a clear error: “Open a POS session to sync offline sales” and keep queue pending.

Do **not** auto-open sessions without cashier context (avoids phantom drawers).

## Server idempotency

### Schema

Add nullable column on `pos_transactions` in Prisma (no Prisma `@@unique` — that mishandles multiple NULLs):

```prisma
client_ref String? @db.VarChar(64) // offline idempotency; null for online sales
```

Enforce uniqueness only when set, via **partial unique index** in the Prisma migration SQL:

```sql
ALTER TABLE pos_transactions ADD COLUMN IF NOT EXISTS client_ref VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS pos_transactions_business_client_ref_uidx
  ON pos_transactions (business_id, client_ref)
  WHERE client_ref IS NOT NULL;
```

Online sales leave `client_ref` null and are unchanged.

### `POSService.createTransaction`

Before insert:

1. If `data.clientRef` is a non-empty string:
   - `SELECT id FROM pos_transactions WHERE business_id = $1 AND client_ref = $2`
   - If found → return that transaction (success, no stock/GL redo).
2. Else insert as today, including `client_ref` when provided.
3. Catch unique-violation race → re-select and return existing row.

Online path omits `clientRef` → identical to today.

## Error handling

| Case | Behavior |
|------|----------|
| Offline + mode off | Block sale; toast to enable offline or reconnect |
| Offline + no/stale catalog | Block sale; toast to reconnect once to cache catalog |
| Sync duplicate `client_ref` | Treat as success; mark synced |
| Sync stock insufficient | Mark failed; keep row; cashier resolves (void/adjust) |
| Sync session missing | Hold pending; prompt to open session |
| Max attempts (e.g. 10) | Mark failed; manual “Retry” in UI |
| Wrong `businessId` in local row | Never sync; ignore / quarantine |

## Security / tenancy

- All server writes still go through `checkAuth(..., 'pos.process_sale', 'pos')` and `business_id` scoping.
- Local catalog is not authoritative for price overrides beyond what POS already allows online; sync uses queued line prices as today (same trust as current online POS cart).
- Clearing site data wipes queue — document for operators; optional later: warn on pending count before logout.

## Rollout (safe)

1. Ship schema + idempotent server path (no UI change) — online POS unaffected.
2. Wire `clientRef` on enqueue + sync (fixes double-post even without catalog).
3. Add catalog snapshot + gate offline checkout.
4. Enable only behind existing toggle; keep default **false**.
5. Verify script: `verify:pos-offline` (unit tests for queue idempotency + catalog TTL helpers).

## Success criteria

- [ ] Online sale with offline mode off: identical SQL path (no `client_ref`).
- [ ] Offline sale → reconnect → one `pos_transactions` row, one stock decrement, one GL post per `client_ref`.
- [ ] Replay of same `client_ref` does not double stock.
- [ ] Offline without catalog: cannot complete checkout.
- [ ] RestaurantPOS / storefront / hub inventory paths unchanged.
- [ ] Plan without `offline_pos_mode`: toggle ineffective / hidden (match existing plan gating patterns).

## Later phases (out of this spec)

| Phase | Content |
|-------|---------|
| 2 | Optional service worker for POS shell assets only |
| 3 | Read-only hub inventory browse from cache |
| 4 | Selective write queues (stock adjust) with stronger conflict UI |
| Optional | Google Drive **export backup** (not live sync) |

## File touch list (expected)

- `prisma/schema.prisma` + new migration for `client_ref`
- `lib/services/POSService.js`
- `lib/utils/posOfflineQueue.js`
- `lib/utils/posOfflineCatalog.js` (new)
- `lib/hooks/usePosOffline.js`
- `lib/hooks/usePosOfflineCatalog.js` (new)
- `lib/hooks/usePosCheckout.js`
- `components/pos/PosTerminal.jsx` / `SuperStorePOS.jsx` (wire catalog ready + clientRef)
- `components/pos/shared/PosOfflineBanner.jsx` (catalog messaging)
- `scripts/verify-pos-offline.mjs` (new) + package.json script

## Open decisions (defaults locked for Phase 1)

| Topic | Default |
|-------|---------|
| Stale catalog | Block after 24h |
| Receipt number offline | Local “OFFLINE-pending” label until sync assigns `POS-######` |
| RestaurantPOS | Excluded |
| Oversell while offline | Allowed until sync; sync fails loudly if stock rule rejects |

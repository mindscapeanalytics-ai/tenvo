# POS Offline Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make retail/SuperStore POS offline sales production-safe: durable catalog snapshot, required `clientRef`, and exactly-once server sync — without changing online POS when offline mode is off.

**Architecture:** Postgres remains canonical. Devices hold an IndexedDB sales queue + product snapshot. Offline checkouts stamp a UUID `clientRef`; `POSService.createTransaction` find-or-creates by `(business_id, client_ref)` via a partial unique index. Feature stays behind `settings.pos.offlineModeEnabled` (default false) and plan feature `offline_pos_mode`.

**Tech Stack:** Next.js App Router, Prisma/Postgres, IndexedDB, existing `posOfflineQueue` / `usePosOffline`, `POSService`, Bun/Node verify scripts.

**Spec:** `docs/superpowers/specs/2026-07-18-pos-offline-phase1-design.md`

## Global Constraints

- Do **not** break online POS: omit `client_ref` when absent; INSERT path stays identical.
- Default `offlineModeEnabled` remains `false` (`lib/config/posSettings.js`).
- Do **not** touch RestaurantPOS, storefront checkout, hub inventory writes, or finance.
- Do **not** add a service worker / PWA in this plan.
- Tenant isolation: every IndexedDB read/write keyed by `businessId`.
- Fail closed: offline checkout requires a catalog snapshot newer than 24h.
- Copy: no em dashes in UI strings; prefer `font-semibold`.
- Git: **do not commit unless the user explicitly asks**; skip commit steps and continue.
- Cross-check columns against `prisma/schema.prisma` before migrations.

## File map

| File | Role |
|------|------|
| `prisma/migrations/20260718_pos_transactions_client_ref/migration.sql` | Add nullable `client_ref` + partial unique index |
| `prisma/schema.prisma` | Map `client_ref` on `pos_transactions` |
| `lib/services/POSService.js` | Idempotent create when `clientRef` present; optional open-session remap |
| `lib/utils/posOfflineIds.js` | `newPosClientRef()` |
| `lib/utils/posOfflineCatalog.js` | IndexedDB catalog snapshot + TTL helpers |
| `lib/utils/posOfflineQueue.js` | Require `clientRef`; support `failed` status |
| `lib/hooks/usePosOffline.js` | Stamp `clientRef`; treat idempotent success; session remap |
| `lib/hooks/usePosOfflineCatalog.js` | Write/read snapshot; expose `catalogReady` |
| `lib/hooks/usePosCheckout.js` | Gate offline on `catalogReady` |
| `components/pos/shared/PosOfflineBanner.jsx` | Catalog / failed messaging |
| `components/pos/PosTerminal.jsx` | Wire catalog + gated offline |
| `components/pos/SuperStorePOS.jsx` | Same |
| `components/pos/PosSettingsPanel.jsx` | Gate toggle on plan feature when available |
| `lib/config/plans.js` | Add `offline_pos_mode` (align with `plans-new.js`) |
| `scripts/verify-pos-offline.mjs` | Static wiring + pure helper checks |
| `package.json` | `verify:pos-offline` script |

---

### Task 1: Schema — nullable `client_ref` + partial unique index

**Files:**
- Create: `prisma/migrations/20260718_pos_transactions_client_ref/migration.sql`
- Modify: `prisma/schema.prisma` (`pos_transactions` model ~1786)
- Test: `scripts/verify-pos-offline.mjs` (created in Task 8; for now manual SQL review)

**Interfaces:**
- Consumes: existing `pos_transactions` table
- Produces: column `client_ref VARCHAR(64) NULL`; unique index `pos_transactions_business_client_ref_uidx` on `(business_id, client_ref) WHERE client_ref IS NOT NULL`

- [ ] **Step 1: Add migration SQL**

Create `prisma/migrations/20260718_pos_transactions_client_ref/migration.sql`:

```sql
-- Offline POS idempotency: nullable client_ref; multiple NULLs allowed for online sales.
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS client_ref VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS pos_transactions_business_client_ref_uidx
  ON pos_transactions (business_id, client_ref)
  WHERE client_ref IS NOT NULL;
```

- [ ] **Step 2: Update Prisma model**

In `prisma/schema.prisma` on `pos_transactions`, after `void_reason`, add:

```prisma
  /// Offline queue idempotency key; null for normal online sales.
  client_ref            String?                 @db.VarChar(64)
```

Do **not** add Prisma `@@unique([business_id, client_ref])` (breaks multiple NULLs). Rely on the partial index in SQL.

- [ ] **Step 3: Sanity-check migration against schema**

Confirm `pos_transactions` has no existing `client_ref`. Run (if DB available):

```bash
npx prisma validate
```

Expected: validate OK (or only pre-existing unrelated warnings).

- [ ] **Step 4: Skip commit** (unless user asked)

---

### Task 2: Server idempotency in `POSService.createTransaction`

**Files:**
- Modify: `lib/services/POSService.js` (`createTransaction` starting ~134)
- Test: extend verify script in Task 8; manual reasoning checklist below

**Interfaces:**
- Consumes: `data.clientRef?: string`, `data.businessId`, existing session/items/payments
- Produces: if row exists for `(business_id, client_ref)`, return that transaction without stock/GL redo; else insert with `client_ref` set when provided

- [ ] **Step 1: Normalize clientRef at top of `createTransaction`**

After destructuring `data`, add:

```javascript
const clientRefRaw = data.clientRef ?? data.client_ref ?? null;
const clientRef =
  typeof clientRefRaw === 'string' && clientRefRaw.trim().length > 0
    ? clientRefRaw.trim().slice(0, 64)
    : null;
```

- [ ] **Step 2: Find-or-return before session validation side effects**

Immediately after `BEGIN` (and before creating a new document number), if `clientRef`:

```javascript
if (clientRef) {
  const existing = await client.query(
    `SELECT * FROM pos_transactions
     WHERE business_id = $1 AND client_ref = $2
     LIMIT 1`,
    [businessId, clientRef]
  );
  if (existing.rows[0]) {
    if (shouldManageTransaction) await client.query('COMMIT');
    return existing.rows[0];
  }
}
```

Note: returning inside an open transaction after SELECT-only is fine; COMMIT releases cleanly. Alternatively ROLLBACK — prefer COMMIT of empty txn or use a read outside BEGIN. Cleaner pattern:

```javascript
// Before BEGIN, if clientRef:
if (clientRef && shouldManageTransaction) {
  const existing = await client.query(
    `SELECT * FROM pos_transactions WHERE business_id = $1 AND client_ref = $2 LIMIT 1`,
    [data.businessId, clientRef]
  );
  if (existing.rows[0]) return existing.rows[0];
}
```

Use the **before BEGIN** pattern so online path is untouched and idempotent hits skip BEGIN entirely.

- [ ] **Step 3: Session remap (careful, additive)**

After open-session check fails, if `clientRef` is set:

```javascript
if (ses.rows.length === 0) {
  if (clientRef) {
    const openSes = await client.query(
      `SELECT id FROM pos_sessions
       WHERE business_id = $1 AND status = 'open'
       ORDER BY opened_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [businessId]
    );
    if (openSes.rows[0]) {
      // Remap queued sale onto currently open session
      data.sessionId = openSes.rows[0].id;
      sessionId = openSes.rows[0].id;
    } else {
      throw new Error('POS session is not open — open a session to sync offline sales');
    }
  } else {
    throw new Error('POS session is not open');
  }
}
```

Ensure `sessionId` is `let` (not const) from destructuring, or reassign via a local `let activeSessionId = sessionId`.

- [ ] **Step 4: Include `client_ref` on INSERT**

Change INSERT to:

```sql
INSERT INTO pos_transactions (
  business_id, session_id, transaction_number, customer_id,
  subtotal, tax_amount, discount_amount, total_amount, payment_status, client_ref
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'completed',$9)
RETURNING *
```

Pass `clientRef` as `$9` (null for online sales).

- [ ] **Step 5: Unique-violation race**

Wrap insert/create path: on Postgres unique_violation (`23505`) for the client_ref index, re-SELECT by `client_ref` and return that row (same as idempotent hit). Do not re-run stock.

```javascript
} catch (err) {
  if (clientRef && err?.code === '23505') {
    if (shouldManageTransaction) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    }
    const again = await client.query(
      `SELECT * FROM pos_transactions WHERE business_id = $1 AND client_ref = $2 LIMIT 1`,
      [businessId, clientRef]
    );
    if (again.rows[0]) return again.rows[0];
  }
  // existing error handling...
}
```

Only apply this branch when `clientRef` is set so unrelated unique errors (e.g. transaction_number) still throw.

- [ ] **Step 6: Manual checklist**

- Online sale (no clientRef): INSERT columns include null client_ref; stock once.
- Replay same clientRef: second call returns first row; no second stock move.
- Skip commit unless user asked.

---

### Task 3: Pure helpers — clientRef + catalog TTL + slim products

**Files:**
- Create: `lib/utils/posOfflineIds.js`
- Create: `lib/utils/posOfflineCatalog.js` (Node-safe TTL + slim helpers; IndexedDB I/O in same file behind `typeof indexedDB` checks)
- Create: `lib/utils/__tests__/posOfflineCatalog.test.js` (or bun test colocated — follow existing `__tests__` under `lib/utils`)

**Interfaces:**
- Produces:
  - `newPosClientRef(): string` — UUID v4, max 64 chars
  - `POS_OFFLINE_CATALOG_TTL_MS = 24 * 60 * 60 * 1000`
  - `isPosOfflineCatalogFresh(updatedAt: string|number|Date, now?: number): boolean`
  - `slimPosOfflineProduct(product: object): object`
  - `writePosOfflineCatalog(businessId, products): Promise<void>`
  - `readPosOfflineCatalog(businessId): Promise<{ businessId, updatedAt, products } | null>`

- [ ] **Step 1: Write failing tests for TTL + slim**

Create `lib/utils/__tests__/posOfflineCatalog.test.js` using the same test runner as nearby utils tests (check `lib/utils/__tests__/inventoryEffectiveStock.test.js` for pattern — likely `node:test` or bun).

```javascript
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPosOfflineCatalogFresh,
  slimPosOfflineProduct,
  POS_OFFLINE_CATALOG_TTL_MS,
} from '../posOfflineCatalog.js';

describe('posOfflineCatalog', () => {
  test('fresh within TTL', () => {
    const now = Date.parse('2026-07-18T12:00:00Z');
    const updatedAt = new Date(now - 60_000).toISOString();
    assert.equal(isPosOfflineCatalogFresh(updatedAt, now), true);
  });

  test('stale after TTL', () => {
    const now = Date.parse('2026-07-18T12:00:00Z');
    const updatedAt = new Date(now - POS_OFFLINE_CATALOG_TTL_MS - 1).toISOString();
    assert.equal(isPosOfflineCatalogFresh(updatedAt, now), false);
  });

  test('slim keeps sell fields', () => {
    const slim = slimPosOfflineProduct({
      id: 'p1',
      name: 'Tea',
      sku: 'T1',
      barcode: '123',
      price: 10,
      selling_price: 10,
      stock: 5,
      category: 'Drinks',
      is_active: true,
      huge: { nested: true },
    });
    assert.equal(slim.id, 'p1');
    assert.equal(slim.huge, undefined);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
node --test lib/utils/__tests__/posOfflineCatalog.test.js
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement `posOfflineIds.js`**

```javascript
export function newPosClientRef() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 64);
}
```

- [ ] **Step 4: Implement catalog helpers + IndexedDB**

In `lib/utils/posOfflineCatalog.js`:

- Reuse same DB name `tenvo_pos_offline` as `posOfflineQueue.js`.
- Bump shared version carefully: **both** queue and catalog must open the same DB_VERSION and create both stores in `onupgradeneeded`. Prefer extracting `openPosOfflineDb()` into `lib/utils/posOfflineDb.js` used by queue + catalog to avoid version skew.

Recommended small extract:

`lib/utils/posOfflineDb.js`:

```javascript
export const POS_OFFLINE_DB_NAME = 'tenvo_pos_offline';
export const POS_OFFLINE_DB_VERSION = 2; // was 1 in queue-only

export function openPosOfflineDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(POS_OFFLINE_DB_NAME, POS_OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sales')) {
        const os = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
        os.createIndex('businessId', 'businessId', { unique: false });
        os.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('catalog')) {
        db.createObjectStore('catalog', { keyPath: 'businessId' });
      }
    };
  });
}
```

Then update `posOfflineQueue.js` to import `openPosOfflineDb` instead of local `openDb`.

`slimPosOfflineProduct` keep: `id`, `name`, `sku`, `barcode`, `price`, `selling_price`, `unit_price`, `stock`, `tax_rate`/`taxPercent`, `category`, `is_active`, `variants` (pass-through array if present, else omit).

`isPosOfflineCatalogFresh(updatedAt, now = Date.now())`:
`return now - Date.parse(updatedAt) <= POS_OFFLINE_CATALOG_TTL_MS` (false if invalid date).

- [ ] **Step 5: Re-run tests — expect pass**

```bash
node --test lib/utils/__tests__/posOfflineCatalog.test.js
```

Expected: PASS.

- [ ] **Step 6: Skip commit** unless user asked.

---

### Task 4: Queue requires `clientRef` + failed status

**Files:**
- Modify: `lib/utils/posOfflineQueue.js`
- Modify: `lib/utils/posOfflineDb.js` (from Task 3)
- Test: unit assert in verify script / small node test if feasible without IndexedDB

**Interfaces:**
- Consumes: `openPosOfflineDb`
- Produces: `enqueueOfflinePosSale({ businessId, payload, clientRef })` throws if `!clientRef`; `markPosSaleFailed(id, error)`; `listFailedPosSales(businessId)` optional

- [ ] **Step 1: Refactor queue to shared DB opener**

Replace local `openDb` with `openPosOfflineDb` from `posOfflineDb.js`. Keep export names stable.

- [ ] **Step 2: Require clientRef on enqueue**

```javascript
export async function enqueueOfflinePosSale(sale) {
  const clientRef = sale?.clientRef || sale?.payload?.clientRef;
  if (!clientRef || typeof clientRef !== 'string') {
    throw new Error('clientRef required for offline POS sale');
  }
  // ...add record with clientRef at top level and inside payload
  const record = {
    businessId: sale.businessId,
    clientRef,
    payload: { ...sale.payload, clientRef },
    status: 'pending',
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  // existing add...
}
```

- [ ] **Step 3: Add `markPosSaleFailed`**

Mirror `markPosSaleSynced` but set `status: 'failed'`, `lastError`, `failedAt`.

- [ ] **Step 4: Skip commit** unless user asked.

---

### Task 5: `usePosOffline` — stamp clientRef, sync semantics

**Files:**
- Modify: `lib/hooks/usePosOffline.js`
- Modify: `lib/hooks/usePosCheckout.js`

**Interfaces:**
- Consumes: `newPosClientRef`, queue APIs, `posAPI.checkout`
- Produces: `queueSale(payload)` always adds `clientRef`; sync marks synced on success **or** when server returns existing tx; hard errors → failed

- [ ] **Step 1: Update `queueSale`**

```javascript
const queueSale = useCallback(async (payload) => {
  if (!businessId) throw new Error('Business required');
  const clientRef = payload?.clientRef || newPosClientRef();
  await enqueueOfflinePosSale({
    businessId,
    clientRef,
    payload: { ...payload, clientRef, businessId },
  });
  await refreshPending();
}, [businessId, refreshPending]);
```

- [ ] **Step 2: Update sync loop**

On `res?.success` → `markPosSaleSynced`.  
On error message matching `/session is not open/i` → leave pending (cashier must open session); do not mark failed on first hit.  
On other business errors after attempts ≥ 1 → `markPosSaleFailed`.  
Network throw → `incrementPosSaleAttempt` only.

- [ ] **Step 3: Gate `usePosCheckout`**

Add optional `catalogReady = true` param:

```javascript
if (!isOnline && offlineEnabled) {
  if (!catalogReady) {
    toast.error('Connect once to cache products before selling offline', { id: 'pos-offline' });
    return { success: false, error: 'catalog_not_ready' };
  }
  await queueSale(payload);
  // ...
}
```

- [ ] **Step 4: Skip commit** unless user asked.

---

### Task 6: `usePosOfflineCatalog` + wire POS UIs

**Files:**
- Create: `lib/hooks/usePosOfflineCatalog.js`
- Modify: `components/pos/PosTerminal.jsx`
- Modify: `components/pos/SuperStorePOS.jsx`
- Modify: `components/pos/shared/PosOfflineBanner.jsx`

**Interfaces:**
- Consumes: `writePosOfflineCatalog`, `readPosOfflineCatalog`, `isPosOfflineCatalogFresh`
- Produces: `{ catalogReady, catalogProducts, refreshCatalogFromProducts(products) }`

- [ ] **Step 1: Implement hook**

```javascript
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  writePosOfflineCatalog,
  readPosOfflineCatalog,
  isPosOfflineCatalogFresh,
} from '@/lib/utils/posOfflineCatalog';

export function usePosOfflineCatalog(businessId, { enabled = false, products = [] } = {}) {
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);

  const refreshFromMemory = useCallback(async () => {
    if (!businessId || !enabled) {
      setCatalogReady(false);
      return;
    }
    if (Array.isArray(products) && products.length > 0) {
      await writePosOfflineCatalog(businessId, products);
    }
    const snap = await readPosOfflineCatalog(businessId);
    const ready = Boolean(snap?.products?.length && isPosOfflineCatalogFresh(snap.updatedAt));
    setCatalogReady(ready);
    setCatalogProducts(snap?.products || []);
  }, [businessId, enabled, products]);

  useEffect(() => {
    refreshFromMemory().catch(() => {
      setCatalogReady(false);
    });
  }, [refreshFromMemory]);

  return { catalogReady, catalogProducts, refreshFromMemory };
}
```

Throttle: if `products` identity changes every render, debounce write (60s) via ref `lastWriteAt` inside the hook to avoid IndexedDB spam.

- [ ] **Step 2: Wire PosTerminal**

Where offline is used (~714):

```javascript
const { catalogReady, catalogProducts } = usePosOfflineCatalog(businessId, {
  enabled: posSettings.offlineModeEnabled,
  products, // existing POS product list variable name — use the real one in file
});
```

Offline checkout branch (~1011):

```javascript
if (!isOnline && posSettings.offlineModeEnabled) {
  if (!catalogReady) {
    toast.error('Connect once to cache products before selling offline');
    return;
  }
  await queueSale(payload); // queueSale stamps clientRef
  // existing clear cart...
}
```

When `!isOnline && catalogReady`, product search/scan should fall back to `catalogProducts` if in-memory `products` is empty.

- [ ] **Step 3: Mirror in SuperStorePOS** (same gates; do not touch RestaurantPOS).

- [ ] **Step 4: Extend banner**

```javascript
export function PosOfflineBanner({
  isOnline,
  pendingCount = 0,
  isSyncing = false,
  catalogReady = true,
  onSync,
  className,
}) {
  if (isOnline && pendingCount <= 0) return null;
  // if !isOnline && !catalogReady → message: "Offline — product cache missing. Reconnect to enable sales."
  // else existing copy
}
```

- [ ] **Step 5: Skip commit** unless user asked.

---

### Task 7: Plan feature `offline_pos_mode` in canonical `plans.js`

**Files:**
- Modify: `lib/config/plans.js` (each tier `features` + `FEATURE_NAMES` if present)
- Modify: `components/pos/PosSettingsPanel.jsx`

**Interfaces:**
- Align with `lib/config/plans-new.js`: free/false; starter+ true (match that file’s flags).
- Settings toggle: if plan lacks feature, show disabled toggle + short upgrade hint (do not remove the row).

- [ ] **Step 1: Add feature flag to every tier in `PLAN_TIERS`**

```javascript
offline_pos_mode: false, // free
// starter and above: true — copy exact tier keys from plans-new.js
```

Add label in the human-readable map near `barcode_scanning`:

```javascript
offline_pos_mode: 'Offline POS Mode',
```

- [ ] **Step 2: Gate settings UI**

In `PosSettingsPanel`, use existing business plan helpers already used elsewhere in settings (find `planHasFeatureWithPackaging` / `useBusiness`). If unavailable, keep toggle but document in comment that server does not need plan for queue — plan is UX gate only in Phase 1.

```javascript
const canOffline = planHasFeatureWithPackaging(planTier, 'offline_pos_mode', business?.settings);
// ToggleRow disabled={!canOffline} hint=...
```

Effective enable in POS components:

```javascript
enabled: posSettings.offlineModeEnabled && canOffline
```

- [ ] **Step 3: Skip commit** unless user asked.

---

### Task 8: Verify script + package.json

**Files:**
- Create: `scripts/verify-pos-offline.mjs`
- Modify: `package.json` (add script near other verify entries)

**Interfaces:**
- Produces: `bun run verify:pos-offline` exit 0 when wiring intact

- [ ] **Step 1: Write verify script** (static includes pattern like `verify-finance-gl.mjs`)

Assert files contain:

- migration `client_ref` + `pos_transactions_business_client_ref_uidx`
- schema `client_ref`
- `POSService` strings: `client_ref`, `clientRef`
- `newPosClientRef`
- `writePosOfflineCatalog` / `isPosOfflineCatalogFresh`
- `enqueueOfflinePosSale` requires clientRef (source includes `clientRef required`)
- `usePosOfflineCatalog`
- PosTerminal / SuperStorePOS import `usePosOfflineCatalog`
- RestaurantPOS does **not** import `usePosOfflineCatalog`
- `offline_pos_mode` in `lib/config/plans.js`
- `verify:pos-offline` present only after package.json update

Also run:

```bash
node --test lib/utils/__tests__/posOfflineCatalog.test.js
```

from the script (spawn) or document as separate step.

- [ ] **Step 2: Add package.json script**

```json
"verify:pos-offline": "node scripts/verify-pos-offline.mjs"
```

- [ ] **Step 3: Run verify**

```bash
bun run verify:pos-offline
```

Expected: all OK, exit 0.

- [ ] **Step 4: Skip commit** unless user asked.

---

### Task 9: Manual QA checklist (no code)

**Files:** none

- [ ] **Step 1: Online baseline**

With `offlineModeEnabled` false: complete one POS sale. Confirm receipt number `POS-…`, stock down by 1, no `client_ref` needed.

- [ ] **Step 2: Cache then offline**

Enable offline mode (plan allows). Load POS online (catalog writes). DevTools → Network → Offline. Sell one item. Confirm toast queued; banner pending ≥ 1.

- [ ] **Step 3: Sync idempotency**

Go online. Confirm sync creates one transaction. Trigger `syncPending` again — still one row for that `client_ref` in DB:

```sql
SELECT id, transaction_number, client_ref FROM pos_transactions
WHERE business_id = '<id>' AND client_ref IS NOT NULL
ORDER BY created_at DESC LIMIT 5;
```

- [ ] **Step 4: Fail closed**

Clear site data / IndexedDB. Go offline without cache. Attempt sale → blocked with catalog message.

- [ ] **Step 5: Regression**

Confirm RestaurantPOS and storefront checkout untouched.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Nullable `client_ref` + partial unique index | 1 |
| Find-or-create idempotent sync | 2 |
| Session remap to open session | 2 |
| Catalog snapshot + 24h TTL | 3, 6 |
| Require clientRef on enqueue | 4, 5 |
| Fail closed without catalog | 5, 6 |
| Banner messaging | 6 |
| Plan gate `offline_pos_mode` | 7 |
| Default toggle false / additive | Global + 7 |
| Restaurant/storefront untouched | Global + 8 |
| verify:pos-offline | 8 |
| Safe rollout order | Tasks 1→2→4→5→6→7 |

## Out of scope (do not implement)

- Service worker / PWA
- Google Drive backup
- Hub-wide offline
- RestaurantPOS offline
- Multi-device optimistic stock locking

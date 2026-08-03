# POS Market-Ready Cart, Hold & Checkout Fidelity

**Date:** 2026-07-25  
**Status:** Implemented (2026-07-25)  
**Related:** `2026-07-16-pos-power-till-design.md`, `2026-07-18-pos-offline-phase1-design.md`, `lib/config/posDomains.js`

## Problem

SuperStorePOS (supermarket / milk-shop / pharmacy family) puts **active sale lines in the center browse pane** and leaves the right **CART** as totals-only. Market tills keep **catalog/browse left** and **editable line items in the cart panel**. Hold is **resume-last only** (no pick which parked sale). Cart weight flags, batch/variant IDs, and checkout stock paths drift between shells and hub glue, so milk kg sales, pharmacy FEFO, and variants are not market-accurate.

## Goals

1. **Cart chrome:** Selected lines always render in the cart window (right desktop / checkout pane mobile); center stays browse + search + scan.
2. **Multi-held sales:** Park many carts; resume or discard any by id (customer · time · total), not LIFO-only.
3. **Checkout fidelity:** Preserve batch / variant / serial / clientRef through hub checkout into `POSService` stock deduct.
4. **Weight accuracy:** Persist `isWeightItem` on cart lines so kg/g steppers work (milk-shop critical).
5. **Retail shell parity:** SuperStore ↔ PosTerminal share hold picker, discount types, bulk qty when flagged, stock caps, and one checkout hook path.
6. **Domain awareness:** Drive behavior from `getPosDomainFlags`; restaurant stays kitchen ledger (no retail hold parks).

## Non-goals

- Merging SuperStorePOS and PosTerminal into one component file.
- Restaurant offline, split tender, or camera-scan parity.
- Hardware scale protocols, pole display, FBR live, cash-drawer protocol expansion beyond existing kick.
- Changing canonical F1–F9 map (F4 Hold / F8 Clear remains).
- Server-persisted held sales (localStorage per business remains Phase 1).

## Approach

Phased pack on existing shells (not a single-shell rewrite):

1. Layout + shared cart line list  
2. Multi-held APIs + picker UI  
3. Product-add / checkout / stock correctness  
4. Parity + verify scripts  

RestaurantPOS unchanged except shared dock map already in place.

---

## Architecture

| Unit | Responsibility |
|------|----------------|
| `components/pos/shared/PosCartLines.jsx` (new) | Cart line rows (`theme: 'dark' | 'light'`): qty ±, bulk quick-adds, weight input, remove, unit/line totals |
| `CartSummary` (SuperStore) / PosTerminal cart panel | Embed `PosCartLines` above customer/totals; scroll lines in `flex-1` |
| SuperStore left pane | Always `PosProductBrowseGrid` (+ search hit list); never `ScannedItemsList` as primary cart |
| `lib/hooks/usePosHeldSales.js` | Stable ids, `resumeHeld(id)`, `removeHeld(id)`, full snapshot incl. `discountType` |
| `components/pos/shared/PosHeldSalesSheet.jsx` (new) | List held parks; Resume / Discard |
| `lib/hooks/usePosProductAdd.js` | Write `isWeightItem` (+ unit) on new lines |
| `lib/hooks/usePosCheckout.js` | Single online/offline checkout path used by both retail shells |
| `DashboardClient.handlePosCheckout` | Pass through `batchId`, `variantId`, `serialNumber`, `clientRef` |
| `POSService.createTransaction` | Variant → `removeVariantStock`; batch_id into `removeStock` when present |
| `lib/config/posDomains.js` | Flags remain SoT; `supportsHeldOrders` gates retail hold UI only |

### Layout (desktop SuperStore)

```
┌─────────────────────────────┬──────────────────┐
│ Session / offline / scan    │ CART header      │
│ Department chips            │ PosCartLines ★   │
│ PosProductBrowseGrid ★      │ Customer         │
│ (search hits under scan)    │ Totals / tender  │
│                             │ Hold / Clear /   │
│                             │ Held sheet       │
│                             │ Checkout         │
└─────────────────────────────┴──────────────────┘
         F1–F9 PosHotkeyDock
```

★ = primary change vs today (today lines sit left; right has no lines).

### Mobile SuperStore

- Browse pane: catalog only (even when cart non-empty); sticky bar opens checkout.
- Checkout pane: `CartSummary` with `PosCartLines` + totals + actions.

### PosTerminal

Already cart-right. Swap inline line markup for shared `PosCartLines` (light or dark skin prop) so qty/bulk/weight behavior matches SuperStore when flags apply.

---

## Held sales model

Storage key (unchanged): `tenvo:pos:held:{businessId}`.

Shared across SuperStore and PosTerminal for the same tenant (intentional: one counter park list).

Each entry:

```js
{
  id: string,              // crypto.randomUUID() or `${Date.now()}-${n}`
  items: PosCartLine[],
  customer: object | null,
  discount: number,
  discountType: 'fixed' | 'percentage',
  taxMode: 'standard' | 'gst_only' | 'exempt',
  paymentMethod: string,
  timestamp: number,
}
```

API:

| Method | Behavior |
|--------|----------|
| `holdSale(snapshot)` | Append if items.length > 0; return id or false |
| `resumeHeld(id)` | Remove that entry; return snapshot or null |
| `removeHeld(id)` | Discard without restoring |
| `resumeLastHeld()` | Convenience for power users; still available |

UI:

- Cart badge `{n} held` opens `PosHeldSalesSheet` (not auto-resume).
- Each row: label (customer name or Walk-in), relative time, line count, computed total, **Resume** / **Discard**.
- Resume into empty cart only; if cart has lines, confirm replace or block with toast (prefer **block + toast** to avoid silent wipe).
- F4 continues to **park** current cart (clear active after hold).
- Rename SuperStore **VOID** → **Clear** (manager PIN path unchanged). True post-sale void stays hub `PosVoidPanel`.

Restaurant: `supportsHeldOrders` false; no park sheet.

---

## Product add & weight

In `usePosProductAdd.tryAddProduct`, new lines must include:

```js
isWeightItem: Boolean(...),
unit: product.unit || (isWeightItem ? 'kg' : 'pcs'),
```

Weight lines: do not merge on re-scan (already); UI uses decimal stepper when `isWeightItem`.

Qty change (both shells): clamp to `maxStock` when `maxStock > 0` and `!allow_negative_stock`.

Bulk quick-adds: show when `getPosDomainFlags(category).supportsBulkQty` (or wholesaleMode); prefer `getBulkQuickAdds(moq)` over hardcoded +5/+12 when wholesale MOQ present; else keep +5/+12 for supermarket family.

Discount: SuperStore gains fixed ↔ percentage toggle (parity with PosTerminal); hold snapshot always stores `discountType`.

---

## Checkout & stock path

### Payload

`buildPosCheckoutPayload` already maps line fields. Hub `handlePosCheckout` **must not strip**:

- `batchId` / `batch_id`
- `variantId` / `variant_id`
- `serialNumber` / `serial_number`
- `clientRef` / `client_ref` (offline exactly-once)

### POSService

For each line after insert into `pos_transaction_items`:

1. If `variantId` → `InventoryService.removeVariantStock({ ... })` on same client.
2. Else → `InventoryService.removeStock({ ..., batch_id: item.batchId || null, ... })` on same client.

Do not double-deduct headline + variant.

### Shells

Route `handleCompleteSale` through `usePosCheckout` so online / offline / split / taxMode stay one path. Keep shell-specific success toast / print / drawer kick after the hook returns.

Invoice fallback path (no session): preserve same item fields where invoice lines support them; do not invent batch columns invoices lack — document any invoice-fallback limits in the plan.

---

## Domain awareness

| Flag / variant | Behavior |
|----------------|----------|
| `superstore` | Browse-left / cart-right layout; bulk qty; held sheet |
| `retail` / `service` | PosTerminal shell; held sheet; serviceMode labels only |
| `restaurant` | Kitchen / open orders; no retail held parks |
| `pharmacyMode` | Batch dialog + batchId through checkout |
| `supportsWeight` | Weight UI when line `isWeightItem` |
| `supportsBulkQty` | Quick-add chips on cart lines |
| `supportsHeldOrders` | Gate hold button + sheet (retail + superstore only) |
| `wholesaleMode` | MOQ + `getBulkQuickAdds` / wholesale price |

Verify script `scripts/verify-pos-hotkeys.mjs` SUPERSTORE set must include **`milk-shop`** (aligned with `posDomains.js`).

---

## Error handling

| Case | UX |
|------|-----|
| Hold empty cart | Toast; no-op |
| Resume while cart non-empty | Toast: clear or checkout first |
| Oversell qty | Clamp + toast |
| Offline without catalog | Existing offline banner / block |
| Stock remove fails mid-tx | Existing transaction rollback in `POSService` |
| Corrupt localStorage held JSON | Reset to `[]` (already) |

---

## Testing

**Unit**

- `usePosHeldSales`: hold → resume by id → remove; discountType round-trip
- `usePosProductAdd` / helper: `isWeightItem` on kg products
- Checkout normalize: batch/variant/serial/clientRef preserved
- `getBulkQuickAdds` / flag gating for quick-add visibility

**Verify**

- `bun run verify:pos-hotkeys` (milk-shop in SUPERSTORE)
- Existing offline / tax unit tests still green

**Manual (milk demo)**

1. Add Buffalo Milk → line appears in **right cart**, center stays categories/grid.
2. Add more via grid without losing cart visibility of lines.
3. Hold sale A, build sale B, hold B; open held sheet; resume A; checkout.
4. kg SKU: decimal qty in cart; stock decreases correctly after sale.
5. Pharmacy tenant (if available): pick batch → checkout stores batch and deducts.

---

## Implementation order

1. Extract `PosCartLines`; wire into SuperStore `CartSummary` + always-browse left pane + mobile.
2. Align PosTerminal cart rows with shared component.
3. Extend `usePosHeldSales` + `PosHeldSalesSheet`; wire both shells; rename VOID → Clear.
4. `isWeightItem` on add; SuperStore stock clamp; discount type; bulk chips via flags.
5. Hub checkout pass-through; `POSService` variant/batch stock; adopt `usePosCheckout`.
6. Verify scripts + unit tests.

## Success criteria

- Milk SuperStore: no cart lines in selection window; cart panel shows editable lines.
- Operator can hold ≥2 sales and resume either by name/time/total.
- Weight, pharmacy batch, and variant sales deduct the correct inventory path.
- PosTerminal and SuperStore share hold/discount/bulk/checkout behavior per domain flags.
- Restaurant kitchen flow unchanged.
- Hotkey dock still F4 Hold / F8 Clear; verify includes milk-shop.
)
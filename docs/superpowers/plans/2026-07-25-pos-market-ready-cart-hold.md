# POS Market-Ready Cart, Hold & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Market-standard SuperStore/PosTerminal till: lines in cart panel, multi-held picker, weight/batch/variant checkout fidelity, domain-flag parity.

**Architecture:** Shared `PosCartLines` + `PosHeldSalesSheet`; extend `usePosHeldSales`; fix product-add weight flag; pass batch/variant through `handlePosCheckout` into `POSService` stock paths; keep restaurant kitchen-only.

**Tech Stack:** React client components, existing POS hooks, `InventoryService`, Bun verify scripts, Vitest unit tests.

## Global Constraints

- No em dashes in UI copy.
- Desktop layouts dual with `lg:`; do not break mobile browse/checkout panes.
- F1–F9 map unchanged (F4 Hold, F8 Clear).
- RestaurantPOS: no retail held parks / offline parity in this plan.
- Do not merge SuperStore and PosTerminal into one file.
- Prefer `notify`/toast patterns already used in POS shells.
- User rule: do not git commit unless explicitly asked.

---

## File map

| File | Role |
|------|------|
| `components/pos/shared/PosCartLines.jsx` | Create — shared cart line list |
| `components/pos/shared/PosHeldSalesSheet.jsx` | Create — multi-held picker dialog |
| `lib/hooks/usePosHeldSales.js` | Extend — id, resumeHeld, removeHeld |
| `lib/hooks/usePosProductAdd.js` | Add `isWeightItem` on lines |
| `components/pos/SuperStorePOS.jsx` | Always-browse left; cart lines right; held sheet; Clear label |
| `components/pos/PosTerminal.jsx` | Use PosCartLines; held sheet |
| `app/business/[category]/DashboardClient.jsx` | Preserve batch/variant/serial/clientRef |
| `lib/services/POSService.js` | Variant + batch stock deduct |
| `lib/hooks/usePosCheckout.js` | Adopt in both shells (optional thin wrap) |
| `scripts/verify-pos-hotkeys.mjs` | Add milk-shop to SUPERSTORE |
| `tests/unit/posHeldSales.test.js` | New unit coverage |
| `tests/unit/posCheckoutNormalize.test.js` | Payload field preservation helper test |

---

### Task 1: Shared PosCartLines + SuperStore layout

**Files:**
- Create: `components/pos/shared/PosCartLines.jsx`
- Modify: `components/pos/SuperStorePOS.jsx`

**Produces:** Cart lines render only in cart panel; left pane always browse.

- [ ] **Step 1:** Create `PosCartLines` with props: `items`, `currency`, `businessCategory`, `theme` (`dark`|`light`), `onQuantityChange`, `onWeightChange`, `onRemoveItem`, `showBulkQuickAdds`, `bulkQuickAdds` (number[]).
- [ ] **Step 2:** In SuperStore `CartSummary`, insert scrollable `PosCartLines` between customer and totals (`flex-1 min-h-0 overflow-y-auto`).
- [ ] **Step 3:** Desktop left: always `PosProductBrowseGrid` (remove cart→ScannedItemsList branch). Keep search hit list under scan.
- [ ] **Step 4:** Mobile browse: always grid (not ScannedItemsList when cart nonempty).
- [ ] **Step 5:** Remove or stop using left-pane `ScannedItemsList` as cart (delete dead component if unused).
- [ ] **Step 6:** Manual check — milk layout mental model: lines only in right cart.

### Task 2: Multi-held sales

**Files:**
- Modify: `lib/hooks/usePosHeldSales.js`
- Create: `components/pos/shared/PosHeldSalesSheet.jsx`
- Modify: SuperStore + PosTerminal hold/resume UI
- Test: `tests/unit/posHeldSales.test.js` (pure helpers if hook hard to test — extract `normalizeHeldEntry` / `createHeldEntry`)

**Produces:** Pick any held sale by id.

- [ ] **Step 1:** Add `id` on hold; `resumeHeld(id)`, `removeHeld(id)`; keep `resumeLastHeld`; persist `discountType`.
- [ ] **Step 2:** `PosHeldSalesSheet` dialog listing parks with Resume/Discard; totals from items.
- [ ] **Step 3:** Badge opens sheet; resume blocked if active cart nonempty (toast).
- [ ] **Step 4:** Rename SuperStore VOID → Clear.
- [ ] **Step 5:** Unit test hold/resume/remove by id.

### Task 3: Weight + qty parity

**Files:**
- Modify: `lib/hooks/usePosProductAdd.js`
- Modify: SuperStore/PosTerminal qty handlers + PosCartLines bulk flags via `getPosDomainFlags`
- SuperStore discountType state

- [ ] **Step 1:** Persist `isWeightItem` on new cart lines.
- [ ] **Step 2:** Clamp qty to `maxStock` on SuperStore.
- [ ] **Step 3:** Bulk chips when `supportsBulkQty`; wholesale uses `getBulkQuickAdds`.
- [ ] **Step 4:** SuperStore discount fixed/% parity; include in hold snapshot.

### Task 4: Checkout & stock fidelity

**Files:**
- Modify: `DashboardClient.jsx` `handlePosCheckout`
- Modify: `POSService.js` `createTransaction`
- Wire `usePosCheckout` in shells where it reduces duplication without breaking print/drawer

- [ ] **Step 1:** Normalize items keeping `batchId`, `variantId`, `serialNumber`, `clientRef`.
- [ ] **Step 2:** If variantId → `removeVariantStock`; else `removeStock` with `batch_id`.
- [ ] **Step 3:** Unit/helper test that normalize preserves fields.
- [ ] **Step 4:** Pass `clientRef` on checkout payload when offline sync supplies it.

### Task 5: PosTerminal shared lines + verify

**Files:**
- Modify: `PosTerminal.jsx` to use `PosCartLines` (light theme)
- Modify: `scripts/verify-pos-hotkeys.mjs` — add `milk-shop`
- Run: `bun run verify:pos-hotkeys` and relevant unit tests

- [ ] **Step 1:** Replace inline cart rows with shared component (preserve light look).
- [ ] **Step 2:** Wire held sheet.
- [ ] **Step 3:** Add milk-shop to verify SUPERSTORE set + variant case.
- [ ] **Step 4:** Run verifies/tests; fix failures.

---

## Spec coverage check

| Spec goal | Task |
|-----------|------|
| Cart lines in cart window | 1 |
| Multi-held picker | 2 |
| Weight flag | 3 |
| Batch/variant checkout | 4 |
| Retail parity | 3, 5 |
| milk-shop verify | 5 |
| Restaurant unchanged | (no restaurant tasks) |

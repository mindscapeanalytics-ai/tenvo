# Finance Expenses Quick Add & Money Entry UX — Design Spec

**Date:** 2026-07-24  
**Status:** Implemented (Approach 3 — shared form + hub event pattern)  
**Goal:** Make Finance Ledger / Bank Reconciliation / Expenses reliable and easy to enter day-to-day, with domain-aware quick expense add that does not fork the create path or break existing Finance Hub consolidation.

**Related:** `2026-07-17-finance-hub-consolidation-design.md`, `2026-07-17-finance-money-hub-design.md`, milk-shop vertical (`2026-07-23-milk-shop-pakistan-design.md`).

---

## Problem

1. Header **Log Expense** only calls `switchTab('finance')` and lands on Overview — no form, no Expenses sub-tab.
2. Mobile header quick-add omits Log Expense.
3. Expense **category** values differ across `ExpenseEntryForm` (title-case labels), `ExpenseManager` (local slugs), and canonical `EXPENSE_CATEGORIES` in `lib/config/accounting.js` — filters and breakdowns look broken for new rows.
4. Dashboard **reconcile-now** maps to Chart of Accounts (`accounting`), not Bank Reconciliation.
5. Bank Reconciliation empty state does not distinguish “no sessions yet” vs “tables missing”.
6. Expense delete action exists but list UI never wires it; receipt dropzone is a stub.
7. No domain-aware expense category overlays (milk-shop route fuel / chilling / supplier milk, etc.).
8. Easy dashboard has **View expenses** but no one-tap **Log expense** create shortcut.

General Ledger itself already mounts a real report (`GeneralLedgerReport` + `getGLEntriesAction`). This pass does not rewrite GL; it only protects deep-links and verify coverage.

---

## Goals

1. One-tap **Log Expense** from header `+ ADD` (desktop + mobile) and from Easy/Advanced dashboards.
2. Single create path: `ExpenseEntryForm` → `createExpenseAction` → `ExpenseService` → GL expense journal (unchanged posting).
3. Unified, domain-aware expense categories for form, filters, and breakdown badges.
4. Fix Bank Reconciliation discoverability and empty-state honesty.
5. Wire expense delete in the list; leave receipt upload out of scope.
6. Verify script asserts wiring so regressions are caught.

## Non-goals

- New expense APIs or parallel QuickExpense stack.
- Receipt file upload / OCR.
- Rewriting AccountantDashboard mock widgets (follow-up).
- Merging milk Route Hisab into Finance Expenses.
- New CoA seeding or custom GL accounts per domain beyond category → `account_code` suggest.
- Changing Finance Hub tab consolidation / Statements nesting.
- Free-plan entitlement changes for `expense_tracking` (keep existing plan gates).

---

## Approach (locked)

**Approach 3 — shared form + hub `open-modal` pattern** (same family as invoice / product / customer / vendor / purchase).

Rejected:

- **Wire-only:** still forces Finance tab switch; weak “quick” UX.
- **Parallel stack:** duplicates create path; higher break risk.

---

## Architecture

```
Header + ADD / Dashboard tile / Finance “Record Expense”
        │
        ▼
open-modal { modalId: 'expense' }   OR   in-tab setShowForm(true)
        │
        ▼
DashboardClient showExpenseForm → ExpenseEntryForm
        │
        ▼
createExpenseAction → ExpenseService.createExpense
        │
        ├── expenses row
        ├── optional vendor AP / payments row
        └── AccountingService.recordBusinessTransaction('expense')
        │
        ▼
onSave → fetchExpenses (+ FinanceHub list refresh when mounted)
```

### Plan gate

- Before opening the modal: `planHasFeatureWithPackaging(..., 'expense_tracking')` (same gate as Finance Expenses tab).
- If denied: compact toast (“Expense tracking is not on your plan”) — do not open an empty form.
- If allowed: open modal on **current tab** (no forced Finance navigation). Optional secondary link in success toast: “View in Finance” → `finance` + `financeView=expenses`.

---

## Entry points (UX)

| Surface | Behavior |
|---------|----------|
| Header desktop `+ ADD` → Log Expense | `open-modal` `expense` |
| Header mobile quick-add | Same item + same event |
| Easy dashboard Finance section | Primary button **Log expense** → same modal; keep **View expenses** as browse deep-link |
| Advanced / domain dashboard expense tiles | Prefer create action where copy says “add/log”; keep view actions for browse |
| Finance → Expenses → Record Expense | Keep in-tab overlay form (reuse same `ExpenseEntryForm`) |
| `view-all-expenses` / `view-category-expenses` | Unchanged: navigate Finance → Expenses |
| `reconcile-now` | **Fix:** `finance` + `financeView=reconciliation` (align with `reconcile-account*`) |

### DashboardClient changes

- State: `showExpenseForm` (boolean).
- `open-modal` handler: `modalId === 'expense'` → set true (after plan gate).
- `handleQuickAction`: support `log-expense` (open modal) distinct from `expenses` (navigate Finance Expenses).
- Mount `ExpenseEntryForm` once at shell level (vendors from DataContext), same overlay tokens as other hub forms (`MOBILE_OVERLAY` / existing form styles).
- On save success: `fetchExpenses()`; close modal; `notify.compactSave` or existing toast pattern.

### Header

- Replace `switchTab('finance')` with `open-modal` expense event on desktop Log Expense.
- Add Log Expense to mobile quick-add list (parity).

---

## Categories & domain awareness

### Canonical base

Source of truth: `lib/config/accounting.js` → `EXPENSE_CATEGORIES`:

`{ value, label, account_code }`

### Resolver

New helper (sync, no server): `lib/utils/expenseCategories.js` (or extend `lib/config/accounting.js` if keep colocated):

```
getExpenseCategoriesForDomain(domainKey) → Array<{ value, label, account_code, color? }>
normalizeExpenseCategory(raw) → canonical value | 'miscellaneous'
```

Rules:

1. Resolve domain alias first (`resolveDomainKey` / existing alias helper).
2. Start from base `EXPENSE_CATEGORIES` (never drop base items — filters stay stable across verticals).
3. **Append** domain overlay items (unique `value`s).
4. `normalizeExpenseCategory` maps legacy title-case / alias labels (`Salaries` → `salaries`, `salary` → `salaries`, `Repair & Maintenance` → `repairs`, `Others`/`other` → `miscellaneous`) so old rows still filter.

### Domain overlays (v1)

| Domain keys | Extra categories (examples) | Map toward GL |
|-------------|-----------------------------|---------------|
| `milk-shop` (+ milk aliases) | Supplier milk purchase, Chilling / ice, Route fuel, Packaging (pouches), Shop utilities | logistics / utilities / miscellaneous / office as nearest codes |
| `restaurant-cafe` | Kitchen supplies, Delivery fuel, Packaging | office / logistics / miscellaneous |
| Supermarket family (`supermarket`, grocery/fmcg aliases) | Cold chain / perishable loss, Store supplies | utilities / miscellaneous / office |

Verticals without an overlay use base list only. Owner overrides via Settings are **out of scope** for v1 (can later plug `settings.domainKnowledge` if needed).

### Form UX

- Category select uses resolver output (labels domain-aware).
- On category change: if matching `account_code` exists in loaded expense GL accounts, **preselect** that account (user can override).
- Currency / tax labels from `useBusiness()` / `regionalPack` (no hardcoded PKR).
- Pass `businessCategory` into form (fix unused `category` prop today).
- Hide or remove non-functional receipt dropzone until upload ships (prefer hide — cleaner UX than a fake control).

### ExpenseManager

- Import shared categories via resolver + `businessCategory`.
- Filters / breakdown use canonical `value`s; display `label` + optional color.
- Wire row delete → `onDeleteExpense` / `deleteExpenseAction` with confirm; refresh list.
- Keep Record Expense in-tab form; do not open shell modal from Finance unless we intentionally dual-fire (prefer in-tab only inside Expenses to avoid double overlays).

---

## Bank Reconciliation UX

1. Fix `QUICK_VIEW_ACTION_TO_TAB['reconcile-now']` routing to reconciliation (via `handleTabChange('finance', { financeView: 'reconciliation' })` or equivalent — do not leave it as bare `accounting`).
2. When API returns `warning` / `TABLES_MISSING`: show honest empty state (“Bank reconciliation is not available on this database yet”) instead of a silent blank list.
3. When tables exist and `sessions.length === 0`: keep friendly empty state + **New Reconciliation** CTA (already present).
4. No schema/migration work in this pass; if tables missing, message is enough.

---

## General Ledger

- No feature rewrite.
- Confirm `view-general-ledger` and `financeView=general-ledger` still resolve correctly after DashboardClient quick-action edits.
- `bun run verify:finance-gl` remains green.

---

## Error handling

- Validation: existing Zod `expenseSchema` + `formErrorHandler` / `showActionError`.
- Plan gate: toast, no modal.
- Delete failure: toast; do not remove row optimistically until success (or rollback).
- Bank Rec fetch failure: toast + keep last good state; tables-missing uses dedicated UI, not generic error.

---

## Testing / verification

Extend or add asserts (prefer extend `scripts/verify-finance-gl.mjs` and/or `verify-hub-tabs-forms.mjs`):

1. Header Log Expense dispatches `open-modal` with `modalId: 'expense'` (not bare `switchTab('finance')` only).
2. `DashboardClient` handles `modalId === 'expense'`.
3. `ExpenseEntryForm` and `ExpenseManager` import shared category helper (not local hardcoded slug lists that diverge).
4. `reconcile-now` resolves to Finance reconciliation view.
5. `getExpenseCategoriesForDomain('milk-shop')` includes base + milk overlays; unknown domain returns base only.
6. Existing Finance consolidation asserts remain green.

Manual QA checklist:

- [ ] Log Expense from Overview, Inventory, and Finance tabs opens modal and saves.
- [ ] Mobile header shows Log Expense and opens modal.
- [ ] Easy dashboard Log expense opens modal; View expenses opens Finance → Expenses.
- [ ] Milk-shop tenant sees milk overlay categories; supermarket sees supermarket overlays; generic retail sees base only.
- [ ] New expense appears in Finance Expenses list and filter by category works.
- [ ] Category suggest selects a sensible expense GL account when present.
- [ ] Delete expense works with confirm.
- [ ] reconcile-now opens Bank Reconciliation.
- [ ] Bank Rec tables-missing vs empty sessions states are distinguishable.
- [ ] GL report still loads; Statements nesting unchanged.

---

## File touch list (expected)

| File | Change |
|------|--------|
| `lib/utils/expenseCategories.js` (new) or `lib/config/accounting.js` | Resolver + normalize + overlays |
| `components/ExpenseEntryForm.jsx` | Shared categories, account suggest, hide receipt stub, use business category |
| `components/finance/ExpenseManager.jsx` | Shared categories, delete UI, pass domain |
| `components/layout/Header.jsx` | Log Expense → open-modal; mobile parity |
| `app/business/[category]/DashboardClient.jsx` | Modal state, open-modal, log-expense action, reconcile-now fix, mount form |
| `components/dashboard/easy/EasyBusinessDashboard.tsx` (and/or finance tile) | Log expense CTA |
| `components/finance/BankReconciliation.jsx` | Honest tables-missing empty state |
| `components/finance/FinanceHub.jsx` | Pass `businessCategory` into ExpenseManager if not already |
| `scripts/verify-finance-gl.mjs` / `verify-hub-tabs-forms.mjs` | New asserts |
| Optional: `lib/config/quickActions.js` | Document `log-expense` if that registry is used |

---

## Rollout / risk

- **Low blast radius:** create path unchanged; UI wiring + category normalization only.
- **Legacy categories:** `normalizeExpenseCategory` keeps old rows filterable; breakdown may still show “uncategorized” buckets for unknown legacy strings until normalized display.
- **Double form:** Finance in-tab form and shell modal must not both open for one click — Finance Record Expense stays in-tab only.
- **Plan gate:** Free tenants without `expense_tracking` keep current tab hiding; header action must not look broken (toast).

---

## Implementation order (for writing-plans)

1. Category helper + normalize + milk/restaurant/supermarket overlays + unit-style verify asserts.
2. Align `ExpenseEntryForm` + `ExpenseManager` to helper; wire delete; hide receipt stub.
3. DashboardClient modal + Header events + `log-expense` quick action; Easy dashboard CTA.
4. Bank Rec empty-state + `reconcile-now` fix.
5. Run `verify:finance-gl`, `verify:hub-tabs-forms`, manual checklist on milk demo.

---

## Spec self-review notes

- No TBD placeholders left for v1 scope.
- Architecture matches Approach 3; no parallel create path.
- Scope excludes receipt upload, AccountantDashboard mocks, Route Hisab merge.
- Ambiguity resolved: Log Expense opens modal on current tab; View expenses navigates; Finance Record Expense stays in-tab.

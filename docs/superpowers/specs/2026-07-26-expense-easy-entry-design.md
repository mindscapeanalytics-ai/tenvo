# Easy Expense Entry (Shopkeeper) — Design Spec

**Date:** 2026-07-26  
**Status:** Approved (Approach 1)  
**Goal:** Let any shopkeeper record money-out in seconds with plain language, domain-aware categories, optional Accurate details, and Urdu via the existing hub language toggle — without a second create path.

**Builds on:** `2026-07-24-finance-expenses-quick-add-design.md`

---

## Problem

1. `ExpenseEntryForm` is accountant-first (GL account required and prominent).
2. Shopkeepers need: what for → how much → paid how → save.
3. Category→GL suggest fails silently when accounts are missing or not yet loaded.
4. Quick Accounting Actions / command palette omit a reliable Log Expense create path.
5. Urdu exists (`LanguageContext` + `lib/translations.js`) but expense form has no keys.

## Goals

1. **Easy default:** category tiles + amount + Cash/Bank/Pay later + Save.
2. **Accurate optional:** collapse for GL, tax, vendor, full note.
3. **Server GL resolve** when `accountId` omitted: category `account_code` → expense GL → miscellaneous fallback.
4. **Shopkeeper copy** (EN + UR) via existing `useLanguage` / translations; DB keeps English category slugs.
5. **Quick option:** Log Expense in Quick Accounting Actions + command palette `open-modal`.
6. Single create path: `ExpenseEntryForm` → `createExpenseAction` → `ExpenseService`.

## Non-goals

- Receipt upload / OCR
- Edit/update expense
- Full-hub Urdu localization
- Parallel QuickExpense stack
- Busy/Excel expense grid
- Free-plan `expense_tracking` entitlement change

## Architecture

```
Header / Quick Action / Command palette / Easy dash
        │
        ▼
open-modal expense | log-expense
        │
        ▼
ExpenseEntryForm (Easy default; Accurate expand)
        │  category (required in Easy) + amount + paymentMethod
        │  accountId optional
        ▼
createExpenseAction
        │  resolveExpenseAccountId(businessId, category, accountId?)
        ▼
ExpenseService.createExpense (unchanged posting)
```

### Plan gate

Unchanged: `planCan('expense_tracking')` before modal.

### Urdu

- Reuse `app-language` / `LanguageProvider` (no new i18n).
- Expense-only keys in `translations.en` / `translations.ur`.
- Category display: `expense_cat_<value>` with fallback to English `label`.
- Missing Urdu key → English string (never blank).

### Last-used category

`localStorage` key `tenvo-expense-last-cat:{businessId}` — preselect when opening Easy form (domain list must include value).

## Entry points

| Surface | Behavior |
|---------|----------|
| Header Log Expense | Unchanged `open-modal` |
| Easy dashboard Log expense | Unchanged `log-expense` |
| FinancialOverview Quick Accounting Actions | Add **Log Expense** → `log-expense` / `open-modal` |
| Command palette | `open-modal` expense (replace `/finance/expenses?action=new`) |
| Finance → Record Expense | Same form, Easy default |

## Error handling

- Easy: require category + positive amount; toast if server cannot resolve any expense GL.
- Accurate: same validation; explicit account wins over suggest.
- Plan gate toast unchanged.

## Verification

Extend `verify-hub-tabs-forms` / `verify-finance-gl`:

1. Form has Easy shopkeeper labels path (category tiles / Record money out).
2. `createExpenseAction` or helper resolves account when `accountId` missing.
3. Command palette dispatches `open-modal` expense.
4. FinancialOverview includes Log Expense.
5. Translation keys `expense_record_title` (en + ur) exist.

## File touch list

| File | Change |
|------|--------|
| `docs/superpowers/specs/2026-07-26-expense-easy-entry-design.md` | This spec |
| `lib/utils/resolveExpenseAccount.js` | Server/client-safe resolve helper (or action-only) |
| `lib/validation/schemas.js` | `accountId` optional when category present |
| `lib/actions/basic/expense.js` | Resolve before create |
| `components/ExpenseEntryForm.jsx` | Easy / Accurate UX + Urdu |
| `lib/utils/expenseCategories.js` | Shop labels helper |
| `lib/translations.js` | Expense EN/UR keys |
| `components/dashboard/FinancialOverview.jsx` | Log Expense quick action |
| `components/GlobalCommandPalette.jsx` | open-modal expense |
| `lib/config/quickActions.js` | `LOG_EXPENSE` id |
| `scripts/verify-hub-tabs-forms.mjs` | Asserts |

## Spec self-review

- No TBD for v1.
- One create path; Accurate is UI expand only.
- Urdu scoped to form strings + category display labels.
- Scope excludes receipt, edit, full hub i18n.

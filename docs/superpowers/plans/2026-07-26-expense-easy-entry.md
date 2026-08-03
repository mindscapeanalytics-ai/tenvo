# Easy Expense Entry Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Shopkeeper-easy expense form with server GL resolve, Urdu labels, and accurate quick-entry wiring.

**Architecture:** Same `ExpenseEntryForm` + optional `accountId`; server resolves GL from category; translations via existing LanguageContext.

**Tech Stack:** Next.js client form, Zod, `createExpenseAction`, `ExpenseService`, `lib/translations.js`.

## Global Constraints

- Single create path (no parallel QuickExpense).
- Plan gate `expense_tracking` unchanged.
- Category DB values stay English slugs.
- No em dashes in UI copy.
- Do not commit unless user asks.

---

### Task 1: Resolve expense GL + schema

**Files:**
- Create: `lib/utils/resolveExpenseAccount.js`
- Modify: `lib/validation/schemas.js`, `lib/actions/basic/expense.js`

- [ ] Resolver: if `accountId` valid use it; else category → account_code → gl_accounts row; else MISCELLANEOUS code; else first expense-type account.
- [ ] Schema: `accountId` optional/nullable; require category when accountId absent (or always require category in Easy).
- [ ] `createExpenseAction` calls resolver before `ExpenseService.createExpense`.

### Task 2: Easy form + Urdu

**Files:**
- Modify: `components/ExpenseEntryForm.jsx`, `lib/utils/expenseCategories.js`, `lib/translations.js`

- [ ] Easy default UI: tiles, amount, payment, save; Accurate collapse.
- [ ] `useLanguage` for strings; category labels via translation keys.
- [ ] Last category from localStorage.

### Task 3: Quick entry surfaces

**Files:**
- Modify: `FinancialOverview.jsx`, `GlobalCommandPalette.jsx`, `lib/config/quickActions.js`, verify script

- [ ] Log Expense quick action.
- [ ] Command palette open-modal.
- [ ] Verify asserts.

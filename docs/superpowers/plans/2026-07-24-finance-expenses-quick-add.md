# Finance Expenses Quick Add — Implementation Plan

> **For agentic workers:** Execute task-by-task. Prefer inline careful execution for this pass (shared create path; avoid parallel forks).

**Goal:** Domain-aware expense categories, one-tap Log Expense modal from header/dashboards, and Finance gap fixes (reconcile-now, Bank Rec empty state, expense delete) without forking `createExpenseAction`.

**Architecture:** Shared `ExpenseEntryForm` via hub `open-modal` (`modalId: 'expense'`); categories from `getExpenseCategoriesForDomain`; existing ExpenseService/GL posting unchanged.

**Tech Stack:** Next.js hub client, existing server actions, `lib/config/accounting.js`, verify scripts.

## Global Constraints

- Single create path: `ExpenseEntryForm` → `createExpenseAction` → `ExpenseService`
- Gate modal with `planCan('expense_tracking')` via `usePermissions`
- No receipt upload; hide stub dropzone
- Do not remount FinanceHub on every save; call `fetchExpenses` / `handleExpenseSaved`
- Keep Finance tab consolidation intact
- No em dashes in UI copy
- Commits only if user asks

---

### Task 1: Expense category helper

**Files:**
- Create: `lib/utils/expenseCategories.js`
- Test: extend `scripts/verify-finance-gl.mjs` or `scripts/verify-hub-tabs-forms.mjs`

**Produces:** `getExpenseCategoriesForDomain(domainKey)`, `normalizeExpenseCategory(raw)`, `findExpenseCategory(value, domainKey)`

- [ ] Implement helper with base `EXPENSE_CATEGORIES` + overlays for milk-shop, restaurant-cafe, supermarket family
- [ ] Assert milk includes overlays; unknown domain returns base; normalize maps legacy labels

### Task 2: Align form + manager

**Files:**
- Modify: `components/ExpenseEntryForm.jsx`
- Modify: `components/finance/ExpenseManager.jsx`
- Modify: `components/finance/FinanceHub.jsx` (pass `businessCategory`)

- [ ] Form uses shared categories + account suggest; hide receipt; pass domain
- [ ] Manager filters/breakdown/delete wired; pass domain to form

### Task 3: Hub quick entry

**Files:**
- Modify: `components/layout/Header.jsx`
- Modify: `app/business/[category]/DashboardClient.jsx`
- Modify: `app/business/[category]/components/ActionModals.jsx`
- Modify: `components/dashboard/easy/EasyBusinessDashboard.tsx`

- [ ] Header Log Expense → `open-modal` expense (desktop + mobile)
- [ ] DashboardClient: `showExpenseForm`, plan gate, `log-expense` action, mount via ActionModals
- [ ] Easy dashboard: Log expense button + keep View expenses

### Task 4: Bank Rec + reconcile-now

**Files:**
- Modify: `app/business/[category]/DashboardClient.jsx` (`reconcile-now`)
- Modify: `components/finance/BankReconciliation.jsx`

- [ ] `reconcile-now` → finance + reconciliation view
- [ ] Surface tables-missing vs empty sessions

### Task 5: Verify

- [ ] Extend verify scripts; run `bun run verify:finance-gl` and `bun run verify:hub-tabs-forms`

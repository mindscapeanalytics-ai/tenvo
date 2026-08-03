# Finance Hub Consolidation Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Consolidate Finance hub duplicates without removing capability; keep legacy deep-links working.

**Architecture:** Nested TB + Day Book inside `FinancialReports`; remove top-level TB/Day Book/Vouchers tabs; alias legacy `financeView` values; grouped nav + Bank Reconciliation rename; fix `FINANCE_VIEW_BY_TAB`.

**Tech Stack:** React client components, existing report components, `lib/config/tabs.js`, verify scripts.

## Global Constraints

- Do not delete TrialBalanceView, DayBookReport, PaymentReceiptForm, or GL/Journal UIs.
- Legacy `financeView=trial-balance|day-book|vouchers` must resolve without 404/blank.
- No em dashes in UI copy; prefer `font-semibold`.
- Update `verify:finance-gl` and `verify:hub-tabs-forms` expectations.

---

### Task 1: Deep-link map

- [ ] Fix `FINANCE_VIEW_BY_TAB` in `lib/config/tabs.js`
- [ ] Update `scripts/verify-hub-tabs-forms.mjs` expectations for accounts → accounts

### Task 2: Statements nest TB + Day Book

- [ ] Add `tb` and `day-book` TabsTriggers to `FinancialReports.jsx`
- [ ] Accept optional `initialReport` prop; render `TrialBalanceView` / `DayBookReport`
- [ ] Keep existing P&L/BS/CF/Aging + PDF chrome

### Task 3: FinanceHub IA

- [ ] Remove top-level `trial-balance`, `day-book`, `vouchers` from `FINANCE_TABS`
- [ ] Alias legacy active/initial tabs → statements (+ nested) or overview/payments
- [ ] Rename Reconciliation → Bank Reconciliation; unique icons
- [ ] Overview shortcuts + Payments CTA; remove vouchers case body or redirect
- [ ] Grouped nav in `FinanceMobileNav` / desktop header

### Task 4: Verify

- [ ] Update `scripts/verify-finance-gl.mjs`
- [ ] Run `verify:finance-gl` and `verify:hub-tabs-forms`

# Finance Hub Consolidation — Design Spec

**Date:** 2026-07-17  
**Status:** Approved (Approach 2 — consolidate without deleting capability)  
**Goal:** Full finance control and reporting with no true duplicates or label conflicts, without removing necessary workflows.

## Problem

FinanceHub exposes 13 flat sub-tabs. True duplication and ambiguity:

1. **Vouchers** is a thin subset of the top-level Payments hub.
2. **Trial Balance** and **Day Book** are peer tabs of **Statements**, so formal reports feel scattered.
3. **Reconciliation** is bank-only but reads like payment/GL coverage reconcile.
4. Deep-links: `accounts` / `accounting` / `acc` open Overview instead of Chart of Accounts.
5. Icon collisions (BookOpen, Calendar, BarChart3) and unused group labels on tab objects.

## Non-goals

- Removing Trial Balance, Day Book, Journal, GL, CoA, Expenses, Credit Notes, Fiscal, FX, or Bank Reconciliation capability
- Merging Expenses into Payments
- Embedding full GST manager inside Finance
- Rewriting Report Builder / analytics

## Design (Approach 2)

### Target top-level Finance tabs

| Group | Keys | Capability |
|-------|------|------------|
| Insights | `overview` | KPIs, books-coverage alerts, shortcuts |
| Statements | `statements` | Nested: P&L, BS, Cash Flow, **Trial Balance**, **Day Book**, Aging |
| Books | `accounts`, `journal`, `general-ledger`, `reconciliation` | CoA, JE write, GL read, **Bank Reconciliation** |
| Cash | `expenses`, `credit-notes` | OpEx + credit notes; Payments via sidebar/Overview CTA |
| Close | `fiscal`, `exchange` | Period close + FX rates |

### Compatibility (must not break)

- `financeView=trial-balance` and `financeView=day-book` still work: open Statements with the matching nested report.
- `financeView=vouchers` opens Overview (Payments CTA) or redirects to Payments — Receipt/Payment forms remain available in Payments.
- Overview shortcuts that previously navigated to `trial-balance` / `day-book` open Statements nested tabs.
- Existing PDF/print for TB and Day Book stay intact (same components).

### Deep-links

Update `FINANCE_VIEW_BY_TAB`:

- `accounts` / `accounting` / `acc` → `accounts` (Chart of Accounts)
- `trial-balance` → resolve via FinanceHub alias to Statements + TB nested
- `day-book` → Statements + Day Book nested
- Add maps for `statements`, `general-ledger`, `reconciliation` where useful

### Nav UX

- Render group headers (Insights / Statements / Books / Cash / Close) on desktop and mobile chip nav.
- Distinct icons per tab; rename Reconciliation label to **Bank Reconciliation**.
- Overview: separate copy for “Books coverage”, “Bank reconciliation”, and “Payments”.

### Outside Finance (unchanged homes)

- **Payments** hub — canonical AR/AP register and vouchers
- **Tax / GST** hub — tax registers; Overview may deep-link for discoverability

## Verification

- `bun run verify:finance-gl`
- `bun run verify:hub-tabs-forms`
- Manual: legacy `financeView` aliases, Statements nested TB/Day Book PDF, Payments CTA from Overview, Bank Reconciliation label

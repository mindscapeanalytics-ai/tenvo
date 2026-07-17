# Finance / Money Hub — Design Spec

**Date:** 2026-07-17  
**Status:** Approved for phased implementation  
**Scope:** GL accuracy (omnichannel posting), unified financial statements + standard PDFs, FinanceHub IA/UX

## Problem

1. Formal statements (P&L, BS, TB, Cash Flow) read only `gl_entries`, but paid storefront and restaurant orders often never post.
2. Storefront paid paths sometimes post orphan AR receipts without a sale JE.
3. Purchase JEs with tax imbalance (DR inventory net, CR AP gross).
4. Core statements are browser-print only; aging/GST use a thin PDF helper.
5. Cash Flow is client-derived; no Day Book; duplicate Trial Balance paths; `journal` deep-link opens GL.
6. Finance tab gated on `expense_tracking` while Free already has `basic_reports` / `basic_accounting`.

## Non-goals

- Analytics / Report Builder PDF rewrite
- Migrating `payments` + `invoice_payments` into one table
- Live FBR / government tax filing
- Full mobile Finance tile hub redesign

## Design

### Ledger contract

- Money statements remain **GL-only**.
- Omnichannel completeness comes from posting paid commerce into GL via `AccountingService` / `reconcileOrderPayment`.
- Dashboard sales KPIs may still union ops ledgers; Overview must label Statements as books.

### Phase 1 — GL accuracy

- Storefront paid → idempotent cash-sale JE (`reference_type: storefront_order`), not orphan AR receipt.
- Restaurant settle → `pos_sale` unless already mirrored via POS (which posts GL).
- Purchase with tax → DR Inventory + DR Input Tax Credit + CR AP.
- Coverage snapshot for unpaid-to-GL storefront/restaurant counts.
- Finance nav unlock when any of `basic_reports` / `basic_accounting` (OR).

### Phase 2 — Statements + PDFs

- Canonical actions in `lib/actions/standard/report.js` including `getCashFlowAction`, `getDayBookAction`.
- Shared `lib/pdf/financeStatementPdf.js` header/footer for all Money PDFs.
- Day Book sub-tab; PDF + Print on every formal report.

### Phase 3 — Hub UX

- Grouped nav (Insights / Statements / Books / Cash & pay / Close).
- Intelligent Overview with coverage alerts + shortcuts.
- Fix `journal` → `journal` deep-link; vouchers CTA to Payments; toast instead of `alert` on credit notes.
- GST registers use shared PDF chrome; include POS tax where fields exist.

## Verification

- `bun run verify:finance-gl`
- `verify:mvp-launch`, `verify:hub-tabs-forms`
- AccountingService unit tests (purchase tax, storefront/restaurant shapes)

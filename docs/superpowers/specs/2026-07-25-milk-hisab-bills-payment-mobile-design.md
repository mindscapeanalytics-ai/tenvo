# Milk Hisab Bills: payment toggle + mobile

**Date:** 2026-07-25  
**Scope:** `milk-shop` Route Hisab Bills tab only  
**Decision:** Hybrid (C) — compact Paid/Unpaid on the list; Open invoices for formal receipts

## Goals

1. Compact **Unpaid | Paid** control on each billed row.
2. WhatsApp / remind only when the bill is **not paid** (unbilled or unpaid).
3. Mobile card layout for Bills (parity with Daily route cards).
4. Keep AR truth: mark paid posts `invoice_payments`; mark unpaid voids Route Hisab collection receipts only.

## Behavior

### Payment toggle

- Enabled only when `invoiceId` exists (after Generate). Unbilled rows show `-`.
- **Paid:** record full outstanding balance via `InvoicePaymentService.recordPayment` (cash, notes `Route Hisab collection`).
- **Unpaid:** void active payments whose notes contain that marker. If invoice is still paid (other receipts), return a clear error to use Open invoices.
- Needs network (not offline). Updates local row `paymentStatus` on success.
- Permission: `sales.record_payment`.

### Remind / WhatsApp

- Per-row WhatsApp + hub/email remind: `amount > 0` and `paymentStatus !== 'paid'`.
- Bulk **Remind unpaid** unchanged (unbilled + unpaid billed).
- Paid rows: remind controls disabled / hidden with hint.

### Mobile (`lg:hidden`)

- Card per customer: house, name, amount, days, compact product qty summary.
- Same payment toggle, 58mm EN/Urdu actions, remind icons.
- Desktop table kept (`hidden lg:block`); horizontal scroll retained for product columns.

## Out of scope

- Offline payment toggles
- Partial payment UI on the Bills grid
- Supermarket / other domains

# Milk Hisab Bills: payment toggle + mobile

**Date:** 2026-07-25 (updated 2026-07-26)  
**Scope:** `milk-shop` Route Hisab Bills tab only  
**Decision:** Hybrid (C) — compact Paid/Unpaid on the list; Open invoices for formal receipts

## Goals

1. Compact **Unpaid | Paid** control on each billable row (invoice optional).
2. WhatsApp / remind only when the bill is **not paid**; message embeds qty line details (wa.me cannot attach PDF).
3. Mobile card layout for Bills (parity with Daily route cards).
4. Keep AR truth when an invoice exists: mark paid posts `invoice_payments`; mark unpaid voids Route Hisab collection receipts only. Always persist period flag on `customers.domain_data.milkHisab.periodPayments`.

## Behavior

### Payment toggle

- Enabled when `amount > 0` or `billed` (does **not** require Generate first).
- Always writes `domain_data.milkHisab.periodPayments[periodKey]` = `paid` | `unpaid`.
- When `invoiceId` exists:
  - **Paid:** record full outstanding balance via `InvoicePaymentService.recordPayment` (cash, notes `Route Hisab collection`).
  - **Unpaid:** void active payments whose notes contain that marker. If invoice is still paid (other receipts), return a clear error to use Open invoices.
- When no invoice yet: hisab-only status is enough (`hisabOnly: true`); Generate later carries Paid onto the new invoice receipt.
- Display resolve: invoice `payment_status` wins when billed; else manual hisab flag.
- Needs network (not offline). Updates local row `paymentStatus` / `hisabPaymentStatus` on success.
- Permission: `sales.record_payment`.

### Remind / WhatsApp

- Per-row WhatsApp + hub/email remind: `amount > 0` and `paymentStatus !== 'paid'` (`isMilkHisabBillRemindable`).
- Reminder copy includes compact `Bill:` qty lines from `qtyByProduct` / `productMeta`.
- Server rejects when hisab period is paid **or** linked invoice is paid (`MILK_HISAB_ALREADY_PAID`).
- Bulk **Remind unpaid** uses the same remindable filter (not unbilled-only).
- Paid rows: remind controls hidden; show Paid hint.

### Mobile (`lg:hidden`)

- Card per customer: house, name, amount, days, compact product qty summary.
- Same payment toggle, 58mm EN/Urdu actions, remind icons (`BillsActionCluster`).
- Desktop table kept (`hidden lg:block`); horizontal scroll retained for product columns; Status + Actions columns.

## Out of scope

- Offline payment toggles
- Partial payment UI on the Bills grid
- Supermarket / other domains

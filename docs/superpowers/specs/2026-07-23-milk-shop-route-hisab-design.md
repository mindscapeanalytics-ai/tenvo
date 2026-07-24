# Milk shop Route Hisab (daily delivery + monthly collection)

**Status:** Implemented (P1 daily sheet + P2 week/month invoices + 58mm thermal bills)  
**Date:** 2026-07-23  
**Canonical gate:** `resolveDomainKey(category) === 'milk-shop'` only  
**Companion:** `docs/superpowers/specs/2026-07-23-milk-shop-pakistan-design.md` (retail/POS/storefront — unchanged)  
**Approach:** New milk-gated ops module on top of existing **Customers** + **Invoices / invoice_payments / AR**; do not extend memberships, restaurant orders, or supermarket grocery flows  
**Billing print:** Reuses POS `dispatchThermalReceipt` at **58mm** (works on 55–58mm printers) via `lib/print/milkHisabThermalBill.js` — Weekly / Monthly hisab bills

---

## Problem (keeper mental model)

Neighborhood milk shops keep a paper register like:

| house no | Customer | Milk | Eggs | Bread | Butter | (more products…) | Date |

Each row = one house, one day. Month end = sum qty × rates → collect payment (cash / JazzCash / weekly credit).

Today Tenvo milk-shop covers **counter + online kg retail**. It does **not** model this doorstep hisab. Customer fields `Delivery Route` / `Daily Milk Preference` are free-text only. Credit collection exists only via generic invoices + AR.

## Goals

1. Easy daily entry that feels like the paper sheet (grid, house-first, qty cells).
2. Month-end hisab: per-customer totals → invoice → record payment (reuse AR truth).
3. Product columns from **live inventory** (milk kg, eggs, bread, butter, add more).
4. Zero blast radius: supermarket, dairy-farm, restaurant, memberships untouched.
5. Mobile-friendly dual layout (`lg:`) for route use on phone.

## Non-goals (v1)

- GPS / live map routing.
- Driver app / multi-rider sync.
- Auto stock decrement on every house tick (optional later; many keepers adjust stock in bulk).
- Membership-style recurring invoices as the primary model.
- Public storefront “subscribe to milk” (can come later).
- Changing POS / storefront checkout behavior.

---

## Section 1 — Product approach (approved direction)

**Hybrid reuse + new milk-only ledger**

| Layer | Decision |
|--------|----------|
| Customer master | **Reuse** `customers` (+ structured `domain_data` for milk) |
| Money / monthly collect | **Reuse** `invoices` + `invoice_payments` + AR aging + PaymentModal |
| Daily route lines | **New** tables gated to milk-shop |
| Memberships / restaurant_orders | **Do not use** |
| Hub entry | New tab/panel **Route Hisab** visible only when `isMilkShopStore(category)` |

### Phased delivery (best practice — ship perfect slices)

| Phase | Scope | Keeper value |
|-------|--------|--------------|
| **P1** | Customers structured prefs + Daily route grid (save qty by date) | Replace paper sheet |
| **P2** | Month summary + Generate invoice(s) + Mark paid | Close the month |
| **P3** | Optional: bulk stock adjust from day totals; WhatsApp share statement | Polish |

P1 alone is useful; P2 completes hisab. Do not ship P2 without P1.

---

## Section 2 — Customer master (milk-shop fieldConfig only)

Enrich existing customerFields with **fieldConfig** (still only for milk-shop knowledge):

| Key | UI | Purpose |
|-----|-----|---------|
| `houseno` | text | e.g. `A-783, Ph-01` |
| `deliveryroute` | select or text | Route A / Morning / Area name |
| `dailymilkkg` | number | Default milk qty (kg) for new day rows |
| `deliveryactive` | Yes/No | Include on today’s sheet |
| `preferredpayment` | select | Cash / JazzCash / Weekly Credit / Monthly Credit |

Keep `customers.address`, `name`, `phone`, credit_limit as today.  
**Do not** add these fieldConfigs to supermarket or dairy-farm.

---

## Section 3 — Data model (new, tenant-scoped)

All rows: `id` UUID, `business_id`, timestamps, soft-delete if hub convention requires.

### `milk_delivery_days` (optional header) **or** derive from distinct dates on lines

Prefer **no empty header table**: day is just a date filter on lines.

### `milk_delivery_stops` (one row per customer per calendar day)

| Column | Type | Notes |
|--------|------|--------|
| business_id | uuid | tenancy |
| delivery_date | date | sheet date |
| customer_id | uuid | FK customers |
| house_no_snapshot | text | copy from customer at save (paper match) |
| customer_name_snapshot | text | same |
| route_label | text nullable | |
| notes | text nullable | skip reason, etc. |
| status | text | `draft` \| `confirmed` (default confirmed on save) |

Unique: `(business_id, delivery_date, customer_id)`.

### `milk_delivery_lines`

| Column | Type | Notes |
|--------|------|--------|
| business_id | uuid | |
| stop_id | uuid | FK stops |
| product_id | uuid | FK products (inventory) |
| product_name_snapshot | text | |
| unit_snapshot | text | kg / pcs / … |
| quantity | decimal | allow 0; milk supports decimals |
| unit_price_snapshot | decimal | price at entry (from product.price) |

Unique: `(stop_id, product_id)`.

### Month invoice link

- When generating month bill: create `invoices` + `invoice_items` from aggregated lines.
- Store on invoice `domain_data` or metadata: `{ milk_hisab: { period: '2026-07', stop_ids: [...] } }` for idempotency.
- Payments only via existing **invoice_payments** path (never legacy `payments` allocations alone).

Prisma migration under `prisma/migrations`; verify with `to_regclass` after apply.

---

## Section 4 — Hub UX (keeper-first)

### Daily sheet (P1)

- Hub tab **Route Hisab** (milk-shop only) → subview **Today**.
- Date picker (default today).
- Grid columns: House no | Customer | [product columns from owner’s “hisab products” list] | Notes.
- Owner configures which products appear as columns (defaults: Fresh Milk, Eggs, Bread, Butter matching inventory names/categories).
- Prefill rows: all `deliveryactive` customers on selected route (or all active).
- Prefill milk cell from `dailymilkkg`; other products 0.
- Busy-style rapid edit; save batch; keyboard friendly.
- Mobile: card list per house with steppers (dual layout).

### Month hisab (P2)

- Subview **Month close**.
- Pick month → table: Customer | House | Milk kg | Eggs | … | Amount | Status.
- Actions: **Generate invoice** (one per customer or one combined — default **one invoice per customer** for AR clarity).
- **Record payment** opens existing PaymentModal for that invoice.
- Idempotent: re-generate skips customers already billed for that period (or offers credit note path later).

### Stock (P3, optional)

- Button “Adjust stock from day” → single InventoryService removal for day totals (opt-in).
- Default **off** so P1/P2 never break stock for keepers who don’t want it.

---

## Section 5 — Wiring & isolation

| Concern | Rule |
|---------|------|
| Gate | `isMilkShopStore` / `resolveDomainKey === 'milk-shop'` for tab, actions, migrations consumers |
| Auth | `withGuard` + `business_id` on all actions |
| Serialisation | `serializeDecimalsDeep` on customer/invoice payloads to client |
| Forms | `actionSuccess` / `actionFailure` |
| Copy | No em dashes; `font-semibold`; Open Sans tokens |
| Verify | `scripts/verify-milk-shop-hisab.mjs` + extend `verify-milk-shop-storefront` gate checks |
| Easy/Ops | Optional milk playbook copy pointing to Route Hisab — no supermarket knowledge remap |

---

## Section 6 — Success criteria

1. Keeper can enter a day of deliveries for 20+ houses in under a few minutes.
2. Month totals match sum of daily qty × snapshot prices.
3. Payment reduces invoice balance via `invoice_payments` / aging.
4. Opening supermarket or dairy-farm hub shows **no** Route Hisab tab.
5. POS and public storefront behavior unchanged.

---

## Section 7 — Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Price changes mid-month | Snapshot `unit_price` on each line at entry |
| Customer rename / house move | Snapshots on stop; master still editable |
| Double month invoice | Period key in invoice domain_data + unique check |
| Scope creep into subscriptions | Non-goal; standing defaults only via `dailymilkkg` |

---

## Open points (defaults if user silent)

1. Month invoice: **one invoice per customer** (not one mega-invoice).
2. Stock decrement: **off** until P3.
3. Hisab product columns: owner picks up to **8** products; seed defaults Milk / Eggs / Bread / Butter when SKUs exist.

---

## Spec self-review

- [x] No TBD placeholders for core flow  
- [x] Isolation explicit  
- [x] Reuses AR canon (`invoice_payments`)  
- [x] Phased so “perfect” does not mean one risky mega-PR  
- [x] Aligns with paper register in user image  

**Next:** user reviews this file → implementation plan (`writing-plans`) → build P1 then P2.

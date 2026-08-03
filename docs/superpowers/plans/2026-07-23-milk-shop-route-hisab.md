# Milk Route Hisab Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-07-23-milk-shop-route-hisab-design.md`

**Goal:** Milk-shop-only daily doorstep delivery grid + month-end invoice/AR collection (paper hisab → hub).

**Architecture:** New `milk_delivery_stops` / `milk_delivery_lines` tables; hub tab `route-hisab` gated by `isMilkShopStore`; month bills via `InvoiceService.createInvoice` with `skip_inventory: true` and period marker in `notes`.

**Tech Stack:** Prisma/Postgres, Next.js server actions + `withGuard`, React hub UI, existing customers/invoices/AR.

## Global Constraints

- Gate every UI/action with `resolveDomainKey === 'milk-shop'`
- Tenancy: `business_id` + `findFirst` / `assertEntityBelongsToBusiness`
- Payments only via invoice_payments path
- No em dashes in UI copy; Open Sans / font-semibold
- Do not touch supermarket/dairy-farm/restaurant/memberships

## Files

| File | Role |
|------|------|
| `prisma/schema.prisma` + migration | stops + lines |
| `lib/storefront/milkShopHisab.js` | product column resolve, period helpers, gate |
| `lib/domainData/retail.js` | customer fieldConfig |
| `lib/actions/standard/milkHisab.js` | load/save day, month summary, generate invoices |
| `components/milk/MilkRouteHisab.jsx` | Daily + Month UI |
| `lib/config/tabs.js`, Sidebar, DashboardTabs, useHubMobileNav | tab wiring |
| `scripts/verify-milk-shop-hisab.mjs` | wiring verify |

## Tasks

### Task 1: Schema
- [x] Add models + migration SQL
- [x] Relations on `businesses` / `customers` / `products`

### Task 2: Helpers + customer fields
- [x] `isMilkHisabRelevant`, default hisab product pickers, period key
- [x] Milk customer fieldConfig (house no, route, daily kg, active, payment)

### Task 3: Actions
- [x] `getMilkHisabDayAction`, `saveMilkHisabDayAction`
- [x] `getMilkHisabMonthSummaryAction`, `generateMilkHisabInvoicesAction`

### Task 4: Hub UI + nav
- [x] `MilkRouteHisab` component
- [x] Tab `route-hisab` + domainRule `milkHisab`

### Task 5: Verify
- [x] `bun scripts/verify-milk-shop-hisab.mjs`
- [x] Mark design status Approved / Implemented P1+P2

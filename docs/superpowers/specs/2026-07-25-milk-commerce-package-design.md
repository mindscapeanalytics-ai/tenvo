# Milk Commerce package — PK doodh-shop operating system

**Status:** Implemented (package + Easy playbook + single-counter knowledge)  
**Date:** 2026-07-25  
**Package key:** `milk-commerce`  
**Canonical vertical:** `milk-shop`  
**Aliases (resolve only):** `milk`, `milkshop`, `doodh-shop`, `dairy-shop`  
**Demo:** `demo-milk`  
**Recommended tier:** `professional`  
**Approach:** Additive domain commercial package (Approach A) — same pattern as pharmacy/clothing; zero schema change; zero blast radius to supermarket / dairy-farm / other packages  

**Companions (already shipped — do not redesign):**

- `docs/superpowers/specs/2026-07-23-milk-shop-pakistan-design.md` — vertical, POS, storefront, kg commerce  
- `docs/superpowers/specs/2026-07-23-milk-shop-route-hisab-design.md` — Route Hisab ledger  

This spec only adds **plan/packaging + Easy OS clarity** so keepers see a milk operating system, not a generic Business/Professional ERP.

---

## Problem

`milk-shop` already has:

- Elevated public store (`demo-milk`) + SuperStore POS (kg)  
- Domain knowledge (FEFO, dairy fields, route customer fields)  
- Route Hisab (domain-gated)

It does **not** have a commerce package. Tenants on Professional still inherit confusing modules: multi-warehouse, serials, restaurant POS, memberships, loyalty, price lists, supplier quotes, delivery challans. Easy mode has **no** `milk-shop` playbook. Knowledge still advertises multi-location, so Warehouses appears in nav.

Pakistani neighborhood doodh shops need a small, obvious OS: counter + morning route hisab + chill stock + JazzCash/credit collect — not warehouse/CRM/F&B chrome.

## Goals

1. Sell and register **`milk-commerce`** with Professional packaging that strips irrelevant features.  
2. Easy dashboard / ops copy that speaks counter sales, route kg, credit to collect, near expiry.  
3. Hide multi-warehouse chrome for typical single-counter milk shops via knowledge flag (milk only).  
4. Leave supermarket, dairy-farm, livestock, other domain packages, Prisma schema, and Route Hisab tables **unchanged**.

## Non-goals

- New Prisma models or migrations.  
- New plan feature key for Route Hisab (remains `domainRule` / `milkHisab`).  
- Merging supermarket / grocery into this package.  
- New elevated storefront template (keep supermarket shell + milk overlays).  
- Changing Route Hisab money path (invoices + `invoice_payments`).  
- Free-tier POS parity work (separate product track).  
- Building packages for restaurant/marine/tiles/etc. in this pass.

---

## Section 1 — Isolation & identity (approved)

| Item | Decision |
|------|----------|
| Package key / slug | `milk-commerce` |
| Name | Milk Shop Commerce Suite (or “Doodh Shop OS” in tagline only — keep marketing professional) |
| Verticals | `['milk-shop']` only |
| Default vertical | `milk-shop` |
| Alias handling | Existing `domainKeyAliases` — package applies after `resolveDomainKey` |
| Explicitly out | `supermarket`, `grocery`, `fmcg`, `dairy-farm`, `livestock-cattle`, `poultry-farm` |
| `recommendedPlanTier` | `professional` |
| Demo | `demo-milk` |
| Marketing path | `/solutions/milk-commerce` (dynamic `[slug]` once package + solutions content exist) |
| Registration | `?package=milk-commerce` via `buildRegistrationFromDomainPackage` |
| Pricing | `price_pkr: 10000`, `price_usd: 35`, `billing: 'monthly'`, `badge: 'Milk shop suite'` (Professional list parity; flows through existing `stripeCatalog` / `resolveBillableSku`) |

### Limit overrides (lean neighborhood shop)

Prefer **at or below** Professional defaults where multi-location is implied; bump customers for route houses:

| Limit | Suggested | Rationale |
|-------|-----------|-----------|
| `max_users` | 5 | Owner + 1–2 helpers |
| `max_products` | 2000 | Match Pro; milk catalogs are small |
| `max_customers` | 3000 | Route houses |
| `max_vendors` | 200 | Milk suppliers / bakeries |
| `max_warehouses` | **1** | Single counter (critical) |
| `max_invoices_per_month` | 2000 | Hisab + counter |
| `max_pos_terminals` | 2 | Counter + backup |
| `max_storage_mb` | 1000 | Match Pro |
| `max_branches` | 1 | Single shop |

Owners who grow use Settings → Billing / admin `limit_overrides` — no code fork.

---

## Section 2 — Feature packaging (approved)

### Mechanism (do not reinvent)

1. Define `MILK_DESIRED` in `lib/config/domainPackageFeatures.js`.  
2. Build overrides with **`buildDomainPackageFeatureOverrides('professional', MILK_DESIRED)`** — not Business defaults (`withBusinessDefaults`).  
3. Store on tenant as `settings.packaging = { mode: 'custom', feature_overrides }`.  
4. Runtime: existing `planHasFeatureWithPackaging` — platform overrides still win.  
5. Only keys in `PLAN_FEATURE_TOGGLE_KEYS`; only diffs vs Professional base are written.

### Professional base vs milk package

| Feature key | Pro base | Milk package | Notes |
|-------------|----------|--------------|-------|
| `pos` | true | true | SuperStore + kg |
| `pos_refunds` | true | true | |
| `barcode_scanning` | true | true | Packaged dairy |
| `offline_pos_mode` | true | true | PK load-shedding — keep |
| `batch_tracking` | true | true | FEFO / chill |
| `expense_tracking` | true | true | Daily costs |
| `credit_notes` | true | true | |
| `payment_allocations` | true | true | |
| `tax_compliance` | true | true | `defaultTax: 0` already in knowledge; light GST chrome |
| `fiscal_periods` | true | true | Leave on (buried in Finance; useful year-end) |
| `basic_accounting` / `basic_reports` / `advanced_reports` | true | true | Hisab + P&L |
| `storefront_orders` | true | true | Online orders |
| `sales_hub` | true | true | |
| `invoicing` / `purchases` / `customers` / `vendors` / `quotations` | true | true* | *Quotations already hidden for milk via `inventoryFeatures` (no Quotation Management) — no packaging key needed |
| `restaurant_pos` | **true** | **false** | Must strip |
| `restaurant_kds` | false | false | No override needed |
| `multi_warehouse` | **true** | **false** | Single counter |
| `serial_tracking` | **true** | **false** | No IMEI/warranty |
| `membership_management` | **true** | **false** | Not gym |
| `loyalty_programs` | **true** | **false** | Reduce CRM clutter |
| `promotions_crm` | **true** | **false** | |
| `price_lists` | **true** | **false** | Simple retail prices |
| `supplier_quotes` | **true** | **false** | |
| `delivery_challans` | **true** | **false** | |
| `stock_reservations` | **true** | **false** | |
| `manufacturing` | false | false | |
| `payroll` / `attendance_tracking` / `shift_scheduling` | false | false | |
| `multi_currency` / `exchange_rates` | false | false | |
| `campaigns` / marketing GenAI suite | false on Pro | false | Do not enable |
| `ai_restock` | false | false | Off for v1 clarity; enable later via packaging only if needed |
| `white_label` / `multi_domain` / `custom_workflows` | false | false | |

### Domain knowledge alignment (milk-shop row only)

In `lib/domainData/retail.js` → `'milk-shop'`:

| Flag / copy | Change | Why |
|-------------|--------|-----|
| `multiLocationEnabled` | `true` → **`false`** | Hides Warehouses nav via existing Sidebar domainRule — packaging alone only locks tab |
| `batchTrackingEnabled` | keep `true` | FEFO |
| `expiryTrackingEnabled` | keep `true` | |
| `manufacturingEnabled` | keep `false` | |
| `inventoryFeatures` | Remove or reword “Multi-Location Inventory” → e.g. “Chilled stock / FEFO” | Honest OS copy |
| Reports list | Keep Route Hisab, Daily Milk Sales, Expiry Alerts | Already good |

**Blast radius:** Affects all `milk-shop` tenants (including non-package). Correct for PK default. Owners who need a second chill room re-enable via **Settings → Industry** (`settings.domainKnowledge` overrides) and may need `multi_warehouse` packaging later — document in Solutions FAQ.

**Do not** change supermarket or dairy-farm knowledge rows.

### Route Hisab

- No new feature key.  
- Visibility remains `resolveDomainKey(category) === 'milk-shop'` / `milkHisab`.  
- Package does not gate hisab (always available for milk vertical when hub shows it).

---

## Section 3 — Easy OS & hub clarity (approved)

### Easy playbook

Add `VERTICAL_PLAYBOOKS['milk-shop']` in `lib/dashboard/easyDomainIntelligence.js`:

| Focus | Keeper language (no em dashes) |
|-------|--------------------------------|
| `stockFocus` | Fresh milk and chill packs turn daily. Watch near expiry and morning supply gaps. |
| `salesFocus` | Counter kg sales plus route deliveries. Peak winter and summer heat drive demand. |
| `accountsFocus` | Weekly and monthly house credit. Collect with JazzCash, cash, or invoice receipt. |
| `actionTab` | `route-hisab` |

### Perishability insight gap

Where Easy/ops treats `perishability === 'high'`, also treat **`critical`** as perishable (milk knowledge uses `critical`). Scope the comparison helper, not supermarket data.

### Ops mode (v1)

**Skip** a new `CATEGORY_MODE` for milk. Rely on Easy playbook + existing storefront contact queue. A dedicated route-collect ops mode can be a follow-up without packaging changes.

### KPI narrative (labels / guidance — not new metrics pipelines)

Prefer existing dashboard numbers with milk labels:

1. Today counter sales (PKR)  
2. Route activity / hisab progress (if snapshot already exposes counts; else link to Route Hisab — do not invent fake KPIs)  
3. Credit / AR to collect (existing aging or outstanding)  
4. Near expiry / low stock (existing inventory KPIs + expiry-aware labels)

**Do not** add new analytics tables or restaurant_orders into milk KPIs.

### Hub visibility (existing gates — verify only)

Expected after packaging + knowledge:

| Visible | Hidden / locked away |
|---------|----------------------|
| Dashboard, Inventory, POS, Route Hisab, Customers, Invoices, Orders, Purchases, Vendors, Expenses/Finance (lean), Settings | Restaurant, Memberships, Campaigns, Warehouses, Serials/Manufacturing, Loyalty |

Finance sub-nav stays permission/plan gated (no domain filter today). FX remains off via packaging. Do not rewrite FinanceHub for milk-only in v1.

---

## Section 4 — Wiring checklist (implementation touch list)

Additive files/keys only:

| Area | Touch | Notes |
|------|-------|-------|
| `lib/config/domainPackageFeatures.js` | `MILK_DESIRED`, `MILK_COMMERCE_FEATURE_OVERRIDES`, highlights | Use `buildDomainPackageFeatureOverrides('professional', …)` |
| `lib/config/domainPackages.js` | `DOMAIN_PACKAGES['milk-commerce']` | Import milk overrides |
| `lib/marketing/domainPackageSolutionsContent.js` | Content for `milk-commerce` | Honest Available/Roadmap; align capabilities map |
| `lib/marketing/domainPackageVerticalMeta.js` | Slides/presets if required by peers | Follow existing helper patterns |
| `scripts/verify-domain-packages.mjs` | Add `milk-commerce` to `EXPECTED_PACKAGES` | |
| `lib/dashboard/easyDomainIntelligence.js` | Playbook + critical perishability | |
| `lib/domainData/retail.js` | milk-shop multiLocation + inventoryFeatures | Milk only |
| Billing/nav | `DomainPackageBillingCards` `PACKAGE_ICONS` add `milk-commerce` (e.g. Lucide `Milk`); cards already `listDomainPackages()` | Prefer auto-list; icon map is hardcoded |
| Registration | Existing `domainPackageKey` path | Rich catalog already includes milk-shop |
| Verify | `bun run verify:domain-packages`, `verify:milk-shop-storefront`, `verify:milk-shop-hisab`, `verify:easy-dashboard`, `verify:registration-flow` | |

### Explicitly do not touch

- `prisma/schema.prisma` / migrations  
- Route Hisab actions/tables  
- supermarket / dairy-farm storefront libs (except reading existing milk overlays)  
- Other `*_COMMERCE_FEATURE_OVERRIDES` maps  
- Plan tier feature matrices for Free/Starter/Business (except reading Professional for diffs)

---

## Section 5 — Marketing honesty

Solutions page module groups (suggested):

1. **Counter POS (kg)** — SuperStore, barcode, offline mode, refunds  
2. **Route Hisab** — daily sheet, week/month invoice, thermal bill, reminders  
3. **Chill inventory** — FEFO, best-before, dairy domain fields  
4. **Online milk store** — elevated supermarket chrome + milk overlays, storefront orders  

Label Roadmap honestly (e.g. GPS routing, auto stock decrement from hisab day totals) per companion hisab spec non-goals.

Trust copy must align with `lib/marketing/capabilities.js` / `docs/MARKETING_CAPABILITY_MAP.md` — no unverified stats.

---

## Section 6 — Testing / acceptance

1. Register with `?package=milk-commerce` → business category `milk-shop`, plan Professional, packaging custom overrides present.  
2. Hub: Route Hisab visible; Warehouses / Restaurant / Memberships / Campaigns / Loyalty **not** offered as usable modules.  
3. POS resolves SuperStore with weight; offline flag still true.  
4. Easy dashboard shows milk playbook copy; perishable insights fire for `critical`.  
5. `demo-milk` and existing hisab verify scripts still pass.  
6. Clothing/pharmacy/fitness package verifies still pass (`EXPECTED_PACKAGES` extended, not replaced).  
7. A supermarket tenant packaging/nav unchanged in smoke check.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Softening Professional still leaves Fiscal/Tax tabs | Accept for v1; copy stays light via `defaultTax: 0` |
| `multiLocationEnabled: false` surprises multi-depot milk brands | Document Industry override path; rare for neighborhood shops |
| Solutions content missing → `/solutions/milk-commerce` 404 | Content entry required same PR as package |
| Hardcoded package allowlists miss milk | Extend `verify-domain-packages.mjs` EXPECTED list and any hardcoded nav arrays found during impl |
| Using `withBusinessDefaults` by mistake | Spec mandates Professional base builder |

---

## Open decisions (resolved in this design)

| Question | Resolution |
|----------|------------|
| Scope | milk-shop + aliases only (not supermarket) |
| Approach | A — dedicated `milk-commerce` SKU |
| Tier | Professional |
| Schema | None |
| Loyalty | Off for clarity |
| AI restock | Off for v1 |
| Warehouses | Off packaging + knowledge `multiLocationEnabled: false` |

---

## Next step after user reviews this file

Invoke writing-plans → `docs/superpowers/plans/2026-07-25-milk-commerce-package.md` with file-level tasks, then implement behind verify scripts.

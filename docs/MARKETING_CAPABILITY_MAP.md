# Marketing capability map

Public marketing must stay aligned with **what ships** in the product. This doc is the editorial companion to **`lib/marketing/capabilities.js`** (code) and **`lib/config/plans.js`** (entitlements).

## Status labels (public)

| Label | Meaning |
|-------|---------|
| **Available** | In production; usable when plan/env allows |
| **Partial** | Usable with caveats (config, plan gate, or incomplete depth) |
| **Roadmap** | Planned or scaffold only - do not badge as Live |

## Shipped today (high confidence)

- Inventory hub: products, stock adjustments, Excel import, product images, multi-warehouse (Professional+)
- POS: terminals, sessions, retail checkout, restaurant POS, browser thermal receipts, shared camera barcode scanner
- Offline POS Phase 1: IndexedDB queue + catalog snapshot (plan `offline_pos_mode`; PosTerminal / SuperStorePOS)
- Branded storefront: catalog, cart, checkout, order hub
- Finance: journal entries, GL hub, fiscal periods (Professional+)
- CRM: loyalty, promotions (Professional+), campaigns hub (Business+)
- Sales pipeline: B2B quotations, sales orders, delivery challans with stock context
- Domain commercial suites: clothing, pharmacy, auto-parts, vehicle showroom, furniture, fitness, milk (`/solutions/[slug]`)
- AI: Business Analyst, forecasting signals (Business+, API keys)
- Billing: Stripe subscriptions, manual/offline path, optional NOWPayments
- Email: Resend transactional (OTP, orders, leads)

## Partial (say it plainly)

- **Pakistani tax**: configuration + summaries + exports - **not** live FBR IRIS filing
- **JazzCash / EasyPaisa**: checkout labels - **not** built-in wallet capture
- **Storefront stock**: shared catalog; multi-location businesses should validate stock rules
- **Manufacturing**: BOM + production orders - not full MES
- **Restaurant KDS**: kitchen display on Business+; confirm depth on demo
- **Campaigns / analytics**: usable hubs with plan gates; full MAP automation and guided AI depth vary by tier
- **HR**: payroll backend on Business+; attendance/shift UIs are early
- **Urdu**: toggle + partial strings - not 100% localized UI
- **Milk Route Hisab offline**: Phase 1 day-sheet queue (not full POS offline for restaurant)

## Roadmap (never “Live” on /integrations)

- FBR IRIS / Tier-1 POS transmission
- Shopify, Daraz, WooCommerce sync
- WhatsApp Business API automation
- Bank feed API reconciliation
- Full MES / shop-floor scheduling; pharmacy Rx network APIs; gym turnstile / biometric access

## Pages updated from this map

- `/integrations` - honest status grid
- `/features` - advanced section bullets
- Solutions mega-menu - `capabilities.js` descriptions (no duplicate sales-pipeline in Growth)
- `/solutions/[slug]` - DomainPackageSolutionsPage for all Industry Plan suites
- `/solutions/supermarket-grocery`, `/solutions/restaurant-hospitality` - honest Partial labels, no unverified KPIs
- `/solutions/marketing-crm` - growth story cross-linked to Industry Plans
- `/industries` - 62 presets, not “automatic compliance”
- `/why-tenvo`, `lib/marketing/content.js`, `lib/marketing/faqs.js`, `TENVO_ADVANTAGES`

## When product changes

1. Update `lib/marketing/capabilities.js`
2. Adjust affected page if not driven from catalog
3. Sync `PLAN_TIERS` / `FEATURE_LABELS` if entitlements change
4. Note in PR if a **Partial → Available** promotion is intentional

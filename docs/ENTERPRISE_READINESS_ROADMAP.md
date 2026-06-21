# Enterprise readiness — Zoho / Odoo / Busy-style parity (no conflicts)

This document is the **roadmap layer** on top of **`docs/MARKET_READINESS.md`** (launch gate) and **`docs/DATA_INTEGRITY_AND_FORMS.md`** (engineering patterns). It explains how to compete with suites like **Zoho Books/Inventory**, **Odoo**, and **Busy** without introducing **parallel sources of truth** or blocked releases.

## Single sources of truth (avoid roadblocks)

| Concern | Canonical mechanism | Do not duplicate with |
|--------|---------------------|------------------------|
| **Tenant isolation** | `business_id` + `withGuard` / `assertEntityBelongsToBusiness`; `prismaBase` vs `db` per `AGENTS.md` | Ad-hoc “global” queries for tenant data |
| **Plan limits** (seats, SKUs, warehouses) | `businesses.plan_tier` + columns + `getPlanTierQuotaUpdateData` | `settings.packaging` (overrides **features**, not numeric limits) |
| **Module / tab access** | `PLAN_TIERS.*.features` + optional `settings.packaging` via `planHasFeatureWithPackaging` | Per-row `feature_flags` table **until** a migration plan merges or replaces packaging (today: **packaging only**) |
| **Platform experiments** | `platform_feature_flags` + overrides | Per-business `feature_flags` (unused in guards today) |
| **Merchant SaaS billing** | Stripe webhooks + `subscription_history`; manual path `recordManualSubscriptionPayment` | Silent client-only “plan” state |
| **Regional / tax story** | `docs/REGIONAL_STANDARDS.md`, `businesses.country` canonical name | Hard-coded country strings in new features |

If a new feature needs a toggle: **prefer** extending `PLAN_TIERS` + packaging, or a **namespaced** key under `businesses.settings`, documented in one place.

## What buyers compare (axes)

1. **Trust** — Correct data per tenant; recoverable billing; audit trail for money and plan changes.  
2. **Reliability** — Idempotent webhooks, migrations applied, smoke tests green (`docs/FLOW_E2E_TESTING.md`).  
3. **Depth** — GL, inventory, tax, POS where promised by tier (`lib/config/plans.js`, `docs/MODULAR_PACKAGING_AND_DASHBOARD_MATRIX.md`).  
4. **Operations** — Clear dunning vs grace (`docs/SUBSCRIPTION_BILLING_FLOW.md`), owner billing, admin manual renew.  
5. **Time-to-value** — Registration → first invoice/product without dead ends; forms use `formErrorHandler` patterns.

## Phased plan (best order, minimal conflict)

### Phase 0 — Ship gate (non-negotiable)

Already enumerated in **`docs/MARKET_READINESS.md`**: auth boundaries, billing env + webhook path, migrations, observability, legal/regional, performance basics, **register → hub → create doc → refresh** smoke.

**Exit:** checklist signed off; no P0 open security/tenancy issues from `docs/AUDIT_SCHEMA_AND_INTEGRATIONS.md` where applicable.

### Phase 1 — “Works like Busy for day one” (core ERP credibility)

- **Form consistency** — Migrate high-traffic screens still on throw-only APIs to **`actionSuccess` / `actionFailure`** + **`formErrorHandler`** where missing (`MARKET_READINESS.md` reference list).  
- **Billing completeness** — Every **priced** tier × currency in UI has a matching **`STRIPE_PRICE_*`** (or hide that currency in checkout). See gaps table in **`docs/SUBSCRIPTION_BILLING_FLOW.md`**.  
- **Offline / local PSP** — Either Stripe-only for v1, or one PSP with webhook → **`recordManualSubscriptionPayment`**; avoid shadow “paid” flags in random JSON.  
- **Owner self-serve “I paid”** (optional v1.1) — Ticket + ops approval calling the **same** server action as platform admin (no second payment write path).

### Phase 2 — “Feels like Zoho/Odoo scale” (breadth without spaghetti)

- **Imports / exports** — CSV or Excel for masters and opening balances; always scoped actions + progress feedback.  
- **Print & documents** — Invoice/delivery templates and numbering rules; keep finance posting in **`AccountingService`** / schema-aligned journals (`AGENTS.md`).  
- **Explicit grace / suspend** — If you need hard lock after N days past_due, add a **single** column (e.g. `subscription_grace_until`) and one guard read — do not fork “is active” logic in five places (`GET /api/billing/subscription` should remain the product definition of `isActive` / `needsBillingAttention`).  
- **API & integrations** — When `api_access` is real, ship keys + rate limits + audit; webhook outbound queue if volume grows.

### Phase 3 — Differentiation (after parity is boring)

Industry verticals (`lib/domainKnowledge`, `docs/DOMAIN_VERTICALS.md`), AI assist where bounded by plan, white-label, multi-company UX polish — **after** Phase 0–1 are green so marketing does not outrun reliability.

## Conflict checklist (before merging large features)

- [ ] Does this touch **billing state**? If yes, update webhooks + `subscription_history` story in **`SUBSCRIPTION_BILLING_FLOW.md`** and use **`prismaBase`** for cross-tenant writes.  
- [ ] Does this change **who sees a tab**? If yes, update **`planHasFeatureWithPackaging`** usage or **`DASHBOARD_TAB`** mapping in one documented place (`MODULAR_PACKAGING_AND_DASHBOARD_MATRIX.md`).  
- [ ] Does this add a **new permission**? Add to **`PERMISSION_DEFINITIONS`** and mirror in UI gating; owners already bypass unknown keys but **admins** do not.  
- [ ] Does this add a **new “flag” table**? Re-read **`AGENTS.md`** — justify vs `settings.packaging` vs `platform_feature_flags`.

## Related documents

- `docs/MARKET_READINESS.md` — launch checklist  
- `docs/DATA_INTEGRITY_AND_FORMS.md` — tenant + forms + cache  
- `docs/SUBSCRIPTION_BILLING_FLOW.md` — SaaS billing lifecycle  
- `docs/MODULAR_PACKAGING_AND_DASHBOARD_MATRIX.md` — tabs vs plans  
- `docs/subscription-analysis.md` — tier vs packaging philosophy  
- `docs/PAYMENTS_ENV_AND_SETUP.md` — env and PSP setup  
- `docs/REGIONAL_STANDARDS.md` — multi-country onboarding  
- `docs/FLOW_E2E_TESTING.md` — automated smoke  

When this roadmap and the launch checklist diverge, **update both** in the same PR so sales and engineering stay aligned.

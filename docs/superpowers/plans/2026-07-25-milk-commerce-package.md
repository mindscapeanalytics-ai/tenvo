# Milk Commerce Package Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship additive `milk-commerce` domain package (Professional packaging, Easy playbook, milk knowledge single-counter default) without schema or other-domain breakage.

**Architecture:** Reuse `DOMAIN_PACKAGES` + `buildDomainPackageFeatureOverrides('professional', …)` + existing solutions/billing/registration wiring. Route Hisab stays domain-gated. No Prisma changes.

**Tech Stack:** Next.js, existing plan/packaging system, Easy dashboard intelligence, marketing solutions content.

## Global Constraints

- Vertical: `milk-shop` only (+ existing aliases). Never supermarket / dairy-farm.
- Tier: `professional`. Overrides via Professional diffs only (not `withBusinessDefaults`).
- No schema / migrations / Route Hisab table changes.
- Copy: no em dashes in UI/marketing strings.
- Verify: `bun run verify:domain-packages` (and milk/easy scripts).

---

### Task 1: Feature overrides + package catalog

**Files:**
- Modify: `lib/config/domainPackageFeatures.js`
- Modify: `lib/config/domainPackages.js`

- [x] Add `MILK_DESIRED`, `MILK_COMMERCE_FEATURE_OVERRIDES` via `buildDomainPackageFeatureOverrides('professional', MILK_DESIRED)`, and `MILK_COMMERCE_HIGHLIGHTS`.
- [x] Add `DOMAIN_PACKAGES['milk-commerce']` with limits/pricing/moduleGroups/faqs from spec; import/export overrides.
- [x] Run: `node -e` or verify script later.

### Task 2: Marketing solutions + vertical meta + billing icon

**Files:**
- Modify: `lib/marketing/domainPackageSolutionsContent.js`
- Modify: `lib/marketing/domainPackageVerticalMeta.js`
- Modify: `components/billing/DomainPackageBillingCards.jsx`

- [x] Solutions content block for `milk-commerce` (3 pillars, 1 vertical preset `milk-shop`).
- [x] `VERTICAL_PRESET_SLIDE_META['milk-shop']` + `PACKAGE_CHANNEL_HERO_IMAGES['milk-commerce']` (3 heroes from milk unsplash ids).
- [x] Billing `PACKAGE_ICONS['milk-commerce'] = Milk`.

### Task 3: Easy playbook + knowledge + knowledge knowledge

**Files:**
- Modify: `lib/dashboard/easyDomainIntelligence.js`
- Modify: `lib/domainData/retail.js` (`milk-shop` only)

- [x] `VERTICAL_PLAYBOOKS['milk-shop']` with `actionTab: 'route-hisab'`.
- [x] Treat `critical` like `high` in perishability branches.
- [x] `multiLocationEnabled: false`; update `inventoryFeatures` copy.

### Task 4: Verify wiring

**Files:**
- Modify: `scripts/verify-domain-packages.mjs`
- Modify: `docs/superpowers/specs/2026-07-25-milk-commerce-package-design.md` status → Implementing/Shipped

- [x] Add `milk-commerce` to `EXPECTED_PACKAGES` + `MILK_COMMERCE_FEATURE_OVERRIDES` check.
- [x] Run `bun run verify:domain-packages`, `bun run verify:milk-shop-storefront`, `bun run verify:milk-shop-hisab`, `bun run verify:easy-dashboard`.

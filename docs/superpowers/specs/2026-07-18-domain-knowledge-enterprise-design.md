# Domain Knowledge Enterprise Layer — Design Spec

**Date:** 2026-07-18  
**Status:** Implemented — plan at `docs/superpowers/plans/2026-07-18-domain-knowledge-enterprise.md`  
**Approach:** Platform presets + country/market layer + owner patch in `settings.domainKnowledge` (merge, not fork)  
**Not chosen:** Per-override Prisma tables; copy-preset-into-DB at registration (fork)

## Problem

Tenvo ships **62+ verticals** via `lib/domainData/*.js` → `lib/domainKnowledge.js`. Country awareness exists (`getDomainKnowledgeForBusiness`, `lib/regionalMarket/`), but enterprise gaps remain:

1. **Owners cannot extend or update** product fields, units, brands, category shells, or intelligence — presets are code-only.
2. **Country leaks:** many tenant UI paths call bare `getDomainKnowledge(category)` (defaults to PK); tax categories and brand merge are still PK-centric in places (`popularBrands` merge only for PK).
3. **Vertical data quality** is uneven: some rows lack complete `intelligence` / `fieldConfig` / consistent shapes; verification does not enforce an enterprise completeness contract.
4. **Legacy naming** (`pakistaniFeatures`) confuses maintainers even though runtime already exposes `marketFeatures`.

Without a single resolution pipeline and a safe owner patch surface, multi-country tenants and customized wholesale/retail ops cannot manage domain behavior like Zoho/Busy-style industry packs.

## Goals

1. One canonical resolution path for tenant-scoped domain knowledge: platform → country/market → owner patch → financials tax/currency (locked).
2. Owners (with settings permission) can extend/update ops config: fields, units, brands, categories, intelligence, payment-term labels — without forking platform presets.
3. Country awareness is correct for every hub/POS/inventory path that has a business context; AE/US/CN/SA tenants do not inherit PK tax category lists or brand merge rules by accident.
4. All 62+ verticals meet a documented completeness contract; CI verifies domains, regional market, and override merge.
5. Backward compatible: empty/missing `settings.domainKnowledge` preserves today’s behavior.

## Non-goals (v1)

- Changing plan modules / packaging (`settings.packaging`) or elevated storefront templates.
- Letting owners override tax **rates**, `taxCompliance`, or market **payment gateway** catalogs (those stay regional/financials + market profile).
- New Prisma tables or migrations for domain knowledge.
- Per-product custom field schema redesign beyond existing `domain_data` + `fieldConfig`.
- Full admin “vertical CMS” for platform staff to edit `domainData` files in UI.
- Translating all inventoryFeature/report string catalogs per country in v1 (optional later).

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Scope | Owner extensibility → country hardening → vertical data quality |
| Owner surface | Ops-flexible (**B**): fields, brands, units, categories, intelligence; tax math locked |
| Storage | `businesses.settings.domainKnowledge` JSON patch (merge layer) |
| Tax rates | `getBusinessRegionalPack` / `settings.financials` only |
| Brands | Owner/domain `popularBrands` prepend for **all** markets |

## Current architecture (baseline)

| Piece | Location | Behavior today |
|-------|----------|----------------|
| Presets | `lib/domainData/*.js` | Per-vertical fields, units, intelligence, setupTemplate |
| Aggregator | `lib/domainKnowledge.js` | `getDomainKnowledge(category, { countryIso })` merges defaults + market |
| Business helper | `lib/utils/businessRegionalContext.js` | `getDomainKnowledgeForBusiness` — country only, **no owner patch** |
| Market layer | `lib/regionalMarket/` | Brands, payments, taxCompliance, languages per ISO |
| Brand merge | `getBrandsForMarketWithOverrides` | Domain `popularBrands` only when market is **PK** |
| Config matrix | `lib/config/domains.js` | Modules / plan hints; synthetic rows for long-tail keys |
| Aliases | `lib/config/domainKeyAliases.js` | e.g. `apparel` → `garments` |
| Call-site drift | `domainHelpers.ts`, templates, some inventory utils | Bare `getDomainKnowledge` → PK default |
| Verify | `verify:domains`, `verify:regional-market` | Icons/modules/brands; no override contract |

## Design

### 1. Resolution pipeline

```
platform preset (domainData[resolvedKey] || retail-shop)
  → DOMAIN_KNOWLEDGE_DEFAULTS merge
  → country/market layer (getMarketFeatures / regional tax defaults)
  → owner patch (settings.domainKnowledge) via applyDomainKnowledgeOverrides
  → financials/regional pack for defaultTax when forms need rate
       (never taken from owner domain patch)
```

**Canonical tenant API:** `getDomainKnowledgeForBusiness(category, business)`  
Must apply country **and** owner overrides. All hub/POS/inventory/dashboard tenant paths use this (or pass explicit `{ countryIso, overrides }` for tests).

**Platform / registration API:** `getDomainKnowledge(category, { countryIso })`  
No owner patch (no business yet). Keep for onboarding, admin pickers, verify scripts.

```js
// Pseudocode — applyDomainKnowledgeOverrides(base, patch)
// Allowlist keys only; ignore locked keys if present in patch
```

### 2. Owner patch shape (`settings.domainKnowledge`)

```json
{
  "productFields": ["Custom Spec"],
  "fieldConfig": {
    "customspec": {
      "label": "Custom Spec",
      "type": "text",
      "required": false
    }
  },
  "units": ["pcs", "box", "crate"],
  "popularBrands": ["Acme Local", "House Brand"],
  "setupTemplate": {
    "categories": ["Core", "Seasonal"],
    "suggestedProducts": []
  },
  "intelligence": {
    "seasonality": "high",
    "peakMonths": ["March", "April"],
    "perishability": "medium",
    "shelfLife": 180,
    "demandVolatility": 0.6,
    "minOrderQuantity": 24,
    "leadTime": 10
  },
  "customerFields": ["Loyalty Tier"],
  "vendorFields": ["Preferred Carrier"],
  "paymentTerms": ["Cash", "Credit 30 Days", "Advance 50%"]
}
```

**Merge rules**

| Key | Policy |
|-----|--------|
| `fieldConfig` | Deep-merge by `normalizeKey(field)`; owner wins on conflict |
| `productFields` | Union preserving platform order, then owner additions (dedupe case-insensitive) |
| `units` | If owner array non-empty → replace; else keep platform |
| `popularBrands` | Prepend owner list, then market+domain brands; dedupe |
| `setupTemplate.categories` | If owner non-empty → replace categories; suggestedProducts replace only if owner array provided |
| `intelligence` | Shallow-merge allowlisted keys only |
| `customerFields` / `vendorFields` / `paymentTerms` | Same as units (replace if non-empty) |

**Locked (strip/ignore if present in patch)**

- `defaultTax`, `taxCategories` (when country-aware regional defaults apply)
- `marketFeatures.paymentGateways`, `marketFeatures.taxCompliance`
- Plan/module flags (`posEnabled` etc. remain platform; packaging is separate)
- `icon`, `imageUrl` (platform branding)

**Limits (Zod)**

- Max **40** `fieldConfig` entries; label ≤ 80 chars; type enum: `text` \| `select` \| `number` \| `date` \| `textarea`
- Max **30** units; max **50** popularBrands; max **40** categories
- Intelligence enums: seasonality / perishability constrained; numbers finite and non-negative; `peakMonths` max 12

### 3. Country awareness hardening

1. **`getBrandsForMarketWithOverrides`:** prepend domain/owner `popularBrands` for **all** markets (remove PK-only gate).
2. **Tax categories:** when `countryIso !== 'PK'` (resolved market), use `buildRegionalTaxCategoryDefaults(countryIso)` unless a future explicit regionalized row exists; do not ship Anarkali/FBR label lists to AE/US tenants.
3. **Call-site audit:** replace bare `getDomainKnowledge(category)` in tenant UI with `getDomainKnowledgeForBusiness` or pass `countryIso` from `resolveBusinessCountryIso` / `useBusiness()`.
4. **API naming:** prefer `marketFeatures` in new code; keep `pakistaniFeatures` as deprecated alias pointing at the same object.
5. **`domainHelpers`:** add optional `countryIso` / `business` to helpers used by inventory grids; registration/demo without business may keep PK default with an explicit comment.

### 4. Settings UX

**Location:** Hub Settings → **Industry** (new sub-tab alongside Team / Billing / Store).

**Permission:** existing settings update permission (same gate as packaging / store settings). Owner primary; staff with settings access may edit.

**UI sections**

1. Baseline summary (read-only): vertical name, country ISO, currency/tax label from regional pack  
2. Product fields editor (`fieldConfig` + productFields sync)  
3. Units  
4. Brand suggestions  
5. Category shells (`setupTemplate.categories`)  
6. Intelligence (compact form)  
7. Per-section **Reset to platform defaults** (deletes that key from patch)  
8. Global **Reset all industry customizations**

**Server:** `updateDomainKnowledgeOverridesAction` via `withGuard`, Zod parse, write into `businesses.settings.domainKnowledge` (merge with existing settings object; do not wipe packaging/financials/storefront). Use `actionSuccess` / `actionFailure` + `formErrorHandler`.

**Client:** after save, refresh business context so inventory grids pick up new fields without full reload of catalog.

### 5. Vertical data quality contract

Every key in `domainKnowledge` must provide after merge with defaults:

| Required | Notes |
|----------|--------|
| `icon` | Already verified |
| `name` or slug-derived name | Already supplied by getter |
| `units` | Non-empty array |
| `productFields` **or** non-empty `fieldConfig` | At least one |
| `intelligence` | All keys: seasonality, peakMonths, perishability, shelfLife, demandVolatility, minOrderQuantity, leadTime |
| `setupTemplate.categories` | Non-empty array (suggestedProducts may be empty) |

Fill sparse rows in `lib/domainData/*.js` with sensible vertical defaults — no fake PK bazaar brands on industrial/service rows. Prefer empty `popularBrands` and let regional catalogs supply brands.

### 6. Verification

| Script | Additions |
|--------|-----------|
| `verify:domains` | Completeness contract above; `getDomainConfig` still non-null |
| `verify:regional-market` | Brand prepend works for AE/US/CN/SA; tax categories not PK-labeled for non-PK |
| `verify:domain-knowledge-overrides` (new) | Zod accept/reject; merge idempotency; locked keys stripped; empty patch ≡ base |

Run after related edits: `bun run verify:domains`, `bun run verify:regional-market`, `bun run verify:domain-knowledge-overrides`.

### 7. Rollout phases

| Phase | Scope | Risk |
|-------|--------|------|
| **1** | `applyDomainKnowledgeOverrides` + wire into `getDomainKnowledgeForBusiness`; brand/tax country fixes; critical call-site countryIso | Low |
| **2** | Zod + `updateDomainKnowledgeOverridesAction` + Settings → Industry UI | Medium |
| **3** | Preset completeness fills + verify script extensions | Low |

No Prisma migration. Feature flag optional; default **on** (empty patch = no behavior change).

### 8. Error handling

- Invalid patch on save → 400 with field-level Zod issues; do not partially write invalid keys.
- Corrupt existing JSON at read time → log once, treat as `{}`, do not crash inventory.
- Unknown `fieldConfig` types → coerce to `text` on read or reject on write (prefer reject on write).

### 9. Testing

- Unit: merge policies, locked-key strip, brand prepend all markets, tax category swap for non-PK.
- Unit: Zod boundary (41 fields rejected; empty patch ok).
- Integration smoke: save Industry settings → `getDomainKnowledgeForBusiness` returns owner field in inventory column resolver.
- Regression: `verify:domains` + `verify:regional-market` green for all verticals.

## Success criteria

1. Owner can add a custom product field and see it in Visual/Busy/Excel inventory without a deploy.
2. AE/US tenant inventory brand suggestions and tax category labels are market-appropriate, not PK FBR/Anarkali lists.
3. Every vertical passes the completeness contract in CI.
4. Empty `settings.domainKnowledge` leaves behavior identical to pre-change for existing tenants.
5. Platform updates to `domainData` continue to flow to tenants (merge, not fork).

## Out of scope follow-ups

- Platform admin UI to edit global `domainData` without code.
- Per-country translated `inventoryFeatures` / `reports` strings.
- Owner-defined inventory feature toggles that change POS variant selection.
- Migrating legacy `pakistaniFeatures` key off the wire entirely (keep alias until major version).

## References

- `docs/DOMAIN_VERTICALS.md`
- `docs/REGIONAL_STANDARDS.md`
- `lib/domainKnowledge.js`
- `lib/utils/businessRegionalContext.js`
- `lib/regionalMarket/index.js`
- `lib/utils/domainHelpers.ts` (`normalizeKey`)
- Packaging precedent: `settings.packaging` / `lib/subscription/effectivePlanAccess.js`

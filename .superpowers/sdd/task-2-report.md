# Task 2 Report: Wire business resolver + country tax categories

**Status:** DONE  
**Date:** 2026-07-18  
**Phase:** Domain Knowledge Enterprise Layer — Phase 1 (business resolver wiring)

---

## Summary

Wired owner `settings.domainKnowledge` patches into `getDomainKnowledgeForBusiness` and fixed non-PK markets leaking PK row `taxCategories`. Extended the override verify script with AE grocery tax isolation checks.

---

## Files Modified

| File | Change |
|------|--------|
| `lib/utils/businessRegionalContext.js` | Import override helpers; `getDomainKnowledgeForBusiness` resolves country, loads base knowledge, applies owner patch when given a business object |
| `lib/domainKnowledge.js` | `taxCategories` uses row lists only when `resolvedMarketIso === 'PK'`; otherwise `buildRegionalTaxCategoryDefaults(countryIso)` |
| `scripts/verify-domain-knowledge-overrides.mjs` | AE vs PK grocery taxCategories assertions (no PK FBR mirror; no JazzCash/Anarkali leak) |

---

## Behavior Changes

### `getDomainKnowledgeForBusiness(category, businessOrCountryIso)`

1. String arg → country ISO only; returns base `getDomainKnowledge` (no patch).
2. Falsy business → base only.
3. Business object → `resolveBusinessCountryIso`, base knowledge, then `extractDomainKnowledgeOverride(settings)` + `applyDomainKnowledgeOverrides`.
4. `defaultTax` and `taxCategories` remain locked (override layer unchanged from Task 1).

### `getDomainKnowledge` taxCategories

- **Before:** Any domain row with `taxCategories` applied globally (AE tenants saw PK FBR labels).
- **After:** Row `taxCategories` only when market is PK; AE/US/etc. get regional defaults (e.g. grocery AE → `['VAT 5%', 'Zero Rated', 'Exempt']`; PK grocery → row list `['Sales Tax 0%', 'Exempt', 'Zero Rated']`).

---

## Verification

```bash
bun run verify:domain-knowledge-overrides
bun run verify:domains
```

**Results:**

- `OK: domain knowledge overrides merge + Zod` (exit 0)
- `OK: 65 domains wired (config + plan tier + icons).` (exit 0)

### New AE tax cases

1. AE grocery `taxCategories` must not JSON-equal PK list when PK list contains FBR/WHT/Provincial patterns.
2. AE `taxCategories` must not contain Anarkali/JazzCash strings.

---

## Scope Adherence

- No git commit.
- Only the three files listed in the task brief were touched.
- Tax rates stay on regional/financials; owner patch cannot change `defaultTax`.
- `marketFeatures` / `pakistaniFeatures` alias behavior unchanged in override merge layer.

---

## Concerns / Notes

- Verify script does not yet assert `getDomainKnowledgeForBusiness` end-to-end with a mock business object; Task 3+ may add that when Settings/action wiring lands.
- Domains without row `taxCategories` already used regional defaults; this fix mainly affects verticals with PK-specific lists in `domainData/*`.

---

## Commits

None (not requested).

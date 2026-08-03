# Business verticals (domain knowledge)

## Canonical sources

- **Rich vertical presets** (units, fields, seed templates, reports, `intelligence`): `lib/domainKnowledge.js` aggregating `lib/domainData/*.js`.
- **Plan / module matrix** (required vs recommended modules, tax labels for admin): `lib/config/domains.js` (`BUSINESS_DOMAINS`) plus **`lib/config/syntheticBusinessDomain.js`** for any key that exists in `domainKnowledge` but does not yet have an explicit `BUSINESS_DOMAINS` row.

`getDomainConfig(key)` returns an explicit row when present, otherwise a **synthetic** row derived from `domainKnowledge[key]` so all **62** verticals stay wired for `getDomainOptions()` and `getModulesForDomainPlan()`.

## Defaults merged for every vertical

`getDomainKnowledge(category, { countryIso })` merges baseline `taxCategories`, country-aware `marketFeatures` (legacy key `pakistaniFeatures`), and `intelligence` so UI and helpers do not receive empty objects for those shapes. Pass **`countryIso`** (`PK`, `AE`, `US`, `CN`, …) from business registration so brands, payment gateways, and tax compliance match the selected market — see **`docs/REGIONAL_STANDARDS.md`** and **`lib/regionalMarket/`**.

Tenant-scoped callers should use **`getDomainKnowledgeForBusiness(category, business)`** (`lib/utils/businessRegionalContext.js`), which applies country **and** optional owner patch at **`businesses.settings.domainKnowledge`**.

## Owner industry overrides

Owners/admins edit ops config in Hub **Settings → Industry** (`IndustryDomainKnowledgePanel`). Saves go through **`updateDomainKnowledgeOverridesAction`** (permission `settings.edit`) into **`settings.domainKnowledge`**. Merge rules and Zod limits live in **`lib/utils/domainKnowledgeOverrides.js`**. Tax rates stay under Financials / regional pack; owners cannot override tax compliance or payment gateway catalogs.

Empty or missing `settings.domainKnowledge` preserves platform presets (backward compatible).

Domain-specific analytics copy for **dental-clinic**, **veterinary-clinic**, and **salon-spa** lives in `getDomainIndustryInsightsAction` (`lib/actions/premium/ai/analytics.js`) alongside pharmacy, education, and textile.

## Classification (plans & feature hints)

- **POS / starter-relevant** domains: `_POS_LIST` in `lib/config/domains.js` (expanded for wholesale, FMCG, hardware, cold chain, etc.).
- **Manufacturing / business tier**: `_MANUFACTURING_LIST` includes `chemical` and other mills; legacy keys that did not exist in `domainKnowledge` were removed.
- **Campaign / CRM relevance**: lazy set built from **`Object.keys(domainKnowledge)`** so every registered vertical gets at least **starter** tier when `suggestPlanTier` is evaluated (unless manufacturing/hospitality pushes **business**).

`suggestPlanTier(category, dk)` resolves `dk` from the second argument or from `domainKnowledge[category]` when omitted.

## Verification

```bash
npm run verify:domains
npm run verify:regional-market
npm run verify:domain-knowledge-overrides
```

Checks: icon present on each raw `domainKnowledge` entry, completeness after `getDomainKnowledge` merge (`units`, fields, `intelligence`, `setupTemplate.categories`), `getDomainConfig` returns modules, `suggestPlanTier` returns a valid tier; regional script ensures all verticals have brand catalogs for PK, AE, US, CN, SA and `popularBrands` prepend works for non-PK; override script covers Zod + merge + locked keys.

## Best practices (maintenance)

- **After changing** `lib/domainData/*.js`, `lib/domainKnowledge.js`, `lib/config/domains.js` (`_POS_LIST` / `_MANUFACTURING_LIST` / `BUSINESS_DOMAINS`), or **`app/register/page.js`** category blueprints, run **`bun run verify:domains`** (or `npm run verify:domains`) locally; CI runs the same check.
- **Prefer explicit `BUSINESS_DOMAINS` rows** for high-traffic verticals (modules, tax story, Urdu labels) so admins see curated copy; use **synthetic** rows only so long-tail keys never return `null` from `getDomainConfig`.
- **Single source of truth**: new vertical keys live in **`domainKnowledge`** first; then extend registration **`DOMAIN_CATEGORY_BLUEPRINTS`** if the vertical should appear in a specific tab, and add **`translations.en` / `translations.ur`** `domains.{key}` for search and labels.
- **Plans / POS / manufacturing**: adjust `_POS_LIST` and `_MANUFACTURING_LIST` when a vertical’s real-world checkout or factory floor story changes; campaign relevance stays aligned with **`Object.keys(domainKnowledge)`** by design.
- **Do not** duplicate phone numbers, secrets, or env values in domain docs; keep operational contact in marketing constants (e.g. `TENVO_PARENT_COMPANY`).

# Regional standards (multi-country)

Business registration and `createBusiness` resolve **country → currency, time zone, tax labels, default VAT/GST rate, locale, and tax ID naming** from a single registry: `lib/utils/regionalHelpers.ts`.

## Defaults

- **Empty / unknown** country input normalizes to **Pakistan (`PK`)** for backward compatibility with existing flows.
- **Database `businesses.country`** stores the **canonical English country name** (e.g. `Pakistan`, `United States`) for storefronts and admin UI.
- **Wizard and APIs** may send **ISO 3166-1 alpha-2** codes (e.g. `PK`, `US`); aliases (e.g. `UAE`, `United Kingdom`) are accepted.

## Adding a new country

1. Ensure the **operating currency** exists in `lib/currency/index.ts` (`CURRENCY_CONFIG`). Add the currency first if needed.
2. Add a row to **`REGIONAL_REGISTRY`** in `regionalHelpers.ts` with accurate `timeZone` (IANA), `defaultTaxRate` (indicative only - not legal advice), and `taxIdLabel`.
3. Add any **aliases** (full country name, major cities) to **`ALIAS_TO_ISO`** so free-text and legacy data resolve correctly.

`getRegistrationCountryOptions()` is derived from the registry, so the register wizard updates automatically.

## Persisted metadata

On signup, `business_settings.settings.registration` includes `country_iso`, `tax_label`, `default_tax_rate`, `tax_strategy`, `locale`, `time_zone`, `market_profile`, and `brand_catalog` for downstream features. Storefront defaults also receive `countryIso` and `locale` under `settings.storefront` where applicable.

## Country-aware domain knowledge (brands, payments, tax)

Vertical-specific defaults (62 domains) live in `lib/domainKnowledge.js` + `lib/domainData/*`. **Market-specific** overlays (brand catalogs, payment gateways, tax compliance labels) are resolved by **`lib/regionalMarket/`**:

| Market | ISO | Brand catalog | Launch tier |
|--------|-----|---------------|-------------|
| Pakistan | PK | `brandCatalogs/pakistan.js` (200+ local + import labels) | MVP |
| UAE / GCC | AE, SA | `brandCatalogs/uae.js` | Scale |
| United States | US | `brandCatalogs/unitedStates.js` | Scale |
| China | CN | `brandCatalogs/china.js` | Scale |

- **`getDomainKnowledge(category, { countryIso })`** merges each vertical with `getMarketFeatures(countryIso, category)` (exposed as `marketFeatures` and legacy `pakistaniFeatures`).
- **`getBrandsForMarket(countryIso, domainKey)`** maps every vertical via `domainBrandMap.js` → brand category → country catalog.
- **UI:** `BrandAutocomplete` and product forms pass `business` regional `countryCode` so Pakistan signup sees Khaadi/Gul Ahmed, UAE sees Al Islami/Splash, etc.

Integrity check: `bun run verify:regional-market` (62 domains × PK/AE/US/CN/SA catalogs).

## Registration flow (country → standards → seed data)

1. **Wizard (`app/register/page.js`)** — country ISO drives `getRegionalStandards`, currency options, tax ID label, plan pricing (PKR vs USD), and step-3 preview via `getDomainKnowledge(category, { countryIso })`.
2. **`createBusiness`** — persists canonical `businesses.country` name, currency/timezone, mirrors `settings.registration` on **`businesses.settings`** and **`business_settings.settings`**, including `market_profile` / `brand_catalog`.
3. **`seedRegistrationInventoryAction`** — owner-only post-signup seed; uses **`RegistrationSeedService`** to create **`product_categories`** rows plus template products (prices, stock, regional tax, market brands).
4. **`getDefaultCoaForCountry`** — localized tax GL account names at signup (shared codes via **`lib/config/regionalCoa.js`**).
5. **Hub context (`BusinessContext`)** — resolves region from `settings.registration.country_iso`; use **`getDomainKnowledgeForBusiness(category, business)`** in dashboard/forms.

## Plan pricing display

Pakistan + PKR shows **list prices in PKR** from `PLAN_TIERS.*.price_pkr`. Other regions show **USD reference prices** from `price_usd` with a short footnote (billing rules remain product-specific).

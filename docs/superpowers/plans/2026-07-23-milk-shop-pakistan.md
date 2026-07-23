# Milk Shop Pakistan + Tenvo Milk Demo Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship isolated `milk-shop` vertical with PK country-aware knowledge, full daily-retail catalog (kg milk + dairy), SuperStorePOS, supermarket-chrome public store overlays, and **Tenvo Milk Demo** (`demo-milk`) without breaking `dairy-farm` / supermarket.

**Architecture:** New canonical key + aliases; dedicated seed catalog from `archive/milk-shop.html` + PK shop research; map storefront to supermarket with milk-only overlays; fractional qty helper for weight units; POS via SuperStorePOS.

**Tech Stack:** Next.js App Router, existing domainKnowledge / dataLab / storefront helpers, bun verify scripts.

## Global Constraints

- Do not reshape `dairy-farm` product fields or supermarket grocery seed.
- No em dashes in UI copy.
- Fresh milk default unit `kg`; pack/pcs stay integer qty.
- Images: Unsplash / allowlisted only.

---

### Task 1: Domain knowledge + wiring

- [ ] Add `milk-shop` to `lib/domainData/retail.js` (kg-first, FEFO, categories from Appendix A)
- [ ] Aliases in `domainKeyAliases.js`; map in `storefrontDomains.js`; SuperStore in `posDomains.js`
- [ ] `domains.js` config + lists; translations EN/UR
- [ ] `pakistaniBrands.dairy` + `DOMAIN_BRAND_CATEGORY['milk-shop']='dairy'`
- [ ] Registration picker includes `milk-shop`

### Task 2: Catalog + demo

- [ ] Create `lib/dataLab/milkShopDemoCatalog.js` (~30–40 SKUs covering Appendix A)
- [ ] Wire `richProductCatalog.js` + `REGISTRATION_RICH_CATALOG_VERTICALS`
- [ ] `demo-milk` in `domains.mjs` (Tenvo Milk Demo, fullSeed), `demoStoreProfiles.js`

### Task 3: Storefront overlays + weight qty

- [ ] `lib/storefront/milkShopStorefront.js` + supermarket overlay hooks (quick search, departments, titles)
- [ ] Shared `isStorefrontWeightUnit` / fractional helpers; cart + AddToCart + stock API `unit`
- [ ] Serial alloc floor only; do not floor weight stock decrement

### Task 4: Verify

- [ ] `scripts/verify-milk-shop-storefront.mjs` + package.json script
- [ ] Run `verify:domains`, `verify:regional-market`, `verify:milk-shop-storefront`

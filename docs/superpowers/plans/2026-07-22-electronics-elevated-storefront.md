# Electronics Elevated Storefront Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship a premium, inventory-backed `electronics-goods` public store (`electronics-elevated`) with archive seed catalog and `demo-electronics` under owner refresh.

**Architecture:** Mirror tyre/furniture elevated stack: `electronicsStorefront.js` + sections, hero `electronics-elevated`, archive → `electronicsDemoCatalog.js`, rich catalog + registration seed, verify script. Appliances + gadgets only; installment = contact CTA.

**Tech Stack:** Next.js App Router, existing elevated storefront helpers, dataLab seed, bun verify scripts.

## Global Constraints

- Canonical key: `electronics-goods` (alias `electronics`)
- No motorcycles; no fake EMI calculator; no cross-vertical imagery
- DB UUID products only in orderable UI; seed images enrich
- Dual layout `lg:`; Open Sans; no em dashes; `font-semibold` headings
- Accent: electric blue (`#2563eb`), not purple Unsplash tech

---

### Task 1: Domain knowledge + brands + demo profile
- [ ] Extend `electronics-goods` categories/fieldConfig/intelligence in `lib/domainData/retail.js`
- [ ] Add YOLO + major brands to `pakistaniBrands.electronics`
- [ ] Karachi defaults in `demoStoreProfiles.js` for electronics

### Task 2: Catalog pipeline
- [ ] `scripts/build-electronics-seed-catalog.mjs` parse `archive/electronics.html`
- [ ] Write `electronicsArchiveExtract.json` + `electronicsDemoCatalog.js`
- [ ] Wire `richProductCatalog.js` + `domains.mjs` `fullSeed: true`
- [ ] Optional: `REGISTRATION_RICH_CATALOG_VERTICALS` include `electronics-goods`

### Task 3: Storefront module + UI
- [ ] `lib/storefront/electronicsStorefront.js`
- [ ] `ElectronicsHero.jsx` + `ElectronicsHomeSections.jsx`
- [ ] Wire heroPresets, heroSlides, IMMERSIVE, DomainHeroRouter, LazyVertical, page.jsx, storeHomeCatalog

### Task 4: Registration + settings + subjects
- [ ] `buildDefaultElectronicsStorefrontSeed` in registrationStorefrontDefaults
- [ ] admin.js + StoreSettingsManager nest `storefront.electronics`
- [ ] Add `installment` to STOREFRONT_CONTACT_SUBJECTS (+ contact validation sync)

### Task 5: Verify + marketing
- [ ] `scripts/verify-electronics-storefront.mjs` + package.json script
- [ ] Remove `demo-electronics` from HERO_EXCLUDED; gallery hero from seed
- [ ] Run verify; refresh demo if DB available

# Electronics supermarket-style v2 — implementation plan

**Spec:** `docs/superpowers/specs/2026-07-22-electronics-supermarket-style-v2-design.md`

## Done

1. Telemart Shopify scrape → `lib/dataLab/telemartArchiveExtract.json` (`scripts/fetch-telemart-electronics-catalog.mjs`)
2. Catalog merge + cap → `electronicsDemoCatalog.js` (~78 SKUs) via `build-electronics-seed-catalog.mjs`
3. Homepage `ElectronicsFeedLayout` + department sidebar
4. `/products` `ElectronicsShopLayout` + category strip + brand filters
5. Verify + demo refresh

## Commands

```bash
node scripts/fetch-telemart-electronics-catalog.mjs
node scripts/build-electronics-seed-catalog.mjs
bun run verify:electronics-storefront
npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-electronics --refresh-catalog
```

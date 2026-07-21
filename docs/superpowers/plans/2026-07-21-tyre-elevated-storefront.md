# Tyre Elevated Storefront Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Ship a premium multi-brand tyre retail + bay public store for `tyre-shop` (`tyre-elevated`), demo `demo-tyre` (Tenvo Tyre Store), rich catalog with accurate product details, and country-aware local/imported brands — per `docs/superpowers/specs/2026-07-21-tyre-elevated-storefront-design.md`.

**Architecture:** Dedicated elevated module (`tyreStorefront.js` + `sections/tyre/*`) wired like furniture/tiles; archive-backed seed catalog; `tyres` brand category for regional markets.

**Tech Stack:** Next.js App Router, React client sections, existing `StoreProductRail` / elevated carousel helpers, bun verify scripts.

## Global Constraints

- Canonical vertical: `tyre-shop` only (`tyre-elevated`).
- No em dashes in UI copy; `font-semibold` headings; asphalt + crimson accent (not purple).
- Desktop layouts of other verticals unchanged; dual-layout `lg:` for hero finder.
- No auto-parts / furniture / fitness imagery fallbacks.
- Inventory-first orderable UI (UUID rows); seed enriches images only.
- Owner `pageSections` remain the marketing banner system.
- Do not commit unless the user asks.

## File map

| File | Role |
|------|------|
| `lib/config/domainKeyAliases.js` | tyre/tire aliases → `tyre-shop` |
| `lib/domainData/specialized.js` | enrich tyre-shop categories + sourcing field |
| `lib/domainData/pakistaniBrands.js` + brand catalogs | `tyres` brand lists |
| `lib/regionalMarket/domainBrandMap.js` | `tyre-shop` → `tyres` |
| `lib/dataLab/tyreArchiveExtract.json` | archive images + models |
| `lib/dataLab/tyreDemoCatalog.js` | seed products |
| `lib/dataLab/richProductCatalog.js` | register `tyre-shop` |
| `lib/onboarding/registrationRichVerticals.js` | rich seed on registration |
| `lib/dataLab/domains.mjs` | `demo-tyre` |
| `lib/storefront/tyreStorefront.js` | config, resolvers, hero slides |
| `components/storefront/sections/tyre/*` | Hero + HomeSections |
| `heroPresets.js`, `DomainHeroRouter.jsx`, `LazyVerticalHomeSections.jsx`, `page.jsx`, `storeHomeCatalog.js` | elevated wiring |
| `StoreSettingsManager.jsx` + admin nest | owner tyre settings |
| `scripts/verify-tyre-storefront.mjs` + seed verify | gates |

### Task 1: Domain aliases, knowledge, brands
- [x] Done
### Task 2: Archive extract + demo catalog + rich/demo wiring
- [x] Done
### Task 3: `tyreStorefront.js` core module
- [x] Done
### Task 4: UI sections (Hero + HomeSections)
- [x] Done
### Task 5: Elevated wiring (presets, page, lazy, catalog plan)
- [x] Done
### Task 6: Settings + registration storefront seed
- [x] Done
### Task 7: Marketing gallery + verify scripts
- [x] Done (`bun run verify:tyre-storefront` OK — 51 products)
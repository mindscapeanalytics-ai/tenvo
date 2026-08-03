# Tyre Elevated Storefront Design

**Date:** 2026-07-21  
**Scope:** Premium public-store elevated template for canonical vertical `tyre-shop` (hero `tyre-elevated`), demo domain `demo-tyre` (**Tenvo Tyre Store**), rich registration catalog, and country-aware local/imported tyre brand packs.  
**Approved archetype:** Multi-brand retail + fitting bay (Techno Tyres UX + GTR category tree + Tyres-online size-first finder). Approach 1 — dedicated elevated vertical (not auto-parts mode, not hardware-parts skin).

## Problem

1. **Hub-ready, store-generic:** `tyre-shop` already has inventory fields (size, load, speed, DOT, rim, run-flat), batch tracking, and POS — but the public store maps to generic `hardware-parts` with no tyre finder, no elevated homepage, and no demo credibility.
2. **Weak country brands:** `domainBrandMap` sends `tyre-shop` → `autoparts`, while Pakistan `pakistaniBrands` has **no `autoparts` list**, so owners fall back to useless “Local / Imported / China…” general tags.
3. **No rich day-one catalog:** `tyre-shop` is outside `REGISTRATION_RICH_CATALOG_VERTICALS`; new tenants get category shells only.
4. **Archive gold unused:** `archive/tyre.html` (GTR), `tyre2.html` (Techno Tyres), `tyre3.html` (Tyres-online.pk) provide category trees, product lines, brand walls, size-finder UX, and product imagery that are not wired into Tenvo.

## Goals

1. One premium company + ecommerce homepage: **find size → browse brands → shop → services → visit bay**.
2. Inventory-first product rails and tiles; seed images enrich DB rows; no `catalog_preview` in orderable UI.
3. Country-aware **local vs imported** tyre brands via a dedicated `tyres` brand category + `domain_data.sourcing`.
4. Demo `demo-tyre` and registration seed so day-one storefront looks complete.
5. Dual layout (`lg:`): desktop premium showroom unchanged for other verticals; mobile compact and action-friendly.
6. Reuse elevated peer patterns (furniture / pharmacy / tiles) for wiring, verification, and owner settings — without copying their visual assets.

## Non-goals

- Live price-comparison marketplace (tyre3 is UX reference only).
- Live VIN / LTA / COE APIs, forums, CMS, or app-download placeholders.
- Folding tyre retail into `auto-parts` parts-finder.
- Redesigning hub POS beyond existing `tyre-shop` domain config (POS already enabled).
- Reintroducing global footer trust strips or pre-footer contact CTA strips.
- Using GTR / Techno / Tyres-online logos as Tenvo brand marks.
- Fake KPI/stat strips or unverified “No.1” claims on the Tenvo demo storefront.
- Full custom `/products` shop chrome in v1 (standard storefront products page + query filters is enough; optional tyre filter chips can follow if needed).

## Approved approach

**Dedicated elevated vertical** for `tyre-shop` only:

| Layer | Decision |
|-------|----------|
| Canonical key | `tyre-shop` |
| Aliases | `tyre`, `tire`, `tyres`, `tires`, `tyre-store` → `tyre-shop` via `domainKeyAliases.js` |
| Hero type | `tyre-elevated` |
| Demo | `demo-tyre` — name **Tenvo Tyre Store**, country Pakistan, `fullSeed: true`, showcase |
| Brand category | New `tyres` (not `autoparts` fallback) |
| Sourcing | `domain_data.sourcing`: `local` \| `imported` (same idea as clothing) |
| Catalog | Archive-curated seed ~40–80 SKUs with accurate size / load / speed / brand / category / prices |

## Visual direction

| Token | Role |
|-------|------|
| Near-black asphalt (`#0a0a0a` / `#111`) | Hero and bay CTA shells |
| Off-white / light gray page body | Product and brand sections (readable ecommerce) |
| Crimson accent (`#CC1532` family, GTR-inspired) | CTAs and active finder controls — **not** purple gradients |
| High-contrast white type on dark media | Hero / bay only |

Rules:

- Full-bleed cinematic hero (edge-to-edge media plane).
- No cards in the hero; no floating promo stickers on hero media.
- Open Sans / existing storefront typography tokens; `font-semibold` headings; no em dashes in UI copy.
- CSS-only motion (`group` hover, `motion-safe:` / `motion-reduce:`); no per-card Framer hover; no `blur-2xl`.
- Imagery from tyre archives / tyre product photography only — never auto-parts, furniture, or fitness placeholders.

## Homepage section order (canonical)

Render a section only when it has content (empty → omit). Owner `settings.pageSections` placements (`after-hero` | `mid-page` | `before-footer`) remain the only generic marketing banner system and wrap outside these sections as on other elevated stores.

| Order | Section | Component / source | Job |
|------:|---------|--------------------|-----|
| 0 | Hero + tyre finder dock | `TyreHero` + carousel | Atmosphere; size-first finder; secondary vehicle chips |
| 1 | Trust strip | `resolveTyreTrustPillars` | Fresh DOT stock, fitting bay, warranty support, local + imported |
| 2 | Shop by vehicle type | Category tiles from GTR-aligned tree | Primary discovery |
| 3 | Brand wall | Local + imported brands | Brand browse → `/products?brand=` |
| 4 | Featured / bestsellers | `StoreProductRail` | Conversion |
| 5 | Sale & offers | `StoreProductRail` (omit if empty) | Deals |
| 6 | Alloy & wheels | Optional rail (omit if no rim SKUs) | Secondary catalog |
| 7 | Services | Fitting, balancing, alignment, puncture | Book / contact CTAs |
| 8 | Bay / visit CTA | Store Settings phone / WhatsApp / booking URL | Visit or book bay |
| 9 | Testimonials | Demo or owner-configured only | Social proof (omit if empty on live) |

### Finder behavior (hero)

- **Primary:** Width / Profile / Rim selects → navigate to  
  `{base}/products?width=…&profile=…&rim=…` (and/or `search=` size string like `205/55R16`).
- **Secondary:** Quick chips “Toyota / Honda / Suzuki / …” → `{base}/products?search=…` or category query — **client-side only**, no external vehicle APIs.
- Defaults for selects come from common PCR sizes in seed + owner config override.
- Desktop: finder as overlay dock on hero. Mobile: finder stacked under hero media (dual-layout `lg:`).

### Duplicate-job rules

| Do not add | Reason |
|------------|--------|
| Second category marquee + vehicle tiles | One discovery grid only |
| Generic “Fast Delivery / Secure Payment” strip | Removed globally; trust strip is tyre-specific |
| Parallel banner stacks inside tyre sections | Use `pageSections` only |
| Cross-vertical curated hero images | Tyre archive / seed / tenant only |

## Domain knowledge upgrades

File: `lib/domainData/specialized.js` → `tyre-shop` (keep existing fieldConfig; extend carefully).

1. **Categories (setupTemplate):** align to GTR tree while staying sellable retail:  
   `Passenger Car`, `SUV / Crossover`, `Light Truck`, `Commercial / OTR`, `Motorcycle / Rickshaw`, `Tractor / Agri`, `Alloy Rims`, `Services (Fitting)`.
2. **fieldConfig:** keep `tyresize`, `loadindex`, `speedrating`, `dotweek`, `rimsize`, `runflat`; add  
   `sourcing: { label: 'Sourcing', type: 'select', options: ['Local', 'Imported'], required: false }`.
3. **Intelligence:** keep high seasonality / monsoon-winter peaks; batch tracking stays on.
4. **Suggested products:** replace thin 3-SKU stub with pointers to rich seed (or a representative subset) so hub setup stays credible.
5. **Aliases:** register in `lib/config/domainKeyAliases.js`.
6. **Storefront domain map:** stop treating elevated tyre as plain `hardware-parts` for homepage/hero — elevate path wins when `isTyreElevatedStore(category)`.

## Country-aware brands

1. Add `tyres` arrays to market brand catalogs:
   - **PK (`pakistaniBrands.tyres`):** local — `GTR`, `General Tyre`; imported — `Michelin`, `Bridgestone`, `Yokohama`, `GT Radial`, `Otani`, `Hankook`, `Continental`, `Dunlop`, `Pirelli`, `Maxxis`, `Nexen`, `Toyo`, `Falken`, `Winda` (and similar archive-backed names).
   - **AE / US / CN:** market-appropriate tyre lists in existing `brandCatalogs/*.js` (extend `autoparts` is **not** enough — add explicit `tyres` key).
2. Map `'tyre-shop': 'tyres'` in `lib/regionalMarket/domainBrandMap.js`.
3. Seed products set `domain_data.sourcing` to `local` or `imported` consistently with brand.
4. Run `bun run verify:regional-market` after brand map edits.

## Catalog & demo seed

| Artifact | Responsibility |
|----------|----------------|
| `scripts/build-tyre-seed-catalog.mjs` (or extract + build pair) | Parse archive HTML for GTR product-line images, Techno brand/model names, size-finder defaults; emit JSON extract |
| `lib/dataLab/tyreArchiveExtract.json` | Stable image URLs + model metadata from archives |
| `lib/dataLab/tyreDemoCatalog.js` | Final seed products: name, sku, category, price, stock, image, `domain_data` (tyresize, loadindex, speedrating, rimsize, brand, sourcing, runflat) |
| `lib/dataLab/richProductCatalog.js` | Register tyre catalog for `tyre-shop` |
| `lib/onboarding/registrationRichVerticals.js` | Add `tyre-shop` to `REGISTRATION_RICH_CATALOG_VERTICALS` |
| `lib/dataLab/domains.mjs` | `{ key: 'tyre-shop', name: 'Tenvo Tyre Store', domain: 'demo-tyre', country: 'Pakistan', fullSeed: true, showcase: true }` |
| Marketing gallery meta | Hero + card imagery from tyre seed slide 0 (not shared auto-parts art) |

### Catalog quality rules

- Prefer real archive product photography (GTR side-tyre assets at full resolution where available; Techno/brand assets when usable).
- Accurate size strings (`205/55R16` style), load index, speed rating where known; honest “typical” specs when archive lacks numbers — never invent fake DOT week codes as unique selling claims.
- PKR prices in realistic retail bands for demo (regional pack still drives currency display).
- Service SKUs (fitting / balancing / alignment) may be bookable-style or contact CTA on homepage; if purchasable, they must obey storefront purchasability rules (no silent cart blocks).
- `resolveTyreShowcaseProducts`: enrich live DB rows with seed images by sku/name match; **never** replace live catalog with seed ids in orderable UI.

## Config architecture (`settings.storefront.tyre`)

`getTyreConfig(settings, businessDomain)` returns owner overrides with demo-safe defaults gated by `isDemoStoreDomain`:

```js
{
  showTrustStrip: true,
  showVehicleTiles: true,
  showBrandWall: true,
  showAlloyRail: true,
  showServices: true,
  showBayCta: true,
  showTestimonials: true, // demo default on; live requires owner content
  searchPlaceholder: 'Search size, brand, or model…',
  heroVideoUrl: '', // optional https; demo may ship a tasteful default
  bayCtaTitle: '',
  bayCtaSubtitle: '',
  // optional owner arrays: heroSlides, vehicleTiles, brands, trustPillars, services, finderDefaults
}
```

Store Settings: Tyre section with toggles + optional hero video URL (mirror marine/furniture pattern). Contact phone / WhatsApp / location stay on shared Store Settings contact resolvers (`resolveStoreContact`).

## File / unit map

| Unit | Responsibility |
|------|----------------|
| `lib/storefront/tyreStorefront.js` | Canonical set, accents, config, resolvers, partitions, hero slides, trust/brands/services |
| `components/storefront/sections/tyre/TyreHero.jsx` | Full-bleed hero + finder dock |
| `components/storefront/sections/tyre/TyreHomeSections.jsx` | Canonical section order only |
| `components/storefront/sections/tyre/*` | Trust, vehicle tiles, brand wall, services, bay CTA (split only if files stay focused) |
| `lib/storefront/heroPresets.js` | `tyre-elevated` preset when `isTyreElevatedStore` |
| `components/storefront/sections/LazyVerticalHomeSections.jsx` | Dynamic import tyre home sections |
| `app/store/[businessDomain]/page.jsx` | Elevated tyre branch + marketing placements |
| `components/StoreSettingsManager.jsx` | Tyre storefront toggles / video URL |
| `lib/config/storefrontDomains.js` / hero slides maps | Elevated type mapping; do not leave tyre stuck on hardware-parts for elevated path |
| Verify | `scripts/verify-tyre-storefront.mjs` + `bun run verify:tyre-seed` |

## Mobile / desktop

- Dual layout: `hidden lg:block` / `lg:hidden` where hero finder needs different stacking; desktop layouts of other verticals untouched.
- Vehicle tiles: 2 → 3 → 6 grid; brand wall wraps or horizontal scroll on small screens.
- Product rails: existing `StoreProductRail` horizontal scroll.
- Bay CTA: compact stack on mobile with WhatsApp + Call using Store Settings links.

## Testing / verification

1. `bun run verify:domains` after domain knowledge / alias edits.
2. `bun run verify:regional-market` after `tyres` brand category + map.
3. `bun run verify:tyre-seed` (new) — catalog shape, sourcing, required domain_data keys, no cross-vertical image hosts.
4. `node`/`bun` storefront verify — config defaults, section order helpers, finder query builder, elevated hero type.
5. Manual: `/store/demo-tyre` — section order matches table; finder navigates; Add to Cart works on UUID products; empty alloy/deals sections omit; live-tenant path without testimonials omits quotes.
6. Registration path for `tyre-shop` seeds rich catalog when `shouldSeedRichCatalogOnRegistration` is true.
7. Confirm auto-parts / furniture / pharmacy elevated stores unchanged.

## Implementation order (for plan)

1. Aliases + domain knowledge + `tyres` brand packs + brand map.
2. Archive extract + demo catalog + rich catalog + demo domain wiring.
3. `tyreStorefront.js` resolvers + hero preset + page / lazy sections wiring.
4. UI sections (Hero → HomeSections) with dual layout and motion budget.
5. Store Settings tyre panel + registration defaults seed for storefront config.
6. Verify scripts + demo seed refresh command documented.

## Risks / careful flow notes

1. **Image hosts:** Prefer stable GTR / Techno CDN URLs already in archives; mark dead hosts via existing dead-image helpers if needed.
2. **Isolation:** Never fall back to auto-parts `HeroCarousel` automotive tiles for empty tyre inventory.
3. **Services vs cart:** Homepage services emphasize book/contact; only put service SKUs in cart if they are normal purchasable products without special policy blocks.
4. **Copy honesty:** Demo trust pillars must not claim unverifiable market rank; use operational truths (DOT-aware stock, fitting, warranty support, local + imported range).
5. **Commit cadence:** Spec → plan → implement task-by-task with verify gates; do not ship half-wired elevated detection (hero without sections or catalog without demo).

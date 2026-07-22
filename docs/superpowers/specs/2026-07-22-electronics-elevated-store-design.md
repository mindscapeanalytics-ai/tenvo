# Electronics Elevated Storefront Design

**Date:** 2026-07-22  
**Status:** Implemented (v1 elevated + archive seed; more appliance archives can append via build script)  
**Scope:** Premium public-store elevated template for canonical vertical `electronics-goods` (hero `electronics-elevated`), demo domain `demo-electronics` (**Tenvo Electronics**), archive-backed rich catalog from Imran eShop reference material, and owner-seedable demo under platform owner email.  
**Approved archetype:** Multi-brand home appliances + gadgets retailer (Imran Electronics / imraneshop.com UX reference). Approach A — dedicated elevated vertical; appliances + gadgets only; skip motorcycles and phone-only `mobile` fork.

## Problem

1. **Hub-ready, store-generic:** `electronics-goods` already has serial/warranty inventory knowledge, EMI in payment terms, and PK appliance brands — but the public store maps to generic `electronics-tech` with a reused pharmacy-finder hero, Unsplash slides, and no elevated homepage sections.
2. **Demo not marketing-ready:** `demo-electronics` is `fullSeed: false`, showcase-only, and listed in `HERO_EXCLUDED_DEMO_DOMAINS` until elevated polish ships.
3. **No rich day-one catalog:** electronics is outside `REGISTRATION_RICH_CATALOG_VERTICALS` / package rich catalogs; no `electronicsDemoCatalog` or archive extract pipeline.
4. **Archive underused:** `archive/electronics.html` (Imran Gadgets page) has 11 real SKUs with prices and CDN images; appliance category nav (AC, fridge, TV, washer, etc.) is present in the HTML but product lists for those categories are not in this dump.
5. **Spec gap vs Imran catalog:** `fieldConfig` is Model / Warranty / Specs / IMEI-MAC only — missing appliance attributes (tonnage, capacity, screen size, load kg) that PDPs and filters need.
6. **Installment story is copy-only:** Imran leads with “Buy on Installment”; Tenvo lists EMI in knowledge but has no honest storefront lead CTA (must not fake underwriting).

## Goals

1. One premium Karachi-style appliances + gadgets ecommerce homepage: **browse categories → brand wall → shop rails → installment enquiry → contact**.
2. Inventory-first product rails and tiles; seed images enrich DB UUID rows; no `catalog_preview` in orderable UI.
3. Credible `demo-electronics` under owner email via `ensure-demo-storefronts --only demo-electronics --refresh-catalog --owner <email>`.
4. Extend `domain_data` for appliance attributes without breaking existing serial/warranty flows.
5. Dual layout (`lg:`): desktop premium showroom; mobile compact; do not change unrelated elevated verticals.
6. Reuse elevated peer patterns (tyre / furniture / pharmacy / tiles) for wiring, verification, and owner settings — without copying their visual assets.

## Non-goals

- Motorcycle SKUs or a mixed showroom vertical in v1.
- Folding phones into this store as a second elevated template (`mobile` stays separate; optional later).
- Live Magento scrape automation against imraneshop.com (403 / bot protection); v1 uses archive HTML; more category dumps can feed the same pipeline later.
- Real EMI / BNPL underwriting, interest calculators, or lender integrations.
- Reintroducing global footer trust strips or pre-footer contact CTA strips.
- Using Imran Electronics logos as Tenvo brand marks.
- Fake KPI/stat strips or unverified “best shop in Karachi” claims.
- Full custom `/products` shop chrome in v1 (standard products page + category query filters is enough).
- New domain commercial package SKU unless product later requests it (registration can stay category + demo-profile defaults; rich seed for demo + optional registration rich flag).

## Approved approach

**Dedicated elevated vertical** for `electronics-goods` only:

| Layer | Decision |
|-------|----------|
| Canonical key | `electronics-goods` |
| Alias | `electronics` → `electronics-goods` (already in `domainKeyAliases.js`) |
| Storefront vertical map | Elevated path wins when `isElectronicsElevatedStore(category)`; keep `electronics-tech` as fallback for non-elevated tech cousins (`computer-hardware`, `solar-energy`, etc.) |
| Hero type | `electronics-elevated` (share `elevatedCarouselHero.js` height tokens with furniture/pharmacy/tiles/restaurant) |
| Demo | `demo-electronics` — name **Tenvo Electronics**, country Pakistan, city Karachi defaults, `fullSeed: true`, showcase |
| Catalog v1 | Archive + curated supplements (17 SKUs: YOLO gadgets/wearables, PEL AC, plus fridge/TV/washer/microwave/AC/fan) |
| Installment | Contact / lead CTA only (`/contact` or storefront contact subject), owner phone/WhatsApp from Store Settings |

## Visual direction

| Token | Role |
|-------|------|
| Deep graphite / near-black (`#0a0a0a`–`#111827`) | Hero and installment CTA shells |
| Cool light gray / white page body | Product and brand sections |
| Electric blue accent (`#2563eb` family) | CTAs and active chips — **not** purple/indigo Unsplash tech cliché (`#7c3aed` / `#4f46e5` currently in generic electronics-tech) |
| High-contrast white type on dark media | Hero / installment band only |

Rules:

- Full-bleed cinematic hero (edge-to-edge media plane); product photography from archive/CDN or tenant uploads.
- No cards in the hero; no floating promo stickers on hero media.
- Open Sans / existing storefront typography tokens; `font-semibold` headings; no em dashes in UI copy.
- CSS-only motion (`group` hover, `motion-safe:` / `motion-reduce:`); no per-card Framer hover; no `blur-2xl`.
- Imagery from electronics archive / appliance product photography only — never automotive, furniture, supermarket aisle, or fitness placeholders.

## Homepage section order (canonical)

Render a section only when it has content (empty → omit). Owner `settings.pageSections` placements (`after-hero` | `mid-page` | `before-footer`) remain the only generic marketing banner system.

| Order | Section | Source | Job |
|------:|---------|--------|-----|
| 0 | Hero carousel | `ElectronicsHero` + `electronics-elevated` | Atmosphere; primary Shop CTA; secondary Installment enquiry |
| 1 | Trust strip | Warranty / genuine / insured delivery / authorized | Vertical-specific trust (not global footer strip) |
| 2 | Shop by category | AC, Refrigerator, LED TV, Washing Machine, Kitchen, Gadgets, Mobile (optional link), etc. | Primary discovery from Imran nav (minus motorcycle) |
| 3 | Brand wall | PK electronics brands + YOLO | Brand browse → `/products?brand=` or search |
| 4 | Featured / bestsellers | `StoreProductRail` | Conversion |
| 5 | Gadgets & wearables | Rail (omit if empty) | Archive YOLO strength |
| 6 | Appliances spotlight | Rail or mosaic (omit if empty) | PEL AC and future appliance SKUs |
| 7 | Installment enquiry band | Contact / WhatsApp / phone from Store Settings | Honest lead capture |
| 8 | About / visit | Owner About + resolveStoreContact | Karachi delivery story when configured |

### Duplicate-job rules

| Do not add | Reason |
|------------|--------|
| Second category marquee + chip row | One discovery grid only |
| Generic “Fast Delivery / Secure Payment” footer strip | Removed globally |
| Parallel banner stacks inside electronics sections | Use `pageSections` only |
| Cross-vertical curated hero images | Electronics archive / seed / tenant only |
| Fake EMI calculator | Contact CTA only in v1 |

## Domain knowledge upgrades

File: `lib/domainData/retail.js` → `electronics-goods`.

1. **Categories (setupTemplate):** align to Imran sellable tree:  
   `Air Conditioners`, `Refrigerators`, `LED TVs`, `Washing Machines`, `Deep Freezers`, `Kitchen Appliances`, `Water Dispensers`, `Cooling & Fans`, `Gadgets & Wearables`, `Small Appliances`.  
   (Omit `Motorcycles`. Mobile phones stay optional category label only if seeded later — not a required v1 rail.)
2. **fieldConfig:** keep `model`, `warranty`, `specifications`, `imeimac`; add optional:  
   - `brand` (text / datalist)  
   - `capacity` (text — liters / kg / tons as free text for v1)  
   - `screensize` (text — e.g. `43"`)  
   - `energylabel` (select optional)  
   Use `normalizeKey` so hub grids/Excel map cleanly.
3. **Intelligence:** keep medium seasonality; peak months wedding/festival (Oct–Nov) + summer AC peak (Apr–Jun) — update `peakMonths` to include summer AC demand.
4. **Brands:** add `YOLO`, `Samsung`, `LG`, `Sony`, `Panasonic` (and similar) to `pakistaniBrands.electronics` / market packs without removing Orient/Haier/Dawlance/PEL/Gree.
5. **Suggested products:** point at rich seed subset so hub setup stays credible.
6. **Serial tracking:** remains enabled (high-value appliances + wearables).

## Catalog pipeline

Mirror tyre / furniture / fitness:

| Artifact | Role |
|----------|------|
| `archive/electronics.html` | Source HTML (Gadgets page v1) |
| `scripts/build-electronics-seed-catalog.mjs` | Parse products, prices, images, categories → extract JSON + catalog module |
| `lib/dataLab/electronicsArchiveExtract.json` | Raw extract |
| `lib/dataLab/electronicsDemoCatalog.js` | Seed products with `sku`, `name`, `price`, `category`, `image_url`, `domain_data`, `brand` |
| Demo bootstrap / ensure | Upsert into `demo-electronics` with UUID rows + stock locations |

Rules:

- Orderable UI uses DB UUID products only; seed images enrich when URL missing.
- Prices stay PKR numeric as on archive (e.g. 1399, 143500).
- Decode HTML entities in names (`&amp;` → `&`).
- When additional archive files land (`archive/electronics-ac.html`, etc.), same builder appends SKUs — no second pipeline.

Optional (phase 1b): add `electronics-goods` to a rich-catalog registration set (demo-aligned) so new PK electronics tenants get day-one SKUs — only if it does not bloat every registration; prefer demo refresh path first.

## Storefront modules

| Unit | Responsibility |
|------|----------------|
| `lib/storefront/electronicsStorefront.js` | `isElectronicsElevatedStore`, config getters, hero slides, category tiles, brand wall, showcase resolve, installment CTA copy, registration/demo defaults |
| `components/storefront/sections/electronics/*` | `ElectronicsHero`, `ElectronicsHomeSections`, rails/tiles |
| `LazyVerticalHomeSections` | `case 'electronics':` |
| `heroPresets.js` / `heroSlides.js` / `IMMERSIVE_FINDER_HERO_TYPES` | Register `electronics-elevated` |
| `elevatedStorefrontTenant.js` | Shared slide/tenant helpers (reuse, no fork) |
| Demo profile | Karachi city/address; announcement: warranty + installment enquiry + delivery (honest) |
| Marketing | Remove `demo-electronics` from `HERO_EXCLUDED_DEMO_DOMAINS` only after elevated + catalog verify passes; keep gallery hero domain-aware (own imagery) |

Owner config: `settings.storefront.electronics.*` (section toggles, hero overrides, installment CTA label/href). Generic `heroSlides` still resolve via elevated carousel rules.

## Contact & installment

- Phone / WhatsApp / email from `resolveStoreContact` / Store Settings only.
- Installment band CTA → `/contact` with a allowed contact subject (extend `STOREFRONT_CONTACT_SUBJECTS` if needed, e.g. `installment_enquiry`) or prefilled notes — no parallel lead system.
- Demo default phone may mirror Imran reference `03111146720` only if treated as demo placeholder and editable in Store Settings (do not hardcode in chrome components).

## Seeding under owner email

```text
npx tsx scripts/data-lab/ensure-demo-storefronts.mjs \
  --only demo-electronics \
  --refresh-catalog \
  --owner <owner@email>
```

Requires:

- `demo-electronics` in `DEMO_SHOWCASE_PACK` with `fullSeed: true` after catalog module exists.
- Catalog refresh path wired like furniture/tyre/fitness (`resolveDemoCatalogMinProducts` / rich catalog hooks as peers use).

## Verification

| Script | Checks |
|--------|--------|
| `bun run verify:electronics-storefront` | Alias → `electronics-goods`; elevated gate; seed ≥17 SKUs with image/price/category; deals/visit defaults; hero type; no cross-vertical elevation |
| `bun run verify:domains` | Knowledge / fieldConfig still valid |
| `bun run verify:regional-market` | Brand pack includes YOLO + appliance brands |

## Implementation sequence

1. Domain knowledge + brands + demo profile geo copy.
2. Archive extract + `electronicsDemoCatalog.js` + build script.
3. `electronicsStorefront.js` + hero/sections + LazyVertical wiring + hero preset.
4. Demo seed hooks + `fullSeed: true` + ensure-demo refresh path.
5. Verify scripts; remove hero exclusion; smoke `/store/demo-electronics`.

## Success criteria

- `/store/demo-electronics` shows elevated chrome, inventory-backed SKUs with real product images, category discovery, and installment contact CTA.
- Hub inventory for that tenant shows the same products with warranty/serial-capable `domain_data`.
- Marketing gallery can feature `demo-electronics` without Unsplash-only fallback once exclusion is lifted.
- No motorcycle SKUs; no fake EMI calculator; no cross-vertical image bleed.

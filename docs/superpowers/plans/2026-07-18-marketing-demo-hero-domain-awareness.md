# Marketing Demo Hero Domain Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every marketing demo hero domain-accurate by resolving images from the same storefront assets each `/store/demo-*` uses, eliminate duplicate/cross-vertical leaks, and diversify homepage section assignments.

**Architecture:** Export canonical marketing hero image constants from elevated storefront modules; resolve heroes in `demoStoreGalleryMeta.js` via storefront → profile → chrome overrides; reassign `homeVisualThemes` / commerce pillars; guard with `bun run verify:marketing-demo-heroes`.

**Tech Stack:** Next.js marketing pages, existing storefront asset modules, Bun verify scripts

## Global Constraints

- No layout redesign; image URLs and domain assignments only (plus honest demo labels).
- Dealership heroes must never equal auto-parts archive slides.
- Featured demos must each have a unique `heroImage` URL.
- Fashion Unsplash fallback only for fashion/textile demos.
- No em dashes in user-facing copy.
- Do not commit unless the user asks (plan commits are optional during execution).

## File map

| File | Responsibility |
|------|----------------|
| `lib/storefront/pharmacyStorefront.js` | Export `PHARMACY_MARKETING_HERO_IMAGE` |
| `lib/storefront/furnitureStorefront.js` | Export `FURNITURE_MARKETING_HERO_IMAGE` |
| `lib/storefront/restaurantStorefront.js` | Export `RESTAURANT_MARKETING_HERO_IMAGE` |
| `lib/marketing/demoStoreGalleryMeta.js` | Canonical hero map + chrome overrides |
| `lib/marketing/homeVisualThemes.js` | Toolkit / industry domain reassignment |
| `components/marketing/sections/CommerceAndIntelligenceSection.jsx` | Orders pillar → autoparts |
| `components/marketing/sections/DemoStoreGallery.jsx` | Neutral image-error fallback |
| `lib/marketing/domainPackageVerticalMeta.js` | Dealership preset uses vehicles asset |
| `scripts/verify-marketing-demo-heroes.mjs` | Duplicate + collision asserts |
| `package.json` | `verify:marketing-demo-heroes` script |

---

### Task 1: Export marketing hero constants from elevated storefronts

**Files:**
- Modify: `lib/storefront/pharmacyStorefront.js`
- Modify: `lib/storefront/furnitureStorefront.js`
- Modify: `lib/storefront/restaurantStorefront.js`

**Produces:**
- `export const PHARMACY_MARKETING_HERO_IMAGE`
- `export const FURNITURE_MARKETING_HERO_IMAGE`
- `export const RESTAURANT_MARKETING_HERO_IMAGE`

- [ ] **Step 1:** After each private `*_DEMO_HERO_SLIDES` array, export the first slide image:

```js
export const PHARMACY_MARKETING_HERO_IMAGE = PHARMACY_DEMO_HERO_SLIDES[0]?.image || '';
export const FURNITURE_MARKETING_HERO_IMAGE = FURNITURE_DEMO_HERO_SLIDES[0]?.image || '';
export const RESTAURANT_MARKETING_HERO_IMAGE = RESTAURANT_DEMO_HERO_SLIDES[0]?.image || '';
```

- [ ] **Step 2:** Confirm exports resolve via bun:

```bash
bun -e "import { PHARMACY_MARKETING_HERO_IMAGE } from './lib/storefront/pharmacyStorefront.js'; import { FURNITURE_MARKETING_HERO_IMAGE } from './lib/storefront/furnitureStorefront.js'; import { RESTAURANT_MARKETING_HERO_IMAGE } from './lib/storefront/restaurantStorefront.js'; console.log(!!PHARMACY_MARKETING_HERO_IMAGE, !!FURNITURE_MARKETING_HERO_IMAGE, !!RESTAURANT_MARKETING_HERO_IMAGE)"
```

Expected: `true true true`

---

### Task 2: Canonical hero map in `demoStoreGalleryMeta.js`

**Files:**
- Modify: `lib/marketing/demoStoreGalleryMeta.js`

**Consumes:** Task 1 exports; `TENVO_VEHICLES_ASSETS`, `MARINE_HERO_POSTER`, `SUPERMARKET_DEFAULT_HERO_SLIDES`, `AUTO_PARTS_DEFAULT_SLIDES`, `FITNESS_ASSETS`

- [ ] **Step 1:** Import dealership + marine + new marketing hero constants. Remove `AUTOPARTS_SHOWROOM_HERO` usage for `demo-showroom`.

- [ ] **Step 2:** Build `CANONICAL_DEMO_HEROES` keyed by demo domain per spec table. Critical entries:

```js
'demo-supermarket': SUPERMARKET_DEFAULT_HERO_SLIDES[0]?.image,
'demo-fmcg': SUPERMARKET_DEFAULT_HERO_SLIDES[1]?.image,
'demo-showroom': TENVO_VEHICLES_ASSETS.hero.vehicles,
'demo-autoparts': AUTO_PARTS_DEFAULT_SLIDES[3]?.image || AUTO_PARTS_DEFAULT_SLIDES[0]?.image,
'demo-pharmacy': PHARMACY_MARKETING_HERO_IMAGE,
'demo-furniture': FURNITURE_MARKETING_HERO_IMAGE,
'demo-restaurant': RESTAURANT_MARKETING_HERO_IMAGE,
'demo-marine': MARINE_HERO_POSTER,
'demo-fitness': FITNESS_ASSETS.heroAthlete,
```

Keep fashion/jewellery/bakery/dental/retail/hardware/electronics/mobile/salon as distinct domain-family URLs (existing correct Unsplash where unique).

- [ ] **Step 3:** Resolve `heroImage` as `override.heroImage || CANONICAL_DEMO_HEROES[domain] || profile.cover_image_url || domainFamilyFallback(seedKey)` — fashion fallback only for fashion keys.

- [ ] **Step 4:** Slim `GALLERY_OVERRIDES` so most rows omit `heroImage` (chrome only) except fitness object-fit needs if still required via override chrome fields.

- [ ] **Step 5:** Run:

```bash
bun -e "import { getFeaturedDemoGalleryItems, getDemoStoreHeroByDomain } from './lib/marketing/demoStoreGalleryMeta.js'; const items=getFeaturedDemoGalleryItems(); const m=new Map(); for (const s of items){ if(!m.has(s.heroImage)) m.set(s.heroImage,[]); m.get(s.heroImage).push(s.domain);} for (const [u,d] of m) if(d.length>1) console.log('DUP',d); console.log('showroom', getDemoStoreHeroByDomain('demo-showroom').includes('autostore')?'BAD':'OK'); console.log('unique', m.size===items.length);"
```

Expected: no DUP lines; `showroom OK`; `unique true`

---

### Task 3: Homepage section reassignment + commerce pillar

**Files:**
- Modify: `lib/marketing/homeVisualThemes.js`
- Modify: `components/marketing/sections/CommerceAndIntelligenceSection.jsx`

- [ ] **Step 1:** Toolkit tabs → domains: electronics, furniture, textile, marine, pharmacy (update `demo()` calls).

- [ ] **Step 2:** Industry wholesale card → `demo-textile` with `demoLabel: 'Textile demo'`.

- [ ] **Step 3:** Commerce `DEMO.orders` → `'demo-autoparts'`; pillar `demoName` → `'Auto parts demo'`.

---

### Task 4: Gallery fallback + solutions dealership meta

**Files:**
- Modify: `components/marketing/sections/DemoStoreGallery.jsx`
- Modify: `lib/marketing/domainPackageVerticalMeta.js`

- [ ] **Step 1:** On image error, keep backdrop visible and clear image (or set `imgFailed` and render no `<Image>` / empty) — remove shared car Unsplash fallback.

- [ ] **Step 2:** Set `VERTICAL_PRESET_SLIDE_META['vehicle-dealership'].heroImage` to `TENVO_VEHICLES_ASSETS.hero.vehicles` (import from `tenvoVehiclesAssets.js`).

---

### Task 5: Verify script + package.json

**Files:**
- Create: `scripts/verify-marketing-demo-heroes.mjs`
- Modify: `package.json`

- [ ] **Step 1:** Script imports `getFeaturedDemoGalleryItems`, `getDemoStoreHeroByDomain`, `TENVO_VEHICLES_ASSETS`, `AUTO_PARTS_DEFAULT_SLIDES`, `HOME_TOOLKIT_TABS`, `HOME_INDUSTRY_SOLUTIONS`, and asserts:

  - unique hero URLs across featured demos
  - showroom hero === vehicles asset (or starts with same CDN path)
  - showroom hero !== any `AUTO_PARTS_DEFAULT_SLIDES[].image`
  - supermarket !== fmcg hero
  - toolkit domains include textile + marine
  - industry wholesale uses textile
  - source file `domainPackageVerticalMeta.js` does not contain `AUTO_PARTS_DEFAULT_SLIDES[0]` for vehicle-dealership (or runtime meta equals vehicles)

- [ ] **Step 2:** Add `"verify:marketing-demo-heroes": "bun scripts/verify-marketing-demo-heroes.mjs"`

- [ ] **Step 3:** Run `bun run verify:marketing-demo-heroes` — expect exit 0

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Canonical resolver / unique heroes | 2, 5 |
| Showroom ≠ autoparts | 2, 4, 5 |
| Supermarket ≠ FMCG | 2, 5 |
| Homepage section diversity | 3, 5 |
| Solutions dealership | 4, 5 |
| Gallery error fallback | 4 |
| Export storefront constants | 1 |
| Verify script | 5 |

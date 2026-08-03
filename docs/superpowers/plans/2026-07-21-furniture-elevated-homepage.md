# Furniture Elevated Homepage Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Ship a premium, deduplicated furniture public homepage with hero/showroom video, trust strip, and inventory-first room cards per `docs/superpowers/specs/2026-07-21-furniture-elevated-homepage-design.md`.

**Architecture:** Config + resolvers in `furnitureStorefront.js`; UI in `FurnitureHomeSections` / `FurnitureHero` / `HeroCarousel` (furniture video path); Settings fields in `StoreSettingsManager`.

**Tech Stack:** Next.js App Router, React client sections, CSS `motion-safe` / `motion-reduce`, existing `StoreProductRail` / `ProductGrid`.

## Global Constraints

- Canonical vertical: `furniture` only (`furniture-elevated`).
- No em dashes in UI copy; `font-semibold` headings; Woodin walnut/cream tokens.
- Desktop layouts of other verticals unchanged.
- Owner `pageSections` remain the marketing banner system; furniture mosaic max 2.
- Video: mute, loop, autoplay, playsInline; reduced-motion / error → poster image.
- Do not commit unless the user asks.

## File map

| File | Role |
|------|------|
| `lib/storefront/furnitureStorefront.js` | Video normalize, config toggles, disjoint rails, spotlight + mosaic helpers |
| `components/storefront/sections/furniture/FurnitureVideoBackdrop.jsx` | Shared looping video + reduced-motion |
| `components/storefront/sections/heroes/HeroCarousel.jsx` | Furniture slide `videoUrl` backdrop |
| `components/storefront/sections/furniture/FurnitureHero.jsx` | Unchanged structure; receives video-aware slides |
| `components/storefront/sections/furniture/FurnitureHomeSections.jsx` | Canonical section order |
| `components/StoreSettingsManager.jsx` | Toggles + video URL fields |
| `scripts/verify-furniture-storefront.mjs` | Config + normalize + section contract checks |

### Task 1: Config, video, partition helpers

**Files:** Modify `lib/storefront/furnitureStorefront.js`; Create `scripts/verify-furniture-storefront.mjs`

- [x] Add `normalizeFurnitureVideoUrl`, demo hero video constant, config keys (`showTrustStrip`, `showLifestyleSpotlight`, `heroVideoUrl`, `showroomVideoUrl`)
- [x] `getFurnitureHeroSlides` attaches `videoUrl` on slide 0 from config
- [x] `partitionFurnitureHomepageRails` returns disjoint `topPicks` / `deals`
- [x] `resolveFurnitureLifestyleSpotlight` → first editorial or null; `resolveFurniturePromoMosaic` → max 2
- [x] Verify script asserts normalize + config defaults

### Task 2: Video backdrop + HeroCarousel

**Files:** Create `FurnitureVideoBackdrop.jsx`; Modify `HeroCarousel.jsx`

- [x] Backdrop component with reduced-motion + onError poster
- [x] Furniture variant: when `s.videoUrl`, render video under image layer (image as poster fallback when failed/reduced)

### Task 3: Homepage sections rewrite

**Files:** Modify `FurnitureHomeSections.jsx`

- [x] Order: trust → rooms → featured → spotlight → deals → mosaic(2) → curated → showroom(+video) → testimonials → newsletter
- [x] Remove category marquee, dining/sofas/new-arrivals rails, multi-editorial stack
- [x] Polish room cards + lightweight `motion-safe` section enter

### Task 4: Store Settings

**Files:** Modify `StoreSettingsManager.jsx` furniture defaults + card

- [x] Defaults for new toggles/URLs; UI switches and URL inputs

### Task 5: Verify

- [x] `bun run` / `node` verify script passes
- [x] Spot-check imports resolve

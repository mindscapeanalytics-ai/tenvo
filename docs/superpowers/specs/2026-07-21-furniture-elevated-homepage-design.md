# Furniture Elevated Homepage Design

**Date:** 2026-07-21  
**Scope:** Premium, deduplicated public-store homepage for the elevated `furniture` vertical (`furniture-elevated` hero). Demo domain `demo-furniture` and live tenants share the same section architecture; demo-only content stays gated by `isDemoStoreDomain`.

## Problem

1. **Duplicate discovery:** Category icon marquee and “Discover our range” room tiles both answer “shop by room/category.”
2. **Duplicate marketing:** Four promo banners plus three stacked editorial banners repeat collection CTAs.
3. **Overlapping product rails:** Top picks, dining rail, sofas rail, curated tabs, and latest arrivals reuse the same catalog slices (`partitionFurnitureProducts` + hard-coded living/dining filters).
4. **No atmosphere video:** Marine/dealership support owner looping hero video; furniture hero is image-only, so the page feels flatter than peer elevated templates.
5. **Length vs polish:** The scroll is long without a clear brand → browse → shop → trust → visit arc.

## Goals

1. One curated homepage story with **no duplicate jobs** between sections.
2. Premium showroom + ecommerce feel: stronger room cards, tighter spacing, inventory-first imagery.
3. Optional owner looping video on hero (and showroom CTA), following marine’s mute/autoplay/`motion-reduce` pattern.
4. Lightweight CSS-only motion (`group` hover + `motion-safe:` / `motion-reduce:`); no per-card Framer hover state, no `blur-2xl`.
5. Keep Woodin walnut/cream tokens (`WOODIN_*` in `furnitureStorefront.js`); refine presentation, do not invent a new vertical theme.
6. Owner `settings.pageSections` banners remain the only mid-page marketing slot system; furniture sections must not re-implement those placements.

## Non-goals

- Redesigning `/products` shop chrome or PDP.
- Changing other elevated verticals (tiles, jewellery, marine, etc.).
- New CMS, forums, or fake KPI/stats strips.
- Replacing `StoreProductRail` / `ProductGrid` with a parallel card system.
- Hardcoding another vertical’s curated assets when furniture inventory is empty (keep existing inventory → demo-fallback rules).

## Approved approach

**Curated modern store:** brand → browse → shop → trust → visit. Deduplicate sections; add video only where it earns UX; keep inventory-first resolvers.

## Homepage section order (canonical)

Render only when the section has content (empty sections omit entirely).

| Order | Section | Component / source | Job |
|------:|---------|--------------------|-----|
| 0 | Hero + search dock | `FurnitureHero` + `HeroCarousel` | Atmosphere, search, showroom chip |
| 1 | Trust strip | New compact strip from `resolveFurnitureTrustPillars` | Company credibility (4 pillars) |
| 2 | Shop by room | Room tile grid (`resolveFurnitureRoomCollections`) | Primary discovery |
| 3 | Featured picks | `StoreProductRail` from `partitionFurnitureProducts.topPicks` | Best sellers |
| 4 | Lifestyle spotlight | Single editorial split (`resolveFurnitureEditorialBanners` → first item only, or owner `spotlight`) | Brand lifestyle + one CTA |
| 5 | Sale & offers | `StoreProductRail` from `deals` (omit if empty) | Conversion |
| 6 | Collection mosaic | Promo mosaic max **2** (`resolveFurniturePromoBanners` sliced) | Secondary collection CTAs |
| 7 | Room essentials | Curated tabs + `ProductGrid` | Interactive room browse |
| 8 | Showroom CTA | Existing dark CTA; optional ambient `showroomVideoUrl` | Visit / book |
| 9 | Testimonials | Existing (demo or owner-configured) | Social proof |
| 10 | Newsletter | Existing compact form → contact | Capture |

### Removed from homepage (duplicate jobs)

| Removed | Reason |
|---------|--------|
| `FurnitureCategoryIcons` marquee | Same job as room tiles |
| Dining tables rail | Covered by curated tabs + featured |
| Sofas & recliners rail | Covered by curated tabs + featured |
| Latest arrivals rail | Overlaps featured when catalog is small; omit from homepage |
| Extra editorial banners beyond the first | One spotlight only |
| Promo banners beyond two | Mosaic stays scannable |

Owner toggles that remain meaningful: `showRoomTiles`, `showShowroomCta`, `showTestimonials`, `showMarketingBanners` (for `pageSections` only). Add `showTrustStrip` (default on) and `showLifestyleSpotlight` (default on).

## Video behavior

Mirror marine elevated patterns without copying marine assets.

| Surface | Setting key | Behavior |
|---------|-------------|----------|
| Hero slide 0 | `settings.storefront.furniture.heroVideoUrl` | Optional `https` MP4 (or direct video URL). Mute, loop, autoplay, playsInline. Poster = slide 0 image. On `prefers-reduced-motion` or load failure → static image. |
| Showroom CTA | `settings.storefront.furniture.showroomVideoUrl` | Optional ambient background or side media behind/beside CTA copy. Same mute/loop/`motion-reduce` rules. |

- Demo store (`demo-furniture`): may ship a tasteful default hero video URL constant in `furnitureStorefront.js` (furniture lifestyle, not marine). Live tenants: **no** forced default; empty URL = image-only.
- Store Settings → Furniture: text fields for both URLs (same UX as marine `heroVideoUrl`).
- `getFurnitureHeroSlides` / hero preset wiring attaches `videoUrl` on slide index 0 when configured (and demo default when applicable).
- `HeroCarousel` (furniture variant) or `FurnitureHero` renders video backdrop when `slide.videoUrl` is present; do not break image-only slides.

## Visual / card rules

1. **Room tiles:** Keep 6-up inventory-first grid; improve label hierarchy (title + piece count); CSS `group` scale on image only; rounded-2xl; gradient legibility for white type.
2. **Trust strip:** Single row (wrap on mobile), icon-optional text pillars, no card chrome heavy enough to feel like a second banner row.
3. **Lifestyle spotlight:** Alternating image/copy split; one primary CTA; image from the first editorial banner (or owner override). **v1 is image-only** (no spotlight video field). Hero and showroom videos remain the only video surfaces.
4. **Collection mosaic:** Two equal (or 60/40) tiles max; walnut/cream tones preserved.
5. **Typography:** `STORE_SECTION_HEADING`, `font-semibold`, no em dashes in new copy.
6. **Motion budget:** At least two intentional `motion-safe` effects (e.g. subtle section fade-in via CSS, room-tile hover scale). Respect `motion-reduce`.

## Data / config architecture

| Unit | Responsibility |
|------|----------------|
| `lib/storefront/furnitureStorefront.js` | Config getters, resolvers, demo defaults, video URL normalize/helpers, partition rails |
| `FurnitureHero.jsx` | Hero + search dock; pass video-aware slides into carousel |
| `HeroCarousel.jsx` (`variant="furniture"`) | Optional video backdrop for active slide when `videoUrl` set |
| `FurnitureHomeSections.jsx` | Canonical section order only; no removed rails |
| `FurnitureCategoryIcons.jsx` | Stop mounting from homepage (keep file for potential reuse / Settings preview, or leave unused) |
| `StoreSettingsManager.jsx` | Furniture toggles + `heroVideoUrl` / `showroomVideoUrl` fields |
| `app/store/[businessDomain]/page.jsx` | Already isolates furniture elevated path; ensure `after-hero` / `mid-page` / `before-footer` `StoreMarketingSections` still wrap correctly and do not stack duplicate furniture promos |

### Config additions (`getFurnitureConfig`)

```js
{
  // existing keys retained…
  showTrustStrip: raw.showTrustStrip !== false,
  showLifestyleSpotlight: raw.showLifestyleSpotlight !== false,
  heroVideoUrl: normalizeFurnitureVideoUrl(raw.heroVideoUrl) || (isDemo ? FURNITURE_DEMO_HERO_VIDEO_URL : ''),
  showroomVideoUrl: normalizeFurnitureVideoUrl(raw.showroomVideoUrl) || '',
}
```

`normalizeFurnitureVideoUrl`: trim; accept only `http:` / `https:` absolute URLs; reject empty/relative/javascript.

### Product partition (homepage)

`partitionFurnitureProducts` continues to supply `topPicks` and `deals`. Homepage **stops consuming** `newArrivals` for a dedicated rail. Curated tabs keep using `filterFurnitureByCategorySlug`.

Ensure featured and deals rails use **disjoint** product ids when possible (if a product is featured and on sale, prefer featuring it in Featured; Deals rail excludes ids already shown in Featured) to reduce visual duplication.

## Owner marketing banners

- `settings.pageSections` with placements `after-hero` | `mid-page` | `before-footer` remain authoritative.
- Furniture template sections listed above must not add a third parallel “banner stack” beyond the two-tile mosaic + one spotlight.
- Cap mosaic at 2 even if owner `promoBanners` array is longer (Settings can still store more for future use; homepage renders first two).

## Mobile / desktop

- Dual layout rules unchanged: room grid collapses 2 → 3 → 6; rails stay horizontal scroll via existing rail component.
- Hero search dock: desktop overlay card remains; mobile trending chips remain.
- Desktop layouts of non-furniture verticals unchanged.

## Testing / verification

1. Manual: `/store/demo-furniture` — section order matches table; no category marquee; no dining/sofas/new-arrivals rails; max one spotlight; max two mosaic tiles.
2. Live-tenant path with empty testimonials: testimonials section omitted; no demo quotes.
3. Hero with / without `heroVideoUrl`: video plays muted; reduced-motion shows poster.
4. Room tiles still resolve from inventory (6-up when enough categories); no cross-vertical placeholder images.
5. Owner `pageSections` mid-page still renders once after vertical sections as today.
6. If a furniture-specific verify script exists, extend it; otherwise add assertions to an existing storefront verify or a small `scripts/verify-furniture-storefront.mjs` covering section config defaults and video URL normalize.

## Implementation notes (for plan)

Primary files to touch:

- `lib/storefront/furnitureStorefront.js`
- `components/storefront/sections/furniture/FurnitureHomeSections.jsx`
- `components/storefront/sections/furniture/FurnitureHero.jsx`
- `components/storefront/sections/heroes/HeroCarousel.jsx` (furniture video path only)
- `components/StoreSettingsManager.jsx`
- Optional small shared `FurnitureVideoBackdrop` next to furniture sections (extract from marine pattern, furniture-scoped)

Do not change global footer trust strips or reintroduce removed store contact CTA strips.

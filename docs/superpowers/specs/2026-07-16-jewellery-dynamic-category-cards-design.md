# Jewellery / Beauty Dynamic Category Cards Design

**Date:** 2026-07-16  
**Scope:** Make jewellery/beauty public-store hero overlap tiles and “The Jewellery Edit” mosaic cards inventory-linked, with optional Store Settings per-field overrides.

## Problem

1. **Hero tiles** (Gold / Diamonds / Bridal / Gifts under `JewelleryHero`) use hardcoded Unsplash `TILE_IMAGES` and fixed `?category=` slugs via `getJewelleryHeroTiles`. They ignore live categories and product photos.
2. **Jewellery Edit mosaic** already prefers catalog images in `buildJewelleryEditSection`, but still anchors to fixed rule slots (`gold` / `diamonds` / `bridal` / `gifts`) and copy defaults. Owner tile arrays exist in settings but have **no Store Settings UI**.
3. Owners cannot edit individual cards without raw JSON; inventory changes do not reliably refresh hero cards.

## Goals

1. Both surfaces resolve cards from **live tenant categories + products** (DB UUIDs / real images / real slugs).
2. **Per-field overrides** in `settings.storefront.jewellery`: blank owner fields keep updating from inventory; filled fields stick.
3. Store Settings UI to edit the four hero tiles and four mosaic tiles (category pick, optional image upload, label/headline/href).
4. Beauty mode (`salon-spa`) uses polish/kits/press-on/care defaults with the same resolver.
5. Desktop and mobile layouts unchanged; only data sources change.

## Non-goals

- Redesigning hero chrome, mosaic grid, or trust pills.
- Changing global Branding hero carousel slides.
- Mid-page category circles (already catalog-driven via `pickCategoryCircle`).
- Demo seed catalog content changes beyond what resolution needs.

## Precedence (approved)

For each card field (`label` / `desc` / `eyebrow` / `title` / `ctaLabel` / `href` / `image` / `categorySlug`):

1. Non-empty owner override wins.
2. Else inventory-resolved value (matched category or keyword products).
3. Else mode template default (copy + Unsplash fallback).

If an owner `categorySlug` no longer exists, fall back to the next valid live match for that slot’s keywords (do not link to an empty category).

## Architecture

| Unit | Responsibility |
|------|----------------|
| `lib/storefront/jewelleryCategoryCards.js` | Pure resolver: slot defs + catalog + owner partials → normalized cards |
| `getJewelleryHeroTiles` | Calls resolver; accepts `categories` / `products` / `businessCategory` |
| `buildJewelleryEditSection` | Uses same resolver; maps slots `hero` / `banner` / `half-left` / `half-right` |
| `page.jsx` | Passes catalog snapshot into hero tile resolution |
| `JewelleryCardsEditor` (admin) | Store Settings editors for `heroTiles` and `jewelleryEdit.tiles` |
| `JewelleryHero.jsx` | Prefer `tile.image` from resolver; keep Unsplash only as last-resort `imageKey` fallback |

### Normalized card shape

```ts
{
  id: string;
  slot?: 'hero' | 'banner' | 'half-left' | 'half-right'; // mosaic only
  label?: string;      // hero
  desc?: string;       // hero
  eyebrow?: string;    // mosaic
  title?: string;      // mosaic
  ctaLabel?: string;
  href: string;        // absolute store path or http(s)
  image: string;       // product/category/owner/fallback URL
  categorySlug?: string;
  imageKey?: string;
}
```

### Matching rules

Reuse keyword rules already used by category circles (`JEWELLERY_CATEGORY_CIRCLES` / `BEAUTY_CATEGORY_CIRCLES`) plus gifts/featured heuristics. Prefer:

1. Category slug exact match to slot default.
2. Keyword match on category name/slug.
3. Keyword match on product haystack → derive slug from product category.
4. Template default href + fallback image.

Image order: owner upload → category `image_url` → first product in category (`getEffectiveProductImageUrl`) → Unsplash key fallback.

## Store Settings UI

Under Jewellery / Beauty storefront card:

- **Hero category cards** (4): label, desc, category select, optional image (`purpose: banner`), optional custom href.
- **Editorial mosaic tiles** (4 fixed slots): eyebrow, title, ctaLabel, category select, optional image, optional href.
- Hint copy: empty fields auto-update from inventory.

Persist via existing `updateBusinessSettings` → `settings.storefront.jewellery.heroTiles` and `.jewelleryEdit.tiles`.

## Testing

- Unit: resolver with live categories/products; per-field merge; missing category fallback; beauty mode.
- Unit: `getJewelleryHeroTiles` returns inventory images/hrefs when catalog present.
- Unit: `buildJewelleryEditSection` owner partial does not wipe inventory image.
- Smoke: `bun run verify:demo-storefront-sections` still passes jewellery toggles.

## Success criteria

- Demo jewellery/beauty home shows hero + mosaic cards reflecting inventory photos and real category links when catalog exists.
- Clearing an owner image field restores inventory photo on next load.
- Setting only a custom label keeps inventory image and href.
- Empty catalog still renders four cards with template defaults (no blank holes).

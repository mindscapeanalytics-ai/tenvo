# Jewellery Dynamic Category Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link jewellery/beauty hero tiles and Jewellery Edit mosaic cards to live inventory, with optional per-field Store Settings overrides.

**Architecture:** Shared pure resolver in `jewelleryCategoryCards.js`; wire `getJewelleryHeroTiles` and `buildJewelleryEditSection` through it; add Store Settings editors; keep existing layouts.

**Tech Stack:** Next.js App Router, Vitest, existing `getEffectiveProductImageUrl`, Store Settings + `updateBusinessSettings`.

## Global Constraints

- Per-field override: blank owner fields keep inventory values.
- Tenancy: public store uses already-fetched catalog for the business only.
- No Unsplash-only hero tiles when inventory has a matching category/product image.
- Beauty mode uses polish/kits/press-on/care slot defs.
- At most 4 hero tiles and 4 mosaic tiles.
- Avoid em dashes in UI copy.

---

## File map

| File | Role |
|------|------|
| `lib/storefront/jewelleryCategoryCards.js` | **Create** — resolver + merge helpers |
| `lib/storefront/__tests__/jewelleryCategoryCards.test.js` | **Create** — TDD for resolver |
| `lib/storefront/jewelleryStorefront.js` | Update `getJewelleryHeroTiles` signature/body |
| `lib/storefront/jewelleryHomeSections.js` | Use shared resolver in edit section |
| `app/store/[businessDomain]/page.jsx` | Pass catalog into hero tiles |
| `components/storefront/admin/JewelleryCardsEditor.jsx` | **Create** — settings UI |
| `components/StoreSettingsManager.jsx` | Mount editor |
| `lib/storefront/__tests__/jewelleryStorefront.test.js` | Extend coverage |
| `components/storefront/sections/heroes/JewelleryHero.jsx` | Prefer resolved `image` |

---

### Task 1: Resolver (TDD)

- [ ] Write failing tests for inventory match, per-field merge, missing category fallback, beauty mode.
- [ ] Implement `resolveJewelleryCategoryCards` / `mergeJewelleryCardFields`.
- [ ] Export slot default constants used by hero + mosaic.
- [ ] Run `bun test lib/storefront/__tests__/jewelleryCategoryCards.test.js` — green.

### Task 2: Wire public storefront

- [ ] Update `getJewelleryHeroTiles(base, settings, businessCategory, { categories, products })`.
- [ ] Update `buildJewelleryEditSection` to call shared resolver.
- [ ] Pass `catalogSnapshot` categories/products from `page.jsx` into hero tiles.
- [ ] Ensure `JewelleryHero` uses `t.image` first.
- [ ] Extend `jewelleryStorefront.test.js` / home sections tests — green.

### Task 3: Store Settings editor

- [ ] Add `JewelleryCardsEditor` (pattern from `FashionGulSectionsEditor` category link + image upload).
- [ ] Mount under Jewellery/Beauty card in `StoreSettingsManager`.
- [ ] Save `heroTiles` and `jewelleryEdit.tiles` via existing jewellery merge path.

### Task 4: Verify

- [ ] `bun test lib/storefront/__tests__/jewelleryCategoryCards.test.js lib/storefront/__tests__/jewelleryStorefront.test.js`
- [ ] `bun run verify:demo-storefront-sections` (or note if env-gated)

---

## Manual QA

1. Open demo jewellery store: hero 4 cards + Jewellery Edit use inventory photos/links.
2. In Settings, set only a custom hero label → image still from inventory.
3. Upload mosaic image → persists; clear upload → inventory image returns.
4. Beauty store uses beauty defaults / polish categories.

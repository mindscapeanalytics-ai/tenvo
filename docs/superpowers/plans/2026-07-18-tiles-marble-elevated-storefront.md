# Tiles & Marble Elevated Storefront Implementation Plan

**Goal:** Elevate `ceramics-tiles` into a company-site + commerce public store with rich PK/regional domain knowledge, and seed **Tenvo Marbles** (`demo-marbles`) under the platform owner.

**Architecture:** Furniture-style elevated stack (`tilesStorefront.js`, `tiles-elevated` hero, LazyVertical sections). Hub `domain_data` covers ceramic tiles and natural stone. Catalog uses Unsplash imagery with STILE / SK Stones / SMB-inspired taxonomy.

## Locked decisions

- Canonical key: `ceramics-tiles` (aliases: `tiles`, `tiles-marble`, `marble`, `ceramics`, `marble-stone`, `natural-stone`, `tile-shop`)
- Settings nest: `settings.storefront.tiles`
- Demo: `demo-marbles` / Tenvo Marbles / Pakistan / `fullSeed: true`

## Tasks

- [x] Domain knowledge + brands + aliases
- [x] `tilesStorefront.js` + hero/home sections
- [x] Demo catalog + richProductCatalog + registration
- [x] Wire hero presets, page, lazy sections, storeHomeCatalog
- [x] Demo domains + marketing gallery
- [x] Store settings + admin persist + verify

## Done notes

- Live demo: `/store/demo-marbles` (36 products), owner platform email
- `bun run verify:domains` and `verify:regional-market` OK

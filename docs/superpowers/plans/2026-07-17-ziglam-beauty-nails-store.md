# Ziglam Beauty Nails Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed Ziglam (`salon-spa`) with curated nail/beauty products and matching hero/marketing images from archive HTML (optional Taobao-safe public imagery), without breaking storefront dynamics.

**Architecture:** Offline extract from `archive/nails*.html` → curated catalog module → tenant-scoped feed via existing `catalogSeed.mjs` + settings JSON patch for beauty jewellery storefront.

**Tech Stack:** Node/tsx, pg pool, existing `lib/dataLab/catalogSeed.mjs`, `jewelleryStorefront.js` settings shape

## Global Constraints

- Do not change shared salon-spa/jewellery template contracts unless blocking
- No Prisma migrations
- Exclude secrets from docs/commits
- Soft-refresh only the target business_id
- Prefer archive CDN images over live marketplace scrape

---

## File map

| File | Responsibility |
|------|----------------|
| `scripts/build-nails-seed-catalog.mjs` | Parse archives → extract JSON + generate catalog JS |
| `lib/dataLab/nailsArchiveExtract.json` | Raw extracted products + marketing URLs |
| `lib/dataLab/ziglamBeautyCatalog.js` | Curated seed items for Ziglam |
| `scripts/data-lab/feed-ziglam-beauty.mjs` | Resolve tenant, seed catalog, patch hero/settings |

---

### Task 1: Extract catalog from archives

- [x] Write `scripts/build-nails-seed-catalog.mjs` parsing CJ + Shopify product/media patterns
- [x] Emit `nailsArchiveExtract.json` and `ziglamBeautyCatalog.js` (~40–80 items, categories Polish/Press-Ons/Kits/Care/Tools)
- [x] Run builder; confirm image URLs are https and deduped

### Task 2: Tenant feed script

- [x] Write `scripts/data-lab/feed-ziglam-beauty.mjs` (owner email + business name/domain args)
- [x] Ensure `salon-spa` category; seed categories/products with `refresh: true`
- [x] Patch `settings.storefront.jewellery.heroSlides` (+ optional pageSections banners) from extract marketing images
- [x] Run feed against Ziglam; print counts

### Task 3: Verify

- [x] Query active products with images for business
- [x] Confirm settings contain beauty hero slides
- [x] Smoke: no shared template file regressions (catalog/feed only unless bug found)

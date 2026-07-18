# Ziglam Beauty / Nails Store Catalog Design

**Date:** 2026-07-17  
**Status:** Approved

## Goal

Feed the registered Ziglam tenant (owner email known to operator) with a real nail/beauty product catalog and matching hero/marketing imagery so the public storefront and hub inventory work end-to-end on the existing `salon-spa` beauty elevated template.

## Non-goals

- New storefront templates or domain forks
- Schema/migrations
- Live fragile scrapers against authenticated marketplaces as a hard dependency
- Changing checkout, tenancy, or shared salon-spa component contracts

## Sources

1. `archive/nails1.html` — CJ Dropshipping nail art kits listing (product cards + images)
2. `archive/nails-2.html` — The Best Nails USA Shopify homepage (products + lifestyle/hero)
3. `archive/nails.html` — Olive & June Shopify homepage (products + marketing media)
4. Optional enrichment: public product imagery inspired by [Taobao](https://taobao.com/) beauty/nails category aesthetics — only via stable public CDN URLs already present in archives or curated Unsplash beauty fallbacks already used by `jewelleryCategoryCards`; do not depend on live Taobao HTML scrape success

## Approach

1. Offline extract → `lib/dataLab/nailsArchiveExtract.json` + curated `lib/dataLab/ziglamBeautyCatalog.js`
2. One-shot feed script: resolve business by owner email + name/domain hint; ensure `category = salon-spa`; `seedCategories` + `seedProducts({ refresh: true })`; patch `businesses.settings.storefront.jewellery` hero slides and optional `pageSections` banners from extracted marketing images
3. Categories mapped to beauty hero slots: Polish, Press-Ons, Kits, Care, Tools
4. Soft-refresh catalog (deactivate prior products) then upsert seed SKUs with images
5. Leave jewellery/beauty section toggles on so hero tiles and Beauty Edit resolve from live inventory

## Safety

- All writes `business_id` scoped
- No shared component changes unless a blocking bug is found
- Prefer archive CDN URLs (Shopify/CJ) that already load in browsers
- Verify storefront product count, image_url coverage, and hero settings after feed

## Success criteria

- Ziglam active products ≥ 40 with non-empty `image_url`
- Category is `salon-spa` (beauty mode)
- Hero slides use nail/beauty marketing images from archives
- Hub inventory and public storefront still load; add-to-cart path unchanged

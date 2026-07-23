# Electronics elevated store v2 — Telemart feed + supermarket-style shop

**Status:** Approved to implement (user: proceed with best practices)  
**Date:** 2026-07-22  
**Canonical:** `electronics-goods` · Demo: `demo-electronics`

## Scope (locked)

- **Catalog:** Home appliances + gadgets/wearables only (AC, fridge, TV, washer, kitchen, cooling, speakers/watches). No fashion. Smartphones/tablets out of scope for this vertical.
- **Sources:** Telemart appliance/gadget category pages (live archive dump into `archive/`) + existing `archive/electronics.html` (Imran gadgets; live Imran remains 403). Images must be allowlisted or remapped to Unsplash when hotlink-blocked.
- **Installment:** Contact lead only (`subject=installment`) — no EMI calculator.

## Product experience

### Homepage (supermarket-like feed)

- Keep elevated hero `electronics-elevated` + search/installment dock.
- Add **department sidebar** (desktop) + mobile drawer mirroring supermarket aisle chrome — departments map to category query slugs.
- Sections: trust strip, category tiles, brand wall, top picks, deals, gadgets, appliances, installment CTA, visit CTA (already present; polish copy/spacing).
- Optional **promo strip** / quick department chips under hero (supermarket aisle icons pattern).

### `/products` shop chrome

- Dedicated **`ElectronicsShopLayout`** (pharmacy/tyre precedent): sticky category strip + sidebar `ProductFilters`.
- Enable **brand filter** for electronics (same query param as fashion; SQL already supports `brand`).
- Keep shared: category, price, in-stock, on-sale.
- Enrich list with seed images; show capacity/warranty chips on cards (already wired).

### Catalog pipeline

- `scripts/build-electronics-seed-catalog.mjs` merges: Imran archive parse + Telemart extract JSON + curated supplements.
- Prefer Telemart CDN hosts in `allowedImageHosts.json` when images resolve; else Unsplash category demos (never ship hotlink-403 Magento URLs as live `image_url`).
- Target **40–80** SKUs for demo richness without drowning registration.

## Out of scope

- Live scrape automation in production runtime.
- Full Magento/Telemart checkout clone.
- Motorcycles / fashion / phones mega-catalog.

## Verify

- `bun run verify:electronics-storefront`
- `bun run verify:storefront-image-hosts`
- Demo refresh: `npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-electronics --refresh-catalog`

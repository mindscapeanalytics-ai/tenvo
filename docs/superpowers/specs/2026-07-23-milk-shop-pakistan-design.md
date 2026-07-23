# Milk shop (Pakistan) — country-aware retail vertical

**Status:** Approved to implement (catalog locked from archive + PK shop research)  
**Date:** 2026-07-23  
**Canonical:** `milk-shop`  
**Demo:** `demo-milk` · **Tenvo Milk Demo**  
**Approach:** New isolated vertical; leave `dairy-farm` / supermarket / grocery / fmcg unchanged  
**Archive reference:** `archive/milk-shop.html` = Bismillah Milk Shop (Karachi / foodpanda)

## Problem

Neighborhood milk shops in Pakistan sell fresh milk primarily **by kg** (not litres), plus dahi, malai/makkhan, and some packaged dairy. Today:

- `dairy-farm` is **livestock** knowledge (Animal ID, Breed, Lactation) remapped to supermarket chrome with grocery seed SKUs.
- There is **no** dedicated milk-shop vertical, aliases, or kg-first retail seed.
- SuperStorePOS already supports weight lines (`unit === 'kg'|'g'` via `usePosProductAdd`), but public storefront order paths still tend to treat qty as integer-first in serial/floor helpers — milk-shop weight lines need decimal qty end-to-end **without** changing non-weight verticals.

## Goals

1. Day-one ready milk shop: hub knowledge, PK brands, seed catalog, POS, public store.
2. Accurate units: **kg first** for fresh milk; pack/pcs for packaged dairy.
3. Easy daily retail: SuperStorePOS + supermarket elevated public chrome with milk-specific copy/categories.
4. Zero blast radius: do not reshape `dairy-farm` or alter supermarket grocery catalogs for other tenants.

## Non-goals

- Custom Jewellery/Fitness-scale elevated template fork.
- Animal / lactation / farm yield tracking (stays on `dairy-farm`).
- Forcing decimal qty on all storefronts (only weight-unit / milk-shop weight SKUs).
- New domain commercial package (unless requested later).

---

## Section 1 — Isolation & keys (approved)

| Item | Decision |
|------|----------|
| Canonical key | `milk-shop` |
| Aliases | `milk`, `milkshop`, `doodh-shop`, `dairy-shop` → `milk-shop` |
| Leave alone | `dairy-farm`, `supermarket`, `grocery`, `fmcg`, `livestock-cattle`, `poultry-farm` |
| Storefront vertical map | `milk-shop` → `supermarket` (reuse elevated shell) |
| POS | Add `milk-shop` to SuperStorePOS set (`SUPERSTORE_CATEGORIES`) |
| Brand map | `milk-shop` → dedicated `dairy` brand pack (PK-first), not generic grocery dump |

---

## Section 2 — Hub knowledge & inventory

### Domain knowledge (`lib/domainData/retail.js` or sibling)

Add `milk-shop` row modeled after bakery/grocery retail (not specialized farm):

- **Units (order):** `kg`, `litre`, `pack`, `pcs` (kg first for PK fresh milk).
- **Fields:** Fat %, Source (Farm / Collector / Brand), Batch, Expiry / Best-before, Chill temp note — keep fieldConfig small and required only where daily ops need it (batch + expiry for packaged; fat % optional for fresh).
- **Flags:** FEFO, expiry tracking, batch enabled, multi-location optional, manufacturing off.
- **Intelligence:** perishability `critical`, shelfLife ~1–2 (fresh), peak winter months, leadTime 1, steady demand.
- **Setup categories:** Fresh Milk, Yogurt / Dahi, Cream & Butter, Ghee, Cheese & Khoya, Lassi & Drinks, Dairy Sweets, Packaged Dairy, Eggs, Bakery Staples.
- **Suggested products (shell):** Fresh Cow/Buffalo Milk (kg), Homemade Dahi (kg), Makkhan, Malai, Paneer, Lassi, Olper’s 1L.
- **Canonical seed catalog:** see Appendix A (archive Bismillah + Pure Nest / Punjab Milk Shop / Pure Quality / Anhaar / PurePio).
- **`pakistaniFeatures`:** JazzCash/Easypaisa/COD, FBR/NTN, en+ur, popular dairy brands list.
- **Payments:** Cash, JazzCash, Easypaisa, Card, COD, weekly credit (common for regulars).

### Country-aware brands

- Add `dairy` key to `lib/domainData/pakistaniBrands.js` (and wire `DOMAIN_BRAND_CATEGORY['milk-shop'] = 'dairy'`).
- PK list (illustrative, finalize in impl): Nurpur, Olper’s, Nestlé Pakistan / Everyday, Haleeb, Prema, Milkland, Engro Foods, Tarang, Dayfresh, Anhaar, Gourmet Dairy (local-open).
- Other markets: fall back to `food` / empty gracefully via existing `getBrandsForMarket`.

### Inventory / Easy mode

- Route through existing inventory domain features (`resolveInventoryDomainFeatures`) — no new grid forks.
- Default new row unit **`kg`** for milk-shop via domain units[0] / row defaults.
- Easy dashboard ops mode: treat as perishable retail (restock + expiry), reuse supermarket-family guidance where possible without remapping `dairy-farm`.

### Registration

- Add `milk-shop` to registration domain pickers / `domains.js` lists where retail food verticals appear.
- **Rich seed:** add to `REGISTRATION_RICH_CATALOG_VERTICALS` (or a small milk-only rich set) with **dedicated** catalog — **do not** put `milk-shop` in `SUPERMARKET_REGISTRATION_VERTICALS` (avoids Naheed grocery dump).
- Seed file: `lib/dataLab/milkShopDemoCatalog.js` (~15–30 SKUs): majority fresh by kg + dahi/cream + a few UHT packs; PKR-ish default prices; dairy Unsplash/allowlisted images only.
- Demo profile: `demo-milk` in data-lab domains + `getDemoStorefrontProfile` copy (milk shop, not farm).
- Storefront defaults via existing `registrationStorefrontDefaults` / demo profile path — milk-specific hero title/subtitle when category is milk-shop.

---

## Section 3 — Public store, POS, decimal qty, verify

### Public storefront

- Map `milk-shop` → supermarket vertical in `storefrontDomains.js` (explicit map + inference keyword `milk-shop|doodh`).
- **Milk-specific overlays** (gated by `resolveDomainKey(category) === 'milk-shop'`, not all supermarket tenants):
  - Quick search: Milk, Dahi, Buffalo milk, Olper’s, Cream.
  - Category strip / sidebar departments: Fresh Milk, Yogurt, Cream & Butter, Packaged, Paneer.
  - Hero / section titles: fresh daily milk, order by kg, same-day chill delivery tone (no em dashes).
  - Homepage rails prefer milk categories from live inventory; DB UUID rows only in orderable UI (same supermarket seed-enrich pattern — enrich images, never fake `catalog_preview` checkout).
- Keep supermarket components; prefer config branches in `supermarketStorefront.js` / `supermarketCatalogDefaults.js` or thin `lib/storefront/milkShopStorefront.js` helpers — **no** parallel homepage tree.
- Contact / brand / Store Settings: unchanged shared resolvers.

### Decimal / kg commerce (critical for accuracy)

| Surface | Behavior |
|---------|----------|
| POS | Already: `isWeightItem` when `unit` is `kg` or `g` (`usePosProductAdd` + SuperStorePOS steppers 0.1). Ensure seed + hub default unit `kg` on fresh milk SKUs. |
| Storefront cart / PDP | For products whose unit is weight (`kg`, `g`, `litre` optional): allow fractional qty (step 0.1, min 0.1); show unit label next to qty. Pack/pcs stay integer. |
| Checkout / stock decrement | Weight lines must pass decimal qty through order create → `decrementStorefrontOrderLineStock` / InventoryService **without** `Math.floor` collapsing 1.5 → 1. Scope floor only to serial allocation counts. Non-weight verticals unchanged. |
| Display | Prices as per-kg / per-pack; use `tabular-nums`; copy “per kg” when unit is kg. |

Gate fractional UI/API with a shared helper, e.g. `isStorefrontWeightUnit(unit)` / `allowsFractionalStorefrontQty(product)`, used by cart, validate, and order policies — not a global “all qty are floats” switch.

### POS wiring

- Add `milk-shop` to `SUPERSTORE_CATEGORIES` in `posDomains.js`.
- Category icons: reuse dairy/milk icon mapping already present for milk keywords.

### Translations / marketing

- Add `milk-shop` label EN + Urdu in `lib/translations.js` where other verticals are listed.
- Optional later: solutions page — out of scope unless requested.

### Verification

- `scripts/verify-milk-shop-storefront.mjs` (or extend domains verify):
  - alias resolve → `milk-shop`
  - storefront vertical === supermarket
  - domain knowledge units[0] === `kg`
  - seed catalog has kg fresh milk SKUs and no livestock animal fields
  - `dairy-farm` still resolves to farm knowledge (Animal ID present) and is **not** aliased to milk-shop
- Run existing: `bun run verify:domains`, `bun run verify:regional-market`, `bun run verify:registration-flow`, `bun run verify:pos-hotkeys` (if POS set touched).
- Demo refresh (when demo added): `npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-milk --refresh-catalog`

### Error handling

- Unknown alias → existing resolve fallback; never map milk aliases to `dairy-farm`.
- Missing dairy brand pack → empty array / food fallback, no throw.
- Fractional qty rejected for pcs/pack products with clear validation message.

### Testing focus

- Register PK milk-shop → seed SKUs visible on store + hub.
- Add 1.5 kg fresh milk on POS and storefront → stock decreases by 1.5.
- Existing `demo-supermarket` / `dairy-farm` tenants unchanged after wiring.

---

## File touch list (implementation guide)

| Area | Files (expected) |
|------|------------------|
| Knowledge | `lib/domainData/retail.js`, `lib/config/domains.js`, `lib/translations.js` |
| Aliases | `lib/config/domainKeyAliases.js` |
| Brands | `lib/domainData/pakistaniBrands.js`, `lib/regionalMarket/domainBrandMap.js` |
| Storefront map | `lib/config/storefrontDomains.js`, `lib/storefront/milkShopStorefront.js` (thin), supermarket defaults/helpers |
| Seed / demo | `lib/dataLab/milkShopDemoCatalog.js`, `richProductCatalog.js`, `registrationRichVerticals.js`, `demoStoreProfiles.js`, `domains.mjs` |
| POS | `lib/config/posDomains.js` |
| Fractional qty | shared helper + cart/PDP + order validate/decrement paths (surgical) |
| Verify | `scripts/verify-milk-shop-storefront.mjs`, `package.json` script |

## Success criteria

1. New registration as Milk Shop (PK) yields kg-first inventory + milk-relevant public store.
2. Customer can order fresh milk by kg (including 0.5 / 1.5) and stock matches.
3. `dairy-farm` and supermarket demos behave exactly as before.
4. Verify scripts green for domains, regional market, milk-shop, registration flow.
5. `demo-milk` / Tenvo Milk Demo seeds Appendix A categories with orderable UUID inventory.

---

## Appendix A — PK milk shop assortment (locked)

Sources: `archive/milk-shop.html` (Bismillah Milk Shop Karachi), Pure Nest, Punjab Milk Shop (ISB), Pure Quality Milk (RWP/ISB), Anhaar, PurePio / Fine Milk Shop (foodpanda).

| Category | Items (demo seed must cover) | Typical unit |
|----------|------------------------------|--------------|
| Fresh Milk | Cow milk, Buffalo milk, Goat milk (optional), Fresh Milk 1L | **kg** (loose), litre |
| Yogurt / Dahi | Homemade dahi (kg), Fresh yogurt 250g / 500g / 1kg | kg, pack |
| Cream & Butter | Fresh makkhan, Fresh malai, Nurpur Butter 100g, UHT cream 200ml | kg, pack |
| Ghee | Desi ghee | kg |
| Cheese & Khoya | Fresh paneer, Fresh khoya | kg |
| Lassi & Drinks | Sweet / pheeki / malai / mango / chocolate lassi; rose milk; badami doodh; doodh soda / Pakola | pcs / glass / bottle |
| Dairy Sweets | Kheer, Rabri doodh, Doodh jalebi (shop specialty) | pack / pcs |
| Packaged Dairy | Olper’s / Nurpur / Dayfresh / Prema UHT; flavoured milk; Everyday milk powder | pack / litre |
| Eggs | Farm eggs (dozen) — common companion SKU | dozen / pack |
| Bakery Staples | Dawn / Brady’s milky bread (Bismillah sells these) | pcs |

**Pricing anchors (PKR, indicative for seed):** cow ~220/kg or L, buffalo ~240, dahi ~260/kg, paneer ~2500/kg, desi ghee ~4000/kg; Bismillah archive: Fresh Milk 1L 278, Yogurt 1kg 408, Pheeki Lassi 169, Nurpur Butter 100g 574, Kheer 250g 219.

**Out of seed scope:** Full mithai mega-catalog (barfi/gulab jamun as optional 1–2 SKUs max), murabba, honey (Pure Quality extras — skip unless space).

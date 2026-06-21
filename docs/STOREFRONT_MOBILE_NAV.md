# Storefront mobile navigation

How mobile storefront tabs are wired so sidebar, header, module rail, and page chrome stay in sync without duplication.

See also: **`docs/DOMAIN_VERTICALS.md`** (domain gating), **`docs/MARKET_READINESS.md`** (launch QA).

## Layers (mobile only, `lg+` uses desktop sidebar)

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| App header | `components/layout/Header.jsx` | Tab title (`MOBILE_TAB_LABELS`), date (advanced), search, quick add |
| Module rail | `StorefrontMobileHub` | Jump between storefront tabs (Orders, POS, Refunds, …) |
| Page body | Tab manager (`OrdersManager`, etc.) | Stats strip, filters, data — **no second page title** when embedded |
| Bottom nav | `HubMobileBottomNav` | Home / Stock / Sales / Finance / More (hub-wide, not storefront-only) |

## Single source of truth for module list

- **Config:** `lib/config/storefrontMobileNav.js` → `STOREFRONT_MOBILE_ITEMS`
- **Gating:** `resolveStorefrontItemState` + `useStorefrontMobileNav` (mirrors `Sidebar.jsx` STOREFRONT rules: `posRelevant`, `quotations`, RBAC, plan)
- **Sidebar:** `ADVANCED_NAV_SECTIONS` / `EASY_NAV_SECTIONS` STOREFRONT block — keep keys aligned with config when adding tabs

## Wiring a new storefront tab

1. Add sidebar item in `components/layout/Sidebar.jsx` (STOREFRONT or SELL section).
2. Add row to `STOREFRONT_MOBILE_ITEMS` with the same `key`.
3. Add `TabsContent` in `DashboardTabs.jsx` and wrap with:

```jsx
<StorefrontTabShell activeTab="your-tab-key">
  <YourManager />
</StorefrontTabShell>
```

4. In the manager, use `useStorefrontEmbedded()`:
   - **Embedded (`true`):** skip `MobileTabHeader`; use `MobileStatStrip` + compact filters only.
   - **Not embedded:** keep full `MobileTabHeader` (if the manager is ever used outside the shell).

5. Add label to `lib/utils/mobileLayout.js` → `MOBILE_TAB_LABELS` for the app header.

## Anti-patterns (avoid)

- **Duplicate titles** — App header already shows "Orders"; do not repeat "Store Orders" + large Refresh in the page.
- **Tile rail + tile hub** — Module rail uses **pills**, not `MobileHubTile` (inventory/dashboard keep tiles; storefront uses horizontal chips).
- **Stacked filter cards** — On mobile, search + status + date in 2 compact rows, not a padded `Card` each.
- **Second date picker** — Advanced mode date lives in the app header; tab-level date filters are for list scoping only (e.g. orders "Last 7 days").

## POS / full-screen tabs

POS terminals stay full-width below the rail. The rail remains for module switching; do not add another hub inside POS components.

## External link

`view-storefront` opens `/store/{handle}` in a new tab; it is not a `TabsContent` route.

## Related files

- `components/storefront/mobile/StorefrontTabShell.jsx`
- `lib/context/StorefrontMobileContext.jsx`
- `lib/hooks/useStorefrontMobileNav.js`

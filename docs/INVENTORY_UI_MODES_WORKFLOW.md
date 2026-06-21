# Inventory UI modes: how they work (Tenvo vs Busy.in / Zoho-style)

## Modes in this codebase

| Mode | UI | Primary interaction | Persistence path (dashboard) |
|------|-----|---------------------|------------------------------|
| **Visual** | `DataTable` + cards/metrics | Row actions, bulk delete, export, open **ProductForm** | Form save → `handleSaveProduct` → **`productAPI.upsertIntegrated`** (atomic batches/serials/stock) |
| **Busy** | `BusyGrid` (fixed height ~600px, keyboard nav) | Inline cell edit, Enter/blur commit | **`onUpdate`** → same **`upsertIntegrated`** path; optimistic row + `skipFullWorkspaceRefresh` |
| **Excel** | `ExcelModeModal` wrapping `BusyGrid` | Full-screen grid, bulk paste, multi-row save | When **`onUpdate`** is wired (business dashboard): same **composite upsert** as Busy; else `create`/`update` server actions with **lean** payloads |

Shortcuts: **Alt+V** / **Alt+B** toggle Visual/Busy inside `InventoryManager`. Command palette / quick action **“Excel Fast Entry”** switches to the inventory tab and dispatches **`inventory-open-excel-mode`** so the Excel modal can open automatically.

## Busy.in–style behavior we mirror

- Dense grid, keyboard-first navigation, formula-bar feel when **global Busy toggle** is on (`BusyModeContext`).
- Inline numeric fields coerced consistently with **`productFieldMapper`** / grid handlers.
- **FEFO / batch / serial** domains: composite save avoids writing headline `products.stock` when batch/serial tracking is active (see `inventory_composite.js` + `AGENTS.md`).

## Zoho-style suite behavior we align with

- Single **tenant scope** (`business_id` on all rows).
- **Excel / bulk** operations throttled with **`runWithConcurrency`** (default 5) to avoid `Failed to fetch` from parallel server actions.
- **Export** uses server **`bulkExportProductsAction`** when possible, with client fallback.

## Big-data notes (current + next steps)

- **Today:** Parent workspace loads the full product list used by the inventory tab; `ProductService.getProducts` already supports **`limit` + `offset`** when passed — UI does not yet drive cursor/infinite scroll.
- **Recommended:** Add “Load more” or virtualized grid + `getProductsAction(businessId, { limit, offset, search })` wired to the same filters as `AdvancedSearch`, and cap Excel modal to a **window** of rows or server-side import for 10k+ SKUs.

## Recent wiring fixes (this pass)

1. **Excel bulk save** uses **`onUpdate` → `upsertIntegrated`** when available (same as Busy), merges **batches/serials** from the canonical `products` row, and **`leanProductPayloadForUpdate`** on the direct-`updateProductAction` fallback.
2. **Dashboard `onUpdate`** no longer forces `isUpdate: true` / `productId` into the payload — creates from Excel/Busy rely on **`handleSaveProduct`**’s `isEditing` detection from `product.id`.
3. **Quick action / command palette “Excel”** opens the modal via **`inventory-open-excel-mode`**, not only a toast.

See also: `docs/INVENTORY_AUDIT_2026.md`, `lib/utils/productMutationPayload.js`, `lib/utils/productFieldMapper.js`.

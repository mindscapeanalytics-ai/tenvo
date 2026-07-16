# POS Power Till Design

**Date:** 2026-07-16  
**Scope:** Shared F1–F9 dock, multi-component GST/PST tax on POS, hold/park on retail PosTerminal (parity with SuperStore).

## Goals

1. Mouseless cashier control via a visible bottom dock + real F1–F9 handlers shared by PosTerminal and SuperStorePOS.
2. Honest GST/PST breakout from `tax_configurations` (+ regional pack fallback), with cart modes: standard / GST-only / exempt.
3. Hold/resume parked sales on PosTerminal (localStorage, same pattern as SuperStore).

## Non-goals (later)

Cash drawer kick, pole display, loyalty redeem, FBR live transmit, restaurant modifiers/tips, hardware scale protocols.

## Architecture

| Unit | Responsibility |
|------|----------------|
| `lib/utils/posTaxComponents.js` | Resolve tax component rates; compute order tax breakdown |
| `lib/config/posHotkeys.js` | Canonical F-key map + labels |
| `lib/hooks/usePosHotkeys.js` | Window keydown (skip when typing in non-scan inputs) |
| `lib/hooks/usePosHeldSales.js` | Hold / resume / persist held carts |
| `lib/hooks/usePosTaxConfig.js` | Load till tax config via POS-gated action |
| `components/pos/shared/PosHotkeyDock.jsx` | Bottom dock UI |
| `components/pos/shared/PosTaxPanel.jsx` | Tax mode / rates dialog (F7) |
| `getPosTaxConfigAction` | Read GST/PST rates with `pos.access` |

## Hotkey map (canonical)

| Key | Action |
|-----|--------|
| F1 | Focus scan/search |
| F2 | Customer |
| F3 | Focus discount |
| F4 | Hold / park |
| F5 | Pay / checkout |
| F6 | Cycle payment method |
| F7 | Tax panel |
| F8 | Clear cart (confirm if items) |
| F9 | Print draft bill |
| F11 | Fullscreen (existing) |
| Esc | Clear search (not wipe cart) |

SuperStore previously used F8=Hold / F9=Pay; dock labels migrate operators to this map.

## Tax model

- Components: `{ key: 'gst'|'pst'|'vat', label, rate }` where rate is percent (e.g. 18).
- GST_PST regions: GST from `sales_tax_rate`/`gst_rate`, PST from `provincial_tax_rate` (omit if 0).
- VAT regions: single VAT component from default / sales_tax_rate.
- Line `taxPercent` remains the **sum** of active components for POSService compatibility.
- Cart `taxMode`: `standard` | `gst_only` | `exempt`.
- Product exempt via `tax_exempt` / `domain_data.tax_exempt` → line tax 0.

## Success criteria

- Retail and superstore show component tax lines when PST > 0.
- F1–F9 dock visible on desktop POS; keys fire without mouse.
- PosTerminal can hold and resume sales like SuperStore.
- Unit tests cover tax component resolution and totals.

# POS Power Till Implementation Plan

> **For agentic workers:** Phase 1 implemented in-repo. Later phases below.

**Goal:** Mouseless F1–F9 dock, multi-component GST/PST on POS, hold parity on retail.

**Architecture:** Shared tax components + hotkey map/hooks + dock/panel UI wired into PosTerminal and SuperStorePOS.

**Tech Stack:** React client components, Vitest, existing POSService checkout payload.

## Global Constraints

- Line `taxPercent` remains sum of components for POSService.
- Do not invent PST when provincial rate is 0.
- No em dashes in UI copy.
- Desktop layouts unchanged except bottom dock strip.

## Tasks

- [x] `lib/utils/posTaxComponents.js` + unit tests
- [x] `lib/config/posHotkeys.js`, `usePosHotkeys`, `usePosHeldSales`, `usePosTaxConfig`
- [x] `getPosTaxConfigAction` (pos.access)
- [x] `PosHotkeyDock`, `PosTaxPanel`
- [x] Wire PosTerminal + SuperStorePOS
- [x] Phase 2: Restaurant F-dock + tax breakout
- [x] Phase 2: Manager PIN, loyalty at till, cash drawer / paid in-out
- [ ] Phase 3: Hardware scale protocol, customer pole display, FBR live transmit

## Test

```bash
bunx vitest run tests/unit/posTaxComponents.test.js tests/unit/posOperations.test.js
```

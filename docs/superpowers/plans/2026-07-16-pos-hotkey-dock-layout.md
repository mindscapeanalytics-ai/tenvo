# POS Hotkey Dock Layout Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin F1–F9 as a professional full-width bottom dock on Restaurant, SuperStore, and retail POS.

**Architecture:** Column outer shell everywhere; domain menu/cart stay in an inner row; shared `PosHotkeyDock` uses `POS_HOTKEY_DOCK` footer tokens.

**Tech Stack:** React client components, Tailwind, existing `posHotkeys` / `posLayout`.

## Global Constraints

- Pinned in-flow dock (not `fixed` overlay over Pay / Kitchen).
- Desktop only: `hidden lg:block` on dock.
- No em dashes in UI copy.
- Do not change F1–F9 action semantics.
- Keep desktop layouts otherwise unchanged (hub dual-layout rules).

## File map

| File | Responsibility |
|------|----------------|
| `lib/utils/posLayout.js` | `POS_HOTKEY_DOCK` token |
| `components/pos/shared/PosHotkeyDock.jsx` | Shared dock chrome |
| `components/restaurant/RestaurantPOS.jsx` | Shell wrap fix |
| `components/pos/PosTerminal.jsx` | Confirm dock last; optional hint cleanup |
| `components/pos/SuperStorePOS.jsx` | Confirm dock last; remove redundant F-key text strip if redundant |

---

### Task 1: Layout token + dock chrome

**Files:** `lib/utils/posLayout.js`, `components/pos/shared/PosHotkeyDock.jsx`

- [x] Add `POS_HOTKEY_DOCK` (shrink-0, w-full, z-20, border-t, white bg, soft upward shadow, safe-area padding).
- [x] Apply token in `PosHotkeyDock`; polish key buttons (min-h, tabular F labels, consistent hover).
- [x] Keep `className` override for `hidden lg:block`.

### Task 2: Restaurant shell fix

**Files:** `components/restaurant/RestaurantPOS.jsx`

- [x] Root: `flex flex-col` only (remove `lg:flex-row`).
- [x] Wrap menu column + mobile checkout bar + cart column in `flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden`.
- [x] Leave `PosHotkeyDock` as last shell child (sibling of inner row, not inside it).

### Task 3: Retail + SuperStore alignment

**Files:** `components/pos/PosTerminal.jsx`, `components/pos/SuperStorePOS.jsx`

- [x] Confirm dock remains last child of column shell.
- [x] Remove SuperStore’s redundant “F1 search · …” text footer if the dock already shows those keys.
- [x] No structural change unless dock is misplaced.

### Task 4: Smoke check

- [x] Mentally / visually verify: restaurant no right column; dock full width; cart CTAs above dock.
- [x] No new verify script required (UI-only); existing hotkey map unchanged.

## Test

Manual: open restaurant POS at `lg+`, confirm F1–F9 dock spans bottom; open superstore + retail POS and confirm matching chrome.

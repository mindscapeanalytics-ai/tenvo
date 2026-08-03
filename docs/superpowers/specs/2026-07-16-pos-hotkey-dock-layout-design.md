# POS Hotkey Dock Layout Design

**Date:** 2026-07-16  
**Scope:** Pin F1–F9 as a full-width bottom dock across Restaurant, SuperStore, and retail PosTerminal shells.

## Problem

`RestaurantPOS` root uses `lg:flex-row`, so shared `PosHotkeyDock` renders as a **third column** on the right (skinny F-key stack + empty white space). Retail and SuperStore already use column shells and place the dock correctly at the bottom, but dock chrome is lighter than a professional power-till footer.

## Goals

1. Extreme-bottom, full-width F1–F9 dock on desktop for all three POS variants.
2. Pinned **in-flow** strip (not a floating overlay) so Pay / Send to Kitchen stay fully visible.
3. Shared look and feel via `PosHotkeyDock` + `posLayout` tokens.
4. Preserve domain workflow differences (restaurant kitchen vs retail hold/pay).

## Non-goals

- Changing F-key action map (`posHotkeys.js`).
- Mobile dock (stays `hidden lg:block`).
- New shared `PosShell` mega-wrapper (Approach 2 deferred).
- Hardware / FBR / scale work.

## Architecture

| Unit | Change |
|------|--------|
| `RestaurantPOS.jsx` | Outer shell always `flex-col`; wrap menu + cart in inner `flex-1 lg:flex-row`; dock last child |
| `PosHotkeyDock.jsx` | Full-width footer chrome: elevation, safe-area, denser professional keys |
| `posLayout.js` | Export `POS_HOTKEY_DOCK` class token used by the dock |
| `PosTerminal` / `SuperStorePOS` | Keep dock as last column child; drop redundant text hint if dock is always visible |

## Shell rule (canonical)

```
POS root (flex-col, fixed height)
├── [optional header]
├── content (flex-1 min-h-0) — may be lg:flex-row for menu|cart
└── PosHotkeyDock (shrink-0, w-full, desktop only)
```

## Visual spec

- White / near-white bar, top hairline border, soft upward shadow (`POS_SHELL_FOOTER` family).
- 9 equal columns; F-key label above action short label.
- Disabled keys muted; enabled keys slate with subtle hover (emerald tint retained as power-till accent for cross-domain identity).
- Safe-area bottom padding for fullscreen / notched displays.

## Success criteria

- Restaurant: F1–F9 span the bottom edge; no right-column shortcut stack.
- Retail + SuperStore: same dock chrome and bottom placement.
- Kitchen / Pay / cart footers remain fully clickable above the dock.
- Desktop only; mobile panes unchanged.

## Spec self-review

- No placeholders or TBD action maps.
- No contradiction with power-till hotkey map (same F1–F9).
- Scope limited to layout + dock chrome.

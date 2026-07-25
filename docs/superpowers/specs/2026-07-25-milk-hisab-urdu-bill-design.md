# Milk Hisab Urdu 58mm day-sheet print

**Date:** 2026-07-25  
**Scope:** `milk-shop` Route Hisab Bills only  
**Decision:** Option A — separate اردو Print / PDF next to English

## Goal

Let doodh-shop owners print the same compact 58mm day Y/N sheet in Urdu for monthly customers, without crowding English and Urdu on one slip.

## Behavior

- English Print/PDF unchanged.
- New **اردو** Print and PDF actions on each billable Bills row.
- Same day grid (Latin 3-letter product tags + `Y`/`N`) for thermal column alignment.
- Urdu chrome: title, period, house prefix, payment (نقد/ادھار), totals labels, thank-you, legend.
- Product names on the totals block map to short Urdu dairy labels (دودھ، دہی، لسی، …).
- HTML print loads **Noto Naskh Arabic** (compact receipt face). Urdu PDF uses the same HTML path via print dialog Save-as-PDF when embedded PDF fonts are unavailable; English PDF keeps jsPDF.

## Out of scope

- Hub UI language toggle
- Supermarket / other domains
- Changing day-grid letters to Nastaliq (breaks 58mm alignment)

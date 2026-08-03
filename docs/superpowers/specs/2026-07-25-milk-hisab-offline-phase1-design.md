# Route Hisab Offline Phase 1 — Design

**Date:** 2026-07-25  
**Status:** Approved direction (A + light B)  
**Scope:** `milk-shop` Route Hisab only  
**Non-scope:** Offline invoice generate, WhatsApp/email send, storefront, POS changes, PWA/service worker, schema migrations

## Chosen approach

**A + light B:** Daily sheet works offline (edit + queue Save). Bills may show last cached period totals read-only. Generate / Remind / server print need network.

Mirrors POS Phase 1: Postgres is source of truth; device holds snapshot + outbound queue only.

## Why no schema change

`saveMilkHisabDayAction` already upserts by `(business_id, delivery_date, customer_id)`. Replaying a queued day save is safe (last write wins). Queue **coalesces** to one pending payload per `(businessId, deliveryDate)`.

## Gating

- Domain: `isMilkHisabRelevant(category)`
- Plan: `offline_pos_mode` (milk-commerce / Starter+ already include it)
- Settings: `settings.milkHisab.offlineEnabled` default **on** when plan allows (`!== false`)

## Architecture

```text
[Online]  Load day ──► IndexedDB day snapshot (customers, products, rows)
[Online]  Save day ──► saveMilkHisabDayAction (unchanged) + refresh snapshot
[Offline] Load day ──► snapshot (fail closed if missing)
[Offline] Save day ──► coalesce queue row (businessId + date)
[Online]  Sync    ──► saveMilkHisabDayAction(queued rows) → mark synced
[Offline] Bills   ──► last period summary snapshot (read-only); block Generate/Remind
```

## UX

- Compact banner: Offline / Pending sync N / Syncing
- Daily: allow edit + Save while offline when snapshot ready
- Bills: read-only cache; actions that need network show clear disabled reason

## Gap fixes (post-audit)

- Queue offline only on **network** failures (not auth/validation).
- `isOnline` always tracks the browser (even if offline feature off).
- Auto-reload sheet after successful background sync (`lastSyncAt`).
- Offline print: totals bill from cached row (day Y/N needs internet).
- Daily grid read-only when offline without a day snapshot.

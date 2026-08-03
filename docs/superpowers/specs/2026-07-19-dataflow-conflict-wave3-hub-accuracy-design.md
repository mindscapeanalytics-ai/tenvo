# Dataflow Conflict Wave 3 — Remaining Hub Accuracy

**Date:** 2026-07-19  
**Status:** Implemented (surgical; Phase-3 RQ sole shell still deferred)

## Changes

1. **`getDashboardMetricsAction`** — No longer calendar-month-only SQL. Delegates to date-range `getDashboardKPIs` (+ light invoice pending/paid split) so legacy EnhancedDashboard templates cannot diverge from hub KPI truth.
2. **`DomainDashboard` period metrics** — While sales is loading without shell KPIs, do not fall back to invoice-only revenue/orders (avoids undercount flicker).

## Explicitly not changed

- **`KEEP_ALIVE_TABS`** — Left as the broader visit-based set already enforced by `verify-dashboard-kpi` (hot set + settings/orders/POS/etc.). Narrowing caused verify failures and remount regressions.

## Still deferred

- Hub Phase-3: sole `useQuery(['hubShell'])` store (architectural)

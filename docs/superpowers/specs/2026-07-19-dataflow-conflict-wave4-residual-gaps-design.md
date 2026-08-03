# Dataflow Conflict Wave 4 — Residual Flow Gaps

**Date:** 2026-07-19  
**Status:** Implemented

## Gaps closed

1. **Approval status changes** — `rejectRegistration` and `requestMoreInfo` invalidate storefront tenant cache (approve already did).
2. **Registration seed visibility** — register UI surfaces `seedFailed` instead of silent empty catalog.
3. **Checkout payment step** — requires loaded eligible methods; does not invent COD when the list is empty/unavailable.
4. **Order metadata** — `payment_method_coerced` only when the client explicitly requested a method that was normalized.

## Still deferred

- Hub Phase-3 sole `useQuery(['hubShell'])` store

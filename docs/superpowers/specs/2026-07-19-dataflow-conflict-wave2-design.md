# Dataflow Conflict Fixes — Wave 2 Design

**Date:** 2026-07-19  
**Status:** Implementing (careful accuracy / wiring)  
**Depends on:** Wave 1

## Scope

1. **Public store vs approval** — Resolve/shell/catalog gate when `approval_status` is not `approved` / `auto_approved` (legacy null allowed). Matches hub pending gate; demos stay `auto_approved`.
2. **Payment method selection** — Explicit unavailable method → **400**, do not remap to COD. Empty request still picks COD/first eligible.
3. **Registration setup settings** — `completeRegistrationSetupAction` merges public chrome keys into `business_settings.settings` (SoT for resolve) and invalidates storefront when those keys change; hub-only keys stay on `businesses.settings`.
4. **Catalog access by UUID** — `assertPublicStorefrontCatalogAccess` uses `bs.settings` + `approval_status` (not `businesses.settings` for enable flag).

## Non-goals

- Hub Phase-3 RQ sole shell
- Changing create seed best-effort model

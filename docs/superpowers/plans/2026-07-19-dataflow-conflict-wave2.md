# Dataflow Conflict Wave 2 Implementation Plan

> Completed 2026-07-19

**Goal:** Align public store with approval, fail-closed payment selection, and dual-write registration setup chrome.

## Tasks

- [x] Gate resolve/shell on `approval_status` (approved / auto_approved only; legacy empty allowed)
- [x] Catalog UUID gate: `bs.settings` + `approval_status`
- [x] `coerceStorefrontPaymentMethod` returns null for unavailable explicit methods; orders → 400
- [x] `completeRegistrationSetupAction` dual-writes public keys to `business_settings` + invalidate
- [x] `approveRegistration` invalidates storefront tenant cache
- [x] Verify scripts updated and passing

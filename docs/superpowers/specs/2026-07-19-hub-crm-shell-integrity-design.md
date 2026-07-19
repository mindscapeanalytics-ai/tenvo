# Hub CRM Shell Integrity — Design

**Date:** 2026-07-19  
**Status:** Implemented

## Problem

Shell bootstrap treats CRM as non-fatal: failed `getCustomersAction` still returns `customers: []` plus `errors.customers`. DataContext marked CRM ready on any array (including `[]`), so soft-revalidate could wipe a good SSR paint and block idle/tab refetch.

## Fix

1. Forward `shell.errors` through `loadInitialHubShell`.
2. `applyHubShellPayload`: on `errors.customers`, keep previous non-empty list; do not mark `customers` ready.
3. Session cache: do not write failed empty CRM over a prior good list; persist `errors` when present.
4. Idle + Customers tab still refetch when `customersReady` / `moduleReady.customers` is false.

Legitimate empty tenants (success + `[]`, no error) still mark ready.

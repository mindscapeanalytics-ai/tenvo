# Staff Module Access (Owner Role Rights) — Design Spec

**Date:** 2026-07-18  
**Status:** Implemented — plan at `docs/superpowers/plans/2026-07-18-staff-module-access.md`  
**Approach:** Preset role templates + per-member module overrides (Zoho / Busy pattern)  
**Not chosen:** Preset-only tightening alone; full Odoo-style custom role builder (deferred)

## Problem

Business owners need to restrict staff to specific hub areas (for example POS only, inventory only, or POS + inventory). Today Tenvo only assigns a fixed role from `business_users.role`. That role is evaluated against `PERMISSION_DEFINITIONS` in `lib/rbac/permissions.js`. Closest presets still spill access:

- **Cashier** gets POS plus inventory view, sales, and customers.
- **Warehouse manager** gets inventory plus purchases/warehouses, not a clean inventory-only profile.

Owners have no UI to toggle modules per user. Schema already has `business_users.permissions` (JSONB), but runtime RBAC never reads it. Custom roles (`custom_roles` + `RoleBuilder`) exist as dead paths and are not fed into `hasPermission`.

Plan packaging (`settings.packaging`) is a separate axis: it unlocks modules for the **business**, not which **user** may use them.

## Goals

1. Owner (and admin, within limits) can invite or edit a team member with a role template **and** module access toggles.
2. Effective access is enforced consistently in nav, tab guards, and `withGuard` server actions.
3. Existing members with empty/missing `permissions` keep current role-only behavior (backward compatible).
4. Success cases: POS-only, inventory-only, and POS + inventory combinations work end-to-end.

## Non-goals (v1)

- Full custom role builder / resurrecting `components/admin/RoleBuilder.jsx` or unused `TeamManagementPanel.jsx`.
- Per-action permission checkboxes (finer than module level).
- Changing subscription packaging or seat billing.
- Server-side role checks on every hub layout URL (session gate remains; RBAC stays on actions + UI).
- Reworking gym/CRM “memberships” (unrelated product).

## Current architecture (baseline)

| Piece | Location | Behavior today |
|-------|----------|----------------|
| Membership | `business_users` | `role`, unused `permissions` |
| Matrix | `lib/rbac/permissions.js` | Role → permission keys; `NAV_PERMISSION_MAP` |
| Server gate | `lib/rbac/serverGuard.js` | Loads `role` only; `hasPermission(role, …)` |
| Client | `usePermissions`, `TabGuard`, Sidebar | Role only |
| Team UI | `SettingsManager` Team tab | Role dropdown; invite / create / remove |
| Role change | `updateUserRoleAction` | Requires `settings.manage_roles` (owner-only in matrix) |

## Design

### 1. Effective access model

Two layers, one resolution path:

1. **Role template** — existing `PERMISSION_DEFINITIONS` for `business_users.role`.
2. **Module overrides** — optional object under `business_users.permissions`:

```json
{
  "modules": {
    "dashboard": true,
    "pos": true,
    "inventory": false,
    "sales": false,
    "customers": true,
    "purchases": false,
    "orders": false,
    "finance": false,
    "crm": false,
    "hr": false,
    "settings": false
  }
}
```

**Semantics:**

- `owner` role always allows all defined permissions (unchanged). Plan limits still apply in `withGuard`.
- If `permissions.modules` is **absent** or not an object → **role-only** behavior (backward compatible).
- If `permissions.modules` is present → a permission is allowed only when:
  1. the role matrix allows it, **and**
  2. the permission’s mapped module is explicitly `true`.
- Missing module key while overrides are active → treat as **false** (fail closed for that module).
- Plan packaging still hides/locks business features; module overrides cannot grant plan-locked features.

### 2. Module catalog and mapping

Canonical module ids (owner-facing labels in parentheses):

| Module id | Maps from permission prefixes / areas |
|-----------|----------------------------------------|
| `dashboard` | `dashboard.*` |
| `pos` | `pos.*`, restaurant floor/KDS keys used for counter ops (`restaurant.*` when restaurant POS is in play — see note) |
| `inventory` | `inventory.*`, `warehouses.*`, `manufacturing.*` |
| `sales` | `sales.*` |
| `customers` | `customers.*` |
| `purchases` | `purchases.*`, `vendors.*` |
| `orders` | `orders.*` |
| `finance` | `finance.*`, `payments.*`, `tax.*`, `analytics.*` |
| `crm` | `crm.*` |
| `hr` | `hr.*` |
| `settings` | `settings.*`, `audit.*`, `approvals.*`, `workflows.*` |

**Nav:** each `NAV_PERMISSION_MAP` key resolves through the same permission → module map so Sidebar / `TabGuard` / `getNavItemAccess` stay aligned with server checks.

**Restaurant note:** For `restaurant-cafe`, floor/KDS nav remains gated by existing restaurant permissions; module `pos` covers classic POS. Do not invent a separate restaurant module in v1 unless Team UI testing shows waiters need a distinct toggle; waiter/chef templates remain role-driven with optional modules.

**Implementation home:** prefer a focused helper module (for example `lib/rbac/moduleAccess.js`) exporting:

- `STAFF_ACCESS_MODULES` (ids + labels)
- `permissionToModule(permission)` / `navKeyToModule(navKey)`
- `normalizeModuleAccess(raw)` — validates shape, drops unknown keys
- `getDefaultModulesForRole(role)` — defaults when owner picks a template
- `hasPermission(role, permission, moduleAccess?)` — extend existing API; third arg optional

Keep `PERMISSION_DEFINITIONS` as the source of role capability; modules only **narrow** (deny), never grant permissions the role does not already have. Exception: not required in v1 — do not implement “grant beyond role.” Owners who need more capability pick a higher template (for example manager) then turn modules off.

### 3. Role template defaults (when modules are first applied)

When an owner selects a role and module UI is shown, seed toggles from `getDefaultModulesForRole`. Recommended v1 defaults (dashboard always true for active staff):

| Role | Default modules on |
|------|--------------------|
| `cashier` | dashboard, pos, customers |
| `salesperson` | dashboard, sales, customers, orders |
| `warehouse_manager` | dashboard, inventory, purchases |
| `accountant` | dashboard, finance, sales, customers, purchases |
| `waiter` / `chef` | dashboard, pos (restaurant paths via role matrix) |
| `viewer` | dashboard |
| `manager` / `admin` | all modules the role matrix can use (admin includes settings) |
| `owner` | N/A (no override UI) |

Changing the role template in the UI **resets** module toggles to that role’s defaults. Owner may then adjust before save. Saving with an explicit `modules` object activates override mode for that member.

**Cashier tightening:** defaults above make cashier POS-oriented (no inventory/sales). That is intentional product change for new assignments and for members whose access is re-saved with modules. Members never edited keep legacy cashier spill until an owner saves module access for them.

### 4. Persistence and actions

- Store only `{ modules: { … } }` in `business_users.permissions` for v1 (ignore other keys for resolution; do not delete unknown keys on read).
- Extend role update to save modules in one transaction, for example:
  - `updateMemberAccessAction({ businessId, userId, role, modules })`, or
  - extend `updateUserRoleAction` to accept optional `modules`.
- Invite / create paths (`addBusinessMemberAction`, `createTeamMemberWithPassword`, invitation accept) accept optional `modules`; if omitted, leave `permissions` empty/`{}` so role-only applies until first explicit save.
- Authorization:
  - Invite / remove / list: `settings.manage_users` (admin+).
  - Change role + modules: keep `settings.manage_roles` as **owner-only** for v1 (align Team UI copy; stop implying admins can change roles if server denies). Optional later: allow admin to edit modules for non-admin roles only.
- Never allow changing or demoting `owner`. Never allow non-owners to grant `settings` module to themselves.

No Prisma migration required: column already exists as `Json?`.

### 5. Enforcement wiring

| Layer | Change |
|-------|--------|
| `withGuard` / tenant cache SQL | `SELECT role, status, permissions` |
| Guard context | Pass `moduleAccess` into `hasPermission` |
| Business hydrate (`lib/actions/basic/business.js`) | Expose `user_module_access` (normalized modules or `null`) next to `user_role` |
| `BusinessContext` | Hold module access for the session user |
| `usePermissions` | `can` / `canNav` pass module access |
| `TabGuard` / Sidebar / mobile nav | Same |
| `getNavItemAccess` | Accept optional module access; deny when module off |

Client gates remain UX; mutations must continue to use `withGuard` with correct permission keys. Spot-audit POS, inventory upsert, and sales invoice actions.

### 6. Owner UI (Settings → Team)

In `components/SettingsManager.jsx` Team tab (create + edit member):

1. Role template dropdown (existing assignable roles).
2. **Access modules** checklist: only modules that are relevant and plan-unlocked for the business (hide or disable plan-locked modules with a short “requires plan” hint).
3. Compact summary: “Can open: POS, Customers”.
4. Save writes role + modules together.

Do not resurrect dead Team/RoleBuilder panels; extend the live Settings Team tab only.

### 7. Error handling

- Invalid role → existing `INVALID_ROLE`.
- Invalid modules payload → `INVALID_MODULE_ACCESS` with clear message.
- Permission denied on save → existing guard errors; UI toast via form error helpers.
- Staff hitting a denied action → existing unauthorized / permission error from `withGuard`.

### 8. Testing / verification

Add `scripts/verify-staff-module-access.mjs` (and package script `verify:staff-module-access`) covering:

- Role-only path when modules absent.
- Cashier defaults: `pos.access` true, `inventory.view` false when modules applied.
- Warehouse defaults: inventory on, pos off.
- Module deny wins even if role allows.
- Owner always allows.
- `permissionToModule` covers every key in `PERMISSION_DEFINITIONS` and every nav permission in `NAV_PERMISSION_MAP`.
- Unknown permission with active modules fails closed for module step after role check.

Manual QA: create POS-only user, confirm sidebar and blocked inventory save; create inventory-only user, confirm POS blocked.

## Delivery order

1. `moduleAccess` helpers + extended `hasPermission` / `getNavItemAccess` + verify script.
2. `withGuard` + business hydrate load/pass permissions.
3. Team actions save modules; invite/create optional modules.
4. Settings Team UI toggles + copy fix (owner-only role changes).
5. Spot-audit guards on POS / inventory / sales; align cashier defaults documentation in Team UI help text.

## Success criteria

- Owner can configure **POS-only**: nav shows POS (+ dashboard); inventory/sales actions fail server-side.
- Owner can configure **inventory-only**: inventory (and purchases if toggled); no POS.
- Owner can configure **POS + inventory** only.
- Untouched legacy members behave as today’s role matrix.
- Plan-locked modules remain locked even if a toggle is on in stored JSON.

## Deferred

- Custom roles table wired into `hasPermission`.
- Admin allowed to edit non-admin member modules.
- Hub layout server redirects by module (optional hardening).
- Per-action ACL UI.

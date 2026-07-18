# Staff Module Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let business owners assign role templates plus per-member hub module access (POS-only, inventory-only, or combinations) with one enforcement path across nav, TabGuard, and `withGuard`.

**Architecture:** Keep `PERMISSION_DEFINITIONS` as the capability ceiling. Store optional `{ modules: { … } }` in existing `business_users.permissions`. When modules are present, `hasPermission(role, permission, moduleAccess)` requires both role allow-list and module `true`. When modules are absent, behavior stays role-only (backward compatible). Plan packaging remains a separate business-level gate.

**Tech Stack:** Next.js App Router, Prisma (`business_users.permissions` Json), `lib/rbac/*`, Settings Team UI, Bun verify scripts

## Global Constraints

- Modules only **narrow** access; they never grant permissions the role matrix does not already allow.
- No Prisma migration (column already exists).
- Do not resurrect `RoleBuilder.jsx` or `TeamManagementPanel.jsx`.
- No em dashes in user-facing copy.
- Owner role always full access; never demote or reassign owner.
- Role + module changes require `settings.manage_roles` (owner-only in matrix); invite/remove keep `settings.manage_users`.
- Align Team UI copy with server: admins invite/remove; owners change roles/modules.
- Preserve plan packaging checks; module toggle cannot unlock a plan-locked feature.
- Desktop Settings layout unchanged; extend Team tab only.
- Commit only when the user asks (or when a task’s commit step is explicitly run after approval).

---

## File map

| Area | Files |
|------|--------|
| Module helpers | Create `lib/rbac/moduleAccess.js` |
| Permission API | Modify `lib/rbac/permissions.js` (`hasPermission`, `getNavItemAccess`) |
| Server guard | Modify `lib/rbac/serverGuard.js` (SELECT + pass modules) |
| Business hydrate | Modify `lib/actions/basic/business.js` (`user_module_access`, team, update access) |
| Team create | Modify `lib/actions/admin/teamManagement.js` (optional modules on create) |
| API wrapper | Modify `lib/api/business.js` |
| Client context | Modify `lib/context/BusinessContext.js` |
| Client hooks/guards | Modify `lib/hooks/usePermissions.js`, `components/guards/TabGuard.jsx`, Sidebar callers if they call `hasPermission` directly |
| Owner UI | Modify `components/SettingsManager.jsx` Team tab |
| Verify | Create `scripts/verify-staff-module-access.mjs`; add `package.json` script |

---

### Task 1: Module access helpers + permission API

**Files:**
- Create: `lib/rbac/moduleAccess.js`
- Modify: `lib/rbac/permissions.js`
- Create: `scripts/verify-staff-module-access.mjs`
- Modify: `package.json` (add `"verify:staff-module-access": "bun scripts/verify-staff-module-access.mjs"`)

**Interfaces:**
- Produces:
  - `STAFF_ACCESS_MODULE_IDS` — `readonly string[]`
  - `STAFF_ACCESS_MODULES` — `{ id: string, label: string }[]`
  - `permissionToModule(permission: string): string | null`
  - `extractModuleAccess(permissionsJson: unknown): Record<string, boolean> | null`
  - `normalizeModuleAccess(raw: unknown): Record<string, boolean> | null` — returns `null` if input means “no overrides”; returns object of known module ids → boolean when overrides active
  - `getDefaultModulesForRole(role: string): Record<string, boolean>`
  - `buildPermissionsPayload(modules: Record<string, boolean>): { modules: Record<string, boolean> }`
  - `hasPermission(role, permission, moduleAccess?)` — third arg optional; `null`/`undefined` = role-only
  - `getNavItemAccess(navKey, role, planTier, businessSettings, platformOverrides, moduleAccess?)`

- [ ] **Step 1: Create `lib/rbac/moduleAccess.js`**

Implement exactly:

```js
/** @typedef {Record<string, boolean>} ModuleAccessMap */

export const STAFF_ACCESS_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pos', label: 'POS' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'customers', label: 'Customers' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'orders', label: 'Orders' },
  { id: 'finance', label: 'Finance' },
  { id: 'crm', label: 'CRM' },
  { id: 'hr', label: 'HR' },
  { id: 'settings', label: 'Settings' },
];

export const STAFF_ACCESS_MODULE_IDS = STAFF_ACCESS_MODULES.map((m) => m.id);

const PREFIX_TO_MODULE = [
  ['dashboard.', 'dashboard'],
  ['pos.', 'pos'],
  ['restaurant.', 'pos'],
  ['inventory.', 'inventory'],
  ['warehouses.', 'inventory'],
  ['manufacturing.', 'inventory'],
  ['sales.', 'sales'],
  ['customers.', 'customers'],
  ['purchases.', 'purchases'],
  ['vendors.', 'purchases'],
  ['orders.', 'orders'],
  ['finance.', 'finance'],
  ['payments.', 'finance'],
  ['tax.', 'finance'],
  ['analytics.', 'finance'],
  ['crm.', 'crm'],
  ['hr.', 'hr'],
  ['settings.', 'settings'],
  ['audit.', 'settings'],
  ['approvals.', 'settings'],
  ['workflows.', 'settings'],
];

export function permissionToModule(permission) {
  const key = String(permission || '').trim().toLowerCase();
  if (!key) return null;
  for (const [prefix, mod] of PREFIX_TO_MODULE) {
    if (key.startsWith(prefix)) return mod;
  }
  return null;
}

/** @returns {ModuleAccessMap | null} null = no module overrides (role-only) */
export function extractModuleAccess(permissionsJson) {
  if (permissionsJson == null) return null;
  let obj = permissionsJson;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return null; }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (!Object.prototype.hasOwnProperty.call(obj, 'modules')) return null;
  const modules = obj.modules;
  if (!modules || typeof modules !== 'object' || Array.isArray(modules)) return null;
  /** @type {ModuleAccessMap} */
  const out = {};
  for (const id of STAFF_ACCESS_MODULE_IDS) {
    out[id] = modules[id] === true;
  }
  return out;
}

/**
 * Normalize owner-submitted modules. Empty/invalid → null (caller may treat as clear overrides).
 * When `requireActive` is true and at least one known key is present, return full map (missing → false).
 */
export function normalizeModuleAccess(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const hasAnyKnown = STAFF_ACCESS_MODULE_IDS.some((id) => Object.prototype.hasOwnProperty.call(raw, id));
  if (!hasAnyKnown) return null;
  /** @type {ModuleAccessMap} */
  const out = {};
  for (const id of STAFF_ACCESS_MODULE_IDS) {
    out[id] = raw[id] === true;
  }
  // Dashboard always on for staff with overrides (product rule)
  out.dashboard = true;
  return out;
}

export function buildPermissionsPayload(modules) {
  const normalized = normalizeModuleAccess(modules);
  if (!normalized) return {};
  return { modules: normalized };
}

const ALL_OFF = Object.fromEntries(STAFF_ACCESS_MODULE_IDS.map((id) => [id, false]));

function on(...ids) {
  const m = { ...ALL_OFF, dashboard: true };
  for (const id of ids) m[id] = true;
  return m;
}

export function getDefaultModulesForRole(role) {
  const r = String(role || '').toLowerCase().trim();
  switch (r) {
    case 'cashier':
      return on('pos', 'customers');
    case 'salesperson':
      return on('sales', 'customers', 'orders');
    case 'warehouse_manager':
      return on('inventory', 'purchases');
    case 'accountant':
      return on('finance', 'sales', 'customers', 'purchases');
    case 'waiter':
    case 'chef':
      return on('pos');
    case 'viewer':
      return on();
    case 'manager':
      return on('pos', 'inventory', 'sales', 'customers', 'purchases', 'orders', 'finance', 'crm', 'hr');
    case 'admin':
      return on('pos', 'inventory', 'sales', 'customers', 'purchases', 'orders', 'finance', 'crm', 'hr', 'settings');
    case 'owner':
      return Object.fromEntries(STAFF_ACCESS_MODULE_IDS.map((id) => [id, true]));
    default:
      return on();
  }
}

export function isModuleAllowed(moduleAccess, moduleId) {
  if (moduleAccess == null) return true;
  if (!moduleId) return false;
  return moduleAccess[moduleId] === true;
}
```

- [ ] **Step 2: Extend `hasPermission` and `getNavItemAccess` in `lib/rbac/permissions.js`**

Import `permissionToModule`, `isModuleAllowed` from `./moduleAccess.js`.

Change signature:

```js
export function hasPermission(role, permission, moduleAccess) {
  const effectiveRole = (role || 'viewer').toLowerCase().trim();
  if (effectiveRole === 'owner') return true;

  // existing allow-list / unknown-permission logic unchanged for role gate...
  const roleAllowed = /* existing exact allow-list result */;
  if (!roleAllowed) return false;

  if (moduleAccess == null) return true;
  const mod = permissionToModule(permission);
  if (!mod) return false; // fail closed when overrides active and permission unmapped
  return isModuleAllowed(moduleAccess, mod);
}
```

Update `getNavItemAccess` to accept optional 6th arg `moduleAccess` and call `hasPermission(role, mapping.permission, moduleAccess)`.

Update `getPermissionsForRole` to remain role-only (list of keys the role can hold before modules). Do not change callers that omit the third arg.

- [ ] **Step 3: Write `scripts/verify-staff-module-access.mjs`**

Assert:

1. `hasPermission('cashier', 'pos.access') === true` (no modules)
2. `hasPermission('cashier', 'inventory.view') === true` (legacy spill without modules)
3. With `getDefaultModulesForRole('cashier')`: `pos.access` true, `inventory.view` false, `sales.view` false
4. Warehouse defaults: `inventory.view` true, `pos.access` false
5. `hasPermission('owner', 'settings.billing', { settings: false }) === true`
6. Every key in `PERMISSION_DEFINITIONS` maps via `permissionToModule` to a known module
7. Every `NAV_PERMISSION_MAP[*].permission` maps to a known module
8. `extractModuleAccess({})` and `extractModuleAccess({ foo: 1 })` are `null`
9. `extractModuleAccess({ modules: { pos: true } })` has `pos === true`, `inventory === false`

Exit non-zero on failure; print pass count.

- [ ] **Step 4: Add package script and run verify**

Run: `bun run verify:staff-module-access`  
Expected: all assertions pass.

- [ ] **Step 5: Commit** (when user asks, or at end of batch)

```bash
git add lib/rbac/moduleAccess.js lib/rbac/permissions.js scripts/verify-staff-module-access.mjs package.json
git commit -m "feat(rbac): add staff module access helpers and permission gating"
```

---

### Task 2: Wire `withGuard` + business hydrate

**Files:**
- Modify: `lib/rbac/serverGuard.js`
- Modify: `lib/actions/basic/business.js` (all places that set `user_role`)
- Modify: `lib/context/BusinessContext.js`
- Modify: `lib/hooks/usePermissions.js`
- Modify: `components/guards/TabGuard.jsx`
- Grep and update any direct `getNavItemAccess(` / `hasPermission(` in Sidebar / mobile nav that need the new arg from context

**Interfaces:**
- Consumes: `extractModuleAccess`, `hasPermission(..., moduleAccess)`
- Produces: `withGuard` returns `{ session, role, planTier, moduleAccess, isPlatformAdmin? }`
- Business objects include `user_module_access: ModuleAccessMap | null`
- `BusinessContext` exposes `moduleAccess`
- `usePermissions().can` / `canNav` use context `moduleAccess`

- [ ] **Step 1: Update both SQL selects in `serverGuard.js`**

Change:

```sql
SELECT role, status, permissions FROM business_users WHERE user_id = $1 AND business_id = $2
```

In `getCachedTenantAccess` return `{ role, planTier, tenantSettings, limitOverrides, moduleAccess }` where `moduleAccess = extractModuleAccess(row.permissions)`.

Platform admin / healed owner: `moduleAccess = null` (owner bypass inside `hasPermission`).

Replace:

```js
if (!hasPermission(role, permission)) {
```

with:

```js
if (!hasPermission(role, permission, moduleAccess)) {
```

in all three call sites in this file. Return `moduleAccess` from `withGuard`.

- [ ] **Step 2: Hydrate `user_module_access` in business loaders**

In `getBusinessByUserId`, `getBusinessByDomainAndUser`, owner heal path, and `getJoinedBusinessesAction` map:

```js
import { extractModuleAccess } from '@/lib/rbac/moduleAccess';

user_role: businessUser.role,
user_module_access: extractModuleAccess(businessUser.permissions),
```

Owner heal insert does not need permissions column (defaults `{}` → extract null).

- [ ] **Step 3: `BusinessContext`**

Add `moduleAccess` state (default `null`). On business load:

```js
setModuleAccess(biz.user_module_access ?? null);
```

Clear on logout. Expose `moduleAccess` on context value (platform owner: treat as `null` with role owner).

- [ ] **Step 4: `usePermissions` + `TabGuard`**

```js
const { role, business, moduleAccess } = useBusiness();
can: (permission) => hasPermission(effectiveRole, permission, moduleAccess),
canNav: (navKey) => getNavItemAccess(navKey, effectiveRole, planTier, businessSettings, platformOverrides, moduleAccess),
```

In `TabGuard`, read `moduleAccess` from `useBusiness()` and pass into `hasPermission`.

Find Sidebar / mobile nav: if they use `getNavItemAccess` or `hasPermission` with only role, pass `moduleAccess` from `useBusiness()` / `usePermissions()`.

- [ ] **Step 5: Re-run verify + smoke**

Run: `bun run verify:staff-module-access`  
Expected: PASS (API unchanged for null modules).

- [ ] **Step 6: Commit** (when asked)

```bash
git commit -m "feat(rbac): enforce module access in withGuard and hub client gates"
```

---

### Task 3: Persist member access (actions + API)

**Files:**
- Modify: `lib/actions/basic/business.js` — `updateUserRoleAction` → accept modules; `getBusinessTeamAction` already returns `permissions` via spread (ensure client gets `module_access` helper field)
- Modify: `lib/actions/admin/teamManagement.js` — `createTeamMemberWithPassword` optional `modules`
- Modify: `lib/api/business.js` — `updateUserRole(userId, businessId, role, modules?)`

**Interfaces:**
- `updateUserRoleAction(userId, businessId, role, modules?)`
- When `modules` is provided (object): `permissions = buildPermissionsPayload(modules)` after `normalizeModuleAccess`; if normalize returns null → `INVALID_MODULE_ACCESS`
- When `modules` is `undefined`: update role only; leave `permissions` unchanged
- When `modules` is `null`: clear overrides → set `permissions: {}`
- Create member: if `modules` provided, set permissions; else `{}`

- [ ] **Step 1: Implement update + create persistence**

```js
import { normalizeModuleAccess, buildPermissionsPayload, extractModuleAccess } from '@/lib/rbac/moduleAccess';

export async function updateUserRoleAction(userId, businessId, role, modules) {
  await checkAuth(businessId, 'settings.manage_roles');
  // validate role as today...
  const data = { role: normalizedRole };
  if (arguments.length >= 4 || modules !== undefined) {
    if (modules === null) {
      data.permissions = {};
    } else {
      const normalized = normalizeModuleAccess(modules);
      if (!normalized) {
        return actionFailure('INVALID_MODULE_ACCESS', 'Select at least one valid access module');
      }
      if (normalized.settings === true && /* actor is not owner */) {
        // only owner can grant settings — actor role from checkAuth session membership
      }
      data.permissions = buildPermissionsPayload(normalized);
    }
  }
  // block settings grant unless actor is owner
  // update prisma...
}
```

Prefer explicit optional: use options object if cleaner and update API wrapper:

```js
updateUserRoleAction(userId, businessId, { role, modules })
```

Keep backward compatible: if 3rd arg is string, treat as role; if 3rd is object, treat as `{ role, modules }`.

- [ ] **Step 2: Format team list**

In `getBusinessTeamAction` map:

```js
module_access: extractModuleAccess(member.permissions),
```

- [ ] **Step 3: `createTeamMemberWithPassword`**

Accept optional `modules`; write `permissions: buildPermissionsPayload(...)` or `{}`.

- [ ] **Step 4: API wrapper**

```js
async updateUserRole(userId, businessId, role, modules) {
  const result = await updateUserRoleAction(userId, businessId, { role, modules });
  ...
}
```

- [ ] **Step 5: Extend verify script** with a pure-function check that `buildPermissionsPayload(getDefaultModulesForRole('cashier')).modules.pos === true`.

- [ ] **Step 6: Commit** (when asked)

---

### Task 4: Settings Team UI (owner module toggles)

**Files:**
- Modify: `components/SettingsManager.jsx`

**Interfaces:**
- Consumes: `STAFF_ACCESS_MODULES`, `getDefaultModulesForRole`, `businessAPI.updateUserRole`
- `canManageRoles` = owner or platform owner (not admin)
- Admins still `canManageUsers` for invite/remove only

- [ ] **Step 1: Fix access-control copy**

Replace admin claim that they can change roles with: admins invite and remove; owners assign roles and module access.

- [ ] **Step 2: Create-member module checklist**

State: `createModules` initialized from `getDefaultModulesForRole(createRole)`.

On `createRole` change: reset `createModules` to defaults for that role.

Render checkboxes for `STAFF_ACCESS_MODULES` (dashboard disabled checked). Hide or disable modules that plan packaging locks using `planHasFeatureWithPackaging` + a small map:

| Module | Plan feature key (disable if false) |
|--------|-------------------------------------|
| pos | `pos` |
| orders | `storefront_orders` |
| crm | `loyalty_programs` (or hide if none of crm features) |
| hr | `payroll` |
| finance | unlocked if `basic_reports` OR `basic_accounting` |
| others | always available for toggle (still narrowed by role on server) |

Pass `modules: createModules` into `createTeamMemberWithPassword`.

- [ ] **Step 3: Per-member edit**

For each non-owner row: role select **disabled unless `canManageRoles`**.

Add “Access” button or inline checkboxes. Local draft state per member or edit modal. Save calls:

```js
await businessAPI.updateUserRole(member.user_id, business.id, nextRole, draftModules);
```

If member has `module_access == null`, show defaults for current role as starting draft (saving then activates overrides).

Summary text: `Can open: ${enabledLabels.join(', ')}` (no em dash).

- [ ] **Step 4: Email invite path**

Pass selected role; modules optional in v1 for invite (role-only until owner edits) OR same createModules if invite API is extended. Spec allows omit on invite — document in UI: “After they join, set module access from the team list.”

- [ ] **Step 5: Manual sanity**

Owner creates cashier with only POS+customers → save → refresh → `module_access.pos === true`, inventory false.

- [ ] **Step 6: Commit** (when asked)

```bash
git commit -m "feat(settings): owner team module access toggles"
```

---

### Task 5: Spot-audit enforcement + conflict checks

**Files:**
- Grep: `withGuard(` under `lib/actions/standard/pos*`, inventory upsert, invoice create
- Modify only if a critical mutation lacks `permission`
- Extend `scripts/verify-staff-module-access.mjs` with static file checks that `serverGuard` SELECTs `permissions` and `hasPermission` is called with three args in guard

- [ ] **Step 1: Confirm POS process sale / inventory upsert / create invoice use `withGuard` with permissions**

If any use membership-only auth, add the correct permission key from the matrix.

- [ ] **Step 2: Static wiring asserts in verify script**

- `serverGuard.js` contains `permissions` in SELECT and `hasPermission(role, permission, moduleAccess)`
- `BusinessContext` exposes `moduleAccess`
- `SettingsManager` imports `STAFF_ACCESS_MODULES` or `getDefaultModulesForRole`

- [ ] **Step 3: Run**

```bash
bun run verify:staff-module-access
bun run verify:hub-tabs-forms
```

Expected: both pass (hub-tabs-forms should not regress).

- [ ] **Step 4: Commit** (when asked)

```bash
git commit -m "test(rbac): lock staff module access wiring and spot-audit guards"
```

---

### Task 6: Spec status + docs touch

**Files:**
- Modify: `docs/superpowers/specs/2026-07-18-staff-module-access-design.md` — Status → Implemented (or In progress)
- Optional one-liner in `docs/TEAM_MANAGEMENT_GUIDE.md` if it claims custom roles are live — correct to module overrides (only if that doc is misleading)

- [ ] **Step 1: Update spec status after code lands**
- [ ] **Step 2: Final verify suite**

```bash
bun run verify:staff-module-access
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Module map + helpers | Task 1 |
| `hasPermission` / nav gating | Task 1–2 |
| `withGuard` loads permissions | Task 2 |
| `user_module_access` hydrate | Task 2 |
| Client TabGuard / usePermissions | Task 2 |
| Persist modules on update/create | Task 3 |
| Team UI toggles + owner-only role edit | Task 4 |
| Backward compatible null modules | Task 1–2 |
| Verify script | Task 1, 5 |
| Spot-audit mutations | Task 5 |
| No custom role builder | Global / out of scope |

## Conflict-avoidance notes

- Do not change `PERMISSION_DEFINITIONS` allow-lists in a way that breaks legacy cashiers until modules are saved; defaults apply only when overrides are written.
- Do not use `business_users.permissions` for unrelated payloads without preserving a `modules` key.
- Do not grant beyond role via modules.
- Keep `lib/utils/permissions.js` and `lib/auth/rbac.js` untouched (deprecated/stale); do not dual-write.

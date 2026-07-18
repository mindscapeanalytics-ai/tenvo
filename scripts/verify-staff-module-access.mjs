#!/usr/bin/env bun
/**
 * Staff module access RBAC verification.
 * Run: bun run verify:staff-module-access
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    STAFF_ACCESS_MODULE_IDS,
    extractModuleAccess,
    getDefaultModulesForRole,
    buildPermissionsPayload,
    permissionToModule,
} from '../lib/rbac/moduleAccess.js';
import {
    hasPermission,
    PERMISSION_DEFINITIONS,
    NAV_PERMISSION_MAP,
} from '../lib/rbac/permissions.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        passed += 1;
        console.log(`PASS: ${label}`);
    } else {
        failed += 1;
        console.error(`FAIL: ${label}`);
    }
}

function readRepoFile(relativePath) {
    return readFileSync(join(ROOT, relativePath), 'utf8');
}

// 1. Role-only: cashier pos.access
assert(
    hasPermission('cashier', 'pos.access') === true,
    'cashier pos.access true without modules'
);

// 2. Legacy spill: cashier inventory.view without modules
assert(
    hasPermission('cashier', 'inventory.view') === true,
    'cashier inventory.view true without modules (legacy)'
);

// 3. Cashier defaults with module overrides
const cashierModules = getDefaultModulesForRole('cashier');
assert(
    hasPermission('cashier', 'pos.access', cashierModules) === true,
    'cashier defaults: pos.access true'
);
assert(
    hasPermission('cashier', 'inventory.view', cashierModules) === false,
    'cashier defaults: inventory.view false'
);
assert(
    hasPermission('cashier', 'sales.view', cashierModules) === false,
    'cashier defaults: sales.view false'
);

// 4. Warehouse defaults
const warehouseModules = getDefaultModulesForRole('warehouse_manager');
assert(
    hasPermission('warehouse_manager', 'inventory.view', warehouseModules) === true,
    'warehouse defaults: inventory.view true'
);
assert(
    hasPermission('warehouse_manager', 'pos.access', warehouseModules) === false,
    'warehouse defaults: pos.access false'
);

// 5. Owner bypasses module restrictions
assert(
    hasPermission('owner', 'settings.billing', { settings: false }) === true,
    'owner allows even with settings:false modules'
);

// 6. Every PERMISSION_DEFINITIONS key maps to a known module
for (const key of Object.keys(PERMISSION_DEFINITIONS)) {
    const mod = permissionToModule(key);
    assert(
        mod != null && STAFF_ACCESS_MODULE_IDS.includes(mod),
        `PERMISSION_DEFINITIONS key "${key}" maps to module "${mod}"`
    );
}

// 7. Every NAV_PERMISSION_MAP permission maps to a known module
for (const [navKey, mapping] of Object.entries(NAV_PERMISSION_MAP)) {
    const mod = permissionToModule(mapping.permission);
    assert(
        mod != null && STAFF_ACCESS_MODULE_IDS.includes(mod),
        `NAV_PERMISSION_MAP "${navKey}" permission "${mapping.permission}" maps to module "${mod}"`
    );
}

// 8. extractModuleAccess edge cases
assert(extractModuleAccess({}) === null, 'extractModuleAccess({}) is null');
assert(extractModuleAccess({ foo: 1 }) === null, 'extractModuleAccess({ foo: 1 }) is null');

// 9. extractModuleAccess with partial modules object
const extracted = extractModuleAccess({ modules: { pos: true } });
assert(extracted != null && extracted.pos === true, 'extractModuleAccess pos true');
assert(extracted != null && extracted.inventory === false, 'extractModuleAccess inventory false');

// 10. buildPermissionsPayload for cashier defaults
assert(
    buildPermissionsPayload(getDefaultModulesForRole('cashier')).modules.pos === true,
    'buildPermissionsPayload(cashier defaults).modules.pos === true'
);

// 11. Static wiring: serverGuard loads permissions + hasPermission with moduleAccess
{
    const serverGuard = readRepoFile('lib/rbac/serverGuard.js');
    assert(
        /SELECT\s+role,\s*status,\s*permissions\s+FROM\s+business_users/i.test(serverGuard),
        'serverGuard.js SELECT includes permissions'
    );
    assert(
        /hasPermission\s*\(\s*role\s*,\s*permission\s*,\s*moduleAccess\s*\)/.test(serverGuard),
        'serverGuard.js calls hasPermission(role, permission, moduleAccess)'
    );
}

// 12. Static wiring: BusinessContext exposes/sets moduleAccess
{
    const businessContext = readRepoFile('lib/context/BusinessContext.js');
    assert(
        /setModuleAccess\s*\(/.test(businessContext) && /moduleAccess/.test(businessContext),
        'BusinessContext.js exposes/sets moduleAccess'
    );
}

// 13. Static wiring: SettingsManager imports module access helpers
{
    const settingsManager = readRepoFile('components/SettingsManager.jsx');
    assert(
        /getDefaultModulesForRole|STAFF_ACCESS_MODULES/.test(settingsManager),
        'SettingsManager.jsx imports getDefaultModulesForRole or STAFF_ACCESS_MODULES'
    );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}
console.log('verify:staff-module-access PASS');

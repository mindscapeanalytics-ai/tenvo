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
        try {
            obj = JSON.parse(obj);
        } catch {
            return null;
        }
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
 * When at least one known key is present, return full map (missing → false).
 */
export function normalizeModuleAccess(raw) {
    if (raw == null) return null;
    if (typeof raw !== 'object' || Array.isArray(raw)) return null;
    const hasAnyKnown = STAFF_ACCESS_MODULE_IDS.some((id) =>
        Object.prototype.hasOwnProperty.call(raw, id)
    );
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

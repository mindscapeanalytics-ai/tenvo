export const VALID_DASHBOARD_TABS = new Set([
    'dashboard',
    'inventory',
    'invoices',
    'customers',
    'vendors',
    'payments',
    'purchases',
    'sales',
    'manufacturing',
    'warehouses',
    'quotations',
    'batches',
    'finance',
    'reports',
    'campaigns',
    'gst',
    'pos',
    'restaurant',
    'payroll',
    'approvals',
    'loyalty',
    'refunds',
    'audit',
    'settings',
]);

const TAB_ALIASES = {
    analytics: 'reports',
    report: 'reports',
    'multi-location': 'warehouses',
    accounting: 'finance',
    expenses: 'finance',
    'credit-notes': 'finance',
    fiscal: 'finance',
    'exchange-rates': 'finance',
};

export function normalizeDashboardTab(tab) {
    if (!tab) return 'dashboard';
    const key = String(tab).trim().toLowerCase();
    return TAB_ALIASES[key] || key;
}

export function resolveDashboardTab(tab) {
    const normalized = normalizeDashboardTab(tab);
    return VALID_DASHBOARD_TABS.has(normalized) ? normalized : 'dashboard';
}

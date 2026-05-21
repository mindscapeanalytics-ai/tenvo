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
    'serials',
    'bom',
    'finance',
    'accounting',
    'expenses',
    'credit-notes',
    'fiscal',
    'exchange-rates',
    'journal',
    'reports',
    'analytics',
    'forecasting',
    'campaigns',
    'crm',
    'promotions',
    'gst',
    'pos',
    'refunds',
    'restaurant',
    'kds',
    'payroll',
    'attendance',
    'shifts',
    'approvals',
    'audit',
    'audit-trail',
    'loyalty',
    'settings',
    'api',
    'integrations',
    'webhooks',
    'multi-branch',
]);

const TAB_ALIASES = {
    // Legacy mappings
    analytics: 'reports',
    report: 'reports',
    'multi-location': 'warehouses',
    'financial-reports': 'finance',
    'banking': 'payments',
    
    // Module-based aliases
    'accounts': 'accounting',
    'ai': 'analytics',
    'forecast': 'forecasting',
    'hr': 'payroll',
    'operations': 'warehouses',
    
    // Short forms
    'cn': 'credit-notes',
    'po': 'purchases',
    'so': 'sales',
    'inv': 'inventory',
    'cust': 'customers',
    'ven': 'vendors',
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

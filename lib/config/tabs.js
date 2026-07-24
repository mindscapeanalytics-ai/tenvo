// Tab registry, defined as a plain array to avoid module-level const Set TDZ
// across Next.js chunk boundaries (minifier renames const bindings which can
// cause "Cannot access 'X' before initialization" if chunks load out of order).
const VALID_TAB_LIST = [
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
    'memberships',
    'route-hisab',
    'settings',
    'api',
    'integrations',
    'webhooks',
    'multi-branch',
    'orders',
    'store-settings',
    'inquiries',
];

// Lazily-built Set, never a top-level const binding, so no TDZ risk
let _tabSet = null;
function getTabSet() {
    if (!_tabSet) _tabSet = new Set(VALID_TAB_LIST);
    return _tabSet;
}

// Keep named export for any consumers that still reference it
export const VALID_DASHBOARD_TABS = { has: (v) => getTabSet().has(v) };

const TAB_ALIASES = {
    // Common shortcuts for power users
    dash: 'dashboard',
    prod: 'inventory',
    exp: 'finance',
    mfg: 'manufacturing',
    pay: 'payments',
    fin: 'finance',
    acc: 'finance',
    rep: 'reports',
    set: 'settings',
    
    // Full word aliases
    hisab: 'route-hisab',
    'route-hisab': 'route-hisab',
    'milk-hisab': 'route-hisab',
    analytics: 'reports',
    report: 'reports',
    forecasting: 'reports',
    forecast: 'reports',
    'multi-location': 'warehouses',
    'financial-reports': 'finance',
    banking: 'payments',
    accounts: 'finance',
    accounting: 'finance',
    expenses: 'finance',
    'credit-notes': 'finance',
    fiscal: 'finance',
    'exchange-rates': 'finance',
    journal: 'finance',
    'trial-balance': 'finance',
    'day-book': 'finance',
    statements: 'finance',
    vouchers: 'finance',
    voucher: 'finance',
    'general-ledger': 'finance',
    reconciliation: 'finance',
    ai: 'reports',
    hr: 'payroll',
    attendance: 'payroll',
    shifts: 'payroll',
    operations: 'warehouses',
    
    // Abbreviations
    cn: 'finance',
    po: 'purchases',
    so: 'sales',
    inv: 'inventory',
    cust: 'customers',
    ven: 'vendors',
    serials: 'batches',
    bom: 'manufacturing',
    crm: 'loyalty',
    promotions: 'campaigns',
    kds: 'restaurant',
    'audit-trail': 'audit',
    api: 'settings',
    integrations: 'settings',
    webhooks: 'settings',
    'multi-branch': 'settings',
    'domain-operations': 'inquiries',
    inquiry: 'inquiries',
    inquiries: 'inquiries',
    contact: 'inquiries',
    'contact-messages': 'inquiries'
};

/**
 * Map legacy / shortcut tab ids to URL `financeView` tokens when aliasing into `finance`.
 * These are NOT always FinanceHub `activeTab` keys — Trial Balance / Day Book / vouchers
 * are remapped by {@link resolveFinanceHubNavigation} into Statements nesting or Payments.
 */
export const FINANCE_VIEW_BY_TAB = {
    expenses: 'expenses',
    exp: 'expenses',
    accounting: 'accounts',
    acc: 'accounts',
    accounts: 'accounts',
    'credit-notes': 'credit-notes',
    cn: 'credit-notes',
    fiscal: 'fiscal',
    'exchange-rates': 'exchange',
    journal: 'journal',
    statements: 'statements',
    'financial-reports': 'statements',
    'trial-balance': 'trial-balance',
    'day-book': 'day-book',
    'general-ledger': 'general-ledger',
    reconciliation: 'reconciliation',
    vouchers: 'vouchers',
    voucher: 'vouchers',
};

/** Nested statement report when a legacy financeView maps into Statements. */
export const FINANCE_STATEMENT_REPORT_BY_VIEW = {
    'trial-balance': 'tb',
    tb: 'tb',
    'day-book': 'day-book',
};

/**
 * Resolve FinanceHub navigation from a financeView / legacy alias.
 * Keeps Trial Balance and Day Book reachable without top-level duplicate tabs.
 * @param {string | null | undefined} view
 * @returns {{ tab: string, statementReport: string | null, preferPayments?: boolean }}
 */
export function resolveFinanceHubNavigation(view) {
    if (!view) return { tab: 'overview', statementReport: null };
    const key = String(view).trim().toLowerCase();
    if (key === 'vouchers' || key === 'voucher') {
        return { tab: 'overview', statementReport: null, preferPayments: true };
    }
    const nested = FINANCE_STATEMENT_REPORT_BY_VIEW[key];
    if (nested) {
        return { tab: 'statements', statementReport: nested };
    }
    const mapped = FINANCE_VIEW_BY_TAB[key];
    if (mapped && !FINANCE_STATEMENT_REPORT_BY_VIEW[mapped]) {
        return { tab: mapped, statementReport: null };
    }
    return { tab: key, statementReport: null };
}

export function resolveFinanceViewForTab(tab) {
    if (!tab) return null;
    const key = String(tab).trim().toLowerCase();
    return FINANCE_VIEW_BY_TAB[key] || null;
}

export function normalizeDashboardTab(tab) {
    if (!tab) return 'dashboard';
    const key = String(tab).trim().toLowerCase();
    return TAB_ALIASES[key] || key;
}

export function resolveDashboardTab(tab) {
    const normalized = normalizeDashboardTab(tab);
    return getTabSet().has(normalized) ? normalized : 'dashboard';
}

export function isValidTab(tab) {
    return getTabSet().has(normalizeDashboardTab(tab));
}

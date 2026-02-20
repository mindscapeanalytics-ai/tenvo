/**
 * Plan Tier Configuration
 * Defines feature access, usage limits, and pricing tiers
 * 
 * Tiers: basic → standard → premium → enterprise
 */

export const PLAN_TIERS = {
    basic: {
        key: 'basic',
        name: 'Basic',
        tagline: 'Get started with core POS & Inventory',
        price_pkr: 0,          // Free tier
        price_usd: 0,
        billing: 'free',
        limits: {
            max_users: 2,
            max_products: 100,
            max_warehouses: 1,
            max_invoices_per_month: 50,
            max_pos_terminals: 0,
            max_storage_mb: 100,
        },
        features: {
            // Core (always available)
            invoicing: true,
            purchases: true,
            customers: true,
            vendors: true,
            basic_accounting: true,
            basic_reports: true,
            quotations: true,

            // Gated features
            expense_tracking: false,
            pos: false,
            credit_notes: false,
            batch_tracking: false,
            serial_tracking: false,
            fiscal_periods: false,
            multi_currency: false,
            manufacturing: false,
            ai_analytics: false,
            promotions_crm: false,
            custom_workflows: false,
            api_access: false,
            priority_support: false,
            white_label: false,
            delivery_challans: false,
            multi_warehouse: false,
            advanced_reports: false,

            // New module feature flags
            loyalty_programs: false,
            restaurant_kds: false,
            payroll: false,
            approval_workflows: false,
            audit_logs: false,
            exchange_rates: false,
            campaigns: false,
            price_lists: false,
            supplier_quotes: false,
            ai_forecasting: false,
            ai_restock: false,
            multi_domain: false,
            multi_branch: false,
            custom_reports: false,
            payment_allocations: false,
        },
    },

    standard: {
        key: 'standard',
        name: 'Standard',
        tagline: 'POS + Inventory + Basic Finance + CRM',
        price_pkr: 2999,       // ~$10/mo
        price_usd: 10,
        billing: 'monthly',
        limits: {
            max_users: 5,
            max_products: 500,
            max_warehouses: 3,
            max_invoices_per_month: 500,
            max_pos_terminals: 2,
            max_storage_mb: 500,
        },
        features: {
            invoicing: true,
            purchases: true,
            customers: true,
            vendors: true,
            basic_accounting: true,
            basic_reports: true,
            quotations: true,

            expense_tracking: true,
            pos: true,
            credit_notes: true,
            batch_tracking: true,
            serial_tracking: true,
            fiscal_periods: false,
            multi_currency: false,
            manufacturing: false,
            ai_analytics: false,
            promotions_crm: false,
            custom_workflows: false,
            api_access: false,
            priority_support: false,
            white_label: false,
            delivery_challans: true,
            multi_warehouse: true,
            advanced_reports: false,

            // New module feature flags
            loyalty_programs: true,
            restaurant_kds: false,
            payroll: false,
            approval_workflows: false,
            audit_logs: false,
            exchange_rates: false,
            campaigns: false,
            price_lists: true,
            supplier_quotes: true,
            ai_forecasting: false,
            ai_restock: false,
            multi_domain: false,
            multi_branch: false,
            custom_reports: false,
            payment_allocations: true,
        },
    },

    premium: {
        key: 'premium',
        name: 'Premium',
        tagline: 'Full ERP suite with advanced analytics & HR',
        price_pkr: 7999,       // ~$28/mo
        price_usd: 28,
        billing: 'monthly',
        limits: {
            max_users: 15,
            max_products: 5000,
            max_warehouses: 10,
            max_invoices_per_month: 5000,
            max_pos_terminals: 10,
            max_storage_mb: 2000,
        },
        features: {
            invoicing: true,
            purchases: true,
            customers: true,
            vendors: true,
            basic_accounting: true,
            basic_reports: true,
            quotations: true,

            expense_tracking: true,
            pos: true,
            credit_notes: true,
            batch_tracking: true,
            serial_tracking: true,
            fiscal_periods: true,
            multi_currency: true,
            manufacturing: true,
            ai_analytics: true,
            promotions_crm: true,
            custom_workflows: false,
            api_access: true,
            priority_support: true,
            white_label: false,
            delivery_challans: true,
            multi_warehouse: true,
            advanced_reports: true,

            // New module feature flags
            loyalty_programs: true,
            restaurant_kds: true,
            payroll: true,
            approval_workflows: true,
            audit_logs: true,
            exchange_rates: true,
            campaigns: true,
            price_lists: true,
            supplier_quotes: true,
            ai_forecasting: false,
            ai_restock: false,
            multi_domain: false,
            multi_branch: false,
            custom_reports: true,
            payment_allocations: true,
        },
    },

    enterprise: {
        key: 'enterprise',
        name: 'Enterprise',
        tagline: 'Multi-domain, AI forecasting, full audit-ready finance',
        price_pkr: 24999,      // ~$85/mo
        price_usd: 85,
        billing: 'monthly',
        limits: {
            max_users: -1,       // Unlimited
            max_products: -1,
            max_warehouses: -1,
            max_invoices_per_month: -1,
            max_pos_terminals: -1,
            max_storage_mb: 10000,
        },
        features: {
            invoicing: true,
            purchases: true,
            customers: true,
            vendors: true,
            basic_accounting: true,
            basic_reports: true,
            quotations: true,

            expense_tracking: true,
            pos: true,
            credit_notes: true,
            batch_tracking: true,
            serial_tracking: true,
            fiscal_periods: true,
            multi_currency: true,
            manufacturing: true,
            ai_analytics: true,
            promotions_crm: true,
            custom_workflows: true,
            api_access: true,
            priority_support: true,
            white_label: true,
            delivery_challans: true,
            multi_warehouse: true,
            advanced_reports: true,

            // New module feature flags
            loyalty_programs: true,
            restaurant_kds: true,
            payroll: true,
            approval_workflows: true,
            audit_logs: true,
            exchange_rates: true,
            campaigns: true,
            price_lists: true,
            supplier_quotes: true,
            ai_forecasting: true,
            ai_restock: true,
            multi_domain: true,
            multi_branch: true,
            custom_reports: true,
            payment_allocations: true,
        },
    },
};

// ─── Human-Readable Feature Labels ───────────────────────────────────────────

export const FEATURE_LABELS = {
    invoicing: 'Invoicing',
    purchases: 'Purchase Management',
    customers: 'Customer Management',
    vendors: 'Vendor Management',
    basic_accounting: 'Basic Accounting',
    basic_reports: 'Basic Reports',
    quotations: 'Quotations',
    expense_tracking: 'Expense Tracking',
    pos: 'Point of Sale',
    credit_notes: 'Credit Notes',
    batch_tracking: 'Batch Tracking',
    serial_tracking: 'Serial Number Tracking',
    fiscal_periods: 'Fiscal Period Management',
    multi_currency: 'Multi-Currency Support',
    manufacturing: 'Manufacturing & BOM',
    ai_analytics: 'AI Analytics',
    promotions_crm: 'Promotions & CRM',
    custom_workflows: 'Custom Workflows',
    api_access: 'API Access',
    priority_support: 'Priority Support',
    white_label: 'White Label',
    delivery_challans: 'Delivery Challans',
    multi_warehouse: 'Multi-Warehouse',
    advanced_reports: 'Advanced Reports',
    loyalty_programs: 'Loyalty Programs',
    restaurant_kds: 'Restaurant & KDS',
    payroll: 'Payroll & HR',
    approval_workflows: 'Approval Workflows',
    audit_logs: 'Audit Logs',
    exchange_rates: 'Exchange Rate Management',
    campaigns: 'Campaigns & Marketing',
    price_lists: 'Price Lists',
    supplier_quotes: 'Supplier Quotes',
    ai_forecasting: 'AI Demand Forecasting',
    ai_restock: 'AI Smart Restock',
    multi_domain: 'Multi-Domain Businesses',
    multi_branch: 'Multi-Branch Management',
    custom_reports: 'Custom Reports',
    payment_allocations: 'Payment Allocations',
};

/**
 * Map a feature key to its minimum required plan
 */
export const FEATURE_MIN_PLAN = Object.keys(PLAN_TIERS.enterprise.features).reduce((map, feature) => {
    for (const tier of ['basic', 'standard', 'premium', 'enterprise']) {
        if (PLAN_TIERS[tier].features[feature]) {
            map[feature] = tier;
            break;
        }
    }
    return map;
}, {});

/**
 * Check if a plan tier includes a feature
 * @param {string} planTier - basic | standard | premium | enterprise
 * @param {string} feature - Feature key from the features object
 * @returns {boolean}
 */
export function planHasFeature(planTier, feature) {
    const plan = PLAN_TIERS[planTier];
    if (!plan) return false;
    return plan.features[feature] === true;
}

/**
 * Check if a plan tier's limit allows more of a resource
 * Returns true if under limit, false if at/over limit
 * -1 means unlimited
 * 
 * @param {string} planTier
 * @param {string} limitKey - e.g. 'max_users'
 * @param {number} currentCount
 * @returns {boolean}
 */
export function planWithinLimit(planTier, limitKey, currentCount) {
    const plan = PLAN_TIERS[planTier];
    if (!plan) return false;
    const limit = plan.limits[limitKey];
    if (limit === -1) return true; // Unlimited
    return currentCount < limit;
}

/**
 * Get the plan tier order for comparison
 */
export const PLAN_ORDER = { basic: 0, standard: 1, premium: 2, enterprise: 3 };

/**
 * Check if planA >= planB
 * @param {string} planA
 * @param {string} planB
 * @returns {boolean}
 */
export function planAtLeast(planA, planB) {
    return (PLAN_ORDER[planA] || 0) >= (PLAN_ORDER[planB] || 0);
}

/**
 * Get upgrade benefits — what features the user gains by upgrading
 * @param {string} currentTier - Current plan tier
 * @param {string} targetTier - Target upgrade tier
 * @returns {string[]} Array of feature labels that would be unlocked
 */
export function getUpgradeBenefits(currentTier, targetTier) {
    const currentPlan = PLAN_TIERS[currentTier];
    const targetPlan = PLAN_TIERS[targetTier];
    if (!currentPlan || !targetPlan) return [];

    return Object.keys(targetPlan.features)
        .filter(f => targetPlan.features[f] && !currentPlan.features[f])
        .map(f => FEATURE_LABELS[f] || f);
}

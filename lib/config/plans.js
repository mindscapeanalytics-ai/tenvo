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
            quotations: true,
            multi_warehouse: false,
            advanced_reports: false,
        },
    },

    standard: {
        key: 'standard',
        name: 'Standard',
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
            quotations: true,
            multi_warehouse: true,
            advanced_reports: false,
        },
    },

    premium: {
        key: 'premium',
        name: 'Premium',
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
            quotations: true,
            multi_warehouse: true,
            advanced_reports: true,
        },
    },

    enterprise: {
        key: 'enterprise',
        name: 'Enterprise',
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
            quotations: true,
            multi_warehouse: true,
            advanced_reports: true,
        },
    },
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

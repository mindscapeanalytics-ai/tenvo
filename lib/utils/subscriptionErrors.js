import { PLAN_TIERS, resolvePlanTier } from '@/lib/config/plans';

const LIMIT_LABELS = {
    max_users: 'Users',
    max_products: 'Products',
    max_customers: 'Customers',
    max_vendors: 'Vendors',
    max_warehouses: 'Warehouses',
    max_pos_terminals: 'POS terminals',
    max_invoices_per_month: 'Monthly invoices',
};

export function isEntitlementError(error) {
    const code = error?.code;
    return code === 'PLAN_UPGRADE_REQUIRED' || code === 'LIMIT_REACHED';
}

export function markEntitlementErrorHandled(error) {
    if (error && typeof error === 'object') {
        error.__entitlementHandled = true;
    }
    return error;
}

export function isEntitlementErrorHandled(error) {
    return Boolean(error?.__entitlementHandled);
}

export function getEntitlementErrorMessage(error, options = {}) {
    const action = options.action || 'perform this action';
    const code = error?.code;

    if (code === 'PLAN_UPGRADE_REQUIRED') {
        const requiredPlan = resolvePlanTier(error?.requiredPlan || 'starter');
        const requiredName = PLAN_TIERS?.[requiredPlan]?.name || requiredPlan;
        return `This action requires the ${requiredName} plan. Upgrade in Settings to continue.`;
    }

    if (code === 'LIMIT_REACHED') {
        const key = error?.limitKey;
        const label = LIMIT_LABELS[key] || 'Resource';
        const limitValue = Number(error?.limit);
        const hasLimit = Number.isFinite(limitValue) && limitValue >= 0;
        const limitText = hasLimit ? ` (${limitValue})` : '';
        return `${label} limit reached${limitText}. Upgrade in Settings to ${action}.`;
    }

    return error?.message || 'Request failed';
}

/**
 * Server Action Guard
 * 
 * Provides a reusable wrapper for server actions that enforces:
 *   1. Authentication (user must be logged in)
 *   2. Business authorization (user must belong to the business)
 *   3. Role-based permission check
 *   4. Subscription feature flag check
 *   5. Subscription limit check (optional)
 * 
 * Usage in server actions:
 * 
 *   import { withGuard } from '@/lib/rbac/serverGuard';
 *   
 *   export async function createExpense(businessId, data) {
 *     const { business, user } = await withGuard(businessId, {
 *       permission: 'finance.manage_expenses',
 *       feature: 'expense_tracking',
 *     });
 *     // ... proceed with logic
 *   }
 */

import { hasPermission } from '@/lib/rbac/permissions';
import { planHasFeature, planWithinLimit, FEATURE_MIN_PLAN, PLAN_TIERS } from '@/lib/config/plans';

/**
 * Validate permission + subscription for a server action.
 * This is a lightweight, synchronous check function.
 * 
 * @param {object} options
 * @param {string} options.role - User's role in the business
 * @param {string} options.planTier - Business plan tier
 * @param {string} [options.permission] - Required permission key
 * @param {string} [options.feature] - Required feature flag key
 * @param {string} [options.limitKey] - Resource limit key (e.g., 'max_products')
 * @param {number} [options.currentCount] - Current resource count for limit check
 * @returns {{ success: boolean, error?: string, errorCode?: string }}
 */
export function validateAccess({
    role,
    planTier,
    permission,
    feature,
    limitKey,
    currentCount,
}) {
    // 1. Permission check
    if (permission) {
        if (!hasPermission(role || 'viewer', permission)) {
            return {
                success: false,
                error: `Access denied: your role "${role}" does not have permission "${permission}". Contact your administrator.`,
                errorCode: 'PERMISSION_DENIED',
            };
        }
    }

    // 2. Feature flag check (subscription tier)
    if (feature) {
        const tier = planTier || 'basic';
        if (!planHasFeature(tier, feature)) {
            const requiredPlan = FEATURE_MIN_PLAN[feature] || 'standard';
            const requiredPlanName = PLAN_TIERS[requiredPlan]?.name || requiredPlan;
            return {
                success: false,
                error: `This feature requires the ${requiredPlanName} plan or higher. Your current plan: ${PLAN_TIERS[tier]?.name || tier}.`,
                errorCode: 'PLAN_UPGRADE_REQUIRED',
                requiredPlan,
            };
        }
    }

    // 3. Limit check (optional)
    if (limitKey && typeof currentCount === 'number') {
        const tier = planTier || 'basic';
        if (!planWithinLimit(tier, limitKey, currentCount)) {
            const limit = PLAN_TIERS[tier]?.limits?.[limitKey];
            return {
                success: false,
                error: `You've reached the limit of ${limit} ${limitKey.replace('max_', '').replace(/_/g, ' ')} on your current plan. Please upgrade to add more.`,
                errorCode: 'LIMIT_REACHED',
                limit,
            };
        }
    }

    return { success: true };
}

/**
 * Throw-on-failure variant for use in server actions where you want
 * to short-circuit with an error immediately.
 * 
 * @param {object} options - Same as validateAccess
 * @throws {Error} If access is denied
 */
export function enforceAccess(options) {
    const result = validateAccess(options);
    if (!result.success) {
        const error = new Error(result.error);
        error.code = result.errorCode;
        if (result.requiredPlan) error.requiredPlan = result.requiredPlan;
        if (result.limit) error.limit = result.limit;
        throw error;
    }
}

/**
 * Utility to wrap a server action result with access validation.
 * Returns { success: false, error: string } if access denied,
 * otherwise calls the action function.
 * 
 * @param {object} accessOptions - Options for validateAccess
 * @param {Function} actionFn - Async function to execute if access is granted
 * @returns {Promise<{ success: boolean, error?: string, [key: string]: any }>}
 */
export async function guardedAction(accessOptions, actionFn) {
    const accessResult = validateAccess(accessOptions);
    if (!accessResult.success) {
        return accessResult;
    }

    try {
        return await actionFn();
    } catch (error) {
        console.error('[guardedAction] Action failed:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred.',
        };
    }
}

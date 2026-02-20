// Plan Guard Middleware — not a server action file

import pool from '@/lib/db';
import { PLAN_TIERS, planHasFeature, planWithinLimit } from '@/lib/config/plans';

/**
 * Plan Guard Middleware
 * Validates that a business's plan allows a specific feature or resource limit.
 * 
 * Usage patterns:
 *   await checkPlanFeature(businessId, 'pos');
 *   await checkPlanLimit(businessId, 'max_users', currentUserCount);
 */

/**
 * Get the current plan tier for a business
 * @param {string} businessId
 * @param {import('pg').PoolClient} [txClient] - Optional transaction client
 * @returns {Promise<{plan_tier: string, plan_expires_at: Date|null}>}
 */
export async function getBusinessPlan(businessId, txClient = null) {
    const client = txClient || await pool.connect();
    const shouldRelease = !txClient;

    try {
        const result = await client.query(
            'SELECT plan_tier, plan_expires_at FROM businesses WHERE id = $1',
            [businessId]
        );

        if (result.rows.length === 0) {
            throw new Error('Business not found');
        }

        const { plan_tier, plan_expires_at } = result.rows[0];

        // Check if plan has expired → downgrade to basic
        if (plan_expires_at && new Date(plan_expires_at) < new Date()) {
            return { plan_tier: 'basic', plan_expires_at: null, expired: true };
        }

        return { plan_tier: plan_tier || 'basic', plan_expires_at, expired: false };
    } finally {
        if (shouldRelease) client.release();
    }
}

/**
 * Guard: Check if a business plan includes a feature
 * @param {string} businessId
 * @param {string} featureKey - Feature key from plans.js features object
 * @param {import('pg').PoolClient} [txClient]
 * @throws {Error} If feature not available on plan
 */
export async function checkPlanFeature(businessId, featureKey, txClient = null) {
    const { plan_tier } = await getBusinessPlan(businessId, txClient);

    if (!planHasFeature(plan_tier, featureKey)) {
        const planConfig = PLAN_TIERS[plan_tier];
        // Find the minimum plan that has this feature
        let requiredPlan = 'enterprise';
        for (const tier of ['basic', 'standard', 'premium', 'enterprise']) {
            if (planHasFeature(tier, featureKey)) {
                requiredPlan = tier;
                break;
            }
        }

        throw new Error(
            `Feature "${featureKey}" requires ${requiredPlan} plan or above. ` +
            `Current plan: ${planConfig?.name || plan_tier}. ` +
            `Please upgrade to unlock this feature.`
        );
    }
}

/**
 * Guard: Check if a business is within a usage limit
 * @param {string} businessId
 * @param {string} limitKey - e.g. 'max_users', 'max_products'
 * @param {number} currentCount - Current usage count
 * @param {import('pg').PoolClient} [txClient]
 * @throws {Error} If limit exceeded
 */
export async function checkPlanLimit(businessId, limitKey, currentCount, txClient = null) {
    const { plan_tier } = await getBusinessPlan(businessId, txClient);

    if (!planWithinLimit(plan_tier, limitKey, currentCount)) {
        const planConfig = PLAN_TIERS[plan_tier];
        const limit = planConfig?.limits?.[limitKey];

        throw new Error(
            `${limitKey.replace('max_', '').replace('_', ' ')} limit reached (${limit}). ` +
            `Current plan: ${planConfig?.name || plan_tier}. ` +
            `Please upgrade to add more.`
        );
    }
}

/**
 * Decorator: withPlan
 * Wraps a server action with plan-tier feature guard.
 * Checks BOTH authentication AND plan before executing.
 * 
 * @param {string} featureKey - Feature to check
 * @param {Function} action - Server action to wrap
 * @param {object} options - { businessIdArg: 'first'|'fromObject', businessIdKey: 'business_id' }
 * @returns {Function} Wrapped server action
 */
export function withPlan(featureKey, action, options = {}) {
    const { businessIdArg = 'first', businessIdKey = 'business_id' } = options;

    return async function (...args) {
        let businessId;
        if (businessIdArg === 'first') {
            businessId = args[0];
        } else if (businessIdArg === 'fromObject') {
            businessId = args[0]?.[businessIdKey] || args[0]?.businessId;
        }

        if (!businessId) {
            return { success: false, error: 'Business ID required' };
        }

        try {
            await checkPlanFeature(businessId, featureKey);
            return await action(...args);
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
}

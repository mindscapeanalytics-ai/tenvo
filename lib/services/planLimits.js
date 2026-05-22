import pool from '@/lib/db';

/**
 * Plan Limits Service
 * Enforces subscription plan limits for businesses
 */

const PLAN_LIMITS = {
  free: {
    products: 100,
    users: 2,
    locations: 1,
    monthlyOrders: 50,
    monthlyRevenue: 5000,
    apiCallsPerDay: 100,
    storageGB: 1,
  },
  starter: {
    products: 1000,
    users: 5,
    locations: 3,
    monthlyOrders: 500,
    monthlyRevenue: 50000,
    apiCallsPerDay: 1000,
    storageGB: 5,
  },
  growth: {
    products: 10000,
    users: 15,
    locations: 10,
    monthlyOrders: 5000,
    monthlyRevenue: 500000,
    apiCallsPerDay: 10000,
    storageGB: 25,
  },
  enterprise: {
    products: -1, // unlimited
    users: -1,
    locations: -1,
    monthlyOrders: -1,
    monthlyRevenue: -1,
    apiCallsPerDay: -1,
    storageGB: -1,
  },
};

/**
 * Get business plan tier and limits
 */
export async function getBusinessPlanInfo(businessId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT plan_tier, settings FROM business_settings WHERE business_id = $1`,
      [businessId]
    );
    
    if (result.rows.length === 0) {
      return { planTier: 'free', limits: PLAN_LIMITS.free };
    }
    
    const planTier = result.rows[0].plan_tier || 'free';
    return {
      planTier,
      limits: PLAN_LIMITS[planTier] || PLAN_LIMITS.free,
    };
  } finally {
    client.release();
  }
}

/**
 * Check if business can add more products
 */
export async function canAddProduct(businessId) {
  const client = await pool.connect();
  
  try {
    const { limits } = await getBusinessPlanInfo(businessId);
    
    // Unlimited
    if (limits.products === -1) return { allowed: true };
    
    // Count current products
    const result = await client.query(
      'SELECT COUNT(*) as count FROM products WHERE business_id = $1 AND is_active = true',
      [businessId]
    );
    
    const currentCount = parseInt(result.rows[0].count);
    
    if (currentCount >= limits.products) {
      return {
        allowed: false,
        reason: `Product limit reached (${currentCount}/${limits.products})`,
        current: currentCount,
        limit: limits.products,
        upgradePlan: 'starter',
      };
    }
    
    return {
      allowed: true,
      current: currentCount,
      limit: limits.products,
      remaining: limits.products - currentCount,
    };
  } finally {
    client.release();
  }
}

/**
 * Check if business can add more users
 */
export async function canAddUser(businessId) {
  const client = await pool.connect();
  
  try {
    const { limits } = await getBusinessPlanInfo(businessId);
    
    // Unlimited
    if (limits.users === -1) return { allowed: true };
    
    // Count current users (from business_members or similar table)
    const result = await client.query(
      `SELECT COUNT(*) as count FROM business_members WHERE business_id = $1`,
      [businessId]
    );
    
    const currentCount = parseInt(result.rows[0].count);
    
    if (currentCount >= limits.users) {
      return {
        allowed: false,
        reason: `User limit reached (${currentCount}/${limits.users})`,
        current: currentCount,
        limit: limits.users,
        upgradePlan: 'growth',
      };
    }
    
    return {
      allowed: true,
      current: currentCount,
      limit: limits.users,
      remaining: limits.users - currentCount,
    };
  } finally {
    client.release();
  }
}

/**
 * Check if business can create more orders this month
 */
export async function canCreateOrder(businessId) {
  const client = await pool.connect();
  
  try {
    const { limits } = await getBusinessPlanInfo(businessId);
    
    // Unlimited
    if (limits.monthlyOrders === -1) return { allowed: true };
    
    // Count orders this month
    const result = await client.query(
      `SELECT COUNT(*) as count FROM storefront_orders 
       WHERE business_id = $1 
       AND created_at >= DATE_TRUNC('month', NOW())`,
      [businessId]
    );
    
    const currentCount = parseInt(result.rows[0].count);
    
    if (currentCount >= limits.monthlyOrders) {
      return {
        allowed: false,
        reason: `Monthly order limit reached (${currentCount}/${limits.monthlyOrders})`,
        current: currentCount,
        limit: limits.monthlyOrders,
        upgradePlan: 'starter',
      };
    }
    
    return {
      allowed: true,
      current: currentCount,
      limit: limits.monthlyOrders,
      remaining: limits.monthlyOrders - currentCount,
    };
  } finally {
    client.release();
  }
}

/**
 * Check if business can make API call (rate limiting)
 */
export async function canMakeApiCall(businessId) {
  const client = await pool.connect();
  
  try {
    const { limits } = await getBusinessPlanInfo(businessId);
    
    // Unlimited
    if (limits.apiCallsPerDay === -1) return { allowed: true };
    
    // Count API calls today (from api_usage_logs or similar)
    const result = await client.query(
      `SELECT COUNT(*) as count FROM api_usage_logs 
       WHERE business_id = $1 
       AND created_at >= DATE_TRUNC('day', NOW())`,
      [businessId]
    );
    
    const currentCount = parseInt(result.rows[0].count);
    
    if (currentCount >= limits.apiCallsPerDay) {
      return {
        allowed: false,
        reason: `Daily API limit reached (${currentCount}/${limits.apiCallsPerDay})`,
        current: currentCount,
        limit: limits.apiCallsPerDay,
        retryAfter: '24h',
      };
    }
    
    return {
      allowed: true,
      current: currentCount,
      limit: limits.apiCallsPerDay,
      remaining: limits.apiCallsPerDay - currentCount,
    };
  } finally {
    client.release();
  }
}

/**
 * Log API usage
 */
export async function logApiUsage(businessId, endpoint, method) {
  const client = await pool.connect();
  
  try {
    await client.query(
      `INSERT INTO api_usage_logs (business_id, endpoint, method, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [businessId, endpoint, method]
    );
  } catch (err) {
    // Silently fail - don't block API calls if logging fails
    console.error('Failed to log API usage:', err);
  } finally {
    client.release();
  }
}

/**
 * Get usage summary for dashboard
 */
export async function getUsageSummary(businessId) {
  const client = await pool.connect();
  
  try {
    const { planTier, limits } = await getBusinessPlanInfo(businessId);
    
    const [products, users, orders, revenue] = await Promise.all([
      client.query('SELECT COUNT(*) FROM products WHERE business_id = $1 AND is_active = true', [businessId]),
      client.query('SELECT COUNT(*) FROM business_members WHERE business_id = $1', [businessId]),
      client.query(`SELECT COUNT(*) FROM storefront_orders WHERE business_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`, [businessId]),
      client.query(`SELECT COALESCE(SUM(total_amount), 0) FROM storefront_orders WHERE business_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`, [businessId]),
    ]);
    
    return {
      planTier,
      products: {
        used: parseInt(products.rows[0].count),
        limit: limits.products,
        percentage: limits.products > 0 ? Math.round((parseInt(products.rows[0].count) / limits.products) * 100) : 0,
      },
      users: {
        used: parseInt(users.rows[0].count),
        limit: limits.users,
        percentage: limits.users > 0 ? Math.round((parseInt(users.rows[0].count) / limits.users) * 100) : 0,
      },
      orders: {
        used: parseInt(orders.rows[0].count),
        limit: limits.monthlyOrders,
        percentage: limits.monthlyOrders > 0 ? Math.round((parseInt(orders.rows[0].count) / limits.monthlyOrders) * 100) : 0,
      },
      revenue: {
        used: parseFloat(revenue.rows[0].sum),
        limit: limits.monthlyRevenue,
        percentage: limits.monthlyRevenue > 0 ? Math.round((parseFloat(revenue.rows[0].sum) / limits.monthlyRevenue) * 100) : 0,
      },
    };
  } finally {
    client.release();
  }
}

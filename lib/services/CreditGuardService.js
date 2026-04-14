import pool from '@/lib/db';

/**
 * Credit Guard Service
 * Protects businesses from over-extending credit to customers.
 * Essential for Wholesale and Institutional B2B markets.
 */
export const CreditGuardService = {
    /**
     * Check if a customer has sufficient credit limit for a new transaction.
     * @param {string} businessId
     * @param {string} customerId
     * @param {number} newTransactionAmount
     * @param {object} txClient - Optional transaction client
     */
    async checkCreditLimit(businessId, customerId, newTransactionAmount, txClient = null) {
        // Skip check for walk-in or anonymous customers
        if (!customerId) return { allowed: true }; 

        const client = txClient || await pool.connect();
        try {
            const res = await client.query(`
                SELECT credit_limit, outstanding_balance, name
                FROM customers
                WHERE id = $1 AND business_id = $2
            `, [customerId, businessId]);

            if (res.rows.length === 0) throw new Error('Customer not found');
            const customer = res.rows[0];

            const limit = Number(customer.credit_limit || 0);
            const currentBalance = Number(customer.outstanding_balance || 0);

            /**
             * Business Rule: 
             * - If credit_limit is NULL or 0, we assume 'Unlimited' or 'Not Enforced'.
             * - In enterprise accounts, 0 usually means 'Strictly Cash'. 
             * - For this implementation, we enforce ONLY if limit > 0.
             */
            if (limit > 0) {
                const projectedBalance = currentBalance + Number(newTransactionAmount);
                if (projectedBalance > limit) {
                    return {
                        allowed: false,
                        customerName: customer.name,
                        limit,
                        currentBalance,
                        projectedBalance,
                        reason: `Credit limit exceeded for ${customer.name}. Limit: ${limit}, Projected: ${projectedBalance.toFixed(2)}`
                    };
                }
            }

            return { allowed: true };
        } finally {
            if (!txClient) client.release();
        }
    }
};

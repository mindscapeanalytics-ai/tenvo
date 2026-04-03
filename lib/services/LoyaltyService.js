import pool from '@/lib/db';

/**
 * Loyalty Service (Enterprise SOA)
 * Orchestrates Program management, Point accruals, and Redemptions.
 */
export const LoyaltyService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Create Loyalty Program
     */
    async createProgram(data, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const res = await client.query(`
                INSERT INTO loyalty_programs (
                    business_id, name, points_per_amount, currency_per_point, min_redeem_points
                ) VALUES ($1, $2, $3, $4, $5) RETURNING *
            `, [
                data.businessId, data.name,
                data.pointsPerAmount || 1,
                data.currencyPerPoint || 1,
                data.minRedeemPoints || 100
            ]);
            return res.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Earn Points
     */
    async earnPoints(data, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const progRes = await client.query(
                `SELECT * FROM loyalty_programs WHERE id = $1 AND business_id = $2 AND is_active = true`,
                [data.programId, data.businessId]
            );
            if (progRes.rows.length === 0) throw new Error('Loyalty program not found or inactive');
            const program = progRes.rows[0];

            const points = Math.floor(parseFloat(data.amount) * parseFloat(program.points_per_amount));
            if (points <= 0) throw new Error('Amount too small to earn points');

            const balRes = await client.query(`
                SELECT COALESCE(SUM(CASE WHEN type = 'earn' OR type = 'adjust' THEN points ELSE 0 END), 0)
                     - COALESCE(SUM(CASE WHEN type = 'redeem' OR type = 'expire' THEN points ELSE 0 END), 0) as balance
                FROM loyalty_transactions
                WHERE customer_id = $1 AND program_id = $2
            `, [data.customerId, data.programId]);
            const currentBalance = parseInt(balRes.rows[0].balance);
            const newBalance = currentBalance + points;

            await client.query(`
                INSERT INTO loyalty_transactions (
                    business_id, program_id, customer_id, type, points,
                    reference_type, reference_id, balance_after, description
                ) VALUES ($1, $2, $3, 'earn', $4, $5, $6, $7, $8)
            `, [
                data.businessId, data.programId, data.customerId, points,
                data.referenceType || 'pos_transaction', data.referenceId || null,
                newBalance, data.description || `Earned ${points} points`
            ]);

            if (shouldManageTransaction) await client.query('COMMIT');
            return { pointsEarned: points, newBalance };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Redeem Points
     */
    async redeemPoints(data, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const progRes = await client.query(
                `SELECT * FROM loyalty_programs WHERE id = $1 AND business_id = $2 AND is_active = true`,
                [data.programId, data.businessId]
            );
            if (progRes.rows.length === 0) throw new Error('Loyalty program not found or inactive');
            const program = progRes.rows[0];

            const pointsToRedeem = parseInt(data.points);
            if (pointsToRedeem < parseInt(program.min_redeem_points)) {
                throw new Error(`Minimum ${program.min_redeem_points} points required to redeem`);
            }

            const balRes = await client.query(`
                SELECT COALESCE(SUM(CASE WHEN type = 'earn' OR type = 'adjust' THEN points ELSE 0 END), 0)
                     - COALESCE(SUM(CASE WHEN type = 'redeem' OR type = 'expire' THEN points ELSE 0 END), 0) as balance
                FROM loyalty_transactions
                WHERE customer_id = $1 AND program_id = $2
            `, [data.customerId, data.programId]);
            const currentBalance = parseInt(balRes.rows[0].balance);

            if (pointsToRedeem > currentBalance) throw new Error('Insufficient points balance');

            const discountAmount = Math.round(pointsToRedeem * parseFloat(program.currency_per_point) * 100) / 100;
            const newBalance = currentBalance - pointsToRedeem;

            await client.query(`
                INSERT INTO loyalty_transactions (
                    business_id, program_id, customer_id, type, points,
                    reference_type, reference_id, balance_after, description
                ) VALUES ($1, $2, $3, 'redeem', $4, $5, $6, $7, $8)
            `, [
                data.businessId, data.programId, data.customerId, pointsToRedeem,
                data.referenceType || 'pos_transaction', data.referenceId || null,
                newBalance, `Redeemed ${pointsToRedeem} points for Rs.${discountAmount} discount`
            ]);

            if (shouldManageTransaction) await client.query('COMMIT');
            return { pointsRedeemed: pointsToRedeem, discountAmount, newBalance };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    }
};

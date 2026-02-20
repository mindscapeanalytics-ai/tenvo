'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) await verifyBusinessAccess(session.user.id, businessId, [], client);
    return session;
}

// ─── Program Management ─────────────────────────────────────────────────────

/**
 * Create a loyalty program for a business
 */
export async function createLoyaltyProgramAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);

        const result = await client.query(`
            INSERT INTO loyalty_programs (
                business_id, name, points_per_amount, currency_per_point, min_redeem_points
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [
            data.businessId, data.name,
            data.pointsPerAmount || 1,
            data.currencyPerPoint || 1,
            data.minRedeemPoints || 100
        ]);

        return { success: true, program: result.rows[0] };
    } catch (error) {
        console.error('Create loyalty program error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get loyalty programs for a business
 */
export async function getLoyaltyProgramsAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(
            `SELECT * FROM loyalty_programs WHERE business_id = $1 ORDER BY created_at DESC`,
            [businessId]
        );
        return { success: true, programs: result.rows };
    } catch (error) {
        console.error('Get loyalty programs error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Points Operations ──────────────────────────────────────────────────────

/**
 * Earn loyalty points for a customer (typically called after POS sale)
 */
export async function earnLoyaltyPointsAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Get the program
        const progRes = await client.query(
            `SELECT * FROM loyalty_programs WHERE id = $1 AND business_id = $2 AND is_active = true`,
            [data.programId, data.businessId]
        );
        if (progRes.rows.length === 0) throw new Error('Loyalty program not found or inactive');
        const program = progRes.rows[0];

        // Calculate points: amount * points_per_amount
        const points = Math.floor(parseFloat(data.amount) * parseFloat(program.points_per_amount));
        if (points <= 0) throw new Error('Amount too small to earn points');

        // Get current balance
        const balRes = await client.query(`
            SELECT COALESCE(SUM(CASE WHEN type = 'earn' OR type = 'adjust' THEN points ELSE 0 END), 0)
                 - COALESCE(SUM(CASE WHEN type = 'redeem' OR type = 'expire' THEN points ELSE 0 END), 0) as balance
            FROM loyalty_transactions
            WHERE customer_id = $1 AND program_id = $2
        `, [data.customerId, data.programId]);
        const currentBalance = parseInt(balRes.rows[0].balance);
        const newBalance = currentBalance + points;

        // Create earn transaction
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

        await client.query('COMMIT');
        return { success: true, pointsEarned: points, newBalance };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Earn loyalty points error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Redeem loyalty points (apply discount at POS)
 */
export async function redeemLoyaltyPointsAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query('BEGIN');

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

        // Check balance
        const balRes = await client.query(`
            SELECT COALESCE(SUM(CASE WHEN type = 'earn' OR type = 'adjust' THEN points ELSE 0 END), 0)
                 - COALESCE(SUM(CASE WHEN type = 'redeem' OR type = 'expire' THEN points ELSE 0 END), 0) as balance
            FROM loyalty_transactions
            WHERE customer_id = $1 AND program_id = $2
        `, [data.customerId, data.programId]);
        const currentBalance = parseInt(balRes.rows[0].balance);

        if (pointsToRedeem > currentBalance) {
            throw new Error(`Insufficient points. Available: ${currentBalance}, Requested: ${pointsToRedeem}`);
        }

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

        await client.query('COMMIT');
        return { success: true, pointsRedeemed: pointsToRedeem, discountAmount, newBalance };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Redeem loyalty points error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get loyalty balance and transaction history for a customer
 */
export async function getLoyaltyBalanceAction(businessId, customerId, programId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        const balRes = await client.query(`
            SELECT
                COALESCE(SUM(CASE WHEN type = 'earn' OR type = 'adjust' THEN points ELSE 0 END), 0) as total_earned,
                COALESCE(SUM(CASE WHEN type = 'redeem' THEN points ELSE 0 END), 0) as total_redeemed,
                COALESCE(SUM(CASE WHEN type = 'expire' THEN points ELSE 0 END), 0) as total_expired
            FROM loyalty_transactions
            WHERE customer_id = $1 AND program_id = $2
        `, [customerId, programId]);

        const stats = balRes.rows[0];
        const balance = parseInt(stats.total_earned) - parseInt(stats.total_redeemed) - parseInt(stats.total_expired);

        const history = await client.query(`
            SELECT * FROM loyalty_transactions
            WHERE customer_id = $1 AND program_id = $2
            ORDER BY created_at DESC LIMIT 50
        `, [customerId, programId]);

        return {
            success: true,
            balance,
            totalEarned: parseInt(stats.total_earned),
            totalRedeemed: parseInt(stats.total_redeemed),
            totalExpired: parseInt(stats.total_expired),
            history: history.rows,
        };
    } catch (error) {
        console.error('Get loyalty balance error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

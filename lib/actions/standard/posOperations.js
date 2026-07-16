'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { LoyaltyService } from '@/lib/services/LoyaltyService';
import { resolvePosSettings } from '@/lib/config/posSettings';
import {
    parsePosSessionNotes,
    serializePosSessionNotes,
} from '@/lib/utils/posCashDrawer';

async function requirePosAccess(businessId, client = null) {
    const { session } = await withGuard(businessId, {
        permission: 'pos.access',
        feature: 'pos',
        client,
    });
    return session;
}

/**
 * Verify manager PIN for privileged till actions (clear, tax exempt, large discount, paid out).
 */
export async function verifyPosManagerPinAction(businessId, pin) {
    try {
        await requirePosAccess(businessId);
        const client = await pool.connect();
        try {
            const res = await client.query(
                `SELECT settings FROM business_settings WHERE business_id = $1 LIMIT 1`,
                [businessId]
            );
            const settings = resolvePosSettings({ settings: res.rows[0]?.settings || {} });
            const expected = String(settings.managerPin || '').trim();
            if (!expected) {
                return { success: true, required: false };
            }
            const ok = String(pin || '').trim() === expected;
            if (!ok) return { success: false, error: 'Incorrect manager PIN' };
            return { success: true, required: true };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Active loyalty program + customer balance for POS (pos.access).
 */
export async function getPosLoyaltySummaryAction(businessId, customerId) {
    const client = await pool.connect();
    try {
        await requirePosAccess(businessId, client);
        if (!customerId) {
            return { success: true, program: null, balance: 0 };
        }

        const prog = await client.query(
            `SELECT id, name, points_per_amount, currency_per_point, min_redeem_points
             FROM loyalty_programs
             WHERE business_id = $1 AND is_active = true
             ORDER BY created_at DESC LIMIT 1`,
            [businessId]
        );
        if (prog.rows.length === 0) {
            return { success: true, program: null, balance: 0 };
        }
        const program = prog.rows[0];

        const balRes = await client.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type IN ('earn','adjust') THEN points ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN type IN ('redeem','expire') THEN points ELSE 0 END), 0) AS balance
             FROM loyalty_transactions
             WHERE business_id = $1 AND customer_id = $2 AND program_id = $3`,
            [businessId, customerId, program.id]
        );

        return {
            success: true,
            program: {
                id: program.id,
                name: program.name,
                pointsPerAmount: Number(program.points_per_amount) || 1,
                currencyPerPoint: Number(program.currency_per_point) || 1,
                minRedeemPoints: Number(program.min_redeem_points) || 100,
            },
            balance: Number(balRes.rows[0]?.balance) || 0,
        };
    } catch (error) {
        console.error('getPosLoyaltySummaryAction', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Redeem loyalty points as a till discount (pos.access).
 */
export async function redeemPosLoyaltyPointsAction(data) {
    try {
        await requirePosAccess(data.businessId);
        const result = await LoyaltyService.redeemPoints({
            businessId: data.businessId,
            programId: data.programId,
            customerId: data.customerId,
            points: data.points,
            referenceType: 'pos_transaction',
            referenceId: data.referenceId || null,
        });
        return { success: true, ...result };
    } catch (error) {
        console.error('redeemPosLoyaltyPointsAction', error);
        return { success: false, error: error.message };
    }
}

/**
 * Earn loyalty points after a completed POS sale (pos.access).
 */
export async function earnPosLoyaltyPointsAction(data) {
    try {
        await requirePosAccess(data.businessId);
        const result = await LoyaltyService.earnPoints({
            businessId: data.businessId,
            programId: data.programId,
            customerId: data.customerId,
            amount: data.amount,
            referenceType: 'pos_transaction',
            referenceId: data.referenceId || null,
            description: data.description,
        });
        return { success: true, ...result };
    } catch (error) {
        console.error('earnPosLoyaltyPointsAction', error);
        return { success: false, error: error.message };
    }
}

/**
 * Record paid-in / paid-out against an open POS session (stored in session notes JSON).
 */
export async function recordPosCashMovementAction(data) {
    const client = await pool.connect();
    try {
        const session = await requirePosAccess(data.businessId, client);
        const type = data.type === 'paid_out' ? 'paid_out' : 'paid_in';
        const amount = Math.round(Number(data.amount) * 100) / 100;
        if (!data.sessionId) return { success: false, error: 'Session required' };
        if (!(amount > 0)) return { success: false, error: 'Amount must be greater than zero' };

        const ses = await client.query(
            `SELECT id, notes FROM pos_sessions
             WHERE id = $1 AND business_id = $2 AND status = 'open' FOR UPDATE`,
            [data.sessionId, data.businessId]
        );
        if (ses.rows.length === 0) return { success: false, error: 'Open session not found' };

        const parsed = parsePosSessionNotes(ses.rows[0].notes);
        const movement = {
            type,
            amount,
            reason: String(data.reason || '').trim() || (type === 'paid_in' ? 'Paid in' : 'Paid out'),
            at: new Date().toISOString(),
            by: session?.user?.id || null,
        };
        parsed.cashMovements.push(movement);
        const notes = serializePosSessionNotes(parsed);

        await client.query(
            `UPDATE pos_sessions SET notes = $1 WHERE id = $2 AND business_id = $3`,
            [notes, data.sessionId, data.businessId]
        );

        return { success: true, movement, cashMovements: parsed.cashMovements };
    } catch (error) {
        console.error('recordPosCashMovementAction', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

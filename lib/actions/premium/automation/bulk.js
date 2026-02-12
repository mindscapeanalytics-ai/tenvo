'use server';
import pool from '@/lib/db';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function checkAuth(businessId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId, ['owner', 'admin']);
    }
    return session;
}

/**
 * Optimized bulk deletion for various business entities
 */
export async function bulkDeleteAction(businessId, entityType, ids) {
    if (!ids || ids.length === 0) return { success: true, count: 0 };

    try {
        await checkAuth(businessId);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let table;
            switch (entityType) {
                case 'invoices': table = 'invoices'; break;
                case 'products': table = 'products'; break;
                case 'customers': table = 'customers'; break;
                case 'vendors': table = 'vendors'; break;
                default: throw new Error(`Unsupported entity type: ${entityType}`);
            }

            // Perform bulk delete
            const query = `DELETE FROM ${table} WHERE business_id = $1 AND id = ANY($2)`;
            const res = await client.query(query, [businessId, ids]);

            await client.query('COMMIT');
            return { success: true, count: res.rowCount };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`Bulk delete failed for ${entityType}:`, error);
        return { success: false, error: error.message };
    }
}

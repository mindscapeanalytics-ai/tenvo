'use server';
import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, permission = 'inventory.delete', client = null) {
    const { session } = await withGuard(businessId, {
        permission,
        feature: 'ai_analytics',
        client,
    });
    return session;
}

/**
 * Optimized bulk deletion for various business entities
 */
export async function bulkDeleteAction(businessId, entityType, ids) {
    if (!ids || ids.length === 0) return { success: true, count: 0 };

    try {
        const entityConfig = {
            invoices: { table: 'invoices', permission: 'sales.delete_invoice' },
            products: { table: 'products', permission: 'inventory.delete' },
            customers: { table: 'customers', permission: 'customers.delete' },
            vendors: { table: 'vendors', permission: 'vendors.delete' },
        };

        const config = entityConfig[entityType];
        if (!config) {
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        await checkAuth(businessId, config.permission);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const table = config.table;

            // Perform bulk delete (Soft Delete for core entities)
            let query;
            if (['products', 'customers', 'vendors'].includes(table)) {
                query = `UPDATE ${table} SET is_deleted = true, is_active = false, deleted_at = NOW(), updated_at = NOW() WHERE business_id = $1 AND id = ANY($2)`;
            } else {
                // Invoices and other records might still use hard delete or have specific logic
                query = `DELETE FROM ${table} WHERE business_id = $1 AND id = ANY($2)`;
            }
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

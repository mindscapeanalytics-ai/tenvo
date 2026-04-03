'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import {
    addStockSchema,
    removeStockSchema,
    transferStockSchema,
    reserveStockSchema,
    releaseStockSchema,
    adjustStockSchema,
    validateWithSchema
} from '@/lib/validation/schemas';
import { InventoryService } from '@/lib/services/InventoryService';
import { auditWrite } from '@/lib/actions/_shared/audit';

// Helper to check auth and business access
async function checkAuth(businessId, client = null, permission = 'inventory.view') {
    const { session } = await withGuard(businessId, { permission, client });
    return session;
}

/**
 * Server Action: Reserve Stock for a Sales Order
 */
export async function reserveStockAction(params, txClient = null) {
    try {
        const validation = validateWithSchema(reserveStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = txClient || await pool.connect();
        try {
            await checkAuth(validated.business_id, client, 'inventory.adjust_stock');
            const reservation = await InventoryService.reserveStock(validated, client);
            return { success: true, reservation };
        } finally {
            if (!txClient) client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Release Reserved Stock
 */
export async function releaseStockAction(params, txClient = null) {
    try {
        const validation = validateWithSchema(releaseStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = txClient || await pool.connect();
        try {
            await checkAuth(validated.business_id, client, 'inventory.adjust_stock');
            const result = await InventoryService.releaseStock(validated, client);
            return result;
        } finally {
            if (!txClient) client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Add Stock (Purchase/Stock In)
 */
export async function addStockAction(params, txClient = null) {
    try {
        const validation = validateWithSchema(addStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = txClient || await pool.connect();
        try {
            const session = await checkAuth(validated.business_id, client, 'inventory.adjust_stock');
            const result = await InventoryService.addStock(validated, session.user.id, client);

            auditWrite({
                businessId: validated.business_id,
                action: 'create',
                entityType: 'stock_movement',
                entityId: result.movementId,
                description: `Stock added: ${validated.quantity} items`,
                metadata: { productId: validated.product_id, warehouseId: validated.warehouse_id }
            });

            return { success: true, ...result };
        } finally {
            if (!txClient) client.release();
        }
    } catch (e) {
        console.error("addStockAction error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Remove Stock (Sale/Stock Out)
 */
export async function removeStockAction(params, txClient = null) {
    try {
        const validation = validateWithSchema(removeStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = txClient || await pool.connect();
        try {
            const session = await checkAuth(validated.business_id, client, 'inventory.adjust_stock');
            const result = await InventoryService.removeStock(validated, session.user.id, client);

            auditWrite({
                businessId: validated.business_id,
                action: 'delete',
                entityType: 'stock_movement',
                entityId: result.movementId,
                description: `Stock removed: ${validated.quantity} items`,
                metadata: { productId: validated.product_id, warehouseId: validated.warehouse_id }
            });

            return { success: true, ...result };
        } finally {
            if (!txClient) client.release();
        }
    } catch (e) {
        console.error("removeStockAction error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Transfer Stock
 */
export async function transferStockAction(params) {
    try {
        const validation = validateWithSchema(transferStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = await pool.connect();
        try {
            const session = await checkAuth(validated.business_id, client, 'inventory.transfer');
            const result = await InventoryService.transferStock(validated, session.user.id, client);
            return result;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("transferStockAction error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Adjust Stock
 */
export async function adjustStockAction(params) {
    try {
        const validation = validateWithSchema(adjustStockSchema, params);
        if (!validation.success) return { success: false, error: 'Validation failed', errors: validation.errors };
        const validated = validation.data;

        const client = await pool.connect();
        try {
            const session = await checkAuth(validated.business_id, client, 'inventory.adjust_stock');
            const result = await InventoryService.adjustStock({
                businessId: validated.business_id,
                productId: validated.product_id,
                warehouseId: validated.warehouse_id,
                adjustmentType: validated.quantity_change > 0 ? 'add' : 'remove',
                quantity: Math.abs(validated.quantity_change),
                reason: validated.reason,
                notes: validated.notes
            }, session.user.id, client);
            return result;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("adjustStockAction error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Stock Valuation
 */
export async function getStockValuationAction(businessId, warehouseId = null) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'inventory.view');
            return await InventoryService.getStockValuation(businessId, warehouseId);
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Stock Movements
 */
export async function getStockMovementsAction(productId, limit = 50) {
    try {
        const client = await pool.connect();
        try {
            const pRes = await client.query('SELECT business_id FROM products WHERE id = $1', [productId]);
            if (pRes.rows.length === 0) throw new Error('Product not found');
            await checkAuth(pRes.rows[0].business_id, client, 'inventory.view');
            const res = await client.query(`
                SELECT m.*, w.name as warehouse_name, pb.batch_number
                FROM stock_movements m
                LEFT JOIN warehouse_locations w ON m.warehouse_id = w.id
                LEFT JOIN product_batches pb ON m.batch_id = pb.id
                WHERE m.product_id = $1 AND m.business_id = $2
                ORDER BY m.created_at DESC
                LIMIT $3
            `, [productId, pRes.rows[0].business_id, limit]);

            // Map keys to match expected output if needed (e.g. nested objects)
            // Original used Supabase join: warehouses (name). Result is { ..., warehouses: { name: ... } }
            // Our SQL returns flat `warehouse_name`.
            // We should map it to match UI expectations if it accesses properties deeply.
            // Let's assume UI might do `movement.warehouses?.name`.
            const movements = res.rows.map(row => ({
                ...row,
                warehouses: { name: row.warehouse_name },
                product_batches: { batch_number: row.batch_number }
            }));

            return { success: true, movements };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Low Stock Alerts
 */
export async function getLowStockAlertsAction(businessId) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'inventory.view');
            // Using a default threshold of 10 if min_stock_level is not set/exists
            // Checking if min_stock_level column exists effectively by coalescing or just using logic.
            // Ideally schema has min_stock_level. If not, we assume 5.
            const res = await client.query(`
                SELECT id, name, sku, stock, min_stock
                FROM products 
                WHERE business_id = $1 
                AND is_active = true 
                AND stock <= COALESCE(min_stock, 5)
                ORDER BY stock ASC
            `, [businessId]);

            return { success: true, alerts: res.rows };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Recent Stock Adjustments (business-wide)
 */
export async function getRecentStockAdjustmentsAction(businessId, limit = 100) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'inventory.view');

            const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

            const res = await client.query(`
                SELECT
                    m.id,
                    m.business_id,
                    m.product_id,
                    m.warehouse_id,
                    m.quantity_change,
                    m.notes,
                    m.created_at,
                    p.name as product_name,
                    p.stock as current_stock,
                    w.name as warehouse_name
                FROM stock_movements m
                LEFT JOIN products p ON p.id = m.product_id
                LEFT JOIN warehouse_locations w ON w.id = m.warehouse_id
                WHERE m.business_id = $1
                  AND m.transaction_type = 'adjustment'
                ORDER BY m.created_at DESC
                LIMIT $2
            `, [businessId, safeLimit]);

            const adjustments = res.rows.map((row) => ({
                id: row.id,
                productId: row.product_id,
                productName: row.product_name || 'Unknown',
                adjustmentType: Number(row.quantity_change) >= 0 ? 'increase' : 'decrease',
                quantity: Math.abs(Number(row.quantity_change) || 0),
                newStock: Number(row.current_stock || 0),
                warehouseName: row.warehouse_name || 'Primary',
                reason: String(row.notes || '').split(':')[0] || 'Stock Adjustment',
                notes: row.notes || '',
                createdAt: row.created_at,
                createdBy: 'System'
            }));

            return { success: true, adjustments };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Inventory Reservations (active + historical)
 */
export async function getInventoryReservationsAction(businessId, status = 'all', limit = 200) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'inventory.view');

            const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
            const statusFilter = String(status || 'all').toLowerCase();

            const params = [businessId];
            let whereClause = 'r.business_id = $1';

            if (statusFilter !== 'all') {
                params.push(statusFilter);
                whereClause += ` AND r.status = $${params.length}`;
            }

            params.push(safeLimit);

            const res = await client.query(`
                SELECT
                    r.id,
                    r.business_id,
                    r.product_id,
                    r.batch_id,
                    r.quantity,
                    r.expires_at,
                    r.status,
                    r.reference,
                    r.created_at,
                    r.updated_at,
                    p.name AS product_name,
                    pb.batch_number
                FROM inventory_reservations r
                LEFT JOIN products p ON p.id = r.product_id
                LEFT JOIN product_batches pb ON pb.id = r.batch_id
                WHERE ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT $${params.length}
            `, params);

            return {
                success: true,
                reservations: res.rows.map((row) => ({
                    id: row.id,
                    productId: row.product_id,
                    batchId: row.batch_id,
                    quantity: Number(row.quantity || 0),
                    productName: row.product_name || 'Unknown Product',
                    batchNumber: row.batch_number || null,
                    reservedUntil: row.expires_at,
                    status: row.status,
                    reference: row.reference,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }))
            };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Expire overdue reservations and release reserved batch quantities
 */
export async function expireOverdueReservationsAction(businessId, limit = 200) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client, 'inventory.adjust_stock');
        await client.query('BEGIN');

        const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 1000));

        const overdueRes = await client.query(`
            SELECT id, batch_id, quantity
            FROM inventory_reservations
            WHERE business_id = $1
              AND status = 'active'
              AND expires_at < NOW()
            ORDER BY expires_at ASC
            LIMIT $2
            FOR UPDATE
        `, [businessId, safeLimit]);

        const overdue = overdueRes.rows;
        if (overdue.length === 0) {
            await client.query('COMMIT');
            return { success: true, expiredCount: 0 };
        }

        for (const reservation of overdue) {
            if (reservation.batch_id) {
                await client.query(`
                    UPDATE product_batches
                    SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - $1)
                    WHERE id = $2 AND business_id = $3
                `, [Number(reservation.quantity || 0), reservation.batch_id, businessId]);
            }
        }

        const ids = overdue.map(r => r.id);
        await client.query(`
            UPDATE inventory_reservations
            SET status = 'expired', updated_at = NOW()
            WHERE business_id = $1
              AND id = ANY($2::uuid[])
        `, [businessId, ids]);

        await client.query('COMMIT');
        return { success: true, expiredCount: ids.length };
    } catch (e) {
        await client.query('ROLLBACK');
        return { success: false, error: e.message };
    } finally {
        client.release();
    }
}

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

// ─── Table Management ───────────────────────────────────────────────────────

/**
 * Create or update a restaurant table
 */
export async function upsertTableAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);

        const result = await client.query(`
            INSERT INTO restaurant_tables (
                business_id, table_number, section, capacity, is_active, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (business_id, table_number)
            DO UPDATE SET section = $3, capacity = $4, is_active = $5, sort_order = $6
            RETURNING *
        `, [
            data.businessId, data.tableNumber,
            data.section || null, data.capacity || 4,
            data.isActive !== false, data.sortOrder || 0
        ]);

        return { success: true, table: result.rows[0] };
    } catch (error) {
        console.error('Upsert table error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get all tables for a business with current status
 */
export async function getTablesAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(`
            SELECT t.*,
                   ro.order_number as current_order_number,
                   ro.status as current_order_status,
                   ro.total_amount as current_order_total,
                   ro.waiter_id
            FROM restaurant_tables t
            LEFT JOIN restaurant_orders ro ON t.current_order_id = ro.id AND ro.status NOT IN ('completed', 'cancelled')
            WHERE t.business_id = $1 AND t.is_active = true
            ORDER BY t.sort_order, t.table_number
        `, [businessId]);
        return { success: true, tables: result.rows };
    } catch (error) {
        console.error('Get tables error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Update table status
 */
export async function updateTableStatusAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query(
            `UPDATE restaurant_tables SET status = $1, current_order_id = $2 WHERE id = $3 AND business_id = $4`,
            [data.status, data.currentOrderId || null, data.tableId, data.businessId]
        );
        return { success: true };
    } catch (error) {
        console.error('Update table status error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Order Management ───────────────────────────────────────────────────────

/**
 * Create a restaurant order + send items to kitchen
 */
export async function createRestaurantOrderAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Generate order number
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(order_number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS n
             FROM restaurant_orders WHERE business_id = $1`, [data.businessId]
        );
        const orderNumber = `ORD-${String(numRes.rows[0].n).padStart(6, '0')}`;

        // Calculate totals
        let subtotal = 0;
        for (const item of data.items) {
            const modPrice = (item.modifiers || []).reduce((sum, m) => sum + parseFloat(m.price || 0), 0);
            subtotal += (parseFloat(item.unitPrice) + modPrice) * (item.quantity || 1);
        }
        const taxAmount = Math.round(subtotal * ((data.taxPercent || 0) / 100) * 100) / 100;
        const discountAmount = parseFloat(data.discountAmount || 0);
        const totalAmount = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

        // Create order
        const orderRes = await client.query(`
            INSERT INTO restaurant_orders (
                business_id, order_number, table_id, order_type,
                customer_id, waiter_id, status,
                subtotal, tax_amount, discount_amount, total_amount, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            data.businessId, orderNumber, data.tableId || null,
            data.orderType || 'dine_in', data.customerId || null,
            session.user.id, subtotal, taxAmount, discountAmount,
            totalAmount, data.notes || null
        ]);
        const order = orderRes.rows[0];

        // Create order items
        const kitchenItems = [];
        for (const item of data.items) {
            await client.query(`
                INSERT INTO restaurant_order_items (
                    order_id, product_id, item_name, quantity,
                    unit_price, modifiers, special_instructions, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            `, [
                order.id, item.productId || null, item.itemName,
                item.quantity || 1, item.unitPrice,
                JSON.stringify(item.modifiers || []),
                item.specialInstructions || null
            ]);

            kitchenItems.push({
                item_name: item.itemName,
                qty: item.quantity || 1,
                mods: item.modifiers || [],
                special: item.specialInstructions || null,
            });
        }

        // Create kitchen order (KDS entry)
        await client.query(`
            INSERT INTO kitchen_orders (
                business_id, order_id, station, priority, status, items
            ) VALUES ($1, $2, $3, $4, 'pending', $5)
        `, [
            data.businessId, order.id,
            data.station || null, data.priority || 0,
            JSON.stringify(kitchenItems)
        ]);

        // Mark table as occupied if dine-in
        if (data.tableId && data.orderType !== 'takeaway') {
            await client.query(
                `UPDATE restaurant_tables SET status = 'occupied', current_order_id = $1 WHERE id = $2`,
                [order.id, data.tableId]
            );
        }

        await client.query('COMMIT');
        return { success: true, order };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create restaurant order error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Update order status (progression through workflow)
 */
export async function updateOrderStatusAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        await client.query(
            `UPDATE restaurant_orders SET status = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
            [data.status, data.orderId, data.businessId]
        );

        // If completed or cancelled, free the table
        if (data.status === 'completed' || data.status === 'cancelled') {
            await client.query(
                `UPDATE restaurant_tables SET status = 'available', current_order_id = NULL
                 WHERE current_order_id = $1`,
                [data.orderId]
            );
        }

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update order status error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get active restaurant orders (for dashboard/KDS)
 */
export async function getActiveOrdersAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        let query = `
            SELECT ro.*,
                   rt.table_number,
                   rt.section,
                   c.name as customer_name,
                   json_agg(json_build_object(
                       'id', roi.id,
                       'item_name', roi.item_name,
                       'quantity', roi.quantity,
                       'unit_price', roi.unit_price,
                       'modifiers', roi.modifiers,
                       'special_instructions', roi.special_instructions,
                       'status', roi.status
                   ) ORDER BY roi.created_at) as items
            FROM restaurant_orders ro
            LEFT JOIN restaurant_tables rt ON ro.table_id = rt.id
            LEFT JOIN customers c ON ro.customer_id = c.id
            LEFT JOIN restaurant_order_items roi ON ro.id = roi.order_id
            WHERE ro.business_id = $1
        `;
        const params = [businessId];
        let idx = 2;

        if (filters.status) {
            query += ` AND ro.status = $${idx}`;
            params.push(filters.status);
            idx++;
        } else {
            query += ` AND ro.status NOT IN ('completed', 'cancelled')`;
        }

        if (filters.orderType) {
            query += ` AND ro.order_type = $${idx}`;
            params.push(filters.orderType);
            idx++;
        }

        query += ` GROUP BY ro.id, rt.table_number, rt.section, c.name`;
        query += ` ORDER BY ro.created_at DESC`;

        const result = await client.query(query, params);
        return { success: true, orders: result.rows };
    } catch (error) {
        console.error('Get active orders error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Kitchen Display System (KDS) ───────────────────────────────────────────

/**
 * Get kitchen queue (for KDS screen)
 */
export async function getKitchenQueueAction(businessId, station = null) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        let query = `
            SELECT ko.*,
                   ro.order_number,
                   ro.order_type,
                   rt.table_number,
                   EXTRACT(EPOCH FROM (NOW() - ko.created_at))::int as seconds_elapsed
            FROM kitchen_orders ko
            JOIN restaurant_orders ro ON ko.order_id = ro.id
            LEFT JOIN restaurant_tables rt ON ro.table_id = rt.id
            WHERE ko.business_id = $1 AND ko.status IN ('pending', 'preparing')
        `;
        const params = [businessId];

        if (station) {
            query += ` AND ko.station = $2`;
            params.push(station);
        }

        query += ` ORDER BY ko.priority DESC, ko.created_at ASC`;

        const result = await client.query(query, params);
        return { success: true, queue: result.rows };
    } catch (error) {
        console.error('Get kitchen queue error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Update kitchen order status (KDS interaction)
 */
export async function updateKitchenOrderAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        const updates = { status: data.status };
        if (data.status === 'preparing') updates.started_at = 'NOW()';
        if (data.status === 'ready' || data.status === 'completed') updates.completed_at = 'NOW()';

        await client.query(`
            UPDATE kitchen_orders SET
                status = $1,
                started_at = CASE WHEN $1 = 'preparing' THEN NOW() ELSE started_at END,
                completed_at = CASE WHEN $1 IN ('ready', 'completed') THEN NOW() ELSE completed_at END
            WHERE id = $2 AND business_id = $3
        `, [data.status, data.kitchenOrderId, data.businessId]);

        // If kitchen order is ready, update parent restaurant order
        if (data.status === 'ready') {
            // Check if all kitchen orders for this restaurant order are ready
            const koRes = await client.query(`
                SELECT ko.order_id,
                       COUNT(*) FILTER (WHERE ko.status NOT IN ('ready', 'completed'))::int as pending_count
                FROM kitchen_orders ko
                WHERE ko.id = $1
                GROUP BY ko.order_id
            `, [data.kitchenOrderId]);

            if (koRes.rows.length > 0 && koRes.rows[0].pending_count === 0) {
                await client.query(
                    `UPDATE restaurant_orders SET status = 'ready', updated_at = NOW() WHERE id = $1`,
                    [koRes.rows[0].order_id]
                );
            }
        }

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update kitchen order error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

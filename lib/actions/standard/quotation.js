'use server';

import pool from '@/lib/db';
import { reserveStockAction, releaseStockAction, removeStockAction } from '@/lib/actions/standard/inventory/stock';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, permission = 'sales.view', client = null) {
    const { session } = await withGuard(businessId, { permission, client });
    return session;
}

/**
 * Server Action: Get all quotations for a business
 */
export async function getQuotationsAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, 'sales.view', client);

        const result = await client.query(`
            SELECT 
                q.*,
                c.name as customer_name,
                c.email as customer_email
            FROM quotations q
            LEFT JOIN customers c ON q.customer_id = c.id
            WHERE q.business_id = $1
            ORDER BY q.created_at DESC
        `, [businessId]);

        return { success: true, quotations: result.rows };
    } catch (error) {
        console.error('Get quotations error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

import { SalesService } from '@/lib/services/SalesService';

/**
 * Server Action: Create quotation with items
 */
export async function createQuotationAction(quotationData) {
    try {
        const session = await checkAuth(quotationData.business_id, 'sales.create_quotation');
        const quotation = await SalesService.createQuotation(quotationData, session.user.id);

        auditWrite({
            business_id: quotationData.business_id,
            user_id: session.user.id,
            action: 'create_quotation',
            entity_type: 'quotation',
            entity_id: quotation.id,
            meta: { total: quotation.total_amount }
        });

        return { success: true, quotation };
    } catch (error) {
        console.error('Create quotation error:', error);
        return { success: false, error: error.message };
    }
}


/**
 * Server Action: Get quotation details including items
 */
export async function getQuotationDetailAction(quotationId) {
    const client = await pool.connect();
    try {
        const headerResult = await client.query(`
            SELECT q.*, c.name as customer_name
            FROM quotations q
            LEFT JOIN customers c ON q.customer_id = c.id
            WHERE q.id = $1
        `, [quotationId]);

        if (headerResult.rows.length === 0) {
            return { success: false, error: 'Quotation not found' };
        }

        await checkAuth(headerResult.rows[0].business_id, 'sales.view', client);

        const itemsResult = await client.query(`
            SELECT qi.*, p.name as product_name
            FROM quotation_items qi
            LEFT JOIN products p ON qi.product_id = p.id
            WHERE qi.quotation_id = $1
        `, [quotationId]);

        return {
            success: true,
            quotation: {
                ...headerResult.rows[0],
                items: itemsResult.rows
            }
        };
    } catch (error) {
        console.error('Get quotation detail error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get all sales orders for a business
 */
export async function getSalesOrdersAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, 'sales.view', client);
        const result = await client.query(`
            SELECT 
                so.*,
                c.name as customer_name,
                c.email as customer_email
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.business_id = $1
            ORDER BY so.created_at DESC
        `, [businessId]);

        return { success: true, salesOrders: result.rows };
    } catch (error) {
        console.error('Get sales orders error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Create sales order with items
 */
export async function createSalesOrderAction(orderData) {
    try {
        const session = await checkAuth(orderData.business_id, 'sales.create_order');
        const salesOrder = await SalesService.createSalesOrder(orderData, session.user.id);

        auditWrite({
            business_id: orderData.business_id,
            user_id: session.user.id,
            action: 'create_sales_order',
            entity_type: 'sales_order',
            entity_id: salesOrder.id,
            meta: { quotation_id: orderData.quotation_id || null, total: salesOrder.total_amount }
        });

        return { success: true, salesOrder };
    } catch (error) {
        console.error('Create sales order error:', error);
        return { success: false, error: error.message };
    }
}


/**
 * Server Action: Get sales order details including items
 */
export async function getSalesOrderDetailAction(orderId) {
    const client = await pool.connect();
    try {
        const headerResult = await client.query(`
            SELECT so.*, c.name as customer_name
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.id = $1
        `, [orderId]);

        if (headerResult.rows.length === 0) {
            return { success: false, error: 'Sales Order not found' };
        }

        await checkAuth(headerResult.rows[0].business_id, 'sales.view', client);

        const itemsResult = await client.query(`
            SELECT soi.*, p.name as product_name
            FROM sales_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.sales_order_id = $1
        `, [orderId]);

        return {
            success: true,
            salesOrder: {
                ...headerResult.rows[0],
                items: itemsResult.rows
            }
        };
    } catch (error) {
        console.error('Get sales order detail error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get all delivery challans for a business
 */
export async function getChallansAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, 'sales.view', client);
        const result = await client.query(`
            SELECT 
                dc.*,
                c.name as customer_name,
                c.email as customer_email
            FROM delivery_challans dc
            LEFT JOIN customers c ON dc.customer_id = c.id
            WHERE dc.business_id = $1
            ORDER BY dc.created_at DESC
        `, [businessId]);

        return { success: true, challans: result.rows };
    } catch (error) {
        console.error('Get challans error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Create delivery challan with items
 */
export async function createChallanAction(challanData) {
    try {
        const session = await checkAuth(challanData.business_id, 'sales.create_challan');
        const challan = await SalesService.createChallan(challanData, session.user.id);

        auditWrite({
            business_id: challanData.business_id,
            user_id: session.user.id,
            action: 'create_delivery_challan',
            entity_type: 'delivery_challan',
            entity_id: challan.id,
            meta: { sales_order_id: challanData.sales_order_id || null, total: challanData.total_amount }
        });

        return { success: true, challan };
    } catch (error) {
        console.error('Create challan error:', error);
        return { success: false, error: error.message };
    }
}


/**
 * Server Action: Get delivery challan details including items
 */
export async function getChallanDetailAction(challanId) {
    const client = await pool.connect();
    try {
        const headerResult = await client.query(`
            SELECT dc.*, c.name as customer_name
            FROM delivery_challans dc
            LEFT JOIN customers c ON dc.customer_id = c.id
            WHERE dc.id = $1
        `, [challanId]);

        if (headerResult.rows.length === 0) {
            return { success: false, error: 'Delivery Challan not found' };
        }

        await checkAuth(headerResult.rows[0].business_id, 'sales.view', client);

        const itemsResult = await client.query(`
            SELECT ci.*, p.name as product_name
            FROM challan_items ci
            LEFT JOIN products p ON ci.product_id = p.id
            WHERE ci.challan_id = $1
        `, [challanId]);

        return {
            success: true,
            challan: {
                ...headerResult.rows[0],
                items: itemsResult.rows
            }
        };
    } catch (error) {
        console.error('Get challan detail error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }
    return session;
}

/**
 * Get Unified Activity Feed
 * Combines Invoices, Payments, Customers, and Products into a single chronological timeline.
 * Essential for the "Recent Activity" dashboard widget.
 */
export async function getUnifiedActivityFeedAction(businessId, limit = 10) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // Union query to fetch latest events from multiple tables
            // We use static text for 'type' to identify the source
            const query = `
                WITH activities AS (
                    -- New Invoices
                    SELECT 
                        i.id::text, 
                        i.created_at as date,
                        'invoice' as type,
                        'New invoice #' || i.invoice_number || ' for ' || COALESCE(c.name, 'Customer') as description,
                        i.grand_total as amount,
                        i.status
                    FROM invoices i
                    LEFT JOIN customers c ON i.customer_id = c.id
                    WHERE i.business_id = $1
                    
                    UNION ALL
                    
                    -- Payments Received (Receipts)
                    SELECT 
                        p.id::text, 
                        p.payment_date as date, 
                        'payment' as type,
                        'Payment received' || COALESCE(' for Invoice #' || i.invoice_number, '') as description,
                        p.amount,
                        p.payment_type as status -- using type as status differentiator for UI
                    FROM payments p
                    LEFT JOIN invoices i ON p.reference_id = i.id AND p.reference_type = 'invoice'
                    WHERE p.business_id = $1 AND p.payment_type = 'receipt'
                    
                    UNION ALL
                    
                    -- New Customers
                    SELECT 
                        id::text, 
                        created_at as date, 
                        'customer' as type,
                        'New customer added: ' || name as description,
                        0 as amount,
                        'active' as status
                    FROM customers
                    WHERE business_id = $1
                    
                    UNION ALL
                    
                    -- Low Stock Alerts (Dynamic)
                    SELECT 
                        id::text,
                        updated_at as date,
                        'alert' as type,
                        'Low stock warning: ' || variant_name || ' (' || stock || ' left)' as description,
                        stock as amount,
                        'warning' as status
                    FROM product_variants
                    WHERE business_id = $1 AND stock <= min_stock AND is_active = true
                )
                SELECT * FROM activities
                ORDER BY date DESC
                LIMIT $2
            `;

            const result = await client.query(query, [businessId, limit]);

            return {
                success: true,
                data: result.rows.map(row => ({
                    id: row.id,
                    type: row.type,
                    description: row.description,
                    amount: parseFloat(row.amount),
                    status: row.status,
                    date: row.date,
                    // Helper logic for UI icons/colors can be done here or on frontend
                    iconType: row.type === 'invoice' ? 'file-text' :
                        row.type === 'payment' ? 'credit-card' :
                            row.type === 'customer' ? 'user-plus' : 'alert-triangle'
                }))
            };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Activity Feed Error:', error);
        return { success: false, error: error.message };
    }
}

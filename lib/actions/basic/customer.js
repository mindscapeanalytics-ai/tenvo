'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }
    return session;
}

export async function getCustomersAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM customers 
                WHERE business_id = $1 AND is_deleted = false AND is_active = true
                ORDER BY created_at DESC
            `, [businessId]);
            return { success: true, customers: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('getCustomersAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createCustomerAction(customerData) {
    try {
        await checkAuth(customerData.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, name, email, phone, address, city,
                country, tax_id, type, notes, domain_data
            } = customerData;

            const result = await client.query(`
                INSERT INTO customers (
                    business_id, name, email, phone, address, city, 
                    country, tax_id, type, notes, domain_data,
                    is_active, is_deleted, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, false, NOW(), NOW())
                RETURNING *
            `, [
                business_id, name, email || null, phone || null,
                address || null, city || null, country || 'Pakistan',
                tax_id || null, type || 'individual', notes || null,
                JSON.stringify(domain_data || {})
            ]);

            return { success: true, customer: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('createCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCustomerAction(id, businessId, updates) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const fields = [];
            const values = [];
            let idx = 1;

            const allowedUpdates = [
                'name', 'email', 'phone', 'address', 'city',
                'country', 'tax_id', 'type', 'notes', 'is_active',
                'domain_data'
            ];

            for (const key of Object.keys(updates)) {
                if (allowedUpdates.includes(key)) {
                    fields.push(`${key} = $${idx++}`);
                    values.push(key === 'domain_data' ? JSON.stringify(updates[key]) : updates[key]);
                }
            }

            if (fields.length === 0) return { success: true, message: 'No changes', customer: updates };

            values.push(id);
            values.push(businessId);

            const result = await client.query(`
                UPDATE customers 
                SET ${fields.join(', ')}, updated_at = NOW()
                WHERE id = $${idx++} AND business_id = $${idx++} AND is_deleted = false
                RETURNING *
            `, values);

            if (result.rows.length === 0) return { success: false, error: 'Customer not found or deleted' };
            return { success: true, customer: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('updateCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCustomerAction(id, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // Soft delete
            const result = await client.query(`
                UPDATE customers 
                SET is_deleted = true, is_active = false, deleted_at = NOW(), updated_at = NOW()
                WHERE id = $1 AND business_id = $2
                RETURNING id
            `, [id, businessId]);

            if (result.rows.length === 0) return { success: false, error: 'Customer not found' };
            return { success: true, message: 'Customer soft-deleted successfully' };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('deleteCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

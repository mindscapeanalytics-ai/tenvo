'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId, [], client);
    }
    return session;
}

export async function getCustomersAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        const result = await client.query(`
            SELECT * FROM customers 
            WHERE business_id = $1 AND is_deleted = false AND is_active = true
            ORDER BY created_at DESC
        `, [businessId]);
        return { success: true, customers: result.rows };
    } catch (error) {
        console.error('getCustomersAction Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function createCustomerAction(customerData) {
    const client = await pool.connect();
    try {
        await checkAuth(customerData.business_id, client);

        const {
            business_id, name, email, phone, address, city,
            country, tax_id, type, notes, domain_data
        } = customerData;

        // Map tax_id to ntn (Schema Requirement)
        const ntn = tax_id || customerData.ntn || null;

        const result = await client.query(`
            INSERT INTO customers (
                business_id, name, email, phone, address, city, 
                country, ntn, type, notes, domain_data,
                is_active, is_deleted, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, false, NOW(), NOW())
            RETURNING *
        `, [
            business_id, name, email || null, phone || null,
            address || null, city || null, country || 'Pakistan',
            ntn, type || 'individual', notes || null,
            JSON.stringify(domain_data || {})
        ]);

        return { success: true, customer: result.rows[0] };
    } catch (error) {
        console.error('createCustomerAction Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function updateCustomerAction(id, businessId, updates) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        const fields = [];
        const values = [];
        let idx = 1;

        // Clean updates to match schema
        const cleanUpdates = { ...updates };
        if (cleanUpdates.tax_id) {
            cleanUpdates.ntn = cleanUpdates.tax_id;
            delete cleanUpdates.tax_id;
        }

        const allowedUpdates = [
            'name', 'email', 'phone', 'address', 'city',
            'country', 'ntn', 'type', 'notes', 'is_active',
            'domain_data'
        ];

        for (const key of Object.keys(cleanUpdates)) {
            if (allowedUpdates.includes(key)) {
                fields.push(`${key} = $${idx++}`);
                values.push(key === 'domain_data' ? JSON.stringify(cleanUpdates[key]) : cleanUpdates[key]);
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
    } catch (error) {
        console.error('updateCustomerAction Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function deleteCustomerAction(id, businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        // Soft delete
        const result = await client.query(`
            UPDATE customers 
            SET is_deleted = true, is_active = false, deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND business_id = $2
            RETURNING id
        `, [id, businessId]);

        if (result.rows.length === 0) return { success: false, error: 'Customer not found' };
        return { success: true, message: 'Customer soft-deleted successfully' };
    } catch (error) {
        console.error('deleteCustomerAction Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

'use server';

import { Pool } from 'pg';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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
            const result = await client.query(
                'SELECT * FROM customers WHERE business_id = $1 ORDER BY name ASC',
                [businessId]
            );
            return { success: true, customers: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function createCustomerAction(customerData) {
    try {
        await checkAuth(customerData.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, name, email, phone, ntn, cnic, srn,
                address, city, state, pincode, country,
                credit_limit, outstanding_balance, opening_balance, filer_status, domain_data
            } = customerData;

            const result = await client.query(`
                INSERT INTO customers (
                    business_id, name, email, phone, ntn, cnic, srn,
                    address, city, state, pincode, country,
                    credit_limit, outstanding_balance, opening_balance, filer_status, domain_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `, [
                business_id, name, email, phone, ntn, cnic, srn,
                address, city, state, pincode, country,
                credit_limit || 0, outstanding_balance || 0,
                opening_balance || 0, filer_status || 'none',
                domain_data ? JSON.stringify(domain_data) : '{}'
            ]);

            return { success: true, customer: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
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

            for (const [key, value] of Object.entries(updates)) {
                if (['name', 'email', 'phone', 'ntn', 'cnic', 'srn', 'address', 'city', 'state', 'pincode', 'country', 'credit_limit', 'outstanding_balance', 'domain_data', 'opening_balance', 'filer_status'].includes(key)) {
                    // Handle domain_data JSONB serialization
                    if (key === 'domain_data') {
                        fields.push(`${key} = $${idx++}`);
                        values.push(typeof value === 'string' ? value : JSON.stringify(value || {}));
                    } else {
                        fields.push(`${key} = $${idx++}`);
                        values.push(value);
                    }
                }
            }

            if (fields.length === 0) return { success: true, message: 'No changes' };

            values.push(id);
            values.push(businessId);

            const result = await client.query(`
                UPDATE customers 
                SET ${fields.join(', ')}, updated_at = NOW()
                WHERE id = $${idx} AND business_id = $${idx + 1}
                RETURNING *
            `, values);

            if (result.rows.length === 0) return { success: false, error: 'Not found or access denied' };
            return { success: true, customer: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteCustomerAction(id, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM customers WHERE id = $1 AND business_id = $2 RETURNING id',
                [id, businessId]
            );
            if (result.rows.length === 0) return { success: false, error: 'Not found or access denied' };
            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

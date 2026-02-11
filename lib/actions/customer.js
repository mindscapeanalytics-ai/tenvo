'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { customerSchema, validateWithSchema } from '@/lib/validation/schemas';

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
        // Sanitize numeric fields
        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedData = { ...customerData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        // Handle camelCase
        if (customerData.creditLimit !== undefined) sanitizedData.credit_limit = parseFloat(customerData.creditLimit) || 0;
        if (customerData.openingBalance !== undefined) sanitizedData.opening_balance = parseFloat(customerData.openingBalance) || 0;

        // ✅ 1. Validate with Zod
        const validation = validateWithSchema(customerSchema, sanitizedData);
        if (!validation.success) {
            return { success: false, error: 'Validation failed', errors: validation.errors };
        }
        const validated = validation.data;

        await checkAuth(validated.business_id);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                INSERT INTO customers (
                    business_id, name, email, phone, ntn, cnic, srn,
                    address, city, state, pincode, country,
                    credit_limit, outstanding_balance, opening_balance, filer_status, domain_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `, [
                validated.business_id, validated.name, validated.email, validated.phone,
                validated.ntn, validated.cnic, validated.srn,
                validated.address, validated.city, validated.state, validated.pincode, validated.country,
                validated.credit_limit, validated.outstanding_balance,
                validated.opening_balance, validated.filer_status,
                JSON.stringify(validated.domain_data || {})
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
            // Sanitize numeric fields
            const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
            const sanitizedUpdates = { ...updates };

            numericFields.forEach(field => {
                if (sanitizedUpdates[field] !== undefined) {
                    if (typeof sanitizedUpdates[field] === 'string') {
                        const val = parseFloat(sanitizedUpdates[field]);
                        sanitizedUpdates[field] = isNaN(val) ? 0 : val;
                    } else if (sanitizedUpdates[field] === null) {
                        sanitizedUpdates[field] = 0;
                    }
                }
            });

            // Handle camelCase
            if (updates.creditLimit !== undefined) sanitizedUpdates.credit_limit = parseFloat(updates.creditLimit) || 0;
            if (updates.openingBalance !== undefined) sanitizedUpdates.opening_balance = parseFloat(updates.openingBalance) || 0;

            // ✅ Validate with Zod before update
            const validation = validateWithSchema(customerSchema, { ...sanitizedUpdates, business_id: businessId, id });
            if (!validation.success) {
                return { success: false, error: 'Validation failed', errors: validation.errors };
            }
            const validated = validation.data;

            const fields = [];
            const values = [];
            let idx = 1;

            const validColumns = [
                'name', 'email', 'phone', 'contact_person', 'ntn', 'cnic', 'srn', 'address', 'city',
                'state', 'pincode', 'country', 'credit_limit', 'outstanding_balance',
                'domain_data', 'opening_balance', 'filer_status'
            ];

            for (const [key, value] of Object.entries(validated)) {
                let dbKey = key;
                if (key === 'contactPerson') dbKey = 'contact_person';

                if (validColumns.includes(dbKey) && key !== 'id' && key !== 'business_id') {
                    fields.push(`${dbKey} = $${idx++}`);
                    // Handle domain_data JSONB serialization
                    if (dbKey === 'domain_data') {
                        values.push(typeof value === 'string' ? value : JSON.stringify(value || {}));
                    } else {
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

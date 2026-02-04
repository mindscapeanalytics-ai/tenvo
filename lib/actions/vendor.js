'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createGLEntryAction } from '@/lib/actions/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

/**
 * Server Action: Get all vendors for a business
 */
export async function getVendorsAction(businessId) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM vendors 
                WHERE business_id = $1 
                ORDER BY name ASC
            `, [businessId]);

            return { success: true, vendors: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get vendors error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get vendor by ID
 */
export async function getVendorByIdAction(businessId, vendorId) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM vendors 
                WHERE id = $1 AND business_id = $2
            `, [vendorId, businessId]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Vendor not found' };
            }

            return { success: true, vendor: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get vendor error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create vendor
 */
export async function createVendorAction(vendorData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, vendorData.business_id);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO vendors (
                    business_id, name, email, phone, ntn, srn, 
                    address, city, payment_terms, credit_limit,
                    filer_status, opening_balance, outstanding_balance, domain_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13)
                RETURNING *
            `, [
                vendorData.business_id,
                vendorData.name,
                vendorData.email || null,
                vendorData.phone || null,
                vendorData.ntn || null,
                vendorData.srn || vendorData.strn || null,
                vendorData.address || null,
                vendorData.city || null,
                vendorData.payment_terms || null,
                vendorData.credit_limit || 0,
                vendorData.filer_status || 'none',
                vendorData.opening_balance || 0,
                vendorData.domain_data ? JSON.stringify({
                    ...vendorData.domain_data,
                    contact_person: vendorData.contactPerson || vendorData.contact_person
                }) : JSON.stringify({ contact_person: vendorData.contactPerson || vendorData.contact_person })
            ]);

            const vendor = result.rows[0];

            // If there's an opening balance, create a GL entry to record the initial liability
            if (Number(vendor.opening_balance) !== 0) {
                await createGLEntryAction({
                    businessId: vendorData.business_id,
                    date: new Date().toISOString(),
                    description: `Opening Balance for Supplier: ${vendor.name}`,
                    referenceType: 'vendor_opening',
                    referenceId: vendor.id,
                    entries: [
                        { accountCode: ACCOUNT_CODES.SUSPENSE_ACCOUNT || '3000', debit: Math.abs(Number(vendor.opening_balance)), credit: 0 },
                        { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: Math.abs(Number(vendor.opening_balance)) }
                    ]
                }, client);
            }

            await client.query('COMMIT');
            return { success: true, vendor };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create vendor error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update vendor
 */
export async function updateVendorAction(businessId, vendorId, updates) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            // Build dynamic update query with whitelist of valid columns
            const validColumns = ['name', 'email', 'phone', 'ntn', 'srn', 'address', 'city', 'state', 'payment_terms', 'credit_limit', 'outstanding_balance', 'domain_data', 'filer_status', 'opening_balance'];

            const filteredUpdates = {};
            for (const [key, val] of Object.entries(updates)) {
                let dbKey = key;
                if (key === 'contactPerson' || key === 'contact_person') {
                    // Skip or handle in domain_data if needed
                    continue;
                }
                if (key === 'strn') dbKey = 'srn';
                if (key === 'tax_number') dbKey = 'ntn';

                if (validColumns.includes(dbKey)) {
                    filteredUpdates[dbKey] = val;
                }
            }

            const fields = Object.keys(filteredUpdates);
            const values = Object.values(filteredUpdates).map((value, idx) => {
                if (fields[idx] === 'domain_data') {
                    return typeof value === 'string' ? value : JSON.stringify(value || {});
                }
                return value;
            });
            const setClause = fields.map((field, idx) => `${field} = $${idx + 3}`).join(', ');

            const result = await client.query(`
                UPDATE vendors 
                SET ${setClause}, updated_at = NOW()
                WHERE id = $1 AND business_id = $2
                RETURNING *
            `, [vendorId, businessId, ...values]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Vendor not found' };
            }

            return { success: true, vendor: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update vendor error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete vendor
 */
export async function deleteVendorAction(businessId, vendorId) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
                DELETE FROM vendors 
                WHERE id = $1 AND business_id = $2
                RETURNING id
            `, [vendorId, businessId]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Vendor not found' };
            }

            return { success: true, message: 'Vendor deleted successfully' };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete vendor error:', error);
        return { success: false, error: error.message };
    }
}

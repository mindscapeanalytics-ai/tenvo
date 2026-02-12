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

export async function getTaxConfigAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM tax_configurations WHERE business_id = $1 AND is_active = true',
                [businessId]
            );
            if (result.rows.length === 0) {
                return {
                    success: true,
                    config: {
                        sales_tax_rate: 17.00,
                        filer_status: 'Non-Filer',
                        withholding_tax_applicable: false
                    }
                };
            }
            return { success: true, config: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function configureTaxAction(taxData) {
    try {
        await checkAuth(taxData.businessId);
        const client = await pool.connect();
        try {
            const {
                businessId, ntnNumber, srnNumber, filerStatus,
                salesTaxRate, provincialTaxRate, withholdingTaxApplicable,
                withholdingTaxRate, withholdingTaxCategory, gstNumber, gstRate
            } = taxData;

            const result = await client.query(`
                INSERT INTO tax_configurations (
                    business_id, ntn_number, srn_number, filer_status,
                    sales_tax_rate, provincial_tax_rate, withholding_tax_applicable,
                    withholding_tax_rate, withholding_tax_category, gst_number, gst_rate,
                    is_active, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, NOW())
                ON CONFLICT (business_id) DO UPDATE SET
                    ntn_number = EXCLUDED.ntn_number,
                    srn_number = EXCLUDED.srn_number,
                    filer_status = EXCLUDED.filer_status,
                    sales_tax_rate = EXCLUDED.sales_tax_rate,
                    provincial_tax_rate = EXCLUDED.provincial_tax_rate,
                    withholding_tax_applicable = EXCLUDED.withholding_tax_applicable,
                    withholding_tax_rate = EXCLUDED.withholding_tax_rate,
                    withholding_tax_category = EXCLUDED.withholding_tax_category,
                    gst_number = EXCLUDED.gst_number,
                    gst_rate = EXCLUDED.gst_rate,
                    updated_at = NOW()
                RETURNING *
            `, [
                businessId, ntnNumber, srnNumber, filerStatus,
                salesTaxRate, provincialTaxRate, withholdingTaxApplicable,
                withholdingTaxRate, withholdingTaxCategory, gstNumber, gstRate
            ]);

            return { success: true, config: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

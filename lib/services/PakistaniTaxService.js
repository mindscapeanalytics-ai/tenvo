import pool from '@/lib/db';

/**
 * Pakistani Tax Service (Enterprise SOA)
 * Centralizes FBR compliance, NTN/SRN management, and dynamic tax calculation.
 */
export const PakistaniTaxService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Get tax configuration for a business
     */
    async getTaxConfig(businessId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const result = await client.query(
                'SELECT * FROM tax_configurations WHERE business_id = $1',
                [businessId]
            );
            if (result.rows.length === 0) {
                return {
                    sales_tax_rate: 17.00,
                    filer_status: 'Non-Filer',
                    withholding_tax_applicable: false
                };
            }
            return result.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Create or update tax configuration
     */
    async configureTax(data, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const {
                businessId, ntnNumber, srnNumber, filerStatus,
                salesTaxRate, provincialTaxRate, withholdingTaxApplicable,
                withholdingTaxRate, withholdingTaxCategory, gstNumber, gstRate
            } = data;

            const result = await client.query(`
                INSERT INTO tax_configurations (
                    business_id, ntn_number, srn_number, filer_status,
                    sales_tax_rate, provincial_tax_rate, withholding_tax_applicable,
                    withholding_tax_rate, withholding_tax_category, gst_number, gst_rate,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
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

            return result.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Calculation Helpers (Reference implementation)
     */
    calculateSalesTax(amount, taxConfig) {
        const rate = taxConfig?.sales_tax_rate || 17.00;
        return (amount * rate) / 100;
    },

    calculateProvincialTax(amount, taxConfig) {
        const rate = taxConfig?.provincial_tax_rate || 0;
        return (amount * rate) / 100;
    },

    calculateWithholdingTax(amount, taxConfig) {
        if (!taxConfig?.withholding_tax_applicable) return 0;
        const rate = taxConfig.withholding_tax_rate || 0;
        return (amount * rate) / 100;
    },

    calculateTotalTax(subtotal, taxConfig) {
        const salesTax = this.calculateSalesTax(subtotal, taxConfig);
        const provincialTax = this.calculateProvincialTax(subtotal, taxConfig);
        const withholdingTax = this.calculateWithholdingTax(subtotal, taxConfig);

        return {
            salesTax,
            provincialTax,
            withholdingTax,
            totalTax: salesTax + provincialTax,
            netAmount: subtotal + salesTax + provincialTax - withholdingTax,
            breakdown: {
                subtotal,
                salesTaxRate: taxConfig?.sales_tax_rate || 17.00,
                provincialTaxRate: taxConfig?.provincial_tax_rate || 0,
                withholdingTaxRate: taxConfig?.withholding_tax_rate || 0,
                filerStatus: taxConfig?.filer_status || 'Non-Filer'
            }
        };
    }
};

import { getTaxConfigAction, configureTaxAction } from '../actions/tax';

/**
 * Pakistani Tax Service
 * Handles FBR compliance, NTN, Sales Tax, Withholding Tax
 */
export const PakistaniTaxService = {

    /**
     * Create or update tax configuration for a business
     */
    async configureTax(params) {
        try {
            const result = await configureTaxAction(params);
            if (!result.success) throw new Error(result.error);
            return result.config;
        } catch (error) {
            console.error('Configure Tax Error:', error);
            throw error;
        }
    },

    /**
     * Get tax configuration for a business
     */
    async getTaxConfig(businessId) {
        try {
            const result = await getTaxConfigAction(businessId);
            if (!result.success) throw new Error(result.error);
            return result.config;
        } catch (error) {
            console.error('Get Tax Config Error:', error);
            return null;
        }
    },

    /**
     * Calculate sales tax (Federal)
     */
    calculateSalesTax(amount, taxConfig) {
        const rate = taxConfig?.sales_tax_rate || 17.00;
        return (amount * rate) / 100;
    },

    /**
     * Calculate provincial sales tax
     */
    calculateProvincialTax(amount, taxConfig) {
        const rate = taxConfig?.provincial_tax_rate || 0;
        return (amount * rate) / 100;
    },

    /**
     * Calculate withholding tax
     */
    calculateWithholdingTax(amount, taxConfig) {
        if (!taxConfig?.withholding_tax_applicable) {
            return 0;
        }
        const rate = taxConfig.withholding_tax_rate || 0;
        return (amount * rate) / 100;
    },

    /**
     * Calculate total tax for an invoice
     */
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
    },

    /**
     * Validate NTN format (7 digits - 1 digit)
     */
    validateNTN(ntn) {
        if (!ntn) return false;
        const ntnPattern = /^\d{7}-\d$/;
        return ntnPattern.test(ntn);
    },

    /**
     * Validate SRN format
     */
    validateSRN(srn) {
        if (!srn) return false;
        // SRN format varies, basic validation
        return srn.length >= 8;
    },

    /**
     * Get tax rate based on filer status
     * Filers get different rates in Pakistan
     */
    getTaxRateByFilerStatus(baseRate, filerStatus) {
        // In Pakistan, non-filers often pay higher tax rates
        if (filerStatus === 'Non-Filer') {
            return baseRate * 2; // Example: double rate for non-filers
        }
        return baseRate;
    },

    /**
     * Generate FBR-compliant invoice number
     * Format: FBR-YYYY-NNNNNN
     */
    generateFBRInvoiceNumber(businessId, sequenceNumber) {
        const year = new Date().getFullYear();
        const paddedSequence = String(sequenceNumber).padStart(6, '0');
        const businessPrefix = businessId.substring(0, 4).toUpperCase();
        return `FBR-${businessPrefix}-${year}-${paddedSequence}`;
    }
};

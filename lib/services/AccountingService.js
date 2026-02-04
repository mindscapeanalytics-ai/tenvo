import { createGLEntryAction, getAccountBalanceAction, initializeCOAAction } from '@/lib/actions/accounting';
import { DEFAULT_COA, ACCOUNT_CODES } from '../config/accounting';

/**
 * Accounting Service
 * Manages General Ledger (GL) and Double-Entry Accounting
 * Now acts as a wrapper around Server Actions
 */
export const AccountingService = {

    async createGLEntry(params) {
        const result = await createGLEntryAction(params);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    async getAccountBalance(businessId, accountCode) {
        return await getAccountBalanceAction(businessId, accountCode);
    },

    async initializeCOA(businessId) {
        const result = await initializeCOAAction(businessId, DEFAULT_COA);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    /**
     * High-level Transaction Bridge
     * Automatically maps business events to balanced GL entries
     */
    async recordBusinessTransaction(type, data) {
        const { businessId, referenceId, description, date = new Date().toISOString() } = data;
        let entries = [];

        switch (type) {
            case 'sale':
                // Revenue Side
                entries.push({ accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, debit: data.totalAmount, credit: 0 });
                entries.push({ accountCode: ACCOUNT_CODES.SALES_REVENUE, debit: 0, credit: data.netAmount });
                if (data.taxAmount > 0) {
                    entries.push({ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: 0, credit: data.taxAmount });
                }
                break;

            case 'sale_cogs':
                // Only Inventory/COGS Side (Perpetual Inventory)
                if (data.costAmount > 0) {
                    entries.push({ accountCode: ACCOUNT_CODES.COGS, debit: data.costAmount, credit: 0 });
                    entries.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: data.costAmount });
                }
                break;

            case 'purchase':
                entries.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: data.netAmount, credit: 0 });
                if (data.taxAmount > 0) {
                    entries.push({ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: data.taxAmount, credit: 0 }); // Input tax
                }
                entries.push({ accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: data.totalAmount });
                break;

            case 'stock_adjustment':
                // Assuming adjustment for loss/shrinkage for now
                if (data.amount > 0) { // Add stock
                    entries.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: data.amount, credit: 0 });
                    entries.push({ accountCode: ACCOUNT_CODES.OTHER_INCOME, debit: 0, credit: data.amount });
                } else { // Remove stock
                    const absAmount = Math.abs(data.amount);
                    entries.push({ accountCode: ACCOUNT_CODES.COGS, debit: absAmount, credit: 0 });
                    entries.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: absAmount });
                }
                break;

            default:
                throw new Error(`Unknown transaction type for accounting bridge: ${type}`);
        }

        return await this.createGLEntry({
            businessId,
            referenceId,
            referenceType: type === 'sale' ? 'invoices' : 'bills',
            description: description || `Auto-recorded ${type}`,
            date,
            entries
        });
    }
};


import {
    createGLEntryAction,
    getGLAccountsAction,
    getGLEntriesAction,
    getAccountBalanceAction,
    initializeCOAAction
} from '@/lib/actions/basic/accounting';
import {
    getTrialBalanceAction,
    getProfitLossAction,
    getBalanceSheetAction,
    getAccountingSummaryAction
} from '@/lib/actions/standard/report';

export const accountingAPI = {
    /**
     * Create a manual Journal Entry
     * @param {Object} entryData - { businessId, date, description, entries: [{accountId, debit, credit}] }
     */
    async createEntry(entryData) {
        return await createGLEntryAction({
            ...entryData,
            referenceType: 'manual',
            referenceId: `JE-${Date.now()}` // Generate a unique ref ID for manual entries
        });
    },

    /**
     * Get all Chart of Accounts
     */
    async getAccounts(businessId) {
        return await getGLAccountsAction(businessId);
    },

    /**
     * Get General Ledger Entries (Ledger Report)
     */
    async getEntries(businessId, params) {
        return await getGLEntriesAction(businessId, params);
    },

    /**
     * Get specific account balance
     */
    async getBalance(businessId, accountCode) {
        return await getAccountBalanceAction(businessId, accountCode);
    },

    /**
     * Initialize Default COA
     */
    async initCOA(businessId, coaTemplate) {
        return await initializeCOAAction(businessId, coaTemplate);
    },

    /**
     * Get Trial Balance Report
     */
    async getTrialBalance(businessId, asOfDate) {
        return await getTrialBalanceAction(businessId, asOfDate);
    },

    /**
     * Get Profit & Loss Report
     */
    async getProfitLoss(businessId, startDate, endDate) {
        return await getProfitLossAction(businessId, startDate, endDate);
    },

    /**
     * Get Balance Sheet Report
     */
    async getBalanceSheet(businessId, asOfDate) {
        return await getBalanceSheetAction(businessId, asOfDate);
    },

    /**
     * Get High-level Accounting Summary for Dashboard
     */
    async getSummary(businessId, startDate, endDate) {
        return await getAccountingSummaryAction(businessId, startDate, endDate);
    }
};

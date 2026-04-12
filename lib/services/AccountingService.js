import pool from '@/lib/db';
import { checkFiscalPeriodOpen } from '@/lib/actions/basic/fiscal';
import { ACCOUNT_CODES, DEFAULT_COA } from '../config/accounting';
import { generateScopedDocumentNumber } from '@/lib/db/documentNumber';

/**
 * Accounting Service (Enterprise SOA)
 * Manages General Ledger (GL), Double-Entry Integrity, and Financial Reporting.
 * Every financial transaction in the system flows through this service.
 */
export const AccountingService = {

    /**
     * Internal: Get Postgres Client
     */
    async getClient(txClient = null) {
        if (txClient) return txClient;
        return await pool.connect();
    },

    /**
     * Resolve GL Accounts by their system type (inventory, cogs, sales, etc.)
     */
    async getGLAccountsByTypes(businessId, types, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const query = `
                SELECT id, code, name, type FROM gl_accounts 
                WHERE business_id = $1 AND type = ANY($2::text[])
            `;
            const result = await client.query(query, [businessId, types]);
            const map = {};
            result.rows.forEach(acc => { map[acc.type] = acc; });

            const missing = types.filter(t => !map[t]);
            if (missing.length > 0) throw new Error(`Missing system accounts: ${missing.join(', ')}`);
            return map;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Create a balanced Journal Entry (JE) with GL line entries.
     * Enforces Double-Entry Accounting Rules (Total Debit == Total Credit).
     */
    async createJournalEntry(params, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;

        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const { businessId, date = new Date(), description, referenceType, referenceId, userId } = params;
            let { entries } = params;

            // Normalize entries (support for single entry or legacy fields)
            if (!entries || entries.length === 0) {
                entries = [{
                    accountId: params.accountId || params.account_id,
                    accountCode: params.accountCode || params.account_code,
                    debit: params.debit || 0,
                    credit: params.credit || 0
                }];
            }

            // 1. Fiscal Period Guard
            await checkFiscalPeriodOpen(client, businessId, date);

            // 2. Validate Double-Entry Integrity
            let totalDebit = 0;
            let totalCredit = 0;
            for (const entry of entries) {
                totalDebit += Math.round(Number(entry.debit || 0) * 100) / 100;
                totalCredit += Math.round(Number(entry.credit || 0) * 100) / 100;
            }
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error(`Double-entry violation: DR(${totalDebit}) != CR(${totalCredit})`);
            }

            // 3. Generate Sequential Journal Number
            const journalNumber = await generateScopedDocumentNumber(client, {
                businessId, table: 'journal_entries', column: 'journal_number', prefix: 'JE-', padLength: 6
            });

            // 4. Record Parent Journal
            const journalRes = await client.query(`
                INSERT INTO journal_entries (business_id, journal_number, transaction_date, description, reference_type, reference_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `, [businessId, journalNumber, date, description, referenceType, referenceId, userId]);
            const journal = journalRes.rows[0];

            // 5. Record GL Line Entries
            for (const entry of entries) {
                let accountId = entry.accountId || entry.account_id;
                
                // Resolve by code if ID is missing
                if (!accountId && entry.accountCode) {
                    const accRes = await client.query(
                        'SELECT id FROM gl_accounts WHERE business_id = $1 AND code = $2',
                        [businessId, entry.accountCode]
                    );
                    if (accRes.rows.length === 0) throw new Error(`Account not found: ${entry.accountCode}`);
                    accountId = accRes.rows[0].id;
                }

                if (!accountId) throw new Error('Account ID or Code is required for GL entry');

                await client.query(`
                    INSERT INTO gl_entries (business_id, journal_id, transaction_date, description, account_id, debit, credit, reference_type, reference_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [businessId, journal.id, date, description, accountId, entry.debit || 0, entry.credit || 0, referenceType, referenceId]);
            }

            if (shouldManageTransaction) await client.query('COMMIT');
            return { success: true, journalId: journal.id, journalNumber };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (shouldManageTransaction) client.release();
        }
    },

    /**
     * Map high-level business events to GL entries
     */
    async recordBusinessTransaction(type, data, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const { businessId, referenceId, description, date = new Date(), userId } = data;
            let entries = [];

            switch (type) {
                case 'sale': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['ar', 'revenue', 'tax_payable'], client);
                    entries.push({ accountId: accounts.ar.id, debit: data.totalAmount, credit: 0 });
                    entries.push({ accountId: accounts.revenue.id, debit: 0, credit: data.netAmount });
                    if (data.taxAmount > 0) {
                        entries.push({ accountId: accounts.tax_payable.id, debit: 0, credit: data.taxAmount });
                    }
                    break;
                }
                case 'purchase': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['inventory', 'ap'], client);
                    entries.push({ accountId: accounts.inventory.id, debit: data.netAmount, credit: 0 });
                    entries.push({ accountId: accounts.ap.id, debit: 0, credit: data.totalAmount });
                    break;
                }
                case 'pos_sale': {
                    // POS specific accounts: Cash/Bank instead of AR
                    const accounts = await this.getGLAccountsByTypes(businessId, ['cash', 'bank', 'revenue', 'tax_payable'], client);
                    const cashAmount = data.cashAmount || 0;
                    const cardAmount = data.cardAmount || 0;
                    
                    if (cashAmount > 0) entries.push({ accountId: accounts.cash.id, debit: cashAmount, credit: 0 });
                    if (cardAmount > 0) entries.push({ accountId: accounts.bank.id, debit: cardAmount, credit: 0 });
                    
                    entries.push({ accountId: accounts.revenue.id, debit: 0, credit: data.netAmount });
                    if (data.taxAmount > 0) {
                        entries.push({ accountId: accounts.tax_payable.id, debit: 0, credit: data.taxAmount });
                    }
                    break;
                }
                case 'pos_refund': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['cash', 'bank', 'revenue', 'tax_payable'], client);
                    const isCash = data.refundMethod === 'cash';
                    
                    entries.push({ accountId: accounts.revenue.id, debit: data.netAmount, credit: 0 });
                    if (data.taxAmount > 0) {
                        entries.push({ accountId: accounts.tax_payable.id, debit: data.taxAmount, credit: 0 });
                    }
                    
                    const fundAcc = isCash ? accounts.cash : accounts.bank;
                    entries.push({ accountId: fundAcc.id, debit: 0, credit: data.totalAmount });
                    break;
                }
                case 'payroll_run': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['salaries', 'ap', 'accrued_expenses'], client);
                    
                    entries.push({ accountId: accounts.salaries.id, debit: data.totalGross, credit: 0 });
                    entries.push({ accountId: accounts.ap.id, debit: 0, credit: data.totalNet });
                    entries.push({ accountId: accounts.accrued_expenses.id, debit: 0, credit: data.totalDeductions });
                    break;
                }
                case 'sale_cogs': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['cogs', 'inventory'], client);
                    entries.push({ accountId: accounts.cogs.id, debit: data.costAmount, credit: 0 });
                    entries.push({ accountId: accounts.inventory.id, debit: 0, credit: data.costAmount });
                    break;
                }
                case 'production': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['inventory', 'production_cost'], client);
                    entries.push({ accountId: accounts.inventory.id, debit: data.totalAmount, credit: 0 });
                    entries.push({ accountId: accounts.production_cost.id, debit: 0, credit: data.totalAmount });
                    break;
                }
                case 'adjustment': {
                    const accounts = await this.getGLAccountsByTypes(businessId, ['inventory', 'adjustment_gain_loss'], client);
                    const isIncrease = data.totalAmount > 0;
                    const amount = Math.abs(data.totalAmount);
                    
                    if (isIncrease) {
                        entries.push({ accountId: accounts.inventory.id, debit: amount, credit: 0 });
                        entries.push({ accountId: accounts.adjustment_gain_loss.id, debit: 0, credit: amount });
                    } else {
                        entries.push({ accountId: accounts.adjustment_gain_loss.id, debit: amount, credit: 0 });
                        entries.push({ accountId: accounts.inventory.id, debit: 0, credit: amount });
                    }
                    break;
                }
                case 'payment': {
                    // Receipt: DR Cash/Bank, CR Accounts Receivable
                    // Payment: DR Accounts Payable, CR Cash/Bank
                    const isReceipt = data.paymentType === 'receipt';
                    const isCash = (data.paymentMode || 'cash') === 'cash';
                    const accountTypes = isReceipt
                        ? [isCash ? 'cash' : 'bank', 'ar']
                        : ['ap', isCash ? 'cash' : 'bank'];
                    const accounts = await this.getGLAccountsByTypes(businessId, [...new Set(accountTypes)], client);

                    if (isReceipt) {
                        const fundAcc = isCash ? accounts.cash : accounts.bank;
                        entries.push({ accountId: fundAcc.id, debit: data.amount, credit: 0 });
                        entries.push({ accountId: accounts.ar.id, debit: 0, credit: data.amount });
                    } else {
                        const fundAcc = isCash ? accounts.cash : accounts.bank;
                        entries.push({ accountId: accounts.ap.id, debit: data.amount, credit: 0 });
                        entries.push({ accountId: fundAcc.id, debit: 0, credit: data.amount });
                    }
                    break;
                }
                default:
                    throw new Error(`Untracked transaction type: ${type}`);
            }

            return await this.createJournalEntry({
                businessId, date, description, referenceType: type, referenceId, entries, userId
            }, client);
        } finally {
            if (!txClient) client.release();
        }
    },

    async getAccountBalance(businessId, accountId, asOfDate = null) {
        const client = await pool.connect();
        try {
            let query = `SELECT COALESCE(SUM(debit - credit), 0) as balance FROM gl_entries WHERE business_id = $1 AND account_id = $2`;
            const params = [businessId, accountId];
            if (asOfDate) {
                query += ` AND transaction_date <= $3`;
                params.push(asOfDate);
            }
            const res = await client.query(query, params);
            return Number(res.rows[0].balance || 0);
        } finally {
            client.release();
        }
    }
};

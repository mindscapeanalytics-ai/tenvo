import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * AccountingService Tests
 * 
 * Tests the high-level transaction bridge that maps business events
 * to balanced GL entries.
 */

// We need to mock the server actions that AccountingService depends on
vi.mock('@/lib/actions/basic/accounting', () => ({
    createGLEntryAction: vi.fn(),
    getAccountBalanceAction: vi.fn(),
    initializeCOAAction: vi.fn(),
}));

import { AccountingService } from '../AccountingService';
import { createGLEntryAction, getAccountBalanceAction, initializeCOAAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

describe('AccountingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createGLEntryAction.mockResolvedValue({ success: true, entry: { id: 'gl-1' } });
    });

    describe('createGLEntry', () => {
        it('should create a GL entry via the server action', async () => {
            const params = {
                businessId: 'biz-1',
                referenceId: 'inv-1',
                referenceType: 'invoices',
                description: 'Test entry',
                date: '2026-01-01',
                entries: [
                    { accountCode: '1100', debit: 1000, credit: 0 },
                    { accountCode: '4000', debit: 0, credit: 1000 },
                ],
            };

            const result = await AccountingService.createGLEntry(params);

            expect(createGLEntryAction).toHaveBeenCalledWith(params);
            expect(result.success).toBe(true);
        });

        it('should throw on failure', async () => {
            createGLEntryAction.mockResolvedValueOnce({ success: false, error: 'DB error' });

            await expect(AccountingService.createGLEntry({})).rejects.toThrow('DB error');
        });
    });

    describe('recordBusinessTransaction', () => {
        it('should create balanced entries for a SALE', async () => {
            const data = {
                businessId: 'biz-1',
                referenceId: 'inv-1',
                totalAmount: 11700,
                netAmount: 10000,
                taxAmount: 1700,
            };

            await AccountingService.recordBusinessTransaction('sale', data);

            expect(createGLEntryAction).toHaveBeenCalledTimes(1);
            const callArgs = createGLEntryAction.mock.calls[0][0];

            // Should have 3 entries: AR (debit), Revenue (credit), Sales Tax (credit)
            expect(callArgs.entries).toHaveLength(3);

            // AR should be debited for total amount
            expect(callArgs.entries[0]).toEqual({
                accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
                debit: 11700,
                credit: 0,
            });

            // Revenue should be credited for net amount
            expect(callArgs.entries[1]).toEqual({
                accountCode: ACCOUNT_CODES.SALES_REVENUE,
                debit: 0,
                credit: 10000,
            });

            // Tax should be credited
            expect(callArgs.entries[2]).toEqual({
                accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE,
                debit: 0,
                credit: 1700,
            });

            // Verify entries are balanced: total debits == total credits
            const totalDebits = callArgs.entries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredits = callArgs.entries.reduce((sum, e) => sum + e.credit, 0);
            expect(totalDebits).toBe(totalCredits);
        });

        it('should create balanced entries for a PURCHASE', async () => {
            const data = {
                businessId: 'biz-1',
                referenceId: 'po-1',
                totalAmount: 5850,
                netAmount: 5000,
                taxAmount: 850,
            };

            await AccountingService.recordBusinessTransaction('purchase', data);

            const callArgs = createGLEntryAction.mock.calls[0][0];

            // Purchase: Inventory (debit), Tax (debit input), AP (credit)
            expect(callArgs.entries).toHaveLength(3);

            // Verify double-entry balance
            const totalDebits = callArgs.entries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredits = callArgs.entries.reduce((sum, e) => sum + e.credit, 0);
            expect(totalDebits).toBe(totalCredits);
        });

        it('should create balanced entries for STOCK ADJUSTMENT (add)', async () => {
            const data = {
                businessId: 'biz-1',
                referenceId: 'adj-1',
                amount: 500,
            };

            await AccountingService.recordBusinessTransaction('stock_adjustment', data);

            const callArgs = createGLEntryAction.mock.calls[0][0];
            expect(callArgs.entries).toHaveLength(2);

            // Positive adjustment: Inventory debit, Other Income credit
            expect(callArgs.entries[0].accountCode).toBe(ACCOUNT_CODES.INVENTORY_ASSET);
            expect(callArgs.entries[0].debit).toBe(500);
        });

        it('should create balanced entries for STOCK ADJUSTMENT (remove)', async () => {
            const data = {
                businessId: 'biz-1',
                referenceId: 'adj-2',
                amount: -300,
            };

            await AccountingService.recordBusinessTransaction('stock_adjustment', data);

            const callArgs = createGLEntryAction.mock.calls[0][0];

            // Negative adjustment: COGS debit, Inventory credit
            expect(callArgs.entries[0].accountCode).toBe(ACCOUNT_CODES.COGS);
            expect(callArgs.entries[0].debit).toBe(300);
            expect(callArgs.entries[1].accountCode).toBe(ACCOUNT_CODES.INVENTORY_ASSET);
            expect(callArgs.entries[1].credit).toBe(300);
        });

        it('should handle sale without tax', async () => {
            const data = {
                businessId: 'biz-1',
                referenceId: 'inv-2',
                totalAmount: 5000,
                netAmount: 5000,
                taxAmount: 0,
            };

            await AccountingService.recordBusinessTransaction('sale', data);

            const callArgs = createGLEntryAction.mock.calls[0][0];
            // Without tax, only 2 entries (AR and Revenue)
            expect(callArgs.entries).toHaveLength(2);
        });

        it('should throw for unknown transaction type', async () => {
            await expect(
                AccountingService.recordBusinessTransaction('unknown_type', { businessId: 'biz-1' })
            ).rejects.toThrow('Unknown transaction type');
        });
    });

    describe('getAccountBalance', () => {
        it('should call the server action', async () => {
            getAccountBalanceAction.mockResolvedValue({ success: true, balance: 5000 });

            const result = await AccountingService.getAccountBalance('biz-1', '1100');

            expect(getAccountBalanceAction).toHaveBeenCalledWith('biz-1', '1100');
            expect(result.balance).toBe(5000);
        });
    });

    describe('initializeCOA', () => {
        it('should initialize chart of accounts', async () => {
            initializeCOAAction.mockResolvedValue({ success: true });

            const result = await AccountingService.initializeCOA('biz-1');

            expect(initializeCOAAction).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
        });

        it('should throw on failure', async () => {
            initializeCOAAction.mockResolvedValue({ success: false, error: 'Already initialized' });

            await expect(AccountingService.initializeCOA('biz-1')).rejects.toThrow('Already initialized');
        });
    });
});

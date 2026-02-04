/**
 * Centralized Chart of Accounts (COA) Configuration
 * Maps system functions (Revenue, AR, AP) to standardized GL Codes
 * Localized for the Pakistani market standards
 */

export const ACCOUNT_CODES = {
    // Assets
    CASH_ON_HAND: '1001',
    BANK_ACCOUNTS: '1002',
    ACCOUNTS_RECEIVABLE: '1100',
    INVENTORY_ASSET: '1200',

    // Liabilities
    ACCOUNTS_PAYABLE: '2001',
    SALES_TAX_PAYABLE: '2100', // Federal Sales Tax (FBR)
    PROVINCIAL_TAX_PAYABLE: '2101', // Provincial Sales Tax (PST/SRB/PRA)
    WITHHOLDING_TAX_PAYABLE: '2102', // WHT

    // Equity
    OWNER_EQUITY: '3000',
    RETAINED_EARNINGS: '3100',

    // Income
    SALES_REVENUE: '4000',
    SERVICE_REVENUE: '4100',
    OTHER_INCOME: '4900',

    // Expenses
    COGS: '5000', // Cost of Goods Sold
    MANUFACTURING_COST: '5001', // Clearing account for production
    RENT_EXPENSE: '5100',
    UTILITIES: '5200',
    SALARIES: '5300',
    MARKETING: '5400',
    LOGISTICS: '5500',
};

/**
 * Default Chart of Accounts for initialization
 */
export const DEFAULT_COA = [
    { code: ACCOUNT_CODES.CASH_ON_HAND, name: 'Cash on Hand', type: 'asset' },
    { code: ACCOUNT_CODES.BANK_ACCOUNTS, name: 'Bank Accounts', type: 'asset' },
    { code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', type: 'asset' },
    { code: ACCOUNT_CODES.INVENTORY_ASSET, name: 'Inventory Asset', type: 'asset' },
    { code: ACCOUNT_CODES.ACCOUNTS_PAYABLE, name: 'Accounts Payable', type: 'liability' },
    { code: ACCOUNT_CODES.SALES_TAX_PAYABLE, name: 'Sales Tax Payable', type: 'liability' },
    { code: ACCOUNT_CODES.PROVINCIAL_TAX_PAYABLE, name: 'Provincial Tax Payable', type: 'liability' },
    { code: ACCOUNT_CODES.OWNER_EQUITY, name: 'Owner Equity', type: 'equity' },
    { code: ACCOUNT_CODES.SALES_REVENUE, name: 'Sales Revenue', type: 'income' },
    { code: ACCOUNT_CODES.COGS, name: 'Cost of Goods Sold', type: 'expense' },
];

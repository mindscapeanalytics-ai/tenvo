export const QUICK_ACTION_IDS = {
    OPEN_QUICK_ACTION: 'open-quick-action',
    ADD_PRODUCT: 'add-product',
    ADD_INVOICE: 'add-invoice',
    ADD_CUSTOMER: 'add-customer',
    ADD_VENDOR: 'add-vendor',
    ADD_PURCHASE: 'add-purchase',
    NEW_PRODUCTION: 'new-production',
    NEW_QUOTATION: 'new-quotation',
    GENERATE_REPORT: 'generate-report',
};

export function getPrimaryQuickActionForTab(activeTab, t = {}) {
    const byTab = {
        inventory: { id: QUICK_ACTION_IDS.ADD_PRODUCT, label: t.add_product || 'Add Product' },
        invoices: { id: QUICK_ACTION_IDS.ADD_INVOICE, label: t.new_invoice || 'New Invoice' },
        customers: { id: QUICK_ACTION_IDS.ADD_CUSTOMER, label: t.new_customer || 'New Customer' },
        vendors: { id: QUICK_ACTION_IDS.ADD_VENDOR, label: t.add_vendor || 'Add Vendor' },
        purchases: { id: QUICK_ACTION_IDS.ADD_PURCHASE, label: t.purchase_orders || 'New Purchase' },
        manufacturing: { id: QUICK_ACTION_IDS.NEW_PRODUCTION, label: t.new_production || 'New Production' },
        quotations: { id: QUICK_ACTION_IDS.NEW_QUOTATION, label: t.new_quotation || 'New Quotation' },
        reports: { id: QUICK_ACTION_IDS.GENERATE_REPORT, label: t.generate_report || 'Generate Report' },
    };

    return byTab[activeTab] || {
        id: QUICK_ACTION_IDS.ADD_INVOICE,
        label: t.new_invoice || 'New Invoice',
    };
}
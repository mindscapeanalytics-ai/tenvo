import {
    getPaymentsAction,
    createPaymentAction,
    getCustomerLedgerAction,
    getVendorLedgerAction,
    deletePaymentAction
} from '@/lib/actions/basic/payment';

export const paymentAPI = {
    /**
     * Get all payments for a business with optional filters
     */
    async getAll(businessId, filters = {}) {
        return await getPaymentsAction(businessId, filters);
    },

    /**
     * Create a new payment (customer receipt or vendor payment)
     */
    async create(paymentData) {
        return await createPaymentAction(paymentData);
    },

    /**
     * Get customer ledger with all transactions
     */
    async getCustomerLedger(customerId, businessId) {
        return await getCustomerLedgerAction(customerId, businessId);
    },

    /**
     * Get vendor ledger with all transactions
     */
    async getVendorLedger(vendorId, businessId) {
        return await getVendorLedgerAction(vendorId, businessId);
    },

    /**
     * Delete a payment
     */
    async delete(paymentId) {
        return await deletePaymentAction(paymentId);
    },

    /**
     * Get customer receipts only
     */
    async getCustomerReceipts(businessId, customerId = null) {
        const filters = { payment_type: 'receipt' };
        if (customerId) filters.customer_id = customerId;
        return await getPaymentsAction(businessId, filters);
    },

    /**
     * Get vendor payments only
     */
    async getVendorPayments(businessId, vendorId = null) {
        const filters = { payment_type: 'payment' };
        if (vendorId) filters.vendor_id = vendorId;
        return await getPaymentsAction(businessId, filters);
    }
};

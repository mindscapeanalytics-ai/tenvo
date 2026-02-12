import {
    createSerialAction,
    createBulkSerialsAction,
    sellSerialAction,
    getProductSerialsAction
} from '@/lib/actions/standard/inventory/serial';

/**
 * Serial Number Management Service
 * Now acts as a wrapper around Server Actions
 */
export const SerialService = {

    /**
     * Create/Register a new serial number
     */
    async createSerial(serialData) {
        const result = await createSerialAction(serialData);
        if (!result.success) throw new Error(result.error);
        return result.serial;
    },

    /**
     * Bulk Create Serials
     */
    async createBulkSerials(data) {
        const result = await createBulkSerialsAction(data);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    /**
     * Sell a serial number
     */
    async sellSerial(serialNumber, customerId, invoiceId, businessId) {
        const result = await sellSerialAction(businessId, serialNumber, customerId, invoiceId);
        if (!result.success) throw new Error(result.error);
        return result.serial;
    },

    /**
     * Get all serials for a product
     */
    async getProductSerials(productId, businessId) {
        const result = await getProductSerialsAction(productId, businessId);
        if (!result.success) throw new Error(result.error);
        return result.serials;
    }
};

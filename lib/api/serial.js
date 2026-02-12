import {
    createSerialAction,
    getProductSerialsAction,
    sellSerialAction,
    getSerialAction
} from '@/lib/actions/standard/inventory/serial';

/**
 * Serial Number API Utility
 */
export const serialAPI = {
    /**
     * Create a new serial number
     * @param {Object} serialData - Serial number details
     */
    async create(serialData) {
        const result = await createSerialAction(serialData);
        if (!result.success) throw new Error(result.error);
        return result.serial;
    },

    /**
     * Get a single serial by its serial number
     * @param {string} businessId - Business UUID
     * @param {string} serialNumber - Serial number string
     */
    async getSerial(businessId, serialNumber) {
        const result = await getSerialAction(businessId, serialNumber);
        if (!result.success) return null; // Return null if not found
        return result.serial;
    },

    /**
     * Get all serial numbers for a product
     * @param {string} productId - Product UUID
     * @param {string} businessId - Business UUID
     */
    async getByProduct(productId, businessId) {
        const result = await getProductSerialsAction(productId, businessId);
        if (!result.success) throw new Error(result.error);
        return result.serials;
    },

    /**
     * Mark serial as sold
     * @param {string} businessId - Business UUID
     * @param {string} serialNumber - Serial number
     * @param {string} customerId - Customer UUID
     * @param {string} invoiceId - Invoice UUID
     */
    async sell(businessId, serialNumber, customerId, invoiceId) {
        const result = await sellSerialAction(businessId, serialNumber, customerId, invoiceId);
        if (!result.success) throw new Error(result.error);
        return result.serial;
    }
};


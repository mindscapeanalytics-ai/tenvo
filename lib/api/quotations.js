// Migrated to server actions - see lib/actions/quotation.js
import {
    getQuotationsAction,
    createQuotationAction,
    getSalesOrdersAction,
    createSalesOrderAction,
    getChallansAction,
    createChallanAction,
    getQuotationDetailAction,
    getSalesOrderDetailAction,
    getChallanDetailAction
} from '@/lib/actions/quotation';

export const quotationAPI = {
    async getAll(businessId) {
        try {
            const [quotations, salesOrders, challans] = await Promise.all([
                getQuotationsAction(businessId),
                getSalesOrdersAction(businessId),
                getChallansAction(businessId)
            ]);

            return {
                success: true,
                quotations: quotations.success ? quotations.quotations : [],
                salesOrders: salesOrders.success ? salesOrders.salesOrders : [],
                challans: challans.success ? challans.challans : []
            };
        } catch (error) {
            console.error('Quotation API getAll error:', error);
            return { success: false, error: error.message };
        }
    },

    // --- Quotations ---

    async getQuotations(businessId) {
        const result = await getQuotationsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.quotations;
    },

    async createQuotation(data) {
        const result = await createQuotationAction(data);
        if (!result.success) throw new Error(result.error);
        return result.quotation;
    },

    async getQuotationDetail(quotationId) {
        const result = await getQuotationDetailAction(quotationId);
        if (!result.success) throw new Error(result.error);
        return result.quotation;
    },

    // --- Sales Orders ---

    async getSalesOrders(businessId) {
        const result = await getSalesOrdersAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.salesOrders;
    },

    async createSalesOrder(data) {
        const result = await createSalesOrderAction(data);
        if (!result.success) throw new Error(result.error);
        return result.salesOrder;
    },

    async getSalesOrderDetail(orderId) {
        const result = await getSalesOrderDetailAction(orderId);
        if (!result.success) throw new Error(result.error);
        return result.salesOrder;
    },

    // --- Delivery Challans ---

    async getChallans(businessId) {
        const result = await getChallansAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.challans;
    },

    async createChallan(data) {
        const result = await createChallanAction(data);
        if (!result.success) throw new Error(result.error);
        return result.challan;
    },

    async getChallanDetail(challanId) {
        const result = await getChallanDetailAction(challanId);
        if (!result.success) throw new Error(result.error);
        return result.challan;
    }
};

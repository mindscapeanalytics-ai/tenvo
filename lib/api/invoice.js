import { createInvoiceAction, getInvoicesAction, updateInvoiceAction, deleteInvoiceAction } from '@/lib/actions/invoice';

/**
 * Invoice API Utility
 * Wrapper for Server Actions
 */
export const invoiceAPI = {
    async getAll(businessId) {
        const result = await getInvoicesAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.invoices;
    },

    async create(invoiceData, items) {
        const mappedItems = items.map(item => ({
            product_id: item.productId || item.product_id || null,
            name: item.name || 'Unnamed Item',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.rate || item.unit_price || item.price || item.unitPrice || 0),
            tax_percent: Number(item.taxPercent || item.tax_percent || item.tax || 0),
            tax_amount: Number(item.taxAmount || item.tax_amount || ((item.quantity || 1) * (item.rate || 0) * (item.taxPercent || 0) / 100) || 0),
            discount_amount: Number(item.discount || item.discount_amount || 0),
            total_amount: Number(item.amount || item.total || item.total_amount || 0),
            metadata: {
                ...item.metadata,
                article_no: item.article_no,
                design_no: item.design_no
            }
        }));

        const result = await createInvoiceAction({
            invoiceData: {
                ...invoiceData,
                customer_id: invoiceData.customer_id || invoiceData.customer?.id || null,
                tax_details: invoiceData.tax_details || {},
                subtotal: Number(invoiceData.subtotal || 0),
                tax_total: Number(invoiceData.tax_total || 0),
                discount_total: Number(invoiceData.discount_total || 0),
                grand_total: Number(invoiceData.grand_total || 0)
            },
            items: mappedItems
        });

        if (!result.success) throw new Error(result.error);
        return result.invoice;
    },

    async update(invoiceId, invoiceData, items) {
        const mappedItems = items.map(item => ({
            product_id: item.productId || item.product_id || null,
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.rate || item.price || item.unitPrice || item.unit_price || 0,
            tax_percent: item.taxPercent || item.tax || item.tax_percent || 0,
            tax_amount: item.taxAmount || item.tax_amount || ((item.quantity || 1) * (item.rate || item.price || 0) * (item.taxPercent || 0) / 100) || 0,
            discount_amount: item.discount || item.discount_amount || 0,
            total_amount: item.amount || item.total || item.total_amount || 0,
            metadata: item.metadata || {}
        }));

        const result = await updateInvoiceAction({
            invoiceId,
            invoiceData: {
                ...invoiceData,
                customer_id: invoiceData.customer?.id || invoiceData.customer_id || null,
                tax_details: invoiceData.tax_details || {}
            },
            items: mappedItems
        });

        if (!result.success) throw new Error(result.error);
        return result.invoice;
    },

    async delete(businessId, id) {
        const result = await deleteInvoiceAction(businessId, id);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};

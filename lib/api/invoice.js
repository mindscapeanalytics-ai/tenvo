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
        // Robust total calculation to fix Rs0.00 bug
        const grandTotal = Number(
            invoiceData.grand_total ||
            invoiceData.total ||
            invoiceData.grandTotal ||
            invoiceData.totals?.total ||
            invoiceData.totals?.grand_total || 0
        );
        const subtotal = Number(invoiceData.subtotal || invoiceData.totals?.subtotal || 0);
        const taxTotal = Number(
            invoiceData.tax_total ||
            invoiceData.totalTax ||
            invoiceData.tax_amount ||
            invoiceData.taxTotal ||
            invoiceData.totals?.totalTax ||
            invoiceData.totals?.total_tax || 0
        );
        const discountTotal = Number(
            invoiceData.discount_total ||
            invoiceData.discount ||
            invoiceData.discountTotal ||
            invoiceData.totals?.discount || 0
        );

        const mappedItems = items.map(item => ({
            product_id: item.productId || item.product_id || null,
            name: item.name || 'Unnamed Item',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price || item.rate || item.price || item.unitPrice || 0),
            tax_percent: Number(item.tax_percent || item.taxPercent || item.tax || 0),
            tax_amount: Number(item.tax_amount || item.taxAmount || 0),
            discount_amount: Number(item.discount_amount || item.discount || 0),
            total_amount: Number(item.total_amount || item.amount || item.total || 0),
            metadata: {
                ...item.metadata,
                article_no: item.article_no || item.articleNo,
                design_no: item.design_no || item.designNo
            }
        }));

        const result = await createInvoiceAction({
            invoiceData: {
                ...invoiceData,
                customer_id: invoiceData.customer_id || invoiceData.customer?.id || null,
                invoice_number: invoiceData.invoice_number || invoiceData.invoiceNumber || `INV-${Date.now()}`,
                date: invoiceData.date || new Date().toISOString(),
                due_date: invoiceData.due_date || invoiceData.dueDate || null,
                status: invoiceData.status || 'draft',
                subtotal: subtotal,
                tax_total: taxTotal,
                discount_total: discountTotal,
                grand_total: grandTotal,
                tax_details: invoiceData.tax_details || {},
                domain_data: invoiceData.domain_data || {}
            },
            items: mappedItems
        });

        if (!result.success) throw new Error(result.error);
        return result.invoice;
    },

    async update(invoiceId, invoiceData, items) {
        // Robust total calculation
        const grandTotal = Number(
            invoiceData.grand_total ||
            invoiceData.total ||
            invoiceData.grandTotal ||
            invoiceData.totals?.total ||
            invoiceData.totals?.grand_total || 0
        );
        const subtotal = Number(invoiceData.subtotal || invoiceData.totals?.subtotal || 0);
        const taxTotal = Number(
            invoiceData.tax_total ||
            invoiceData.totalTax ||
            invoiceData.tax_amount ||
            invoiceData.taxTotal ||
            invoiceData.totals?.totalTax ||
            invoiceData.totals?.total_tax || 0
        );
        const discountTotal = Number(
            invoiceData.discount_total ||
            invoiceData.discount ||
            invoiceData.discountTotal ||
            invoiceData.totals?.discount || 0
        );

        const mappedItems = items.map(item => ({
            product_id: item.productId || item.product_id || null,
            name: item.name || 'Unnamed Item',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price || item.rate || item.price || item.unitPrice || 0),
            tax_percent: Number(item.tax_percent || item.taxPercent || item.tax || 0),
            tax_amount: Number(item.tax_amount || item.taxAmount || 0),
            discount_amount: Number(item.discount_amount || item.discount || 0),
            total_amount: Number(item.total_amount || item.amount || item.total || 0),
            metadata: {
                ...item.metadata,
                article_no: item.article_no || item.articleNo,
                design_no: item.design_no || item.designNo
            }
        }));

        const result = await updateInvoiceAction({
            invoiceId,
            invoiceData: {
                ...invoiceData,
                customer_id: invoiceData.customer_id || invoiceData.customer?.id || null,
                invoice_number: invoiceData.invoice_number || invoiceData.invoiceNumber,
                date: invoiceData.date,
                due_date: invoiceData.due_date || invoiceData.dueDate,
                status: invoiceData.status,
                subtotal: subtotal,
                tax_total: taxTotal,
                discount_total: discountTotal,
                grand_total: grandTotal,
                tax_details: invoiceData.tax_details || {},
                domain_data: invoiceData.domain_data || {}
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

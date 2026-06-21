import pool from '@/lib/db';
import { generateInvoicePDFBuffer } from '@/lib/pdf';
import { normalizeInvoiceForDocument, isPakistaniBusiness } from '@/lib/utils/invoiceDocument';
import { sendEmail } from '@/lib/email';

/**
 * Invoice Email Service
 * Handles sending invoices via email with PDF attachments
 * and tracks email delivery status
 */
export const InvoiceEmailService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Send Invoice via Email
     * 
     * @param {Object} params - Email parameters
     * @param {string} params.businessId - Business ID
     * @param {string} params.invoiceId - Invoice ID
     * @param {string} params.to - Recipient email
     * @param {string} params.cc - CC recipients (comma-separated)
     * @param {string} params.bcc - BCC recipients (comma-separated)
     * @param {string} params.subject - Email subject
     * @param {string} params.message - Custom message body
     * @param {string} params.userId - User sending the email
     * @param {boolean} params.includePDF - Whether to include PDF attachment
     * @param {Object} txClient - Optional transaction client
     * @returns {Promise<Object>} Email send result
     */
    async sendInvoice(params, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;

        try {
            const {
                businessId,
                invoiceId,
                to,
                cc = null,
                bcc = null,
                subject = null,
                message = null,
                userId,
                includePDF = true
            } = params;

            // Get invoice details
            const invoiceRes = await client.query(`
                SELECT 
                    i.*,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone,
                    b.business_name as business_name,
                    b.email as business_email,
                    b.phone as business_phone,
                    b.address as business_address,
                    b.country as business_country,
                    b.ntn as business_ntn,
                    b.srn as business_srn
                FROM invoices i
                LEFT JOIN customers c ON i.customer_id = c.id
                LEFT JOIN businesses b ON i.business_id = b.id
                WHERE i.id = $1 AND i.business_id = $2
            `, [invoiceId, businessId]);

            if (invoiceRes.rows.length === 0) {
                throw new Error('Invoice not found');
            }

            const invoice = invoiceRes.rows[0];

            // Get invoice items
            const itemsRes = await client.query(`
                SELECT ii.*, p.name as product_name, p.sku
                FROM invoice_items ii
                LEFT JOIN products p ON ii.product_id = p.id
                WHERE ii.invoice_id = $1 AND ii.business_id = $2
            `, [invoiceId, businessId]);

            invoice.items = itemsRes.rows;

            // Determine recipient
            const recipientEmail = to || invoice.customer_email;
            if (!recipientEmail) {
                throw new Error('No recipient email provided and invoice customer has no email');
            }

            // Generate PDF if requested
            let attachments = [];
            if (includePDF) {
                const businessRow = {
                    business_name: invoice.business_name,
                    address: invoice.business_address,
                    phone: invoice.business_phone,
                    email: invoice.business_email,
                    country: invoice.business_country,
                    ntn: invoice.business_ntn,
                    srn: invoice.business_srn,
                };
                const normalized = normalizeInvoiceForDocument(invoice, invoice.items, businessRow);
                const pdfBuffer = generateInvoicePDFBuffer(
                    normalized,
                    normalized.totals,
                    normalized.business,
                    isPakistaniBusiness(businessRow)
                );
                attachments.push({
                    filename: `Invoice_${invoice.invoice_number}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                });
            }

            // Build email content
            const emailSubject = subject || `Invoice ${invoice.invoice_number} from ${invoice.business_name}`;
            const emailBody = message || this.buildDefaultEmailBody(invoice);

            // Send email
            const emailResult = await sendEmail({
                to: recipientEmail,
                cc: cc,
                bcc: bcc,
                subject: emailSubject,
                html: emailBody,
                attachments: attachments
            });

            // Log email in database
            await client.query(`
                INSERT INTO invoice_email_log (
                    business_id, invoice_id, email_to, email_cc, email_bcc,
                    subject, template_used, status, sent_at, sent_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
            `, [
                businessId,
                invoiceId,
                recipientEmail,
                cc,
                bcc,
                emailSubject,
                'default_invoice_template',
                emailResult.success ? 'sent' : 'failed',
                userId
            ]);

            // Update invoice status to 'sent' if it was 'draft'
            if (invoice.status === 'draft') {
                await client.query(`
                    UPDATE invoices 
                    SET status = 'sent', updated_at = NOW()
                    WHERE id = $1 AND business_id = $2
                `, [invoiceId, businessId]);
            }

            return {
                success: emailResult.success,
                message: emailResult.success 
                    ? `Invoice sent successfully to ${recipientEmail}` 
                    : 'Failed to send invoice email',
                recipient: recipientEmail,
                invoiceNumber: invoice.invoice_number
            };

        } catch (error) {
            console.error('Invoice Email Service Error:', error);
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Build default email body for invoice
     */
    buildDefaultEmailBody(invoice) {
        const items = invoice.items || [];
        const itemRows = items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name || item.product_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.unit_price).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.total_amount).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">INVOICE</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">${invoice.business_name}</p>
                </div>
                
                <div style="padding: 30px; background: white;">
                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #374151; margin: 0 0 10px 0;">Hello ${invoice.customer_name || 'Valued Customer'},</h2>
                        <p style="color: #6B7280; margin: 0;">
                            Please find attached Invoice <strong>${invoice.invoice_number}</strong> for your records.
                        </p>
                    </div>
                    
                    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6B7280;">Invoice Number:</span>
                            <strong>${invoice.invoice_number}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6B7280;">Invoice Date:</span>
                            <strong>${new Date(invoice.date).toLocaleDateString()}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #6B7280;">Due Date:</span>
                            <strong>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'On Receipt'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #10B981;">
                            <span style="color: #374151; font-size: 18px;"><strong>Total Amount:</strong></span>
                            <span style="color: #10B981; font-size: 18px;"><strong>${Number(invoice.grand_total).toFixed(2)}</strong></span>
                        </div>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #F3F4F6;">
                                <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                                <th style="padding: 10px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                                <th style="padding: 10px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                                <th style="padding: 10px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>
                    
                    ${invoice.notes ? `
                    <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <strong style="color: #92400E;">Notes:</strong>
                        <p style="color: #92400E; margin: 5px 0 0 0;">${invoice.notes}</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #6B7280; margin: 0;">
                            Thank you for your business!<br>
                            If you have any questions, please don't hesitate to contact us.
                        </p>
                        <p style="color: #9CA3AF; margin: 15px 0 0 0; font-size: 14px;">
                            ${invoice.business_name}<br>
                            ${invoice.business_email || ''}<br>
                            ${invoice.business_phone || ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get email history for an invoice
     */
    async getEmailHistory(businessId, invoiceId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const res = await client.query(`
                SELECT iel.*, u.name as sent_by_name
                FROM invoice_email_log iel
                LEFT JOIN "user" u ON iel.sent_by = u.id
                WHERE iel.business_id = $1 AND iel.invoice_id = $2
                ORDER BY iel.created_at DESC
            `, [businessId, invoiceId]);

            return res.rows;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Resend a previously sent invoice
     */
    async resendInvoice(businessId, invoiceId, emailLogId, userId, txClient = null) {
        const client = await this.getClient(txClient);
        
        try {
            // Get previous email details
            const logRes = await client.query(`
                SELECT * FROM invoice_email_log 
                WHERE id = $1 AND business_id = $2 AND invoice_id = $3
            `, [emailLogId, businessId, invoiceId]);

            if (logRes.rows.length === 0) {
                throw new Error('Email log entry not found');
            }

            const emailLog = logRes.rows[0];

            return await this.sendInvoice({
                businessId,
                invoiceId,
                to: emailLog.email_to,
                cc: emailLog.email_cc,
                bcc: emailLog.email_bcc,
                subject: `RE: ${emailLog.subject}`,
                message: 'This is a resent invoice. Please see attached.',
                userId,
                includePDF: true
            }, client);
        } finally {
            if (!txClient) client.release();
        }
    }
};

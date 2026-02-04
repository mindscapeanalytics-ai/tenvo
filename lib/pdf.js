import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate PDF Invoice with Business Branding
 * @param {Object} invoice - Invoice data
 * @param {Object} totals - Calculated totals
 * @param {Object} business - Business information for branding
 * @param {Boolean} isPakistaniDomain - Whether to use Pakistani formatting
 */
export function generateInvoicePDF(invoice, totals, business = {}, isPakistaniDomain = true) {
  const doc = new jsPDF();
  const currency = isPakistaniDomain ? 'PKR' : 'INR';
  const currencySymbol = '₨';

  // Business Header - YOUR BRAND
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 21, 56); // Wine color
  doc.text(business?.name || 'Financial Hub', 14, 20);

  // Business Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  let yPos = 28;

  if (business?.address) {
    doc.text(business.address, 14, yPos);
    yPos += 4;
  }

  if (business?.ntn || business?.srn) {
    const taxInfo = [];
    if (business.ntn) taxInfo.push(`NTN: ${business.ntn}`);
    if (business.srn) taxInfo.push(`SRN: ${business.srn}`);
    doc.text(taxInfo.join(' | '), 14, yPos);
    yPos += 4;
  }

  if (business?.phone || business?.email) {
    const contactInfo = [];
    if (business.phone) contactInfo.push(`Phone: ${business.phone}`);
    if (business.email) contactInfo.push(`Email: ${business.email}`);
    doc.text(contactInfo.join(' | '), 14, yPos);
    yPos += 4;
  }

  // Separator Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos + 2, 196, yPos + 2);

  // Invoice Title & Number
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(isPakistaniDomain ? 'TAX INVOICE (FBR Compliant)' : 'TAX INVOICE', 14, yPos);

  // Invoice Details (Right Side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, yPos - 5);
  doc.text(`Date: ${invoice.date}`, 140, yPos);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${invoice.dueDate}`, 140, yPos + 5);
  }

  // Customer Info
  yPos += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer?.name || invoice.customerName || 'Customer', 14, yPos);

  yPos += 5;
  if (invoice.customer?.ntn) {
    doc.text(`NTN: ${invoice.customer.ntn}`, 14, yPos);
    yPos += 5;
  }
  if (invoice.customer?.address) {
    doc.text(invoice.customer.address, 14, yPos);
    yPos += 5;
  }
  if (invoice.customer?.phone) {
    doc.text(`Phone: ${invoice.customer.phone}`, 14, yPos);
    yPos += 5;
  }

  // Items Table
  yPos += 5;
  const tableData = invoice.items.map(item => [
    item.name || item.description,
    (item.quantity || 0).toString(),
    `${currencySymbol} ${Number(item.rate || 0).toFixed(2)}`,
    `${currencySymbol} ${Number(item.amount || 0).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [139, 21, 56],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  // Totals Section
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightX = 155;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Subtotal
  doc.text('Subtotal:', rightX - 40, finalY);
  doc.text(`${currencySymbol} ${Number(totals.subtotal || 0).toFixed(2)}`, rightX, finalY, { align: 'right' });

  let currentY = finalY + 5;

  // Tax Breakdown (Pakistani)
  if (isPakistaniDomain && totals.federalSalesTax > 0) {
    doc.text('Federal Sales Tax (18%):', rightX - 40, currentY);
    doc.text(`${currencySymbol} ${Number(totals.federalSalesTax || 0).toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
  }

  if (isPakistaniDomain && totals.provincialSalesTax > 0) {
    doc.text('Provincial Tax:', rightX - 40, currentY);
    doc.text(`${currencySymbol} ${Number(totals.provincialSalesTax || 0).toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
  }

  if (isPakistaniDomain && totals.withholdingTax > 0) {
    doc.text('Withholding Tax (WHT):', rightX - 40, currentY);
    doc.text(`${currencySymbol} ${Number(totals.withholdingTax || 0).toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Round Off
  if (totals.roundOff && totals.roundOff !== 0) {
    doc.text('Round Off:', rightX - 40, currentY);
    doc.text(`${currencySymbol} ${Number(totals.roundOff || 0).toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Total (Bold)
  currentY += 3;
  doc.setLineWidth(0.3);
  doc.line(rightX - 50, currentY - 2, rightX + 5, currentY - 2);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', rightX - 40, currentY + 3);
  doc.text(`${currencySymbol} ${Number(totals.total || 0).toFixed(2)}`, rightX, currentY + 3, { align: 'right' });

  // Notes
  if (invoice.notes) {
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, currentY + 5);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated invoice and does not require a signature.', 14, pageHeight - 15);
  doc.text(`Generated by ${business?.name || 'Financial Hub'} - ${isPakistaniDomain ? 'FBR Compliant' : ''} ERP System`, 14, pageHeight - 10);

  // Save PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);

  return doc;
}

/**
 * Generate PDF Report
 */
export function generateReportPDF(title, data, columns) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(139, 21, 56);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Table
  const tableData = data.map(row =>
    columns.map(col => row[col.key] || '')
  );

  doc.autoTable({
    startY: 40,
    head: [columns.map(col => col.label)],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [139, 21, 56], textColor: 255 },
    styles: { fontSize: 9 },
  });

  return doc;
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename = 'export') {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

/**
 * Export data to Excel
 */
export async function exportToExcel(data, filename = 'export') {
  // Dynamic import for client-side only
  if (typeof window === 'undefined') {
    console.warn('Excel export is only available in the browser');
    return;
  }

  try {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
}


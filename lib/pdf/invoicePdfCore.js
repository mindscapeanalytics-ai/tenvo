import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  PAGE_MARGIN,
  CONTENT_WIDTH,
  formatPdfMoney,
  formatBusinessAddressBlock,
  resolveBusinessRegistrationLines,
  resolveInvoiceDocumentTitle,
  resolveInvoiceBrandColor,
  formatPdfPaymentMethod,
  formatPdfProvinceLabel,
  normalizePdfTotals,
  normalizePdfLineItem,
} from '@/lib/pdf/invoiceFormat';

/**
 * Build jsPDF document for a tax invoice (no download).
 * @param {ReturnType<import('@/lib/utils/invoiceDocument').normalizeInvoiceForDocument>} doc
 * @param {boolean} isPakistaniDomain
 */
export function buildInvoicePDFDoc(doc, isPakistaniDomain = true) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const {
    invoiceNumber,
    date,
    dueDate,
    customer,
    items,
    totals: rawTotals,
    business,
    notes,
    currency = 'PKR',
    standards = null,
    category = null,
    invoiceType = 'retail',
    paymentTerms,
  } = doc;

  const totals = normalizePdfTotals(rawTotals, doc);
  const currencyCode = business?.currency || currency || standards?.currency || 'PKR';
  const money = (n) => formatPdfMoney(n, currencyCode);
  const brand = resolveInvoiceBrandColor(business, business?.settingsParsed);
  const title = resolveInvoiceDocumentTitle({
    category,
    invoiceType,
    standards,
    isPakistaniDomain,
  });

  const rightCol = PAGE_MARGIN + CONTENT_WIDTH;

  // ── Header: business identity ─────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...brand);
  pdf.text(business?.name || 'Business', PAGE_MARGIN, 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);

  let headerY = 24;
  const addressLines = formatBusinessAddressBlock(business);
  for (const line of addressLines) {
    pdf.text(line, PAGE_MARGIN, headerY);
    headerY += 4.5;
  }

  for (const regLine of resolveBusinessRegistrationLines(business, business?.settingsParsed)) {
    pdf.text(regLine, PAGE_MARGIN, headerY);
    headerY += 4.5;
  }

  const contactParts = [];
  if (business?.phone) contactParts.push(`Tel: ${business.phone}`);
  if (business?.email) contactParts.push(business.email);
  if (contactParts.length) {
    pdf.text(contactParts.join('  |  '), PAGE_MARGIN, headerY);
    headerY += 4.5;
  }

  // ── Invoice meta (right column) ───────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, rightCol, 18, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  let metaY = 24;
  pdf.text(`Invoice #: ${invoiceNumber || 'DRAFT'}`, rightCol, metaY, { align: 'right' });
  metaY += 5;
  pdf.text(`Date: ${date || new Date().toLocaleDateString('en-GB')}`, rightCol, metaY, { align: 'right' });
  metaY += 5;
  if (dueDate) {
    pdf.text(`Due Date: ${dueDate}`, rightCol, metaY, { align: 'right' });
    metaY += 5;
  }
  const paymentLabel = formatPdfPaymentMethod(doc.paymentMethod);
  if (paymentLabel) {
    pdf.text(`Payment: ${paymentLabel}`, rightCol, metaY, { align: 'right' });
    metaY += 5;
  }

  const dividerY = Math.max(headerY, metaY) + 4;
  pdf.setDrawColor(210, 210, 210);
  pdf.setLineWidth(0.4);
  pdf.line(PAGE_MARGIN, dividerY, rightCol, dividerY);

  // ── Bill To ───────────────────────────────────────────────────────────────
  let yPos = dividerY + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BILL TO', PAGE_MARGIN, yPos);

  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(customer?.name || 'Customer', PAGE_MARGIN, yPos);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  yPos += 5;

  if (customer?.ntn) {
    const taxIdLabel = standards?.taxIdLabel || 'Tax ID';
    pdf.text(`${taxIdLabel}: ${customer.ntn}`, PAGE_MARGIN, yPos);
    yPos += 4.5;
  }
  if (customer?.address) {
    const addrLines = pdf.splitTextToSize(String(customer.address), 90);
    pdf.text(addrLines, PAGE_MARGIN, yPos);
    yPos += addrLines.length * 4.5;
  }
  const provinceLabel = formatPdfProvinceLabel(customer?.province);
  const customerCity = [customer?.city, provinceLabel].filter(Boolean).join(', ');
  if (customerCity) {
    pdf.text(customerCity, PAGE_MARGIN, yPos);
    yPos += 4.5;
  }
  if (customer?.phone) {
    pdf.text(`Phone: ${customer.phone}`, PAGE_MARGIN, yPos);
    yPos += 4.5;
  }
  if (customer?.email) {
    pdf.text(customer.email, PAGE_MARGIN, yPos);
    yPos += 4.5;
  }

  yPos += 4;

  // ── Line items (full content width — columns sum to CONTENT_WIDTH) ────────
  const normalizedItems = (items || []).map(normalizePdfLineItem);
  const tableData = normalizedItems.map((item, idx) => [
    String(idx + 1),
    item.name,
    String(item.quantity),
    item.unit,
    money(item.rate),
    item.taxPercent > 0 ? `${item.taxPercent}%` : '-',
    money(item.amount),
  ]);

  if (!tableData.length) {
    tableData.push(['1', 'Item', '1', 'pcs', money(0), '-', money(0)]);
  }

  // Fixed widths must equal CONTENT_WIDTH so the table aligns with header margins
  const colWidths = {
    0: 10,
    1: 68,
    2: 14,
    3: 16,
    4: 30,
    5: 16,
    6: 28,
  };

  pdf.autoTable({
    startY: yPos,
    head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Tax', 'Amount']],
    body: tableData,
    theme: 'plain',
    tableWidth: CONTENT_WIDTH,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    headStyles: {
      fillColor: brand,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [252, 250, 251] },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], halign: 'left' },
      2: { cellWidth: colWidths[2], halign: 'center' },
      3: { cellWidth: colWidths[3], halign: 'center' },
      4: { cellWidth: colWidths[4], halign: 'right' },
      5: { cellWidth: colWidths[5], halign: 'center' },
      6: { cellWidth: colWidths[6], halign: 'right' },
    },
    styles: { lineColor: [230, 230, 230], lineWidth: 0.1, overflow: 'linebreak' },
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  const finalY = pdf.lastAutoTable.finalY + 8;
  const labelX = rightCol - 52;
  const amountX = rightCol;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);

  let currentY = finalY;

  const addTotalRow = (label, amount, { bold = false, color = [60, 60, 60], prefix = '' } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    pdf.text(label, labelX, currentY);
    pdf.text(`${prefix}${money(amount)}`, amountX, currentY, { align: 'right' });
    currentY += bold ? 7 : 5.5;
  };

  addTotalRow('Subtotal:', totals.subtotal);

  if (totals.discount > 0) {
    addTotalRow('Discount:', totals.discount, { prefix: '-' });
  }
  if (totals.seasonalDiscount > 0) {
    addTotalRow('Seasonal Discount:', totals.seasonalDiscount, { prefix: '-' });
  }

  for (const line of totals.taxLines) {
    addTotalRow(`${line.label}:`, line.amount);
  }

  if (totals.roundOff !== 0) {
    addTotalRow('Round Off:', Math.abs(totals.roundOff), {
      prefix: totals.roundOff > 0 ? '+' : '-',
    });
  }

  pdf.setDrawColor(...brand);
  pdf.setLineWidth(0.5);
  pdf.line(labelX - 5, currentY - 1.5, amountX, currentY - 1.5);

  currentY += 3.5;
  addTotalRow('TOTAL:', totals.total, { bold: true, color: brand });

  // ── Notes & terms ─────────────────────────────────────────────────────────
  currentY += 6;
  if (notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Notes', PAGE_MARGIN, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    const noteLines = pdf.splitTextToSize(String(notes), 110);
    pdf.text(noteLines, PAGE_MARGIN, currentY + 5);
    currentY += 5 + noteLines.length * 4.5;
  }

  const termsDays = paymentTerms ?? business?.default_payment_terms ?? 30;
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Payment terms: Net ${termsDays} days. ${isPakistaniDomain ? 'FBR-compliant tax invoice.' : 'Thank you for your business.'}`,
    PAGE_MARGIN,
    currentY + 4
  );

  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This is a computer-generated document.', PAGE_MARGIN, pageHeight - 12);
  pdf.text(`Generated by ${business?.name || 'Tenvo'}`, PAGE_MARGIN, pageHeight - 8);

  return pdf;
}

export function invoicePDFToBuffer(pdfDoc) {
  const arrayBuffer = pdfDoc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

import { exportToCSV, exportToExcel } from '../pdf';

// Note: Excel export functions are async and should be awaited

/**
 * Export invoices to various formats
 */
export async function exportInvoices(invoices, format = 'csv') {
  const data = invoices.map(inv => ({
    'Invoice Number': inv.invoiceNumber || inv.number,
    'Date': inv.date,
    'Customer': inv.customerName || inv.customer,
    'Email': inv.customerEmail || '',
    'Subtotal': inv.subtotal || 0,
    'Tax': inv.tax || 0,
    'Discount': inv.discount || 0,
    'Total': inv.total || inv.amount,
    'Status': inv.status,
  }));

  if (format === 'csv') {
    exportToCSV(data, 'invoices');
  } else if (format === 'excel') {
    await exportToExcel(data, 'invoices');
  }
}

/**
 * Export products to various formats
 * ENHANCED: Preserves batch tracking, serial tracking, and multi-location data
 */
export async function exportProducts(products, format = 'csv') {
  const data = products.map(prod => {
    const baseData = {
      'Name': prod.name,
      'SKU': prod.sku || '',
      'Barcode': prod.barcode || '',
      'Category': prod.category || '',
      'Price': prod.price,
      'Cost': prod.cost || 0,
      'Stock': prod.stock,
      'Min Stock': prod.minStock || 0,
      'Unit': prod.unit || '',
    };

    // BATCH TRACKING: Export batch data as JSON for round-trip preservation
    if (prod.batches && prod.batches.length > 0) {
      const batchData = prod.batches.map(batch => ({
        batch_number: batch.batch_number || batch.batchNumber,
        quantity: batch.quantity || batch.qty,
        expiry_date: batch.expiry_date || batch.expiryDate,
        manufacturing_date: batch.manufacturing_date || batch.manufacturingDate,
        cost_price: batch.cost_price || batch.costPrice
      }));
      baseData['Batch Tracking Data'] = JSON.stringify(batchData);
      baseData['Has Batch Tracking'] = 'Yes';
    } else {
      baseData['Has Batch Tracking'] = 'No';
    }

    // SERIAL TRACKING: Export serial data as JSON for round-trip preservation
    if (prod.serials && prod.serials.length > 0) {
      const serialData = prod.serials.map(serial => ({
        serial_number: serial.serial_number || serial.serialNumber,
        status: serial.status || 'active',
        warranty_expiry: serial.warranty_expiry || serial.warrantyExpiry,
        warranty_start_date: serial.warranty_start_date || serial.warrantyStartDate
      }));
      baseData['Serial Tracking Data'] = JSON.stringify(serialData);
      baseData['Has Serial Tracking'] = 'Yes';
    } else {
      baseData['Has Serial Tracking'] = 'No';
    }

    // MULTI-LOCATION: Export location stock data as JSON
    if (prod.locations && prod.locations.length > 0) {
      const locationData = prod.locations.map(loc => ({
        warehouse: loc.warehouse || loc.warehouseName,
        quantity: loc.quantity || loc.stock,
        min_level: loc.min_level || loc.minLevel
      }));
      baseData['Location Stock Data'] = JSON.stringify(locationData);
    }

    // METADATA: Add export timestamp for round-trip tracking
    baseData['Last Updated'] = prod.updatedAt || new Date().toISOString();

    // Include Domain-specific data
    if (prod.domain_data) {
      Object.entries(prod.domain_data).forEach(([key, val]) => {
        // Humanize key (e.g., 'articleno' -> 'Article No')
        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
          .replace(/^\w/, c => c.toUpperCase());
        baseData[label] = val;
      });
    }

    return baseData;
  });

  // Collect all unique headers (to ensure dynamic fields aren't missed)
  const allHeaders = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  const normalizedData = data.map(row => {
    const newRow = {};
    allHeaders.forEach(h => newRow[h] = row[h] || '');
    return newRow;
  });

  if (format === 'csv') {
    exportToCSV(normalizedData, 'products');
  } else if (format === 'excel') {
    await exportToExcel(normalizedData, 'products');
  }
}

/**
 * Export customers to various formats
 */
export async function exportCustomers(customers, format = 'csv') {
  const data = customers.map(cust => ({
    'Name': cust.name,
    'Email': cust.email || '',
    'Phone': cust.phone || '',
    'Address': cust.address || '',
    'City': cust.city || '',
    'State': cust.state || '',
    'GSTIN': cust.gstin || '',
    'Total Orders': cust.totalOrders || 0,
    'Total Spent': cust.totalSpent || 0,
  }));

  if (format === 'csv') {
    exportToCSV(data, 'customers');
  } else if (format === 'excel') {
    await exportToExcel(data, 'customers');
  }
}


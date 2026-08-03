/**
 * Excel Export Service
 * Handles inventory data export to Excel with batch/serial tracking
 * Supports round-trip import/export without data loss
 */

import * as XLSX from 'xlsx';

/**
 * Export products to Excel workbook with batch and serial data
 * @param {Array} products - Product array with stock/batch/serial details
 * @param {Object} options - Export options
 * @returns {Promise<{success: boolean, buffer?: Uint8Array, error?: string}>}
 */
export async function exportProductsToExcel(products, options = {}) {
  try {
    if (!products || products.length === 0) {
      return { success: false, error: 'No products to export' };
    }

    const {
      includeInactive = false,
      includeBatches = true,
      includeSerials = true,
      currency = 'PKR'
    } = options;

    // Filter products
    let toExport = products;
    if (!includeInactive) {
      toExport = products.filter(p => !p.is_deleted);
    }

    // Main products sheet
    const productsSheet = toExport.map((product, idx) => ({
      'ID': product.id,
      'SKU': product.sku || '',
      'Name': product.name || '',
      'Category': product.category || '',
      'Unit': product.unit || 'PC',
      'Cost': product.cost_price || 0,
      'Price': product.price || product.selling_price || 0,
      'Stock': product.stock || 0,
      'Min Stock': product.min_stock || 0,
      'Barcode': product.barcode || '',
      'Description': product.description || '',
      'Supplier ID': product.preferred_supplier_id || '',
      'Tax Rate': product.tax_rate || 0,
      'Reorder Qty': product.reorder_quantity || 0,
      'Is Active': product.is_active ? 'Yes' : 'No',
      'Created Date': product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : '',
      'Last Updated': product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add products sheet
    const ws1 = XLSX.utils.json_to_sheet(productsSheet);
    setColumnWidths(ws1, {
      'A': 15, 'B': 12, 'C': 20, 'D': 15, 'E': 8,
      'F': 12, 'G': 12, 'H': 10, 'I': 12, 'J': 12,
      'K': 15, 'L': 20, 'M': 10, 'N': 12, 'O': 8,
      'P': 15, 'Q': 15
    });
    XLSX.utils.book_append_sheet(wb, ws1, 'Products');

    // Add batch tracking sheet if enabled and data exists
    if (includeBatches) {
      const batchesData = extractBatchData(toExport);
      if (batchesData.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(batchesData);
        setColumnWidths(ws2, {
          'A': 15, 'B': 12, 'C': 20, 'D': 15, 'E': 12,
          'F': 12, 'G': 15, 'H': 12, 'I': 20
        });
        XLSX.utils.book_append_sheet(wb, ws2, 'Batches');
      }
    }

    // Add serial tracking sheet if enabled and data exists
    if (includeSerials) {
      const serialsData = extractSerialData(toExport);
      if (serialsData.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(serialsData);
        setColumnWidths(ws3, {
          'A': 15, 'B': 12, 'C': 20, 'D': 20, 'E': 12,
          'F': 12, 'G': 15
        });
        XLSX.utils.book_append_sheet(wb, ws3, 'Serials');
      }
    }

    // Add stock locations sheet for multi-warehouse
    const locationsData = extractStockLocations(toExport);
    if (locationsData.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(locationsData);
      setColumnWidths(ws4, {
        'A': 15, 'B': 12, 'C': 20, 'D': 20, 'E': 10, 'F': 15
      });
      XLSX.utils.book_append_sheet(wb, ws4, 'Stock Locations');
    }

    // Add metadata sheet
    const metadataSheet = [{
      'Export Date': new Date().toISOString(),
      'Total Products': toExport.length,
      'Batches Included': includeBatches ? 'Yes' : 'No',
      'Serials Included': includeSerials ? 'Yes' : 'No',
      'Currency': currency,
      'Format Version': '1.0'
    }];
    const ws5 = XLSX.utils.json_to_sheet(metadataSheet);
    XLSX.utils.book_append_sheet(wb, ws5, '_Metadata');

    // Write to buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return {
      success: true,
      buffer,
      fileName: `inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      recordCount: toExport.length
    };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: `Export failed: ${error.message}` };
  }
}

/**
 * Extract batch data from products for secondary sheet
 * @param {Array} products - Products with batch information
 * @returns {Array} - Batch records
 */
function extractBatchData(products) {
  const batches = [];

  products.forEach(product => {
    // Check if product has batch data in domain_data or product_batches relation
    if (product.product_batches && Array.isArray(product.product_batches)) {
      product.product_batches.forEach(batch => {
        batches.push({
          'Product ID': product.id,
          'Product SKU': product.sku,
          'Product Name': product.name,
          'Batch Number': batch.batch_number || batch.name || '',
          'Quantity': batch.quantity || 0,
          'Available': batch.available_quantity || batch.quantity || 0,
          'Manufacturing Date': batch.manufacturing_date ? new Date(batch.manufacturing_date).toISOString().split('T')[0] : '',
          'Expiry Date': batch.expiry_date ? new Date(batch.expiry_date).toISOString().split('T')[0] : '',
          'Status': batch.is_expired ? 'Expired' : 'Active'
        });
      });
    }

    // Also check domain_data.batch_number
    if (product.domain_data?.batch_number) {
      batches.push({
        'Product ID': product.id,
        'Product SKU': product.sku,
        'Product Name': product.name,
        'Batch Number': product.domain_data.batch_number,
        'Quantity': product.stock || 0,
        'Available': product.stock || 0,
        'Manufacturing Date': product.domain_data.manufacturing_date || '',
        'Expiry Date': product.domain_data.expiry_date || '',
        'Status': product.domain_data.is_expired ? 'Expired' : 'Active'
      });
    }
  });

  return batches;
}

/**
 * Extract serial data from products for secondary sheet
 * @param {Array} products - Products with serial information
 * @returns {Array} - Serial records
 */
function extractSerialData(products) {
  const serials = [];

  products.forEach(product => {
    // Check if product has serial data in domain_data or product_serials relation
    if (product.product_serials && Array.isArray(product.product_serials)) {
      product.product_serials.forEach(serial => {
        serials.push({
          'Product ID': product.id,
          'Product SKU': product.sku,
          'Product Name': product.name,
          'Serial Number': serial.serial_number || serial.number || '',
          'Status': serial.status || 'In Stock',
          'Warranty Expiry': serial.warranty_expiry ? new Date(serial.warranty_expiry).toISOString().split('T')[0] : '',
          'Notes': serial.notes || ''
        });
      });
    }

    // Also check domain_data.serial_numbers
    if (product.domain_data?.serial_numbers && Array.isArray(product.domain_data.serial_numbers)) {
      product.domain_data.serial_numbers.forEach((serialNum, idx) => {
        serials.push({
          'Product ID': product.id,
          'Product SKU': product.sku,
          'Product Name': product.name,
          'Serial Number': serialNum,
          'Status': 'In Stock',
          'Warranty Expiry': product.domain_data.warranty_expiry || '',
          'Notes': ''
        });
      });
    }
  });

  return serials;
}

/**
 * Extract stock by location/warehouse
 * @param {Array} products - Products with location data
 * @returns {Array} - Stock location records
 */
function extractStockLocations(products) {
  const locations = [];

  products.forEach(product => {
    // Check if product has location data
    if (product.product_stock_locations && Array.isArray(product.product_stock_locations)) {
      product.product_stock_locations.forEach(loc => {
        locations.push({
          'Product ID': product.id,
          'Product SKU': product.sku,
          'Product Name': product.name,
          'Warehouse/Location': loc.location_name || loc.warehouse_id || '',
          'Stock': loc.quantity || 0,
          'Reserved': loc.reserved_quantity || 0,
          'Available': (loc.quantity || 0) - (loc.reserved_quantity || 0)
        });
      });
    }
  });

  return locations;
}

/**
 * Set column widths for Excel sheet
 * @param {Object} worksheet - XLSX worksheet object
 * @param {Object} widths - Map of column letters to widths
 */
function setColumnWidths(worksheet, widths) {
  worksheet['!cols'] = Object.entries(widths).map(([col, width]) => ({
    wch: width
  }));
}

/**
 * Generate CSV for export (simpler format, no formatting)
 * @param {Array} products - Products to export
 * @param {string} format - 'products' | 'batches' | 'serials'
 * @returns {string} - CSV content
 */
export function generateCSV(products, format = 'products') {
  let data = [];
  let headers = [];

  switch (format) {
    case 'batches':
      headers = ['Product ID', 'Product SKU', 'Product Name', 'Batch Number', 'Quantity', 'Manufacturing Date', 'Expiry Date'];
      data = extractBatchData(products);
      break;

    case 'serials':
      headers = ['Product ID', 'Product SKU', 'Product Name', 'Serial Number', 'Status', 'Warranty Expiry'];
      data = extractSerialData(products);
      break;

    case 'products':
    default:
      headers = ['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Stock', 'Min Stock', 'Barcode'];
      data = products.map(p => ({
        'SKU': p.sku || '',
        'Name': p.name || '',
        'Category': p.category || '',
        'Unit': p.unit || '',
        'Cost': p.cost_price || 0,
        'Price': p.price || p.selling_price || 0,
        'Stock': p.stock || 0,
        'Min Stock': p.min_stock || 0,
        'Barcode': p.barcode || ''
      }));
  }

  // Create CSV
  let csv = headers.join(',') + '\n';
  csv += data.map(row =>
    headers.map(header => {
      const val = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(val).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',')
  ).join('\n');

  return csv;
}

/**
 * Validate round-trip: check if export format can be re-imported
 * @param {Uint8Array} excelBuffer - Exported Excel buffer
 * @returns {Promise<{valid: boolean, errors: Array}>}
 */
export async function validateRoundTrip(excelBuffer) {
  try {
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    const errors = [];

    // Check required sheet exists
    if (!workbook.SheetNames.includes('Products')) {
      errors.push('Missing "Products" sheet');
    }

    const validateSheetColumns = (sheetName, requiredColumns) => {
      if (!workbook.SheetNames.includes(sheetName)) {
        return;
      }

      const ws = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (data.length === 0) {
        errors.push(`${sheetName} sheet is empty`);
        return;
      }

      const actualCols = data.length > 0 ? Object.keys(data[0]) : [];

      requiredColumns.forEach(col => {
        if (!actualCols.includes(col)) {
          errors.push(`Missing required column: ${col}`);
        }
      });
    };

    // Validate sheet structure for every sheet we export.
    validateSheetColumns('Products', ['SKU', 'Name', 'Price', 'Stock']);
    validateSheetColumns('Batches', ['Product SKU', 'Batch Number', 'Quantity', 'Available']);
    validateSheetColumns('Serials', ['Product SKU', 'Serial Number', 'Status']);
    validateSheetColumns('Stock Locations', ['Product SKU', 'Warehouse/Location', 'Stock', 'Available']);

    return {
      valid: errors.length === 0,
      errors,
      warning: errors.length === 0 ? null : 'Export may not round-trip correctly'
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

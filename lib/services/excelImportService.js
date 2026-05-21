/**
 * Excel Import Service
 * Handles Excel file parsing, validation, and data transformation
 * CRITICAL: Production-ready Excel import for inventory system
 */

import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract sheets
 * @param {File} file - Excel file to parse
 * @returns {Promise<{success: boolean, sheets: Object, error?: string}>}
 */
export async function parseExcelFile(file) {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      return { success: false, error: 'Invalid file format. Please upload .xlsx, .xls, or .csv' };
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum 10MB allowed' };
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Extract all sheets
    const sheets = {};
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      sheets[sheetName] = data;
    });

    return {
      success: true,
      sheets,
      fileName: file.name,
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames
    };
  } catch (error) {
    console.error('Excel parsing error:', error);
    return { success: false, error: `Failed to parse file: ${error.message}` };
  }
}

/**
 * Validate imported row against schema
 * @param {Object} row - Data row from Excel
 * @param {Object} existingProducts - Map of existing products by SKU
 * @param {string} category - Product category for domain validation
 * @returns {Object} - {isValid: boolean, errors: Array, warnings: Array}
 */
export function validateImportRow(row, existingProducts = {}, category = 'retail-shop') {
  const errors = [];
  const warnings = [];
  const cleaned = {};

  // REQUIRED FIELDS
  if (!(row.Name || row.name)) {
    errors.push('Product name is required');
  } else {
    cleaned.name = String(row.Name || row.name).trim();
  }

  // SKU validation
  const sku = String(row.SKU || row.sku || '').trim();
  if (sku) {
    if (existingProducts[sku] && !row.id) {
      warnings.push(`SKU "${sku}" already exists. Will update existing product.`);
    }
    cleaned.sku = sku;
  } else {
    warnings.push('SKU not provided. Will auto-generate.');
  }

  // PRICE VALIDATION
  const price = parseFloat(row.Price || row.price || 0);
  if (isNaN(price) || price < 0) {
    errors.push(`Invalid price: "${row.Price || row.price}". Must be a positive number.`);
  } else if (price === 0) {
    warnings.push('Price is zero. This may be unintended.');
  } else {
    cleaned.price = price;
  }

  // COST VALIDATION
  const cost = parseFloat(row.Cost || row.cost || 0);
  if (isNaN(cost)) {
    errors.push(`Invalid cost: "${row.Cost || row.cost}". Must be a number.`);
  } else {
    cleaned.cost = Math.max(0, cost);
  }

  // STOCK VALIDATION
  const stock = parseFloat(row.Stock || row.stock || 0);
  if (isNaN(stock) || stock < 0) {
    errors.push(`Invalid stock: "${row.Stock || row.stock}". Must be a non-negative number.`);
  } else {
    cleaned.stock = Math.floor(stock);
  }

  // MIN STOCK VALIDATION
  const minStock = parseFloat(row['Min Stock'] || row['min_stock'] || 0);
  if (isNaN(minStock) || minStock < 0) {
    warnings.push('Invalid min stock. Setting to 0.');
    cleaned.minStock = 0;
  } else {
    cleaned.minStock = Math.floor(minStock);
  }

  // OPTIONAL FIELDS
  cleaned.barcode = String(row.Barcode || row.barcode || '').trim();
  cleaned.category = String(row.Category || row.category || category).trim();
  cleaned.unit = String(row.Unit || row.unit || '').trim();

  // INLINE BATCH (for simple flat sheets)
  if (row['Batch Number'] || row.batch_number) {
    cleaned.batch_number = String(row['Batch Number'] || row.batch_number).trim();
    const expiryStr = row['Expiry Date'] || row.expiry_date;
    const mfgStr = row['Manufacturing Date'] || row.manufacturing_date;
    
    cleaned.expiry_date = parseDateField(expiryStr) || null;
    cleaned.manufacturing_date = parseDateField(mfgStr) || null;
  }

  // INLINE SERIAL (for simple flat sheets)
  if (row['Serial Number'] || row.serial_number) {
    cleaned.serial_number = String(row['Serial Number'] || row.serial_number).trim();
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleaned,
    originalRow: row
  };
}

/**
 * Parse date field flexibly
 * @param {string|Date} dateStr - Date string
 * @returns {string|null} - YYYY-MM-DD format or null
 */
function parseDateField(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }

  dateStr = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    if (parseInt(month) < 13) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Transform validated rows into product objects with Relational Data (Batches, Serials)
 * @param {Array} validatedRows - Output from validateImportRow
 * @param {string} businessId - Business ID
 * @param {Object} domainData - Domain-specific data template
 * @param {Object} allSheets - All sheets parsed from Excel to extract batches and serials
 * @returns {Array} - Array of product objects ready for DB insertion
 */
export function transformImportedData(validatedRows, businessId, domainData = {}, allSheets = {}) {
  const batchesSheet = allSheets['Batches'] || [];
  const serialsSheet = allSheets['Serials'] || [];

  return validatedRows
    .filter(row => row.isValid || row.errors.length === 0)
    .map((row, index) => {
      const sku = row.cleaned.sku;
      
      // Extract Relational Batches
      const productBatches = batchesSheet
        .filter(b => (b['Product SKU'] || b.sku) === sku)
        .map(b => ({
          batch_number: b['Batch Number'] || b.batch_number || b.Batch,
          quantity: Number(b.Quantity || b.quantity) || 0,
          manufacturing_date: parseDateField(b['Manufacturing Date'] || b.manufacturing_date),
          expiry_date: parseDateField(b['Expiry Date'] || b.expiry_date),
          notes: b.Notes || b.notes || null
        }));
      
      // Add inline batch if provided and not in the batches sheet
      if (row.cleaned.batch_number && productBatches.length === 0) {
        productBatches.push({
          batch_number: row.cleaned.batch_number,
          quantity: row.cleaned.stock,
          manufacturing_date: row.cleaned.manufacturing_date,
          expiry_date: row.cleaned.expiry_date
        });
      }

      // Extract Relational Serials
      const productSerials = serialsSheet
        .filter(s => (s['Product SKU'] || s.sku) === sku)
        .map(s => ({
          serial_number: s['Serial Number'] || s.serial_number || s.Serial,
          status: s.Status || s.status || 'in_stock',
          warranty_expiry: parseDateField(s['Warranty Expiry'] || s.warranty_expiry),
          notes: s.Notes || s.notes || null
        }));

      // Add inline serial if provided and not in the serials sheet
      if (row.cleaned.serial_number && productSerials.length === 0) {
        productSerials.push({
          serial_number: row.cleaned.serial_number,
          status: 'in_stock'
        });
      }

      return {
        ...row.cleaned,
        business_id: businessId,
        domain_data: domainData,
        import_source: 'excel',
        import_batch: new Date().toISOString(),
        _rowIndex: index + 1,
        batches: productBatches,
        serialNumbers: productSerials
      };
    });
}

/**
 * Detect duplicate products in import data
 * @param {Array} rows - Validated rows
 * @returns {Array} - Array of duplicate SKU groups
 */
export function detectDuplicates(rows) {
  const skuMap = {};
  const duplicates = [];

  rows.forEach((row, index) => {
    const sku = row.cleaned.sku;
    if (sku) {
      if (!skuMap[sku]) {
        skuMap[sku] = [];
      }
      skuMap[sku].push({ rowIndex: index + 1, ...row.cleaned });
    }
  });

  Object.entries(skuMap).forEach(([sku, items]) => {
    if (items.length > 1) {
      duplicates.push({
        sku,
        count: items.length,
        rows: items
      });
    }
  });

  return duplicates;
}

/**
 * Auto-generate SKU from product name
 * @param {string} name - Product name
 * @param {number} index - Row index for uniqueness
 * @returns {string} - Generated SKU
 */
export function generateSkuFromName(name, index = 0) {
  if (!name) return `AUTO-${index}`;

  const words = name.trim().split(/\s+/);
  let sku = words[0].substring(0, 3).toUpperCase();

  if (words.length > 1) {
    sku += words[1].substring(0, 1).toUpperCase();
  }

  sku += `-${index + 1}`;
  return sku;
}

/**
 * Prepare import summary for review before commit
 * @param {Object} parseResult - Result from parseExcelFile
 * @param {Array} validationResults - Array of validateImportRow results
 * @returns {Object} - Summary object
 */
export function generateImportSummary(parseResult, validationResults) {
  const total = validationResults.length;
  const valid = validationResults.filter(r => r.isValid).length;
  const warnings = validationResults.filter(r => r.warnings.length > 0).length;
  const errors = validationResults.filter(r => r.errors.length > 0).length;

  const errorsByType = {};
  const warningsByType = {};

  validationResults.forEach(result => {
    result.errors.forEach(error => {
      errorsByType[error] = (errorsByType[error] || 0) + 1;
    });
    result.warnings.forEach(warning => {
      warningsByType[warning] = (warningsByType[warning] || 0) + 1;
    });
  });

  return {
    fileName: parseResult.fileName,
    sheetName: Object.keys(parseResult.sheets)[0],
    totalRows: total,
    validRows: valid,
    rowsWithWarnings: warnings,
    rowsWithErrors: errors,
    successRate: total > 0 ? ((valid / total) * 100).toFixed(1) : 0,
    errorSummary: errorsByType,
    warningSummary: warningsByType,
    canProceed: errors === 0,
    duplicatesDetected: validationResults.some(r => r.cleaned.sku && validationResults.filter(r2 => r2.cleaned.sku === r.cleaned.sku).length > 1)
  };
}

export default {
  parseExcelFile,
  validateImportRow,
  transformImportedData,
  detectDuplicates,
  generateSkuFromName,
  generateImportSummary
};

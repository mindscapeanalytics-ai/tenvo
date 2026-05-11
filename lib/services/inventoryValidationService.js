/**
 * Comprehensive Inventory Validation Service
 * Ensures data quality before database writes
 * Production-ready with detailed error/warning categorization
 */

/**
 * Validate product data before import or creation
 * @param {Object} productData - Product data to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowNegativeStock - Allow negative stock (default: false)
 * @param {boolean} options.allowZeroPrice - Allow zero price (default: false)
 * @param {boolean} options.requireBatchData - Require batch tracking data (default: false)
 * @param {boolean} options.requireSerialData - Require serial tracking data (default: false)
 * @param {Map} options.existingSkus - Map of existing SKUs for duplicate detection
 * @param {Object} options.domainSchema - Domain validation schema
 * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
 */
export function validateProductData(productData, options = {}) {
  const errors = [];
  const warnings = [];
  const {
    allowNegativeStock = false,
    allowZeroPrice = false,
    requireBatchData = false,
    requireSerialData = false,
    existingSkus = new Map(),
    domainSchema = {}
  } = options;

  // REQUIRED FIELDS
  if (!productData.name || productData.name.trim() === '') {
    errors.push('Product name is required');
  }

  if (productData.name && productData.name.length > 255) {
    errors.push('Product name must be less than 255 characters');
  }

  // PRICE VALIDATION (CRITICAL)
  if (productData.price === undefined || productData.price === null || productData.price === '') {
    errors.push('Price is required');
  } else {
    const price = parseFloat(productData.price);
    if (isNaN(price)) {
      errors.push(`Price must be a valid number, got: "${productData.price}"`);
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    } else if (price === 0 && !allowZeroPrice) {
      warnings.push('Price is zero. This may be unintended.');
    }
  }

  // COST VALIDATION
  if (productData.cost !== undefined && productData.cost !== null && productData.cost !== '') {
    const cost = parseFloat(productData.cost);
    if (isNaN(cost)) {
      errors.push(`Cost must be a valid number, got: "${productData.cost}"`);
    } else if (cost < 0) {
      errors.push('Cost cannot be negative');
    }

    // Compare cost vs price
    if (!isNaN(parseFloat(productData.price)) && cost > parseFloat(productData.price)) {
      warnings.push('Cost is higher than selling price. Profit margin will be negative.');
    }
  }

  // STOCK VALIDATION
  if (productData.stock !== undefined && productData.stock !== null && productData.stock !== '') {
    const stock = parseFloat(productData.stock);
    if (isNaN(stock)) {
      errors.push(`Stock must be a valid number, got: "${productData.stock}"`);
    } else if (stock < 0 && !allowNegativeStock) {
      errors.push('Stock cannot be negative');
    } else if (!Number.isInteger(stock)) {
      warnings.push('Stock value contains decimals. Will be rounded down.');
    }
  } else if (productData.stock === '' || productData.stock === null) {
    // Stock is optional, default to 0
    productData.stock = 0;
  }

  // SKU VALIDATION
  if (productData.sku && productData.sku.trim()) {
    const sku = productData.sku.trim().toUpperCase();

    // Check length
    if (sku.length > 50) {
      errors.push('SKU must be 50 characters or less');
    }

    // Check for special characters (allow hyphens, underscores, numbers, letters)
    if (!/^[A-Z0-9\-_]+$/.test(sku)) {
      errors.push('SKU can only contain letters, numbers, hyphens, and underscores');
    }

    // Check for duplicates (if not updating existing product)
    if (!productData.id && existingSkus.has(sku)) {
      warnings.push(`SKU "${sku}" already exists. This will create a duplicate.`);
    }
  } else if (!productData.id) {
    // Auto-generate SKU if not provided for new products
    warnings.push('SKU not provided. Will auto-generate from product name.');
  }

  // CATEGORY VALIDATION
  if (productData.category && productData.category.trim() === '') {
    warnings.push('Category not specified. Using default.');
  }

  // UNIT VALIDATION
  if (productData.unit && productData.unit.trim() === '') {
    warnings.push('Unit not specified. Using default.');
  }

  // MIN STOCK VALIDATION
  if (productData.minStock !== undefined && productData.minStock !== null && productData.minStock !== '') {
    const minStock = parseFloat(productData.minStock);
    if (isNaN(minStock)) {
      errors.push(`Min Stock must be a valid number, got: "${productData.minStock}"`);
    } else if (minStock < 0) {
      errors.push('Min Stock cannot be negative');
    }

    // Compare with current stock
    if (!isNaN(parseFloat(productData.stock)) && parseFloat(productData.stock) < minStock) {
      warnings.push(`Current stock is below minimum level. Consider reordering.`);
    }
  }

  // BATCH TRACKING DATA
  if (productData.batch_number || productData.batches) {
    const batchNumber = productData.batch_number;
    if (batchNumber && batchNumber.trim() === '') {
      errors.push('Batch number cannot be empty if provided');
    }

    // Validate batch dates
    if (productData.expiry_date) {
      if (!isValidDateFormat(productData.expiry_date)) {
        errors.push(`Invalid expiry date format: "${productData.expiry_date}". Use YYYY-MM-DD`);
      } else if (isPastDate(productData.expiry_date)) {
        errors.push(`Expiry date is in the past: "${productData.expiry_date}"`);
      }
    }

    if (productData.manufacturing_date) {
      if (!isValidDateFormat(productData.manufacturing_date)) {
        errors.push(`Invalid manufacturing date format: "${productData.manufacturing_date}". Use YYYY-MM-DD`);
      } else if (isFutureDate(productData.manufacturing_date)) {
        warnings.push(`Manufacturing date is in the future: "${productData.manufacturing_date}"`);
      }
    }
  }

  // SERIAL TRACKING DATA
  if (productData.serial_number || productData.serials) {
    const serialNumber = productData.serial_number;
    if (serialNumber && serialNumber.trim() === '') {
      errors.push('Serial number cannot be empty if provided');
    }

    if (productData.warranty_expiry) {
      if (!isValidDateFormat(productData.warranty_expiry)) {
        errors.push(`Invalid warranty expiry format: "${productData.warranty_expiry}". Use YYYY-MM-DD`);
      }
    }
  }

  // BARCODE VALIDATION
  if (productData.barcode && productData.barcode.trim()) {
    const barcode = productData.barcode.trim();
    if (barcode.length > 50) {
      errors.push('Barcode must be 50 characters or less');
    }

    // Warn if barcode format unusual
    if (!/^[0-9\-A-Z]+$/.test(barcode)) {
      warnings.push('Barcode contains unusual characters. May not scan properly.');
    }
  }

  // DOMAIN-SPECIFIC VALIDATION
  if (productData.domain_data && domainSchema) {
    const domainErrors = validateDomainData(productData.domain_data, domainSchema);
    errors.push(...domainErrors);
  }

  // TEXT ENCODING VALIDATION (for Unicode support - Urdu text, etc.)
  if (productData.name) {
    try {
      // Check if name contains Unicode characters
      if (/[\u0600-\u06FF]/.test(productData.name)) {
        // Urdu/Arabic text - validate encoding
        const encoded = new TextEncoder().encode(productData.name);
        if (encoded.length > 1020) { // UTF-8 safety margin
          warnings.push('Product name contains many Unicode characters. May be slow to process.');
        }
      }
    } catch (e) {
      warnings.push('Could not validate text encoding. Proceed with caution.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: productData
  };
}

/**
 * Validate batch import data
 * @param {Array} products - Array of product data
 * @param {Object} options - Validation options
 * @returns {Object} - {canProceed: boolean, summary: Object, issues: Array}
 */
export function validateBatchImport(products, options = {}) {
  const issues = {
    critical: [],
    warnings: [],
    skipped: []
  };

  const existingSkus = new Map();
  const results = [];

  products.forEach((product, index) => {
    const validation = validateProductData(product, { existingSkus, ...options });

    if (!validation.valid) {
      issues.critical.push({
        row: index + 2,
        product: product.name || 'Unknown',
        errors: validation.errors
      });
      results.push({ ...validation, rowIndex: index + 2, status: 'error' });
    } else if (validation.warnings.length > 0) {
      issues.warnings.push({
        row: index + 2,
        product: product.name,
        warnings: validation.warnings
      });
      results.push({ ...validation, rowIndex: index + 2, status: 'warning' });
    } else {
      results.push({ ...validation, rowIndex: index + 2, status: 'ok' });
    }

    // Track SKU for duplicate detection
    if (product.sku) {
      existingSkus.set(product.sku.toUpperCase(), index);
    }
  });

  const summary = {
    total: products.length,
    valid: results.filter(r => r.status === 'ok').length,
    withWarnings: results.filter(r => r.status === 'warning').length,
    withErrors: results.filter(r => r.status === 'error').length,
    canProceed: issues.critical.length === 0,
    successRate: products.length > 0 ? ((results.filter(r => r.status !== 'error').length / products.length) * 100).toFixed(1) : 0
  };

  return {
    canProceed: summary.canProceed,
    summary,
    issues,
    results,
    recommendation: summary.canProceed ? 'Safe to proceed' : `${issues.critical.length} rows have critical errors`
  };
}

/**
 * Helper: Check if date string is valid YYYY-MM-DD
 */
function isValidDateFormat(dateStr) {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Helper: Check if date is in past
 */
function isPastDate(dateStr) {
  if (!isValidDateFormat(dateStr)) return false;
  return new Date(dateStr) < new Date();
}

/**
 * Helper: Check if date is in future
 */
function isFutureDate(dateStr) {
  if (!isValidDateFormat(dateStr)) return false;
  return new Date(dateStr) > new Date();
}

/**
 * Helper: Validate domain-specific data
 */
function validateDomainData(domainData, schema) {
  const errors = [];

  Object.entries(schema).forEach(([field, rules]) => {
    const value = domainData[field];

    if (rules.required && (!value || value.trim?.() === '')) {
      errors.push(`Domain field "${field}" is required`);
    }

    if (rules.type === 'number' && value && isNaN(parseFloat(value))) {
      errors.push(`Domain field "${field}" must be a number`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors.push(`Domain field "${field}" exceeds maximum length of ${rules.maxLength}`);
    }
  });

  return errors;
}

/**
 * Generate validation report for display
 */
export function generateValidationReport(validationResult) {
  const { valid, errors, warnings, data } = validationResult;

  return {
    status: valid ? 'VALID' : 'INVALID',
    productName: data.name,
    productSku: data.sku,
    criticalIssues: errors,
    cautionItems: warnings,
    issueCount: errors.length + warnings.length,
    canImport: errors.length === 0
  };
}

export default {
  validateProductData,
  validateBatchImport,
  generateValidationReport
};

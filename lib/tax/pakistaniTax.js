/**
 * Pakistani Tax Compliance (FBR/NTN)
 * Federal Board of Revenue (FBR) tax calculations and compliance
 */

/**
 * Pakistani Tax Rates (2024)
 */
export const pakistaniTaxRates = {
  // Sales Tax (Federal)
  salesTax: {
    standard: 0.18, // 18% standard rate (as of 2024 budget)
    reduced: 0.10, // 10% for certain items
    zero: 0.00, // 0% for exempt items
    exempt: null, // Exempt from sales tax
  },

  // Provincial Sales Tax (varies by province)
  provincialTax: {
    punjab: 0.16, // 16% Punjab
    sindh: 0.13, // 13% Sindh
    kp: 0.15, // 15% Khyber Pakhtunkhwa
    balochistan: 0.15, // 15% Balochistan
    islamabad: 0.17, // 17% Islamabad (Federal)
  },

  // Withholding Tax (WHT) rates
  withholdingTax: {
    salary: 0.00, // Varies by income bracket
    services: 0.03, // 3% on services
    supplies: 0.02, // 2% on supplies
    imports: 0.01, // 1% on imports
    exports: 0.00, // 0% on exports
  },

  // Income Tax brackets (2024)
  incomeTax: {
    brackets: [
      { min: 0, max: 600000, rate: 0.00 }, // 0% up to 600k
      { min: 600000, max: 1200000, rate: 0.05 }, // 5% from 600k to 1.2M
      { min: 1200000, max: 1800000, rate: 0.10 }, // 10% from 1.2M to 1.8M
      { min: 1800000, max: 2500000, rate: 0.15 }, // 15% from 1.8M to 2.5M
      { min: 2500000, max: 3500000, rate: 0.175 }, // 17.5% from 2.5M to 3.5M
      { min: 3500000, max: 5000000, rate: 0.20 }, // 20% from 3.5M to 5M
      { min: 5000000, max: Infinity, rate: 0.25 }, // 25% above 5M
    ],
  },
};

/**
 * Tax Categories for different product types
 */
export const pakistaniTaxCategories = {
  // Retail items
  'retail-standard': { salesTax: 0.18, provincialTax: true, wht: 0.02 },
  'retail-reduced': { salesTax: 0.10, provincialTax: true, wht: 0.02 },
  'retail-exempt': { salesTax: 0.00, provincialTax: false, wht: 0.00 },

  // Food items
  'food-essential': { salesTax: 0.00, provincialTax: false, wht: 0.00 }, // Essential food items exempt
  'food-processed': { salesTax: 0.18, provincialTax: true, wht: 0.02 },
  'food-beverages': { salesTax: 0.18, provincialTax: true, wht: 0.02 },

  // Pharmaceuticals
  'pharma-essential': { salesTax: 0.00, provincialTax: false, wht: 0.00 },
  'pharma-standard': { salesTax: 0.18, provincialTax: true, wht: 0.02 },

  // Electronics
  'electronics-standard': { salesTax: 0.18, provincialTax: true, wht: 0.02 },
  'electronics-mobile': { salesTax: 0.18, provincialTax: true, wht: 0.02 },

  // Services
  'services-standard': { salesTax: 0.18, provincialTax: true, wht: 0.03 },
  'services-exempt': { salesTax: 0.00, provincialTax: false, wht: 0.00 },
};

/**
 * @typedef {Object} TaxBreakdown
 * @property {number} baseAmount - Base amount
 * @property {number} federalSalesTax - Federal sales tax amount
 * @property {number} provincialSalesTax - Provincial sales tax amount
 * @property {number} withholdingTax - Withholding tax amount
 * @property {number} totalTax - Total tax amount
 * @property {number} totalAmount - Grand total (base + tax)
 * @property {Object} breakdown - Detailed breakdown
 */

/**
 * Calculate Pakistani Sales Tax with rounding
 * 
 * @param {number} amount - Base amount
 * @param {string} [category='retail-standard'] - Tax category from pakistaniTaxCategories
 * @param {string} [province='punjab'] - Province code
 * @returns {TaxBreakdown} Tax breakdown
 */
export function calculatePakistaniTax(amount, category = 'retail-standard', province = 'punjab') {
  const baseAmount = Math.round(parseFloat(amount || 0) * 100) / 100;
  const taxCategory = pakistaniTaxCategories[category] || pakistaniTaxCategories['retail-standard'];

  // Federal Sales Tax
  const federalTax = Math.round((baseAmount * taxCategory.salesTax) * 100) / 100;

  // Provincial Sales Tax (if applicable)
  const provincialRate = pakistaniTaxRates.provincialTax[province] || 0;
  const provincialTax = taxCategory.provincialTax ? Math.round((baseAmount * provincialRate) * 100) / 100 : 0;

  // Withholding Tax
  const whtRate = taxCategory.wht || 0;
  const withholdingTax = Math.round((baseAmount * whtRate) * 100) / 100;

  // Total tax
  const totalTax = Math.round((federalTax + provincialTax + withholdingTax) * 100) / 100;
  const totalAmount = Math.round((baseAmount + totalTax) * 100) / 100;

  return {
    baseAmount,
    federalSalesTax: federalTax,
    provincialSalesTax: provincialTax,
    withholdingTax,
    totalTax,
    totalAmount,
    breakdown: {
      federal: {
        rate: taxCategory.salesTax,
        amount: federalTax,
      },
      provincial: {
        rate: provincialRate,
        amount: provincialTax,
        applicable: taxCategory.provincialTax,
      },
      wht: {
        rate: whtRate,
        amount: withholdingTax,
      },
    },
  };
}

/**
 * Get tax category for a product domain
 * 
 * @param {string} domain - Product/Business domain
 * @returns {string} Tax category key
 */
export function getTaxCategoryForDomain(domain) {
  const domainTaxMap = {
    'retail-shop': 'retail-standard',
    'pharmacy': 'pharma-standard',
    'food-beverages': 'food-processed',
    'grocery': 'food-essential',
    'mobile': 'electronics-mobile',
    'electronics-goods': 'electronics-standard',
    'computer-hardware': 'electronics-standard',
    'textile-wholesale': 'retail-standard',
    'auto-parts': 'retail-standard',
  };

  return domainTaxMap[domain] || 'retail-standard';
}

/**
 * Format NTN (National Tax Number) for display
 */
export function formatNTN(ntn) {
  if (!ntn) return '';
  // NTN format: XXXXX-XXXXX-X (11 digits with hyphens)
  const cleaned = ntn.replace(/\D/g, '');
  if (cleaned.length !== 11) return ntn;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
}

/**
 * Validate NTN format
 */
export function validateNTN(ntn) {
  if (!ntn) return false;
  const cleaned = ntn.replace(/\D/g, '');
  return cleaned.length === 11;
}

/**
 * Format SRN (Sales Tax Registration Number) for display
 */
export function formatSRN(srn) {
  if (!srn) return '';
  // SRN format varies, typically 13-15 characters
  return srn.toUpperCase();
}

/**
 * Format Pakistani phone number
 * Format: +92 3XX XXXXXXX
 */
export function formatPakistaniPhone(phone) {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 92 if present
  if (cleaned.startsWith('92')) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Format: +92 3XX XXXXXXX
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `+92 ${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }

  // Return original if doesn't match expected format
  return phone;
}

/**
 * Validate Pakistani phone number
 * Valid format: +92 3XX XXXXXXX (mobile numbers start with 3)
 */
export function validatePakistaniPhone(phone) {
  if (!phone) return false;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid Pakistani mobile number
  // Should be 12 digits total (92 + 10 digits starting with 3)
  // OR 10 digits starting with 3 (without country code)
  if (cleaned.length === 12 && cleaned.startsWith('923')) {
    return true;
  }
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return true;
  }
  if (cleaned.length === 11 && cleaned.startsWith('03')) {
    return true;
  }

  return false;
}

/**
 * Get FBR-compliant tax invoice requirements
 */
export function getFBRInvoiceRequirements() {
  return {
    requiredFields: [
      'invoiceNumber',
      'invoiceDate',
      'sellerNTN',
      'sellerSRN',
      'buyerNTN', // If registered
      'buyerName',
      'buyerAddress',
      'items',
      'salesTax',
      'totalAmount',
    ],
    optionalFields: [
      'buyerPhone',
      'buyerEmail',
      'paymentMethod',
      'deliveryAddress',
      'terms',
    ],
    taxFields: [
      'federalSalesTax',
      'provincialSalesTax',
      'withholdingTax',
      'totalTax',
    ],
  };
}

/**
 * Generate FBR-compliant invoice data with precise calculations
 * 
 * @param {Object} invoiceData - Original invoice data
 * @param {string} [province='punjab'] - Province code
 * @returns {Object} Compliant invoice data with totals
 */
export function generateFBRInvoice(invoiceData, province = 'punjab') {
  const requirements = getFBRInvoiceRequirements();

  // Calculate taxes for each item
  const itemsWithTax = invoiceData.items.map(item => {
    const taxCategory = item.taxCategory || getTaxCategoryForDomain(item.domain);
    const taxBreakdown = calculatePakistaniTax(item.amount, taxCategory, province);

    return {
      ...item,
      taxBreakdown,
      totalAmount: taxBreakdown.totalAmount,
    };
  });

  // Calculate totals with precision
  const subtotal = Math.round(itemsWithTax.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const totalFederalTax = Math.round(itemsWithTax.reduce((sum, item) => sum + item.taxBreakdown.federalSalesTax, 0) * 100) / 100;
  const totalProvincialTax = Math.round(itemsWithTax.reduce((sum, item) => sum + item.taxBreakdown.provincialSalesTax, 0) * 100) / 100;
  const totalWHT = Math.round(itemsWithTax.reduce((sum, item) => sum + item.taxBreakdown.withholdingTax, 0) * 100) / 100;
  const totalTax = Math.round((totalFederalTax + totalProvincialTax + totalWHT) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

  return {
    ...invoiceData,
    items: itemsWithTax,
    totals: {
      subtotal,
      federalSalesTax: totalFederalTax,
      provincialSalesTax: totalProvincialTax,
      withholdingTax: totalWHT,
      totalTax,
      grandTotal,
    },
    fbrCompliant: true,
    province,
    generatedAt: new Date().toISOString(),
  };
}



/**
 * Validation Helper Functions
 * Reusable validation utilities for forms and data
 */

/**
 * Validate email address
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (international format)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Check if it starts with + and has 10-15 digits
  return /^\+?[1-9]\d{9,14}$/.test(cleaned);
}

/**
 * Validate URL
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate HSN code (Indian GST)
 * 
 * @param {string} hsn - HSN code to validate
 * @returns {boolean} True if valid HSN
 */
export function isValidHSN(hsn) {
  if (!hsn) return false;
  // HSN codes are 4, 6, or 8 digits
  return /^\d{4,8}$/.test(hsn.replace(/\s/g, ''));
}

/**
 * Validate GSTIN (Indian GST number)
 * 
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} True if valid GSTIN
 */
export function isValidGSTIN(gstin) {
  if (!gstin) return false;
  // GSTIN is 15 characters: 2 state + 10 PAN + 3 check
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase());
}

/**
 * Validate NTN (Pakistani Tax Number)
 * 
 * @param {string} ntn - NTN to validate
 * @returns {boolean} True if valid NTN
 */
export function isValidNTN(ntn) {
  if (!ntn) return false;
  // NTN is typically 7 digits
  return /^\d{7}$/.test(ntn.replace(/\s/g, ''));
}

/**
 * Validate drug license (Indian format)
 * 
 * @param {string} license - License number to validate
 * @returns {boolean} True if valid license
 */
export function isValidDrugLicense(license) {
  if (!license) return false;
  // Basic format: DL-XX-YYYY or similar
  return /^[A-Z]{2}[-]?[0-9]{2}[-]?[0-9]{4,6}$/i.test(license);
}

/**
 * Validate FSSAI license (Indian food license)
 * 
 * @param {string} license - FSSAI license to validate
 * @returns {boolean} True if valid FSSAI license
 */
export function isValidFSSAI(license) {
  if (!license) return false;
  // FSSAI is 14 digits
  return /^\d{14}$/.test(license.replace(/\s/g, ''));
}

/**
 * Validate positive number
 * 
 * @param {number} value - Number to validate
 * @returns {boolean} True if positive number
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Validate percentage (0-100)
 * 
 * @param {number} value - Percentage to validate
 * @returns {boolean} True if valid percentage
 */
export function isValidPercentage(value) {
  return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value);
}

/**
 * Sanitize input string
 * 
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate date range
 * 
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} True if valid range (end >= start)
 */
export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Validate batch number format
 * 
 * @param {string} batchNumber - Batch number to validate
 * @returns {boolean} True if valid format
 */
export function isValidBatchNumber(batchNumber) {
  if (!batchNumber) return false;
  // Allow alphanumeric with dashes/underscores
  return /^[A-Z0-9_-]+$/i.test(batchNumber);
}

/**
 * Validate serial number format
 * 
 * @param {string} serialNumber - Serial number to validate
 * @returns {boolean} True if valid format
 */
export function isValidSerialNumber(serialNumber) {
  if (!serialNumber) return false;
  // Allow alphanumeric with dashes/underscores, typically longer
  return /^[A-Z0-9_-]{3,}$/i.test(serialNumber);
}

/**
 * Validate vehicle model format
 * 
 * @param {string} vehicle - Vehicle model to validate
 * @returns {boolean} True if valid format
 */
export function isValidVehicleModel(vehicle) {
  if (!vehicle) return false;
  // Allow alphanumeric with spaces, dashes, and common vehicle model patterns
  return /^[A-Z0-9\s\-]+$/i.test(vehicle) && vehicle.length >= 3;
}


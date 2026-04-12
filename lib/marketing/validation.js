/**
 * Form Validation Utilities for Marketing Forms
 * Provides validation functions for email, phone, and required fields
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate Pakistani phone number format
 * Accepts formats: +92XXXXXXXXXX, 92XXXXXXXXXX, 03XXXXXXXXX, 3XXXXXXXXX
 * @param {string} phone - Phone number to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Pakistani phone number patterns
  const patterns = [
    /^\+92[0-9]{10}$/,     // +92XXXXXXXXXX
    /^92[0-9]{10}$/,       // 92XXXXXXXXXX
    /^03[0-9]{9}$/,        // 03XXXXXXXXX
    /^3[0-9]{9}$/,         // 3XXXXXXXXX
  ];

  const isValid = patterns.some(pattern => pattern.test(cleanPhone));

  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Please enter a valid Pakistani phone number (e.g., +92 300 1234567)' 
    };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate required field
 * @param {string} value - Field value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateRequired(value, fieldName = 'This field') {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate minimum length
 * @param {string} value - Field value to validate
 * @param {number} minLength - Minimum required length
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateMinLength(value, minLength, fieldName = 'This field') {
  if (!value || value.trim().length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters` 
    };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate maximum length
 * @param {string} value - Field value to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateMaxLength(value, maxLength, fieldName = 'This field') {
  if (value && value.trim().length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }

  return { isValid: true, error: '' };
}

/**
 * Validate form data with multiple fields
 * @param {Object} formData - Object containing form field values
 * @param {Object} validationRules - Object containing validation rules for each field
 * @returns {Object} { isValid: boolean, errors: Object }
 * 
 * Example validationRules:
 * {
 *   email: [{ type: 'email' }],
 *   phone: [{ type: 'phone' }],
 *   name: [{ type: 'required', fieldName: 'Name' }, { type: 'minLength', value: 2, fieldName: 'Name' }]
 * }
 */
export function validateForm(formData, validationRules) {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName];
    const fieldValue = formData[fieldName];

    for (const rule of rules) {
      let result;

      switch (rule.type) {
        case 'email':
          result = validateEmail(fieldValue);
          break;
        case 'phone':
          result = validatePhone(fieldValue);
          break;
        case 'required':
          result = validateRequired(fieldValue, rule.fieldName || fieldName);
          break;
        case 'minLength':
          result = validateMinLength(fieldValue, rule.value, rule.fieldName || fieldName);
          break;
        case 'maxLength':
          result = validateMaxLength(fieldValue, rule.value, rule.fieldName || fieldName);
          break;
        default:
          result = { isValid: true, error: '' };
      }

      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return { isValid, errors };
}

/**
 * Format Pakistani phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Format as +92 XXX XXXXXXX
  if (cleanPhone.startsWith('+92')) {
    const number = cleanPhone.substring(3);
    return `+92 ${number.substring(0, 3)} ${number.substring(3)}`;
  }

  if (cleanPhone.startsWith('92')) {
    const number = cleanPhone.substring(2);
    return `+92 ${number.substring(0, 3)} ${number.substring(3)}`;
  }

  if (cleanPhone.startsWith('03')) {
    return `+92 ${cleanPhone.substring(1, 4)} ${cleanPhone.substring(4)}`;
  }

  if (cleanPhone.startsWith('3')) {
    return `+92 ${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3)}`;
  }

  return phone;
}

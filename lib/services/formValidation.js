/**
 * Centralized Form Validation Service
 * 
 * This service provides unified form validation across the application.
 * It validates required fields, numbers, dates, currency, SKU, batch numbers,
 * and serial numbers with consistent error messages.
 * 
 * Usage:
 *   import { FormValidationService } from '@/lib/services/formValidation';
 *   
 *   const result = FormValidationService.validateRequired(value, 'Product Name');
 *   if (!result.valid) {
 *     setError(result.error);
 *   }
 */

import { DataFetchingService } from './dataFetching';

/**
 * Validation result structure
 * @typedef {object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */

/**
 * Centralized form validation service
 */
export class FormValidationService {
  /**
   * Validate required field
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {ValidationResult} Validation result
   */
  static validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: `${fieldName} is required` };
    }
    
    // Check for whitespace-only strings
    if (typeof value === 'string' && value.trim() === '') {
      return { valid: false, error: `${fieldName} cannot be empty` };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate number with range
   * @param {any} value - Value to validate
   * @param {number} [min] - Minimum value (optional)
   * @param {number} [max] - Maximum value (optional)
   * @returns {ValidationResult} Validation result
   */
  static validateNumber(value, min, max) {
    const num = Number(value);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    
    if (!isFinite(num)) {
      return { valid: false, error: 'Must be a finite number' };
    }
    
    if (min !== undefined && num < min) {
      return { valid: false, error: `Must be at least ${min}` };
    }
    
    if (max !== undefined && num > max) {
      return { valid: false, error: `Must be at most ${max}` };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate date with range
   * @param {any} value - Date value to validate
   * @param {Date|string} [minDate] - Minimum date (optional)
   * @param {Date|string} [maxDate] - Maximum date (optional)
   * @returns {ValidationResult} Validation result
   */
  static validateDate(value, minDate, maxDate) {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Must be a valid date' };
    }
    
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) {
        return { 
          valid: false, 
          error: `Must be after ${min.toLocaleDateString()}` 
        };
      }
    }
    
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) {
        return { 
          valid: false, 
          error: `Must be before ${max.toLocaleDateString()}` 
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Validate currency value
   * @param {any} value - Currency value to validate
   * @param {string} currency - Currency code (PKR, USD, EUR)
   * @returns {ValidationResult} Validation result
   */
  static validateCurrency(value, currency = 'PKR') {
    // First validate as number >= 0
    const numberResult = this.validateNumber(value, 0);
    if (!numberResult.valid) {
      return numberResult;
    }
    
    const num = Number(value);
    
    // Check decimal places based on currency
    const decimals = currency === 'PKR' ? 2 : 2; // Most currencies use 2 decimals
    const parts = String(value).split('.');
    
    if (parts[1] && parts[1].length > decimals) {
      return { 
        valid: false, 
        error: `Maximum ${decimals} decimal places allowed` 
      };
    }
    
    // Check for negative values
    if (num < 0) {
      return { valid: false, error: 'Amount cannot be negative' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate SKU uniqueness
   * @param {string} value - SKU value
   * @param {string} businessId - Business ID
   * @param {string} [excludeProductId] - Product ID to exclude (for updates)
   * @returns {Promise<ValidationResult>} Validation result
   */
  static async validateSKU(value, businessId, excludeProductId = null) {
    // First check format
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'SKU is required' };
    }
    
    if (value.trim() === '') {
      return { valid: false, error: 'SKU cannot be empty' };
    }
    
    // Check length (reasonable limits)
    if (value.length < 2) {
      return { valid: false, error: 'SKU must be at least 2 characters' };
    }
    
    if (value.length > 50) {
      return { valid: false, error: 'SKU must be at most 50 characters' };
    }
    
    try {
      // Check uniqueness via API
      const params = new URLSearchParams({
        sku: value,
        business_id: businessId
      });
      
      if (excludeProductId) {
        params.append('exclude_id', excludeProductId);
      }
      
      const response = await DataFetchingService.fetchWithAuth(
        `/api/products/check-sku?${params.toString()}`
      );
      
      const data = await response.json();
      
      if (data.exists) {
        return { valid: false, error: 'SKU already exists' };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('SKU validation error:', error);
      // On error, allow the SKU (fail open for better UX)
      return { valid: true };
    }
  }
  
  /**
   * Validate batch number format
   * @param {string} value - Batch number
   * @returns {ValidationResult} Validation result
   */
  static validateBatchNumber(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Batch number is required' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed === '') {
      return { valid: false, error: 'Batch number cannot be empty' };
    }
    
    // Batch number pattern: 3-20 alphanumeric characters
    const batchPattern = /^[A-Z0-9]{3,20}$/;
    
    if (!batchPattern.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Batch number must be 3-20 uppercase alphanumeric characters' 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate serial number uniqueness
   * @param {string} value - Serial number
   * @param {string} businessId - Business ID
   * @param {string} [excludeSerialId] - Serial ID to exclude (for updates)
   * @returns {Promise<ValidationResult>} Validation result
   */
  static async validateSerialNumber(value, businessId, excludeSerialId = null) {
    // First check format
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Serial number is required' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed === '') {
      return { valid: false, error: 'Serial number cannot be empty' };
    }
    
    // Check length
    if (trimmed.length < 3) {
      return { valid: false, error: 'Serial number must be at least 3 characters' };
    }
    
    if (trimmed.length > 100) {
      return { valid: false, error: 'Serial number must be at most 100 characters' };
    }
    
    try {
      // Check uniqueness via API
      const params = new URLSearchParams({
        serial: trimmed,
        business_id: businessId
      });
      
      if (excludeSerialId) {
        params.append('exclude_id', excludeSerialId);
      }
      
      const response = await DataFetchingService.fetchWithAuth(
        `/api/inventory/check-serial?${params.toString()}`
      );
      
      const data = await response.json();
      
      if (data.exists) {
        return { valid: false, error: 'Serial number already exists' };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Serial number validation error:', error);
      // On error, allow the serial (fail open for better UX)
      return { valid: true };
    }
  }
  
  /**
   * Validate email format
   * @param {string} value - Email address
   * @returns {ValidationResult} Validation result
   */
  static validateEmail(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Email is required' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed === '') {
      return { valid: false, error: 'Email cannot be empty' };
    }
    
    // Basic email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailPattern.test(trimmed)) {
      return { valid: false, error: 'Must be a valid email address' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate phone number format
   * @param {string} value - Phone number
   * @param {string} [countryCode] - Country code (PK, US, etc.)
   * @returns {ValidationResult} Validation result
   */
  static validatePhone(value, countryCode = 'PK') {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'Phone number is required' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed === '') {
      return { valid: false, error: 'Phone number cannot be empty' };
    }
    
    // Remove all non-digit characters for validation
    const digits = trimmed.replace(/\D/g, '');
    
    // Pakistan phone validation
    if (countryCode === 'PK') {
      // Should be 10-11 digits (with or without country code)
      if (digits.length < 10 || digits.length > 12) {
        return { 
          valid: false, 
          error: 'Phone number must be 10-11 digits' 
        };
      }
    } else {
      // Generic validation: at least 10 digits
      if (digits.length < 10) {
        return { 
          valid: false, 
          error: 'Phone number must be at least 10 digits' 
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Validate URL format
   * @param {string} value - URL
   * @returns {ValidationResult} Validation result
   */
  static validateURL(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'URL is required' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed === '') {
      return { valid: false, error: 'URL cannot be empty' };
    }
    
    try {
      new URL(trimmed);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Must be a valid URL' };
    }
  }
  
  /**
   * Validate multiple fields at once
   * @param {object} fields - Object with field names as keys and validation configs as values
   * @returns {Promise<object>} Object with field names as keys and validation results as values
   */
  static async validateFields(fields) {
    const results = {};
    
    for (const [fieldName, config] of Object.entries(fields)) {
      const { value, type, ...options } = config;
      
      let result;
      
      switch (type) {
        case 'required':
          result = this.validateRequired(value, fieldName);
          break;
        case 'number':
          result = this.validateNumber(value, options.min, options.max);
          break;
        case 'date':
          result = this.validateDate(value, options.minDate, options.maxDate);
          break;
        case 'currency':
          result = this.validateCurrency(value, options.currency);
          break;
        case 'sku':
          result = await this.validateSKU(value, options.businessId, options.excludeProductId);
          break;
        case 'batch':
          result = this.validateBatchNumber(value);
          break;
        case 'serial':
          result = await this.validateSerialNumber(value, options.businessId, options.excludeSerialId);
          break;
        case 'email':
          result = this.validateEmail(value);
          break;
        case 'phone':
          result = this.validatePhone(value, options.countryCode);
          break;
        case 'url':
          result = this.validateURL(value);
          break;
        default:
          result = { valid: true };
      }
      
      results[fieldName] = result;
    }
    
    return results;
  }
  
  /**
   * Check if all validation results are valid
   * @param {object} results - Validation results object
   * @returns {boolean} True if all valid
   */
  static allValid(results) {
    return Object.values(results).every(result => result.valid);
  }
  
  /**
   * Get first error message from validation results
   * @param {object} results - Validation results object
   * @returns {string|null} First error message or null
   */
  static getFirstError(results) {
    for (const result of Object.values(results)) {
      if (!result.valid && result.error) {
        return result.error;
      }
    }
    return null;
  }
  
  /**
   * Get all error messages from validation results
   * @param {object} results - Validation results object
   * @returns {string[]} Array of error messages
   */
  static getAllErrors(results) {
    return Object.values(results)
      .filter(result => !result.valid && result.error)
      .map(result => result.error);
  }
}

/**
 * React hook for form validation
 * @param {object} initialValues - Initial form values
 * @param {object} validationRules - Validation rules for each field
 * @returns {object} Form state and validation functions
 */
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  
  const validateField = React.useCallback(async (fieldName) => {
    const rule = validationRules[fieldName];
    if (!rule) return { valid: true };
    
    const result = await FormValidationService.validateFields({
      [fieldName]: { value: values[fieldName], ...rule }
    });
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: result[fieldName]
    }));
    
    return result[fieldName];
  }, [values, validationRules]);
  
  const validateAll = React.useCallback(async () => {
    const fieldsToValidate = {};
    
    for (const [fieldName, rule] of Object.entries(validationRules)) {
      fieldsToValidate[fieldName] = {
        value: values[fieldName],
        ...rule
      };
    }
    
    const results = await FormValidationService.validateFields(fieldsToValidate);
    setErrors(results);
    
    return FormValidationService.allValid(results);
  }, [values, validationRules]);
  
  const handleChange = React.useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: { valid: true } }));
    }
  }, [errors]);
  
  const handleBlur = React.useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  }, [validateField]);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    isValid: FormValidationService.allValid(errors)
  };
}

/**
 * Centralized Currency Utilities
 * 
 * This module provides a unified interface for currency formatting across the application.
 * It re-exports functions from the main currency module to ensure consistency.
 * 
 * Usage:
 *   import { formatCurrency } from '@/lib/utils/currency';
 *   formatCurrency(1000, 'PKR'); // Returns '₨1,000.00'
 */

import { 
  formatCurrency as baseCurrencyFormatter,
  formatAmount,
  parseCurrency,
  getCurrencySymbol,
  getCurrencyName,
  isValidCurrency,
  formatCurrencyForDisplay,
  formatCurrencyAbbr
} from '@/lib/currency';

/**
 * Format currency value with locale-aware formatting
 * @param {number} value - Numeric value to format
 * @param {string} currency - Currency code (PKR, USD, EUR)
 * @param {object} options - Formatting options
 * @param {boolean} options.compact - Use compact notation (1K, 1M, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'PKR', options = {}) {
  const { locale, decimals, showSymbol = true, compact = false, ...restOptions } = options;
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    value = 0;
  }
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  // Handle compact notation
  if (compact) {
    const absValue = Math.abs(numericValue);
    const sign = numericValue < 0 ? '-' : '';
    const symbol = getCurrencySymbol(currency);
    
    if (absValue >= 1000000) {
      return `${sign}${symbol}${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${sign}${symbol}${(absValue / 1000).toFixed(1)}K`;
    }
  }
  
  // Use base formatter with options
  return baseCurrencyFormatter(numericValue, currency, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...restOptions
  });
}

// Re-export other currency utilities
export {
  formatAmount,
  parseCurrency,
  getCurrencySymbol,
  getCurrencyName,
  isValidCurrency,
  formatCurrencyForDisplay,
  formatCurrencyAbbr
};

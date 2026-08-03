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

const ISO_CURRENCY = new Set([
  'PKR', 'INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'CNY',
]);

/**
 * Format currency value with locale-aware formatting.
 * Supports legacy two-arg calls: `formatCurrency(1234, { compact: true })` (options-only second argument).
 *
 * @param {number|string|null|undefined} value - Numeric value to format
 * @param {string|object} [currencyOrOptions='PKR'] - ISO currency code or options object
 * @param {object} [maybeOptions] - Formatting options when currency is a string
 * @param {boolean} [maybeOptions.compact] - Use compact notation (1K, 1M, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currencyOrOptions = 'PKR', maybeOptions = {}) {
  let currency = 'PKR';
  let options = {};

  if (
    currencyOrOptions !== null &&
    typeof currencyOrOptions === 'object' &&
    !Array.isArray(currencyOrOptions)
  ) {
    options = currencyOrOptions;
    const c = options.currency;
    if (typeof c === 'string' && ISO_CURRENCY.has(String(c).toUpperCase())) {
      currency = String(c).toUpperCase();
    }
  } else if (typeof currencyOrOptions === 'string') {
    const code = currencyOrOptions.toUpperCase();
    currency = ISO_CURRENCY.has(code) ? code : 'PKR';
    options = maybeOptions && typeof maybeOptions === 'object' && !Array.isArray(maybeOptions) ? maybeOptions : {};
  }

  const { locale: _locale, decimals, showSymbol: _showSymbol = true, compact = false, currency: _omitCur, ...restOptions } = options;

  // Handle null/undefined
  if (value === null || value === undefined) {
    value = 0;
  }

  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  // Handle compact notation (no Intl — avoids bad fraction-digit merges)
  if (compact) {
    const absValue = Math.abs(numericValue);
    const sign = numericValue < 0 ? '-' : '';
    const symbol = getCurrencySymbol(currency);

    if (absValue >= 1000000) {
      return `${sign}${symbol}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${symbol}${(absValue / 1000).toFixed(1)}K`;
    }
    return baseCurrencyFormatter(numericValue, currency, restOptions);
  }

  const extra = { ...restOptions };
  if (decimals !== undefined && decimals !== null && !Number.isNaN(Number(decimals))) {
    const d = Math.max(0, Math.min(20, Math.floor(Number(decimals))));
    extra.minimumFractionDigits = d;
    extra.maximumFractionDigits = d;
  }

  return baseCurrencyFormatter(numericValue, currency, extra);
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

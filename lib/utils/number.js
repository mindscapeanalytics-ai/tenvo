/**
 * Centralized Number Utilities
 * 
 * This module provides unified number formatting across the application.
 * Supports locale-aware formatting and percentage calculations.
 * 
 * Usage:
 *   import { formatNumber, formatPercentage } from '@/lib/utils/number';
 *   formatNumber(1000); // Returns '1,000'
 *   formatPercentage(15.5); // Returns '15.5%'
 */

/**
 * Format number with locale-aware formatting
 * @param {number|string} value - Value to format
 * @param {string} locale - Locale code (default: 'en-PK')
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, locale = 'en-PK', decimals = 0) {
  if (value === null || value === undefined) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Format percentage with configurable decimal places
 * @param {number|string} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format number with abbreviations (K, M, B)
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Abbreviated number string
 */
export function formatNumberAbbr(value, decimals = 1) {
  if (value === null || value === undefined) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }
  
  return formatNumber(num, 'en-PK', decimals);
}

/**
 * Parse number from string (removes formatting)
 * @param {string} value - Formatted number string
 * @returns {number} Parsed number
 */
export function parseNumber(value) {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate percentage of a value
 * @param {number} value - Value to calculate percentage of
 * @param {number} percentage - Percentage (e.g., 15 for 15%)
 * @returns {number} Calculated value
 */
export function calculatePercentage(value, percentage) {
  if (value === null || value === undefined || percentage === null || percentage === undefined) {
    return 0;
  }
  
  return (value * percentage) / 100;
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @returns {number} Percentage change
 */
export function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Round number to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded value
 */
export function roundNumber(value, decimals = 2) {
  if (value === null || value === undefined) return 0;
  
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid number
 */
export function isValidNumber(value) {
  if (value === null || value === undefined) return false;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return typeof num === 'number' && !isNaN(num) && isFinite(num);
}

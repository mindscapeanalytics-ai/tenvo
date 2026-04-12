/**
 * Centralized DateTime Utilities
 * 
 * This module provides unified date/time formatting across the application.
 * Supports multiple formats and locales.
 * 
 * Usage:
 *   import { formatDateTime } from '@/lib/utils/datetime';
 *   formatDateTime(new Date(), 'short'); // Returns 'Jan 15, 2024'
 */

/**
 * Format date/time with locale-aware formatting
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (short, long, time, datetime)
 * @param {string} locale - Locale code (default: 'en-PK')
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, format = 'short', locale = 'en-PK') {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const formatOptions = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    date: { year: 'numeric', month: 'short', day: 'numeric' }
  };
  
  const options = formatOptions[format] || formatOptions.short;
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format date to short format (e.g., "Jan 15")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code
 * @returns {string} Formatted date string
 */
export function formatDateShort(date, locale = 'en-PK') {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Format date to long format (e.g., "January 15, 2024")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code
 * @returns {string} Formatted date string
 */
export function formatDateLong(date, locale = 'en-PK') {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString(locale, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format time only (e.g., "10:30 AM")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code
 * @returns {string} Formatted time string
 */
export function formatTime(date, locale = 'en-PK') {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }
  
  return dateObj.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffMs = dateObj - now;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (Math.abs(diffDays) > 7) {
    return formatDateTime(dateObj, 'short');
  }
  
  if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffHours < 0) return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  if (diffMins < 0) return `${Math.abs(diffMins)} minute${Math.abs(diffMins) > 1 ? 's' : ''} ago`;
  
  return 'just now';
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date is valid
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if valid date
 */
export function isValidDate(date) {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
}

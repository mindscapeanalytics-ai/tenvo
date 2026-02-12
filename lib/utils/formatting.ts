/**
 * Formatting Utility Functions
 * Centralized helpers for currency, dates, numbers, and text formatting
 */

import { formatCurrency as baseCurrencyFormatter, type CurrencyCode } from '@/lib/currency';

/**
 * Format currency with proper symbol and locale
 * Re-exports the base currency formatter for consistency
 */
export function formatCurrency(amount: number | string | null | undefined, currency: CurrencyCode = 'PKR'): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount ?? 0);
    return baseCurrencyFormatter(numericAmount, currency);
}

/**
 * Format date to localized string
 */
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };

    return dateObj.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Format date to short format (e.g., "Jan 15")
 */
export function formatDateShort(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 0): string {
    if (value === null || value === undefined) return '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '0';

    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format percentage
 */
export function formatPercent(value: number | string | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined) return '0%';

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '0%';

    return `${num.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';

    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength) + '...';
}

/**
 * Format phone number (Pakistan format)
 */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return 'N/A';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as: +92 XXX XXXXXXX or 0XXX XXXXXXX
    if (cleaned.startsWith('92')) {
        return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
    } else if (cleaned.startsWith('0')) {
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
    }

    return phone;
}

/**
 * Format NTN (National Tax Number)
 */
export function formatNTN(ntn: string | null | undefined): string {
    if (!ntn) return 'N/A';

    // Remove all non-digit characters
    const cleaned = ntn.replace(/\D/g, '');

    // Format as: XXXXXXX-X
    if (cleaned.length === 8) {
        return `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`;
    }

    return ntn;
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string | null | undefined): string {
    if (!text) return '';

    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format file size (bytes to human-readable)
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

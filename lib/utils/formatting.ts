/**
 * Formatting Utility Functions
 * Centralized helpers for currency, dates, numbers, and text formatting
 */

import { formatCurrency as baseCurrencyFormatter, type CurrencyCode } from '@/lib/currency';
import { RegionalStandards } from './regionalHelpers';

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
 * Format phone number based on regional standards
 */
export function formatPhone(phone: string | null | undefined, standards?: RegionalStandards): string {
    if (!phone) return 'N/A';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Pakistan Standards
    if (!standards || standards.countryCode === 'PK') {
        if (cleaned.startsWith('92')) {
            return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
        } else if (cleaned.startsWith('0')) {
            return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
        }
    }

    // UAE Standards
    if (standards?.countryCode === 'AE') {
        if (cleaned.startsWith('971')) {
            return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 4)} ${cleaned.substring(4)}`;
        }
    }

    // Generic fallback: Add plus if it looks like international code
    if (cleaned.length > 10) return `+${cleaned}`;

    return phone;
}

/**
 * Format Tax Identifier (NTN for PK, TRN for UAE)
 */
export function formatTaxId(taxId: string | null | undefined, standards?: RegionalStandards): string {
    if (!taxId) return 'N/A';

    // Remove all non-digit characters
    const cleaned = taxId.replace(/\D/g, '');

    // Pakistan (NTN: XXXXXXX-X)
    if (!standards || standards.countryCode === 'PK') {
        if (cleaned.length === 8) {
            return `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`;
        }
    }

    // UAE (TRN: 15 digits)
    if (standards?.countryCode === 'AE' || standards?.countryCode === 'SA') {
        if (cleaned.length === 15) {
            return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 11)}-${cleaned.substring(11)}`;
        }
    }

    return taxId;
}

/**
 * @deprecated Use formatTaxId instead
 */
export const formatNTN = formatTaxId;

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

/**
 * Regional Helpers
 * Centralized registry for country-specific standards, taxes, and formatting.
 * Adapts the application behavior based on the business region.
 */

import { CurrencyCode } from '../currency';

export interface RegionalStandards {
    countryCode: string;
    countryName: string;
    currency: CurrencyCode;
    currencySymbol: string;
    taxLabel: string; // VAT, GST, PST
    taxStrategy: 'GST_PST' | 'VAT';
    taxIdLabel: string; // NTN, TRN, EIN
    phoneCode: string;
    timeZone: string;
    defaultTaxRate: number;
}

const REGIONAL_REGISTRY: Record<string, RegionalStandards> = {
    'PK': {
        countryCode: 'PK',
        countryName: 'Pakistan',
        currency: 'PKR',
        currencySymbol: '₨',
        taxLabel: 'GST/PST',
        taxStrategy: 'GST_PST',
        taxIdLabel: 'NTN',
        phoneCode: '+92',
        timeZone: 'Asia/Karachi',
        defaultTaxRate: 18
    },
    'AE': {
        countryCode: 'AE',
        countryName: 'United Arab Emirates',
        currency: 'AED',
        currencySymbol: 'د.إ',
        taxLabel: 'VAT',
        taxStrategy: 'VAT',
        taxIdLabel: 'TRN',
        phoneCode: '+971',
        timeZone: 'Asia/Dubai',
        defaultTaxRate: 5
    },
    'SA': {
        countryCode: 'SA',
        countryName: 'Saudi Arabia',
        currency: 'SAR',
        currencySymbol: '﷼',
        taxLabel: 'VAT',
        taxStrategy: 'VAT',
        taxIdLabel: 'TRN',
        phoneCode: '+966',
        timeZone: 'Asia/Riyadh',
        defaultTaxRate: 15
    },
    'US': {
        countryCode: 'US',
        countryName: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        taxLabel: 'Sales Tax',
        taxStrategy: 'VAT', // Simple percentage strategy
        taxIdLabel: 'EIN',
        phoneCode: '+1',
        timeZone: 'America/New_York',
        defaultTaxRate: 0
    }
};

/**
 * Resolve regional standards based on business metadata
 */
export function getRegionalStandards(cityOrCountry: string = 'Pakistan'): RegionalStandards {
    const input = cityOrCountry.toUpperCase();

    // Direct country code match
    if (REGIONAL_REGISTRY[input]) return REGIONAL_REGISTRY[input];

    // City/Name to Country mapping (AI-Enhanced heuristics)
    const nameMap: Record<string, string> = {
        'PAKISTAN': 'PK', 'KARACHI': 'PK', 'LAHORE': 'PK', 'ISLAMABAD': 'PK',
        'UAE': 'AE', 'UNITED ARAB EMIRATES': 'AE', 'DUBAI': 'AE',
        'SAUDI ARABIA': 'SA', 'SAUDI': 'SA', 'RIYADH': 'SA',
        'USA': 'US', 'UNITED STATES': 'US', 'NEW YORK': 'US'
    };

    const countryCode = nameMap[input] || 'PK'; // Default to PK for heritage compatibility
    return (REGIONAL_REGISTRY[countryCode] || REGIONAL_REGISTRY['PK']) as RegionalStandards;
}

/**
 * Get display label for tax based on region
 */
export function getTaxLabel(standards: RegionalStandards): string {
    return standards.taxLabel;
}

/**
 * Get tax ID label (NTN/TRN)
 */
export function getTaxIdLabel(standards: RegionalStandards): string {
    return standards.taxIdLabel;
}

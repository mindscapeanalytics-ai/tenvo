'use client';

/**
 * Safe Smart Defaults Hook with Error Handling
 * Production-ready wrapper with fallbacks and logging
 */

import { useState, useEffect, useMemo } from 'react';

// Feature flags
const FEATURES = {
    SMART_DEFAULTS: process.env.NEXT_PUBLIC_ENABLE_SMART_DEFAULTS !== 'false',
    LOGGING: process.env.NODE_ENV === 'development'
};

/**
 * Safe wrapper for useSmartDefaults with error handling
 */
export function useSafeSmartDefaults(formType, context = {}) {
    const [defaults, setDefaults] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Feature flag check
        if (!FEATURES.SMART_DEFAULTS) {
            setDefaults(getMinimalDefaults(context));
            setIsLoading(false);
            return;
        }

        try {
            const smartDefaults = getSmartDefaults(formType, context);
            setDefaults(smartDefaults);

            if (FEATURES.LOGGING) {
                console.log('[SmartDefaults] Applied for', formType, smartDefaults);
            }
        } catch (err) {
            console.error('[SmartDefaults] Error:', err);
            setError(err);

            // Fallback to minimal defaults
            setDefaults(getMinimalDefaults(context));
        } finally {
            setIsLoading(false);
        }
    }, [formType, context.businessId, context.category]);

    return { defaults, error, isLoading };
}

/**
 * Minimal fallback defaults (always safe)
 */
function getMinimalDefaults(context) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
        business_id: context.businessId,
        created_at: now,
        created_date: today,
        is_active: true
    };
}

/**
 * Get smart defaults based on form type
 * (Extracted from useSmartDefaults for better error handling)
 */
function getSmartDefaults(formType, context) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const { businessId, category, warehouses, customers, vendors, user } = context;

    // Common defaults
    const commonDefaults = {
        business_id: businessId,
        created_by: user?.id,
        created_at: now,
        created_date: today
    };

    switch (formType) {
        case 'product':
            return {
                ...commonDefaults,
                // Pricing
                price: 0,
                cost_price: 0,
                mrp: 0,
                tax_percent: 17, // Pakistan GST

                // Stock
                stock: 0,
                min_stock: 10,
                max_stock: 1000,
                reorder_point: 20,
                reorder_quantity: 100,

                // Unit
                unit: 'pcs',

                // Status
                is_active: true,

                // Warehouse (use first available)
                warehouse_id: warehouses?.[0]?.id || null
            };

        case 'invoice':
        case 'quotation':
        case 'sales_order':
            return {
                ...commonDefaults,
                date: today,
                time: currentTime,
                due_date: getDueDateDefault(today, 30),
                status: formType === 'quotation' ? 'draft' : 'pending',
                payment_status: 'unpaid',
                payment_method: 'cash',
                subtotal: 0,
                total_tax: 0,
                grand_total: 0,
                items: []
            };

        case 'payment':
            return {
                ...commonDefaults,
                payment_date: today,
                time: currentTime,
                amount: 0,
                payment_type: 'received',
                payment_mode: 'cash'
            };

        case 'customer':
        case 'vendor':
            return {
                ...commonDefaults,
                country: 'Pakistan',
                filer_status: 'filer',
                credit_limit: formType === 'customer' ? 100000 : 0,
                outstanding_balance: 0
            };

        default:
            return commonDefaults;
    }
}

/**
 * Calculate due date (X days from start)
 */
function getDueDateDefault(startDate, daysToAdd) {
    try {
        const date = new Date(startDate);
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('[SmartDefaults] Due date calculation error:', error);
        return startDate;
    }
}

/**
 * Merge defaults with existing data
 * Priority: existingData > domainDefaults > smartDefaults
 */
export function mergeFormDefaults(smartDefaults, domainDefaults, existingData) {
    return {
        ...smartDefaults,      // Lowest priority
        ...domainDefaults,     // Medium priority
        ...existingData        // Highest priority (user data always wins)
    };
}

/**
 * Format date for input fields (handles various formats)
 */
export function formatDateForInput(date) {
    if (!date) return '';

    try {
        if (typeof date === 'string') {
            // Already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
            }
            // ISO format with time
            if (date.includes('T')) {
                return date.split('T')[0];
            }
        }

        // Convert to Date and format
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    } catch (error) {
        console.error('[SmartDefaults] Date formatting error:', error);
        return '';
    }
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime() {
    return new Date().toTimeString().slice(0, 5);
}

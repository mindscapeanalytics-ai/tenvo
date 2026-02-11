'use client';

import { useState, useEffect } from 'react';
import { checkStockAvailabilityAction } from '@/lib/actions/validation';

/**
 * Stock Availability Hook
 * Checks if sufficient stock is available before adding items to invoice
 */
export function useStockAvailability(businessId) {
    const [stockCache, setStockCache] = useState({});
    const [isChecking, setIsChecking] = useState(false);

    const checkAvailability = async (productId, quantity, warehouseId = null) => {
        setIsChecking(true);
        try {
            const result = await checkStockAvailabilityAction(productId, quantity, warehouseId);

            // Cache the result
            const cacheKey = `${productId}-${warehouseId || 'all'}`;
            setStockCache(prev => ({
                ...prev,
                [cacheKey]: result
            }));

            return result;
        } catch (error) {
            console.error('Stock availability check failed:', error);
            return { success: false, error: error.message };
        } finally {
            setIsChecking(false);
        }
    };

    const getStockStatus = (productId, quantity, warehouseId = null) => {
        const cacheKey = `${productId}-${warehouseId || 'all'}`;
        const cached = stockCache[cacheKey];

        if (!cached) return null;

        return {
            available: cached.available,
            availableQuantity: cached.availableQuantity,
            reservedQuantity: cached.reservedQuantity,
            requested: quantity,
            shortfall: Math.max(0, quantity - (cached.availableQuantity || 0))
        };
    };

    const clearCache = () => {
        setStockCache({});
    };

    return {
        checkAvailability,
        getStockStatus,
        clearCache,
        isChecking,
        stockCache
    };
}

/**
 * Credit Limit Hook
 * Checks customer credit limit before finalizing invoice
 */
export function useCreditLimitCheck(customer, invoiceTotal) {
    const [warning, setWarning] = useState(null);

    useEffect(() => {
        if (!customer || !customer.credit_limit) {
            setWarning(null);
            return;
        }

        const creditLimit = parseFloat(customer.credit_limit) || 0;
        const outstandingBalance = parseFloat(customer.outstanding_balance) || 0;
        const newTotal = parseFloat(invoiceTotal) || 0;
        const totalExposure = outstandingBalance + newTotal;

        if (totalExposure > creditLimit) {
            const excess = totalExposure - creditLimit;
            setWarning({
                type: 'error',
                message: `Credit limit exceeded by ${excess.toFixed(2)}`,
                creditLimit,
                outstandingBalance,
                newTotal,
                totalExposure,
                excess
            });
        } else if (totalExposure > creditLimit * 0.8) {
            // Warning at 80% utilization
            const remaining = creditLimit - totalExposure;
            setWarning({
                type: 'warning',
                message: `Credit limit 80% utilized. Remaining: ${remaining.toFixed(2)}`,
                creditLimit,
                outstandingBalance,
                newTotal,
                totalExposure,
                remaining
            });
        } else {
            setWarning(null);
        }
    }, [customer, invoiceTotal]);

    return warning;
}

/**
 * Auto-Save Hook
 * Automatically saves form data to localStorage
 */
export function useAutoSave(formType, businessId, data, interval = 30000) {
    useEffect(() => {
        const key = `autosave_${formType}_${businessId}`;

        const saveTimer = setInterval(() => {
            if (data && Object.keys(data).length > 0) {
                localStorage.setItem(key, JSON.stringify({
                    data,
                    timestamp: new Date().toISOString()
                }));
            }
        }, interval);

        return () => clearInterval(saveTimer);
    }, [formType, businessId, data, interval]);

    const loadAutoSave = () => {
        const key = `autosave_${formType}_${businessId}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const savedTime = new Date(parsed.timestamp);
                const now = new Date();
                const hoursSince = (now - savedTime) / (1000 * 60 * 60);

                // Only restore if less than 24 hours old
                if (hoursSince < 24) {
                    return parsed.data;
                }
            } catch (e) {
                console.error('Failed to parse autosave data:', e);
            }
        }

        return null;
    };

    const clearAutoSave = () => {
        const key = `autosave_${formType}_${businessId}`;
        localStorage.removeItem(key);
    };

    return { loadAutoSave, clearAutoSave };
}

/**
 * Due Date Calculator Hook
 * Calculates due date based on invoice date and payment terms
 */
export function useDueDateCalculator(invoiceDate, paymentTermsDays = 30) {
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (!invoiceDate) {
            setDueDate('');
            return;
        }

        const date = new Date(invoiceDate);
        date.setDate(date.getDate() + paymentTermsDays);
        setDueDate(date.toISOString().split('T')[0]);
    }, [invoiceDate, paymentTermsDays]);

    return dueDate;
}

/**
 * Invoice Number Generator Hook
 * Generates sequential invoice numbers
 */
export function useInvoiceNumberGenerator(businessId, prefix = 'INV') {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateNumber = async () => {
        setIsGenerating(true);
        try {
            // In production, this would call an API to get the next number
            // For now, generate based on timestamp
            const year = new Date().getFullYear();
            const timestamp = Date.now().toString().slice(-6);
            const number = `${prefix}-${year}-${timestamp}`;
            setInvoiceNumber(number);
            return number;
        } catch (error) {
            console.error('Failed to generate invoice number:', error);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (!invoiceNumber) {
            generateNumber();
        }
    }, []);

    return { invoiceNumber, generateNumber, isGenerating };
}

/**
 * Price Calculator Hook
 * Calculates pricing with margins and taxes
 */
export function usePriceCalculator() {
    const calculateSellingPrice = (costPrice, marginPercent) => {
        return costPrice * (1 + marginPercent / 100);
    };

    const calculateMRP = (sellingPrice, taxPercent) => {
        return sellingPrice * (1 + taxPercent / 100);
    };

    const calculateFromMRP = (mrp, taxPercent, marginPercent) => {
        const sellingPrice = mrp / (1 + taxPercent / 100);
        const costPrice = sellingPrice / (1 + marginPercent / 100);
        return { sellingPrice, costPrice };
    };

    const calculateMargin = (costPrice, sellingPrice) => {
        if (costPrice === 0) return 0;
        return ((sellingPrice - costPrice) / costPrice) * 100;
    };

    return {
        calculateSellingPrice,
        calculateMRP,
        calculateFromMRP,
        calculateMargin
    };
}

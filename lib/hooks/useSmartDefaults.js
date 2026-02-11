'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * Smart Defaults Hook
 * Provides intelligent default values for forms across the system
 * Reduces user effort by pre-filling common fields
 */
export function useSmartDefaults(formType, context = {}) {
    const [defaults, setDefaults] = useState({});

    // Get current date/time
    const now = useMemo(() => new Date(), []);
    const today = useMemo(() => now.toISOString().split('T')[0], [now]);
    const currentTime = useMemo(() => now.toTimeString().slice(0, 5), [now]);

    useEffect(() => {
        const smartDefaults = getSmartDefaults(formType, context, today, currentTime, now);
        setDefaults(smartDefaults);
    }, [formType, context, today, currentTime, now]);

    return defaults;
}

/**
 * Get smart defaults based on form type and context
 */
function getSmartDefaults(formType, context, today, currentTime, now) {
    const { businessId, warehouses, customers, products, lastEntry, user } = context;

    // Common defaults for all forms
    const commonDefaults = {
        business_id: businessId,
        created_by: user?.id,
        created_at: now,
    };

    switch (formType) {
        case 'product':
            return {
                ...commonDefaults,
                // Dates
                created_date: today,

                // Pricing defaults
                price: 0,
                cost_price: 0,
                mrp: 0,
                tax_percent: 17, // Pakistan standard GST

                // Stock defaults
                stock: 0,
                min_stock: 10,
                max_stock: 1000,
                reorder_point: 20,
                reorder_quantity: 100,

                // Unit defaults
                unit: 'pcs',

                // Status
                is_active: true,

                // Warehouse (use first available or last used)
                warehouse_id: context.lastWarehouseId || warehouses?.[0]?.id,

                // Domain data
                domain_data: {},
            };

        case 'invoice':
        case 'quotation':
        case 'sales_order':
            return {
                ...commonDefaults,
                // Dates - current date as default
                date: today,
                time: currentTime,
                due_date: getDueDateDefault(today, 30), // 30 days from now

                // Document number - will be auto-generated
                invoice_number: '', // Backend will generate

                // Status
                status: formType === 'quotation' ? 'draft' : 'pending',
                payment_status: 'unpaid',

                // Customer (use last customer if available)
                customer_id: context.lastCustomerId || null,

                // Amounts
                subtotal: 0,
                total_tax: 0,
                discount_total: 0,
                grand_total: 0,

                // Items
                items: [],

                // Payment
                payment_method: 'cash',

                // Tax defaults
                tax_details: {
                    gst_percent: 17,
                    filer_status: 'filer',
                },

                // Notes
                notes: '',
                terms: getDefaultTerms(formType),
            };

        case 'purchase_order':
        case 'purchase':
            return {
                ...commonDefaults,
                // Dates
                date: today,
                time: currentTime,
                expected_delivery_date: getDueDateDefault(today, 7), // 7 days from now

                // Vendor (use last vendor if available)
                vendor_id: context.lastVendorId || null,

                // Warehouse (use default warehouse)
                warehouse_id: context.defaultWarehouseId || warehouses?.[0]?.id,

                // Status
                status: 'draft',

                // Amounts
                subtotal: 0,
                total_tax: 0,
                grand_total: 0,

                // Items
                items: [],
            };

        case 'payment':
            return {
                ...commonDefaults,
                // Date - current date
                payment_date: today,
                time: currentTime,

                // Amount
                amount: 0,

                // Type
                payment_type: 'received', // Default to receiving payment
                payment_mode: 'cash',

                // Reference
                reference_type: null,
                reference_id: null,

                // Customer/Vendor (use last one)
                customer_id: context.lastCustomerId || null,
                vendor_id: null,

                // Bank details
                bank_name: '',
                cheque_number: '',
                transaction_id: '',

                // Notes
                notes: '',
            };

        case 'stock_adjustment':
            return {
                ...commonDefaults,
                // Date
                date: today,
                time: currentTime,

                // Product
                product_id: context.lastProductId || null,

                // Warehouse
                warehouse_id: context.defaultWarehouseId || warehouses?.[0]?.id,

                // Adjustment
                quantity_change: 0,
                reason: 'physical_count',

                // Notes
                notes: '',
            };

        case 'customer':
        case 'vendor':
            return {
                ...commonDefaults,
                // Basic info
                name: '',
                email: '',
                phone: '',

                // Tax info
                ntn: '',
                cnic: '',
                srn: '',
                filer_status: 'filer', // Default to filer for lower tax

                // Address
                address: '',
                city: '',
                state: '',
                country: 'Pakistan',
                pincode: '',

                // Financial
                credit_limit: formType === 'customer' ? 100000 : 0,
                outstanding_balance: 0,
                opening_balance: 0,

                // Domain data
                domain_data: {},
            };

        case 'warehouse':
            return {
                ...commonDefaults,
                // Basic info
                name: '',
                code: '',

                // Location
                address: '',
                city: '',
                state: '',
                country: 'Pakistan',

                // Status
                is_active: true,
                is_default: warehouses?.length === 0, // First warehouse is default

                // Capacity
                capacity: null,

                // Contact
                manager_name: '',
                manager_phone: '',
                manager_email: '',
            };

        case 'batch':
            return {
                ...commonDefaults,
                // Product
                product_id: context.productId || null,

                // Warehouse
                warehouse_id: context.warehouseId || warehouses?.[0]?.id,

                // Batch info
                batch_number: generateBatchNumber(),
                manufacturing_date: today,
                expiry_date: getDueDateDefault(today, 365), // 1 year from now

                // Quantity
                quantity: 0,
                reserved_quantity: 0,

                // Pricing
                cost_price: context.productCostPrice || 0,
                mrp: context.productMRP || 0,

                // Status
                is_active: true,
            };

        case 'manufacturing_order':
            return {
                ...commonDefaults,
                // Dates
                order_date: today,
                planned_start_date: today,
                planned_end_date: getDueDateDefault(today, 7),

                // Product
                product_id: null,

                // Quantity
                quantity_to_produce: 0,
                quantity_produced: 0,

                // Warehouse
                warehouse_id: context.defaultWarehouseId || warehouses?.[0]?.id,

                // Status
                status: 'draft',

                // BOM
                bom_items: [],
            };

        default:
            return commonDefaults;
    }
}

/**
 * Get due date default (X days from start date)
 */
function getDueDateDefault(startDate, daysToAdd) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
}

/**
 * Generate batch number (format: BATCH-YYYYMMDD-XXXX)
 */
function generateBatchNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BATCH-${dateStr}-${random}`;
}

/**
 * Get default terms and conditions based on document type
 */
function getDefaultTerms(documentType) {
    const terms = {
        invoice: `Payment Terms:
- Payment due within 30 days of invoice date
- Late payments subject to 2% monthly interest
- All prices are inclusive of applicable taxes
- Goods once sold are not returnable`,

        quotation: `Quotation Terms:
- This quotation is valid for 30 days from the date of issue
- Prices are subject to change without notice
- Delivery time: 7-14 business days from order confirmation
- Payment terms: 50% advance, 50% on delivery`,

        sales_order: `Order Terms:
- Delivery as per agreed schedule
- Payment terms as per contract
- Cancellation charges may apply
- Subject to availability`,

        purchase_order: `Purchase Terms:
- Delivery as per schedule
- Quality as per specifications
- Payment as per agreed terms
- Penalties for late delivery may apply`,
    };

    return terms[documentType] || '';
}

/**
 * Auto-calculate invoice totals
 */
export function calculateInvoiceTotals(items, discountPercent = 0, shippingCharges = 0) {
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        return sum + itemTotal;
    }, 0);

    const discountAmount = (subtotal * (discountPercent || 0)) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;

    const totalTax = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
        const itemTax = (itemTotal * (item.tax_percent || 0)) / 100;
        return sum + itemTax;
    }, 0);

    const grandTotal = subtotalAfterDiscount + totalTax + (shippingCharges || 0);

    return {
        subtotal,
        discount_amount: discountAmount,
        total_tax: totalTax,
        grand_total: grandTotal,
    };
}

/**
 * Auto-calculate product pricing
 */
export function calculateProductPricing(costPrice, marginPercent = 30, taxPercent = 17) {
    const sellingPrice = costPrice * (1 + marginPercent / 100);
    const mrp = sellingPrice * (1 + taxPercent / 100);

    return {
        price: Math.round(sellingPrice * 100) / 100,
        mrp: Math.round(mrp * 100) / 100,
    };
}

/**
 * Get context from last entry (for pre-filling based on user's last action)
 */
export function useLastEntryContext(formType, businessId) {
    const [lastEntry, setLastEntry] = useState(null);

    useEffect(() => {
        // Load last entry from localStorage
        const key = `last_${formType}_${businessId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setLastEntry(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse last entry:', e);
            }
        }
    }, [formType, businessId]);

    const saveLastEntry = (entry) => {
        const key = `last_${formType}_${businessId}`;
        localStorage.setItem(key, JSON.stringify(entry));
        setLastEntry(entry);
    };

    return { lastEntry, saveLastEntry };
}

/**
 * Smart field suggestions based on partial input
 */
export function useFieldSuggestions(fieldName, value, options = []) {
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (!value || value.length < 2) {
            setSuggestions([]);
            return;
        }

        const filtered = options.filter(option => {
            const searchText = typeof option === 'string' ? option : option.label || option.name;
            return searchText.toLowerCase().includes(value.toLowerCase());
        });

        setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
    }, [value, options]);

    return suggestions;
}

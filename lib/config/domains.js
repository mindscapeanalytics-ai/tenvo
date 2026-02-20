/**
 * Domain Expertise Configuration
 * Pakistan-first business domain registry for vertical-specific customization
 * 
 * Each domain defines:
 * - Tax configuration defaults
 * - Default units and categories
 * - Required/optional module flags
 * - UI label overrides for domain relevance
 * - Default product categories
 */

export const BUSINESS_DOMAINS = {
    retail: {
        key: 'retail',
        name: 'Retail / General Store',
        name_ur: 'ریٹیل / جنرل اسٹور',
        icon: 'Store',
        description: 'General retail, supermarkets, departmental stores',
        tax_config: {
            default_tax_rate: 17,    // FBR standard GST
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: true,
        },
        default_units: ['pcs', 'pack', 'dozen', 'carton', 'box'],
        default_categories: [
            'FMCG', 'Beverages', 'Snacks', 'Personal Care',
            'Household', 'Stationery', 'Cleaning', 'Other',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: ['pos', 'batch_tracking', 'expense_tracking', 'delivery_challans'],
        label_overrides: {
            product: 'Item',
            invoice: 'Sales Bill',
            purchase: 'Purchase Bill',
            customer: 'Customer',
        },
    },

    wholesale: {
        key: 'wholesale',
        name: 'Wholesale / Distribution',
        name_ur: 'ہول سیل / ڈسٹری بیوشن',
        icon: 'Warehouse',
        description: 'Wholesale trading, distribution companies, stockists',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: true,
            input_tax_claimable: true,
        },
        default_units: ['carton', 'pallet', 'kg', 'ton', 'pcs', 'dozen'],
        default_categories: [
            'Category A', 'Category B', 'Category C',
            'Fast Moving', 'Slow Moving', 'Seasonal',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: [
            'credit_notes', 'delivery_challans', 'multi_warehouse',
            'batch_tracking', 'expense_tracking', 'quotations',
        ],
        label_overrides: {
            product: 'Item',
            invoice: 'Invoice',
            purchase: 'Purchase Order',
            customer: 'Dealer / Retailer',
            vendor: 'Supplier / Manufacturer',
        },
    },

    pharmacy: {
        key: 'pharmacy',
        name: 'Pharmacy / Medical Store',
        name_ur: 'فارمیسی / میڈیکل اسٹور',
        icon: 'Pill',
        description: 'Pharmacies, medical stores, drug distributors',
        tax_config: {
            default_tax_rate: 0,     // Most pharma items exempt in Pakistan
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: false,
        },
        default_units: ['pcs', 'strip', 'pack', 'bottle', 'tube', 'box', 'carton'],
        default_categories: [
            'Tablets', 'Capsules', 'Syrups', 'Injections',
            'Surgical', 'OTC', 'Baby Care', 'Cosmetics', 'Devices',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting', 'batch_tracking'],
        recommended_modules: ['serial_tracking', 'pos', 'expense_tracking'],
        label_overrides: {
            product: 'Medicine / Drug',
            invoice: 'Sales Bill',
            purchase: 'Purchase Bill',
            batch_number: 'Batch No.',
            expiry_date: 'Expiry Date',
        },
        special_rules: {
            expiry_tracking_mandatory: true,
            batch_tracking_mandatory: true,
            drug_license_required: true,
        },
    },

    electronics: {
        key: 'electronics',
        name: 'Electronics / Mobile',
        name_ur: 'الیکٹرانکس / موبائل',
        icon: 'Smartphone',
        description: 'Mobile phones, electronics, gadgets, accessories',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: true,
        },
        default_units: ['pcs', 'set', 'pair'],
        default_categories: [
            'Smartphones', 'Tablets', 'Laptops', 'Accessories',
            'Chargers', 'Cases', 'Audio', 'Wearables', 'Parts',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting', 'serial_tracking'],
        recommended_modules: ['pos', 'credit_notes', 'expense_tracking'],
        label_overrides: {
            product: 'Product',
            serial_number: 'IMEI / Serial',
            invoice: 'Sales Invoice',
        },
        special_rules: {
            imei_tracking_mandatory: true,
            warranty_tracking: true,
        },
    },

    restaurant: {
        key: 'restaurant',
        name: 'Restaurant / Food & Beverage',
        name_ur: 'ریسٹورنٹ / کھانا',
        icon: 'UtensilsCrossed',
        description: 'Restaurants, cafes, bakeries, catering, food delivery',
        tax_config: {
            default_tax_rate: 16,    // Restaurant GST reduced rate
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: true,
        },
        default_units: ['pcs', 'plate', 'serving', 'kg', 'litre', 'pack'],
        default_categories: [
            'Appetizers', 'Main Course', 'Desserts', 'Beverages',
            'Fast Food', 'Deals', 'Add-ons', 'Raw Materials',
        ],
        required_modules: ['invoicing', 'purchases', 'vendors', 'basic_accounting', 'pos'],
        recommended_modules: ['expense_tracking', 'batch_tracking'],
        label_overrides: {
            product: 'Menu Item',
            invoice: 'Bill',
            customer: 'Guest / Customer',
            pos_terminal: 'Counter',
        },
    },

    textile: {
        key: 'textile',
        name: 'Textile / Garments',
        name_ur: 'ٹیکسٹائل / گارمنٹس',
        icon: 'Shirt',
        description: 'Textile mills, garment factories, fabric shops, tailoring',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: true,
            input_tax_claimable: true,
        },
        default_units: ['meter', 'yard', 'pcs', 'dozen', 'roll', 'bale', 'kg'],
        default_categories: [
            'Raw Fabric', 'Finished Fabric', 'Garments', 'Accessories',
            'Threads', 'Dyes', 'Packaging', 'Lace / Trim',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: ['manufacturing', 'batch_tracking', 'multi_warehouse', 'delivery_challans'],
        label_overrides: {
            product: 'Fabric / Item',
            invoice: 'Sales Invoice',
            variant: 'Size / Color',
        },
    },

    construction: {
        key: 'construction',
        name: 'Construction / Building Materials',
        name_ur: 'تعمیرات / بلڈنگ میٹریل',
        icon: 'HardHat',
        description: 'Construction companies, cement, steel, hardware stores',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: true,
            input_tax_claimable: true,
        },
        default_units: ['kg', 'ton', 'bag', 'pcs', 'ft', 'sqft', 'cft', 'truck'],
        default_categories: [
            'Cement', 'Steel / Iron', 'Bricks', 'Sand / Gravel',
            'Plumbing', 'Electrical', 'Paint', 'Hardware', 'Tiles',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: ['delivery_challans', 'expense_tracking', 'multi_warehouse', 'quotations'],
        label_overrides: {
            product: 'Material',
            warehouse: 'Site / Godown',
            invoice: 'Delivery Bill',
        },
    },

    auto_parts: {
        key: 'auto_parts',
        name: 'Auto Parts / Vehicles',
        name_ur: 'آٹو پارٹس / گاڑیاں',
        icon: 'Car',
        description: 'Auto parts, vehicle dealers, service stations',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: true,
        },
        default_units: ['pcs', 'set', 'pair', 'litre', 'kg'],
        default_categories: [
            'Engine Parts', 'Body Parts', 'Electrical', 'Suspension',
            'Brakes', 'Lubricants', 'Filters', 'Batteries', 'Tyres',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: ['serial_tracking', 'pos', 'expense_tracking'],
        label_overrides: {
            product: 'Part',
            sku: 'Part Number / OEM',
        },
    },

    grocery: {
        key: 'grocery',
        name: 'Grocery / Kiryana Store',
        name_ur: 'گروسری / کریانہ اسٹور',
        icon: 'ShoppingBasket',
        description: 'Kiryana stores, grocery shops, mini marts',
        tax_config: {
            default_tax_rate: 0,     // Most essential items exempt
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: false,
        },
        default_units: ['kg', 'g', 'pcs', 'pack', 'litre', 'ml', 'dozen'],
        default_categories: [
            'Atta / Flour', 'Rice / Pulses', 'Cooking Oil', 'Dairy',
            'Spices', 'Snacks', 'Beverages', 'Cleaning', 'Other',
        ],
        required_modules: ['invoicing', 'purchases', 'vendors', 'basic_accounting'],
        recommended_modules: ['pos', 'expense_tracking', 'batch_tracking'],
        label_overrides: {
            product: 'Item',
            invoice: 'Parchi / Bill',
            customer: 'Customer / Khata',
        },
    },

    services: {
        key: 'services',
        name: 'Professional Services',
        name_ur: 'پروفیشنل سروسز',
        icon: 'Briefcase',
        description: 'Consulting, legal, accounting, IT services, agencies',
        tax_config: {
            default_tax_rate: 16,    // Services GST (Sindh SRB rate)
            tax_label: 'SST',
            withholding_enabled: true,
            input_tax_claimable: true,
        },
        default_units: ['hours', 'days', 'project', 'retainer', 'session'],
        default_categories: [
            'Consulting', 'Development', 'Design', 'Legal',
            'Accounting', 'Marketing', 'Training', 'Support',
        ],
        required_modules: ['invoicing', 'customers', 'basic_accounting'],
        recommended_modules: ['expense_tracking', 'quotations', 'credit_notes'],
        label_overrides: {
            product: 'Service',
            invoice: 'Service Invoice',
            purchase: 'Vendor Invoice',
            stock: 'N/A',
        },
    },

    ecommerce: {
        key: 'ecommerce',
        name: 'E-Commerce',
        name_ur: 'ای کامرس',
        icon: 'Globe',
        description: 'Online stores, marketplace sellers, dropshipping',
        tax_config: {
            default_tax_rate: 17,
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: true,
        },
        default_units: ['pcs', 'pack', 'set'],
        default_categories: [
            'Fashion', 'Electronics', 'Home & Living', 'Beauty',
            'Sports', 'Books', 'Toys', 'Health',
        ],
        required_modules: ['invoicing', 'purchases', 'customers', 'vendors', 'basic_accounting'],
        recommended_modules: [
            'multi_warehouse', 'batch_tracking', 'serial_tracking',
            'delivery_challans', 'credit_notes', 'promotions_crm',
        ],
        label_overrides: {
            product: 'Product / SKU',
            invoice: 'Order Invoice',
            customer: 'Buyer',
            delivery_challan: 'Shipment',
        },
    },

    agriculture: {
        key: 'agriculture',
        name: 'Agriculture / Agri-Business',
        name_ur: 'زراعت / ایگری بزنس',
        icon: 'Wheat',
        description: 'Farms, seed companies, fertilizer dealers, agriculture trading',
        tax_config: {
            default_tax_rate: 0,     // Most agri-products exempt
            tax_label: 'GST',
            withholding_enabled: false,
            input_tax_claimable: false,
        },
        default_units: ['kg', 'maund', 'ton', 'bag', 'acre', 'pcs', 'litre'],
        default_categories: [
            'Seeds', 'Fertilizers', 'Pesticides', 'Crops',
            'Livestock Feed', 'Machinery', 'Irrigation', 'Packaging',
        ],
        required_modules: ['invoicing', 'purchases', 'vendors', 'basic_accounting'],
        recommended_modules: ['batch_tracking', 'expense_tracking', 'multi_warehouse'],
        label_overrides: {
            product: 'Commodity / Input',
            warehouse: 'Godown / Storage',
            invoice: 'Sales Bill',
        },
    },
};

/**
 * Get domain configuration by key
 * @param {string} domainKey
 * @returns {Object|null}
 */
export function getDomainConfig(domainKey) {
    return BUSINESS_DOMAINS[domainKey] || null;
}

/**
 * Get all domain keys for select/dropdown
 * @returns {Array<{value: string, label: string, label_ur: string}>}
 */
export function getDomainOptions() {
    return Object.values(BUSINESS_DOMAINS).map(d => ({
        value: d.key,
        label: d.name,
        label_ur: d.name_ur,
        icon: d.icon,
    }));
}

/**
 * Get recommended modules for a domain + plan combination
 * @param {string} domainKey
 * @param {string} planTier
 * @param {Function} planHasFeature - from plans.js
 * @returns {Array<{module: string, available: boolean, recommended: boolean}>}
 */
export function getModulesForDomainPlan(domainKey, planTier, planHasFeatureFn) {
    const domain = BUSINESS_DOMAINS[domainKey];
    if (!domain) return [];

    const allModules = [...new Set([...domain.required_modules, ...domain.recommended_modules])];

    return allModules.map(mod => ({
        module: mod,
        available: planHasFeatureFn(planTier, mod),
        required: domain.required_modules.includes(mod),
        recommended: domain.recommended_modules.includes(mod),
    }));
}

/**
 * Pakistan-specific tax constants
 */
export const PAKISTAN_TAX = {
    FBR_STANDARD_GST: 17,
    REDUCED_GST: 10,
    EXEMPT_GST: 0,
    SINDH_SRB: 13,
    PUNJAB_PRA: 16,
    KPK_KPRA: 15,
    BALOCHISTAN_BRA: 15,
    WHT_FILER: 4.5,           // Withholding tax for filers
    WHT_NON_FILER: 9,         // Withholding tax for non-filers
    FURTHER_TAX_NON_FILER: 3, // Further tax on non-filer sales
    ADVANCE_TAX_IMPORTS: 6,
};

/**
 * Pakistan-specific compliance
 */
export const PAKISTAN_COMPLIANCE = {
    fiscal_year: { start_month: 7, end_month: 6 },   // July–June
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    tax_authority: 'FBR',
    tax_id_label: 'NTN',
    secondary_tax_id: 'STRN',
    id_label: 'CNIC',
};

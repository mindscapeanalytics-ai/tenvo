import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { createModuleLogger } from '@/lib/services/logging/logger';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { isMeaningfulInventoryBatch } from '@/lib/utils/inventoryTrackingHelpers';

/** Coerce Prisma.Decimal / numeric-like values for DB writes and JSON-safe reads */
function toFiniteNumber(val, fallback = 0) {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
    if (val instanceof Prisma.Decimal) {
        const n = val.toNumber();
        return Number.isFinite(n) ? n : fallback;
    }
    if (typeof val === 'object' && typeof val.toNumber === 'function') {
        const n = val.toNumber();
        return Number.isFinite(n) ? n : fallback;
    }
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Prefer normalized `product_batches`; fall back to legacy `products.batches` JSON
 * when relation rows were never migrated (avoids showing empty batches + stock 0).
 * @param {{ product_batches?: unknown[]; batches?: unknown }} p
 * @returns {unknown[]}
 */
function mergeProductBatchesFromRow(p) {
    const rel = p?.product_batches;
    if (Array.isArray(rel) && rel.length > 0) return rel;
    const raw = p?.batches;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (!t || t === '[object Object]') return [];
        try {
            const parsed = JSON.parse(t);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

const log = createModuleLogger('product-service');

/**
 * Product Management Service
 * Central Logic for Product Lifecycle, Seeding, and Relational Data
 * 2026 Enterprise Standards: Service-First Logic (Prisma ORM)
 */
export const ProductService = {
    /**
     * Get products with optional pagination and search
     */
    async getProducts(businessId, options = {}, tx = db) {
        const { limit, offset, search, category, isActive } = options;
        const usePagination = limit !== undefined && offset !== undefined;

        const where = {
            business_id: businessId,
            is_deleted: false,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { barcode: { contains: search, mode: 'insensitive' } }
                ]
            } : {}),
            ...(category ? { category } : {}),
            ...(isActive !== undefined && isActive !== null ? { is_active: isActive === true || isActive === 'true' } : {})
        };

        const [products, total] = await Promise.all([
            tx.products.findMany({
                where,
                include: {
                    product_batches: {
                        where: { is_active: true, is_deleted: false },
                        select: {
                            id: true,
                            batch_number: true,
                            quantity: true,
                            reserved_quantity: true,
                            expiry_date: true,
                            manufacturing_date: true,
                            cost_price: true,
                            is_active: true
                        }
                    },
                    product_serials: {
                        where: { status: 'in_stock', is_deleted: false },
                        select: { id: true, serial_number: true, status: true, notes: true }
                    },
                    product_stock_locations: {
                        where: { business_id: businessId },
                        select: { warehouse_id: true, quantity: true, state: true }
                    },
                    product_variants: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            variant_sku: true,
                            variant_name: true,
                            size: true,
                            color: true,
                            price: true,
                            cost_price: true,
                            mrp: true,
                            stock: true,
                            is_default: true,
                        }
                    }
                },
                orderBy: { name: 'asc' },
                ...(usePagination ? { skip: parseInt(offset), take: parseInt(limit) } : {})
            }),
            usePagination ? tx.products.count({ where }) : Promise.resolve(0)
        ]);

        // Transform included relations to match legacy output keys
        const mappedProducts = products.map(p => {
            const mapped = {
                ...p,
                batches: mergeProductBatchesFromRow(p),
                serial_numbers: p.product_serials,
                stock_locations: p.product_stock_locations,
                variants: p.product_variants
            };
            delete mapped.product_batches;
            delete mapped.product_serials;
            delete mapped.product_stock_locations;
            delete mapped.product_variants;
            return this.sanitizeProduct(mapped);
        });

        const actualTotal = usePagination ? total : mappedProducts.length;

        return { 
            products: mappedProducts, 
            total: actualTotal, 
            hasMore: usePagination ? (parseInt(offset) + parseInt(limit) < actualTotal) : false 
        };
    },

    /**
     * Get single product by ID
     */
    async getProduct(productId, businessId, tx = db) {
        const product = await tx.products.findFirst({
            where: {
                id: productId,
                business_id: businessId,
                is_deleted: false
            },
            include: {
                product_batches: {
                    where: { is_active: true, is_deleted: false }
                },
                product_serials: {
                    where: { status: 'in_stock', is_deleted: false }
                },
                product_stock_locations: {
                    where: { business_id: businessId },
                    select: { warehouse_id: true, quantity: true, state: true }
                },
                product_variants: {
                    where: { is_deleted: false },
                    select: {
                        id: true,
                        variant_sku: true,
                        variant_name: true,
                        size: true,
                        color: true,
                        price: true,
                        cost_price: true,
                        mrp: true,
                        stock: true,
                        is_default: true,
                    }
                }
            }
        });

        if (!product) return null;

        const mapped = {
            ...product,
            batches: mergeProductBatchesFromRow(product),
            serial_numbers: product.product_serials,
            stock_locations: product.product_stock_locations,
            variants: product.product_variants
        };
        delete mapped.product_batches;
        delete mapped.product_serials;
        delete mapped.product_stock_locations;
        delete mapped.product_variants;

        return this.sanitizeProduct(mapped);
    },

    /**
     * Create product with relational data
     */
    async createProduct(productData, tx = null) {
        const execute = async (prismaTx) => {
            // Extract relational arrays before building create payload
            const batches = productData.batches || productData.product_batches || [];
            const serialNumbers = productData.serial_numbers || productData.product_serials || productData.serialNumbers || [];
            const variants = productData.variants || productData.product_variants || [];
            const stockNum =
                productData.stock === null || productData.stock === undefined
                    ? null
                    : Number(productData.stock) || 0;
            const stockStatus =
                productData.stock_status ||
                (stockNum === null
                    ? 'in_stock'
                    : stockNum <= 0
                      ? 'out_of_stock'
                      : stockNum <= 5
                        ? 'low_stock'
                        : 'in_stock');
            const priceNum = Number(productData.price) || 0;
            const mrpNum = productData.mrp ? Number(productData.mrp) : null;
            const slugFromName =
                productData.name && String(productData.name).trim()
                    ? `${String(productData.name)
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')}-${Math.random().toString(36).slice(2, 10)}`
                    : null;

            const safeSerialize = (val) => {
                if (val === undefined || val === null) return {};
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    if (trimmed === '[object Object]' || trimmed === '') return {};
                    try {
                        return JSON.parse(trimmed);
                    } catch (e) {
                        return {};
                    }
                }
                return val;
            };

            const product = await prismaTx.products.create({
                data: {
                    business_id: productData.business_id,
                    name: productData.name,
                    description: productData.description,
                    sku: productData.sku,
                    price: priceNum,
                    cost_price: (productData.cost_price ?? productData.costPrice) ? Number(productData.cost_price ?? productData.costPrice) : null,
                    mrp: mrpNum,
                    compare_price:
                        productData.compare_price != null
                            ? Number(productData.compare_price)
                            : mrpNum != null && mrpNum > priceNum && priceNum > 0
                              ? mrpNum
                              : null,
                    stock: stockNum ?? 0,
                    stock_status: stockStatus,
                    has_variants: variants.length > 0,
                    is_featured: Boolean(productData.is_featured),
                    is_new: productData.is_new !== false,
                    enable_reviews: productData.enable_reviews !== false,
                    images: Array.isArray(productData.images) ? productData.images : [],
                    min_stock: (productData.min_stock ?? productData.minStock) ? Number(productData.min_stock ?? productData.minStock) : 0,
                    max_stock: (productData.max_stock ?? productData.maxStock) ? Number(productData.max_stock ?? productData.maxStock) : null,
                    min_stock_level: productData.min_stock_level ? Number(productData.min_stock_level) : 5,
                    reorder_point: (productData.reorder_point ?? productData.reorderPoint) ? Number(productData.reorder_point ?? productData.reorderPoint) : null,
                    reorder_quantity: (productData.reorder_quantity ?? productData.reorderQuantity) ? Number(productData.reorder_quantity ?? productData.reorderQuantity) : null,
                    unit: productData.unit || 'pcs',
                    location: productData.location,
                    barcode: productData.barcode,
                    brand: productData.brand,
                    tax_percent: (productData.tax_percent ?? productData.taxPercent) !== undefined ? Number(productData.tax_percent ?? productData.taxPercent) : 17,
                    hsn_code: productData.hsn_code || productData.hsnCode,
                    sac_code: productData.sac_code || productData.sacCode,
                    image_url: productData.image_url,
                    slug:
                        productData.slug != null && String(productData.slug).trim() !== ''
                            ? String(productData.slug).trim()
                            : slugFromName,
                    is_active: productData.is_active !== undefined ? productData.is_active : true,
                    expiry_date: productData.expiry_date ? new Date(productData.expiry_date) : null,
                    manufacturing_date: productData.manufacturing_date ? new Date(productData.manufacturing_date) : null,
                    batch_number: productData.batch_number,
                    domain_data: safeSerialize(productData.domain_data),
                    category: productData.category,
                    unit_conversions: safeSerialize(productData.unit_conversions),
                    product_batches: {
                        create: batches.map(b => ({
                            business_id: productData.business_id,
                            batch_number: b.batch_number || b.batchNumber,
                            quantity: Number(b.quantity) || 0,
                            manufacturing_date: (b.manufacturing_date || b.manufacturingDate) ? new Date(b.manufacturing_date || b.manufacturingDate) : null,
                            expiry_date: (b.expiry_date || b.expiryDate) ? new Date(b.expiry_date || b.expiryDate) : null,
                            cost_price: (b.cost_price || b.costPrice) ? Number(b.cost_price || b.costPrice) : null,
                            notes: b.notes || null,
                            is_active: true
                        }))
                    },
                    product_serials: {
                        create: serialNumbers.map(sn => ({
                            business_id: productData.business_id,
                            serial_number: sn.serial_number || sn.serialNumber || sn,
                            status: sn.status || 'in_stock',
                            notes: sn.notes || null
                        }))
                    },
                    product_variants: {
                        create: variants.map(v => ({
                            business_id: productData.business_id,
                            variant_sku: v.variant_sku || v.variantSku || `${productData.sku}-${Math.random().toString(36).substr(2, 5)}`,
                            variant_name: v.variant_name || v.variantName || `${productData.name} - Variant`,
                            size: v.size || null,
                            color: v.color || null,
                            price: Number(v.price) || 0,
                            cost_price: Number(v.cost_price || v.costPrice) || 0,
                            stock: Number(v.stock) || 0
                        }))
                    }
                }
            });

            log.info('Product created with relational data', { productId: product.id });
            return this.sanitizeProduct(product);
        };

        if (tx) return execute(tx);
        return db.$transaction(execute);
    },

    /**
     * Update product
     */
    async updateProduct(id, businessId, updates, tx = db) {
        const safeSerialize = (val) => {
            if (val === undefined || val === null) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed === '[object Object]' || trimmed === '') return {};
                try {
                    return JSON.parse(trimmed);
                } catch (e) {
                    return {};
                }
            }
            return val;
        };

        const data = { ...updates };

        // Strip fields that are not writable columns on the products table
        const NON_SCHEMA_FIELDS = [
            'id', 'business_id', '_tempId',
            // Relational includes (mapped keys)
            'batches', 'serial_numbers', 'stock_locations', 'variants',
            // Prisma relation names
            'product_batches', 'product_serials', 'product_stock_locations', 'product_variants',
            // Read-only timestamps
            'created_at', 'updated_at', 'deleted_at',
            // Computed / non-column fields
            'value', 'percentage', 'storefront_published',
            // Alias fields that would conflict
            'expiryDate', 'manufacturingDate', 'batchNumber', 'batchDate',
        ];
        for (const field of NON_SCHEMA_FIELDS) {
            delete data[field];
        }

        if (data.domain_data !== undefined) data.domain_data = safeSerialize(data.domain_data);
        if (data.unit_conversions !== undefined) data.unit_conversions = safeSerialize(data.unit_conversions);
        if (data.expiry_date) data.expiry_date = new Date(data.expiry_date);
        if (data.manufacturing_date) data.manufacturing_date = new Date(data.manufacturing_date);

        // Map camelCase to snake_case for Prisma schema compatibility
        const fieldMappings = {
            costPrice: 'cost_price',
            minStock: 'min_stock',
            maxStock: 'max_stock',
            reorderPoint: 'reorder_point',
            reorderQuantity: 'reorder_quantity',
            taxPercent: 'tax_percent',
            hsnCode: 'hsn_code',
            sacCode: 'sac_code'
        };
        for (const [camel, snake] of Object.entries(fieldMappings)) {
            if (data[camel] !== undefined) {
                data[snake] = data[camel];
                delete data[camel];
            }
        }

        // Convert numeric fields
        const numericFields = ['price', 'cost_price', 'mrp', 'stock', 'min_stock', 'max_stock', 'min_stock_level', 'reorder_point', 'reorder_quantity', 'tax_percent'];
        for (const field of numericFields) {
            if (data[field] !== undefined && data[field] !== null) {
                data[field] = toFiniteNumber(data[field], 0);
            }
        }

        if (data.stock !== undefined && data.stock !== null) {
            const s = Number(data.stock);
            if (Number.isFinite(s)) {
                data.stock_status =
                    s <= 0 ? 'out_of_stock' : s <= 5 ? 'low_stock' : 'in_stock';
            }
        }

        try {
            const result = await tx.products.updateMany({
                where: {
                    id,
                    business_id: businessId
                },
                data
            });
            
            if (result.count === 0) return null;

            if (data.stock !== undefined && data.stock !== null) {
                const activeBatches = await tx.product_batches.findMany({
                    where: {
                        product_id: id,
                        business_id: businessId,
                        is_active: true,
                        is_deleted: false,
                    },
                    select: { id: true },
                });
                if (activeBatches.length === 1) {
                    await tx.product_batches.updateMany({
                        where: { id: activeBatches[0].id, business_id: businessId },
                        data: { quantity: data.stock },
                    });
                }
            }

            const product = await tx.products.findFirst({
                where: { id, business_id: businessId },
                include: {
                    product_batches: {
                        where: { is_active: true, is_deleted: false },
                        select: {
                            id: true,
                            batch_number: true,
                            quantity: true,
                            reserved_quantity: true,
                            expiry_date: true,
                            manufacturing_date: true,
                            cost_price: true,
                            is_active: true
                        }
                    },
                    product_stock_locations: {
                        where: { business_id: businessId },
                        select: { warehouse_id: true, quantity: true, state: true }
                    },
                    product_variants: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            variant_sku: true,
                            variant_name: true,
                            size: true,
                            color: true,
                            price: true,
                            cost_price: true,
                            mrp: true,
                            stock: true,
                            is_default: true
                        }
                    }
                }
            });
            if (!product) return null;

            const variantCount = await tx.product_variants.count({
                where: { product_id: id, business_id: businessId, is_deleted: false },
            });
            if (product.has_variants !== (variantCount > 0)) {
                await tx.products.updateMany({
                    where: { id, business_id: businessId },
                    data: { has_variants: variantCount > 0 },
                });
                product.has_variants = variantCount > 0;
            }

            const mapped = {
                ...product,
                batches: mergeProductBatchesFromRow(product),
                stock_locations: product.product_stock_locations,
                variants: product.product_variants
            };
            delete mapped.product_batches;
            delete mapped.product_stock_locations;
            delete mapped.product_variants;
            return this.sanitizeProduct(mapped);
        } catch (e) {
            throw e;
        }
    },

    /**
     * Bulk seed products for a business
     */
    async seedProducts(businessId, items, tx = null) {
        const execute = async (prismaTx) => {
            const results = [];
            for (const item of items) {
                const product = await this.createProduct({
                    ...item,
                    business_id: businessId
                }, prismaTx);
                results.push(product);
            }
            return results;
        };

        if (tx) return execute(tx);
        return db.$transaction(execute);
    },

    /**
     * Soft delete (archive) product
     */
    async deleteProduct(productId, businessId, tx = db) {
        try {
            const result = await tx.products.updateMany({
                where: { id: productId, business_id: businessId },
                data: { is_deleted: true, is_active: false, deleted_at: new Date() }
            });
            
            if (result.count === 0) {
                throw new Error('Product not found or already deleted');
            }
            log.info('Product soft-deleted', { productId, businessId });
            return true;
        } catch (e) {
            throw e;
        }
    },

    /**
     * Effective on-hand quantity for hub / grid display.
     * Prefer summed warehouse rows when present; else max(headline stock, variant sum) when variants exist;
     * else headline `products.stock` (legacy simple inventory).
     */
    resolveDisplayStock(product) {
        if (!product) return 0;
        const base = toFiniteNumber(product.stock, 0);
        const locs = Array.isArray(product.stock_locations) ? product.stock_locations : [];
        if (locs.length > 0) {
            return locs.reduce((sum, row) => sum + toFiniteNumber(row?.quantity, 0), 0);
        }
        const batches = Array.isArray(product.batches) ? product.batches : [];
        const meaningfulBatches = batches.filter(isMeaningfulInventoryBatch);
        const batchSum = meaningfulBatches.reduce((sum, b) => {
            const q = toFiniteNumber(b?.quantity, 0);
            const r = toFiniteNumber(b?.reserved_quantity, 0);
            return sum + Math.max(0, q - r);
        }, 0);
        const vars = Array.isArray(product.variants) ? product.variants : [];
        const variantSum = vars.length > 0
            ? vars.reduce((sum, v) => sum + toFiniteNumber(v?.stock, 0), 0)
            : 0;

        if (meaningfulBatches.length === 0 && variantSum === 0) {
            return base;
        }
        if (meaningfulBatches.length === 1 && variantSum === 0) {
            return batchSum > 0 ? batchSum : base;
        }
        if (meaningfulBatches.length > 0 && variantSum === 0) {
            return Math.max(base, batchSum);
        }
        if (variantSum > 0) {
            return Math.max(base, batchSum, variantSum);
        }
        return base;
    },

    /**
     * Internal Sanitizer for Product Records
     */
    sanitizeProduct(product) {
        if (!product) return null;

        const safeParseJson = (val, fallback = {}) => {
            if (!val) return fallback;
            if (typeof val === 'object') return val;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed === '[object Object]' || trimmed === '') return fallback;
                try {
                    return JSON.parse(trimmed);
                } catch (e) {
                    console.error("Failed to parse JSON string in ProductService:", val, e);
                    return fallback;
                }
            }
            return fallback;
        };

        const normalized = {
            ...product,
            price: toFiniteNumber(product.price, 0),
            cost_price: toFiniteNumber(product.cost_price, 0),
            mrp: toFiniteNumber(product.mrp, 0),
            stock: this.resolveDisplayStock(product),
            min_stock: toFiniteNumber(product.min_stock, 0),
            min_stock_level: toFiniteNumber(
                product.min_stock_level != null ? product.min_stock_level : 5,
                5
            ),
            max_stock: toFiniteNumber(product.max_stock, 0),
            reorder_point: toFiniteNumber(product.reorder_point, 0),
            reorder_quantity: toFiniteNumber(product.reorder_quantity, 0),
            tax_percent: toFiniteNumber(product.tax_percent, 0),
            domain_data: safeParseJson(product.domain_data, {}),
            batches: Array.isArray(product.batches) ? product.batches : safeParseJson(product.batches, []),
            serial_numbers: Array.isArray(product.serial_numbers) ? product.serial_numbers : safeParseJson(product.serial_numbers, []),
            stock_locations: Array.isArray(product.stock_locations) ? product.stock_locations : safeParseJson(product.stock_locations, []),
            variants: Array.isArray(product.variants) ? product.variants : safeParseJson(product.variants, []),
            unit_conversions: safeParseJson(product.unit_conversions, {}),
        };
        return serializeDecimalsDeep(normalized);
    }
};

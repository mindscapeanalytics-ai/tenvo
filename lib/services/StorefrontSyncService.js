import { db } from '@/lib/db';
import { createModuleLogger } from '@/lib/services/logging/logger';

const log = createModuleLogger('storefront-sync');

/**
 * Storefront Sync Service
 * Ensures inventory products are automatically published to storefront
 * Provides intelligent syncing between inventory and public store
 */
export const StorefrontSyncService = {
    /**
     * Auto-publish a product to storefront after creation
     * Ensures the product is visible in the public store
     */
    async autoPublishProduct(productId, businessId, tx = db) {
        try {
            log.info(`Auto-publishing product ${productId} to storefront for business ${businessId}`);
            
            // Ensure product is marked as active and featured for storefront
            await tx.products.update({
                where: { id: productId },
                data: {
                    is_active: true,
                    is_featured: false, // Can be toggled manually
                    is_new: true, // Mark as new for storefront highlighting
                }
            });
            
            log.info(`Product ${productId} auto-published successfully`);
            return { success: true, productId };
        } catch (error) {
            log.error(`Failed to auto-publish product ${productId}:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sync all active inventory products to storefront
     * Use this to bulk-enable storefront for existing products
     */
    async syncInventoryToStorefront(businessId, tx = db) {
        try {
            log.info(`Syncing inventory to storefront for business ${businessId}`);
            
            // Find all inventory products that should be in storefront
            // (active, not deleted, with stock > 0 or stock tracking disabled)
            const products = await tx.products.findMany({
                where: {
                    business_id: businessId,
                    is_deleted: false,
                    is_active: true,
                },
                select: { id: true, name: true, stock: true }
            });
            
            let synced = 0;
            for (const product of products) {
                // Products with stock > 0 or null stock (tracking disabled) are storefront-ready
                if (product.stock === null || product.stock > 0) {
                    await tx.products.update({
                        where: { id: product.id },
                        data: {
                            is_active: true,
                            stock_status: product.stock === 0 ? 'out_of_stock' : 'in_stock'
                        }
                    });
                    synced++;
                }
            }
            
            log.info(`Synced ${synced} products to storefront for business ${businessId}`);
            return { success: true, synced, total: products.length };
        } catch (error) {
            log.error(`Failed to sync inventory to storefront:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update product availability based on stock changes
     * Automatically mark out-of-stock products in storefront
     */
    async updateStockAvailability(productId, newStock, tx = db) {
        try {
            const stockStatus = newStock === 0 ? 'out_of_stock' : 
                              newStock <= 5 ? 'low_stock' : 'in_stock';
            
            await tx.products.update({
                where: { id: productId },
                data: {
                    stock: newStock,
                    stock_status: stockStatus,
                    // Keep active but mark availability
                    is_active: true
                }
            });
            
            log.info(`Updated stock availability for product ${productId}: ${stockStatus}`);
            return { success: true, stockStatus };
        } catch (error) {
            log.error(`Failed to update stock availability for ${productId}:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get storefront-ready products for a business
     * Filters products that should appear in public store
     */
    async getStorefrontProducts(businessId, options = {}, tx = db) {
        const { 
            limit = 24, 
            offset = 0, 
            category = null,
            search = null,
            inStockOnly = false 
        } = options;

        try {
            const where = {
                business_id: businessId,
                is_deleted: false,
                is_active: true,
                ...(category && { category: { contains: category, mode: 'insensitive' } }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } }
                    ]
                }),
                ...(inStockOnly && {
                    OR: [
                        { stock: { gt: 0 } },
                        { stock: null } // Stock tracking disabled
                    ]
                })
            };

            const [products, total] = await Promise.all([
                tx.products.findMany({
                    where,
                    include: {
                        product_variants: {
                            where: { is_deleted: false, is_active: true },
                            select: { id: true, variant_name: true, price: true, stock: true }
                        }
                    },
                    orderBy: [
                        { is_featured: 'desc' },
                        { is_new: 'desc' },
                        { created_at: 'desc' }
                    ],
                    skip: parseInt(offset),
                    take: parseInt(limit)
                }),
                tx.products.count({ where })
            ]);

            return {
                success: true,
                products: products.map(p => ({
                    ...p,
                    // Ensure price is properly formatted
                    display_price: p.price || 0,
                    // Calculate total stock including variants
                    total_stock: p.stock || p.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0,
                    has_variants: p.product_variants?.length > 0
                })),
                total,
                hasMore: offset + limit < total
            };
        } catch (error) {
            log.error(`Failed to get storefront products:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Initialize storefront for a new business
     * Sets up default categories and syncs initial products
     */
    async initializeStorefront(businessId, domain, tx = db) {
        try {
            log.info(`Initializing storefront for business ${businessId} with domain ${domain}`);
            
            // Ensure business has a domain configured
            const existingDomain = await tx.business_custom_domains.findFirst({
                where: { business_id: businessId, is_active: true }
            });
            
            if (!existingDomain) {
                // Create default domain from business handle
                await tx.business_custom_domains.create({
                    data: {
                        business_id: businessId,
                        domain: domain || `store-${businessId}`,
                        is_active: true,
                        is_primary: true
                    }
                });
                log.info(`Created default domain for business ${businessId}`);
            }
            
            // Sync existing products
            const syncResult = await this.syncInventoryToStorefront(businessId, tx);
            
            log.info(`Storefront initialized for business ${businessId}`);
            return {
                success: true,
                domain: existingDomain?.domain || domain,
                productsSynced: syncResult.synced || 0
            };
        } catch (error) {
            log.error(`Failed to initialize storefront for ${businessId}:`, error);
            return { success: false, error: error.message };
        }
    }
};

export default StorefrontSyncService;

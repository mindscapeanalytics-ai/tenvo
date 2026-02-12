import {
    createBatchAction,
    getBatchesAction as getProductBatchesAction,
    getExpiringBatchesAction,
    updateBatchQuantityAction
} from '@/lib/actions/standard/inventory/batch';
import pool from '@/lib/db';
import { createModuleLogger } from '@/lib/services/logging/logger';

const log = createModuleLogger('batch-service');

/**
 * Batch Management Service
 * Handles batch tracking, FEFO/FIFO allocation, expiry management
 * Now acts as a wrapper around Server Actions
 */
export const BatchService = {

    async createBatch(params) {
        const result = await createBatchAction(params);
        if (!result.success) throw new Error(result.error);
        log.info('Batch created', { batchId: result.batch?.id, productId: params.product_id });
        return result.batch;
    },

    async getProductBatches(productId, warehouseId = null) {
        const result = await getProductBatchesAction(productId, warehouseId);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    },

    /**
     * Allocate batches for sale using FEFO (First Expiry First Out)
     * Returns array of batches to use with allocated quantities
     */
    async allocateBatchesFEFO(productId, quantityNeeded, warehouseId = null) {
        try {
            // Get available batches sorted by expiry date
            const result = await getProductBatchesAction(productId, warehouseId);
            if (!result.success) throw new Error(result.error);
            const batches = result.batches;

            const allocation = [];
            let remainingQuantity = quantityNeeded;

            for (const batch of batches) {
                if (remainingQuantity <= 0) break;

                const availableInBatch = batch.available_quantity || (batch.quantity - (batch.reserved_quantity || 0));
                if (availableInBatch <= 0) continue;

                const allocateFromBatch = Math.min(availableInBatch, remainingQuantity);

                allocation.push({
                    batchId: batch.id,
                    batchNumber: batch.batch_number,
                    quantity: allocateFromBatch,
                    costPrice: batch.cost_price,
                    expiryDate: batch.expiry_date
                });

                remainingQuantity -= allocateFromBatch;
            }

            if (remainingQuantity > 0) {
                throw new Error(`Insufficient stock. Need ${quantityNeeded}, available ${quantityNeeded - remainingQuantity}`);
            }

            log.info('FEFO allocation completed', { productId, allocated: allocation.length, totalQty: quantityNeeded });
            return allocation;
        } catch (error) {
            log.error('FEFO Allocation Error', { error, productId, quantityNeeded });
            throw error;
        }
    },

    /**
     * Allocate batches using FIFO (First In First Out)
     * Sorts batches by creation date (oldest first) instead of expiry date
     */
    async allocateBatchesFIFO(productId, quantityNeeded, warehouseId = null) {
        const client = await pool.connect();
        try {
            // Query batches sorted by created_at ASC (oldest first = FIFO)
            let query = `
                SELECT id, batch_number, quantity, reserved_quantity, cost_price, expiry_date, created_at,
                       (quantity - COALESCE(reserved_quantity, 0)) AS available_quantity
                FROM product_batches
                WHERE product_id = $1 
                  AND status = 'active'
                  AND (quantity - COALESCE(reserved_quantity, 0)) > 0
            `;
            const params = [productId];

            if (warehouseId) {
                query += ` AND warehouse_id = $${params.length + 1}`;
                params.push(warehouseId);
            }

            // FIFO: sort by creation date ascending
            query += ` ORDER BY created_at ASC`;

            const res = await client.query(query, params);
            const batches = res.rows;

            const allocation = [];
            let remainingQuantity = quantityNeeded;

            for (const batch of batches) {
                if (remainingQuantity <= 0) break;

                const availableInBatch = Number(batch.available_quantity);
                if (availableInBatch <= 0) continue;

                const allocateFromBatch = Math.min(availableInBatch, remainingQuantity);

                allocation.push({
                    batchId: batch.id,
                    batchNumber: batch.batch_number,
                    quantity: allocateFromBatch,
                    costPrice: Number(batch.cost_price),
                    expiryDate: batch.expiry_date,
                    createdAt: batch.created_at,
                });

                remainingQuantity -= allocateFromBatch;
            }

            if (remainingQuantity > 0) {
                throw new Error(`Insufficient stock (FIFO). Need ${quantityNeeded}, available ${quantityNeeded - remainingQuantity}`);
            }

            log.info('FIFO allocation completed', { productId, allocated: allocation.length, totalQty: quantityNeeded });
            return allocation;
        } catch (error) {
            log.error('FIFO Allocation Error', { error, productId, quantityNeeded });
            throw error;
        } finally {
            client.release();
        }
    },

    async updateBatchQuantity(batchId, quantityChange, isReservation = false) {
        const result = await updateBatchQuantityAction(batchId, quantityChange, isReservation);
        if (!result.success) throw new Error(result.error);
        return result.batch;
    },

    async getExpiringBatches(businessId, daysThreshold = 30) {
        const result = await getExpiringBatchesAction(businessId, daysThreshold);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    },

    /**
     * Get all expired batches (expiry_date < NOW) for a business
     * Returns active batches that have passed their expiry date
     */
    async getExpiredBatches(businessId) {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT pb.*, p.name AS product_name, p.sku
                FROM product_batches pb
                JOIN products p ON pb.product_id = p.id
                WHERE p.business_id = $1
                  AND pb.status = 'active'
                  AND pb.expiry_date IS NOT NULL
                  AND pb.expiry_date < NOW()
                  AND pb.quantity > 0
                ORDER BY pb.expiry_date ASC
            `, [businessId]);

            log.info('Expired batches retrieved', { businessId, count: res.rows.length });
            return res.rows;
        } catch (error) {
            log.error('Failed to get expired batches', { error, businessId });
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Deactivate all expired batches for a business
     * Sets status to 'expired' and moves available quantity to zero
     * Returns array of deactivated batch records
     */
    async deactivateExpiredBatches(businessId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find and update expired batches in a single atomic operation
            const res = await client.query(`
                UPDATE product_batches pb
                SET status = 'expired',
                    reserved_quantity = 0,
                    updated_at = NOW()
                FROM products p
                WHERE pb.product_id = p.id
                  AND p.business_id = $1
                  AND pb.status = 'active'
                  AND pb.expiry_date IS NOT NULL
                  AND pb.expiry_date < NOW()
                  AND pb.quantity > 0
                RETURNING pb.id, pb.batch_number, pb.product_id, pb.quantity, pb.expiry_date, 
                          p.name AS product_name, p.sku
            `, [businessId]);

            const deactivated = res.rows;

            // Update product stock levels for affected products
            const affectedProductIds = [...new Set(deactivated.map(b => b.product_id))];
            for (const productId of affectedProductIds) {
                // Recalculate total stock from remaining active batches
                await client.query(`
                    UPDATE products 
                    SET stock = COALESCE((
                        SELECT SUM(quantity - COALESCE(reserved_quantity, 0))
                        FROM product_batches 
                        WHERE product_id = $1 AND status = 'active'
                    ), 0),
                    updated_at = NOW()
                    WHERE id = $1
                `, [productId]);
            }

            await client.query('COMMIT');

            log.warn('Expired batches deactivated', {
                businessId,
                count: deactivated.length,
                affectedProducts: affectedProductIds.length,
            });

            return deactivated;
        } catch (error) {
            await client.query('ROLLBACK');
            log.error('Failed to deactivate expired batches', { error, businessId });
            throw error;
        } finally {
            client.release();
        }
    }
};

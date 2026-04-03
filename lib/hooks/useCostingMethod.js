import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * useCostingMethod Hook
 * 
 * Enterprise-grade costing method implementation for inventory valuation
 * Supports FIFO (First In First Out), LIFO (Last In First Out), and WAC (Weighted Average Cost)
 * 
 * @param {string} businessId - Business ID
 * @param {string} costingMethod - Costing method: 'FIFO', 'LIFO', or 'WAC'
 * 
 * @returns {Object} Hook interface with costing functions
 */
export function useCostingMethod(businessId, costingMethod = 'FIFO') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const supabase = createClient();

    /**
     * Calculate Cost of Goods Sold (COGS) using specified costing method
     * 
     * @param {string} productId - Product ID
     * @param {number} quantitySold - Quantity being sold
     * @param {string} [warehouseId] - Optional warehouse ID for location-specific calculation
     * @returns {Promise<Object>} COGS calculation result
     */
    const calculateCOGS = useCallback(async (productId, quantitySold, warehouseId = null) => {
        if (!productId || !quantitySold || quantitySold <= 0) {
            throw new Error('Invalid product ID or quantity');
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch available batches for the product
            let query = supabase
                .from('product_batches')
                .select('*')
                .eq('business_id', businessId)
                .eq('product_id', productId)
                .gt('available_quantity', 0)
                .eq('status', 'active');

            if (warehouseId) {
                query = query.eq('warehouse_id', warehouseId);
            }

            const { data: batches, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            if (!batches || batches.length === 0) {
                throw new Error('No available batches found for this product');
            }

            // Calculate COGS based on costing method
            let result;
            switch (costingMethod.toUpperCase()) {
                case 'FIFO':
                    result = calculateFIFO(batches, quantitySold);
                    break;
                case 'LIFO':
                    result = calculateLIFO(batches, quantitySold);
                    break;
                case 'WAC':
                    result = calculateWAC(batches, quantitySold);
                    break;
                default:
                    throw new Error(`Invalid costing method: ${costingMethod}`);
            }

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, costingMethod, supabase]);

    /**
     * FIFO (First In First Out) Costing Logic
     * Consumes oldest batches first
     * 
     * @param {Array} batches - Available batches
     * @param {number} quantitySold - Quantity to sell
     * @returns {Object} COGS calculation result
     */
    const calculateFIFO = (batches, quantitySold) => {
        // Sort batches by receipt_date ascending (oldest first)
        const sortedBatches = [...batches].sort((a, b) => 
            new Date(a.receipt_date || a.created_at) - new Date(b.receipt_date || b.created_at)
        );

        let remainingQuantity = quantitySold;
        let totalCOGS = 0;
        const batchesUsed = [];

        for (const batch of sortedBatches) {
            if (remainingQuantity <= 0) break;

            const quantityFromBatch = Math.min(remainingQuantity, batch.available_quantity);
            const costFromBatch = quantityFromBatch * batch.cost_price;

            totalCOGS += costFromBatch;
            batchesUsed.push({
                batch_id: batch.id,
                batch_number: batch.batch_number,
                quantity_used: quantityFromBatch,
                cost_price: batch.cost_price,
                cost_total: costFromBatch,
                receipt_date: batch.receipt_date || batch.created_at
            });

            remainingQuantity -= quantityFromBatch;
        }

        if (remainingQuantity > 0) {
            throw new Error(`Insufficient stock: ${remainingQuantity} units short`);
        }

        return {
            method: 'FIFO',
            total_cogs: totalCOGS,
            unit_cost: totalCOGS / quantitySold,
            quantity_sold: quantitySold,
            batches_used: batchesUsed,
            batches_count: batchesUsed.length
        };
    };

    /**
     * LIFO (Last In First Out) Costing Logic
     * Consumes newest batches first
     * 
     * @param {Array} batches - Available batches
     * @param {number} quantitySold - Quantity to sell
     * @returns {Object} COGS calculation result
     */
    const calculateLIFO = (batches, quantitySold) => {
        // Sort batches by receipt_date descending (newest first)
        const sortedBatches = [...batches].sort((a, b) => 
            new Date(b.receipt_date || b.created_at) - new Date(a.receipt_date || a.created_at)
        );

        let remainingQuantity = quantitySold;
        let totalCOGS = 0;
        const batchesUsed = [];

        for (const batch of sortedBatches) {
            if (remainingQuantity <= 0) break;

            const quantityFromBatch = Math.min(remainingQuantity, batch.available_quantity);
            const costFromBatch = quantityFromBatch * batch.cost_price;

            totalCOGS += costFromBatch;
            batchesUsed.push({
                batch_id: batch.id,
                batch_number: batch.batch_number,
                quantity_used: quantityFromBatch,
                cost_price: batch.cost_price,
                cost_total: costFromBatch,
                receipt_date: batch.receipt_date || batch.created_at
            });

            remainingQuantity -= quantityFromBatch;
        }

        if (remainingQuantity > 0) {
            throw new Error(`Insufficient stock: ${remainingQuantity} units short`);
        }

        return {
            method: 'LIFO',
            total_cogs: totalCOGS,
            unit_cost: totalCOGS / quantitySold,
            quantity_sold: quantitySold,
            batches_used: batchesUsed,
            batches_count: batchesUsed.length
        };
    };

    /**
     * WAC (Weighted Average Cost) Costing Logic
     * Uses weighted average of all available batches
     * 
     * @param {Array} batches - Available batches
     * @param {number} quantitySold - Quantity to sell
     * @returns {Object} COGS calculation result
     */
    const calculateWAC = (batches, quantitySold) => {
        // Calculate weighted average cost
        let totalCost = 0;
        let totalQuantity = 0;

        for (const batch of batches) {
            totalCost += batch.cost_price * batch.available_quantity;
            totalQuantity += batch.available_quantity;
        }

        if (totalQuantity < quantitySold) {
            throw new Error(`Insufficient stock: ${quantitySold - totalQuantity} units short`);
        }

        const weightedAverageCost = totalCost / totalQuantity;
        const totalCOGS = weightedAverageCost * quantitySold;

        // For WAC, we still need to track which batches to consume
        // We'll consume proportionally from all batches
        const batchesUsed = batches.map(batch => {
            const proportion = batch.available_quantity / totalQuantity;
            const quantityFromBatch = Math.min(
                Math.round(quantitySold * proportion),
                batch.available_quantity
            );

            return {
                batch_id: batch.id,
                batch_number: batch.batch_number,
                quantity_used: quantityFromBatch,
                cost_price: weightedAverageCost, // Use WAC for all batches
                cost_total: quantityFromBatch * weightedAverageCost,
                receipt_date: batch.receipt_date || batch.created_at
            };
        }).filter(b => b.quantity_used > 0);

        return {
            method: 'WAC',
            total_cogs: totalCOGS,
            unit_cost: weightedAverageCost,
            quantity_sold: quantitySold,
            batches_used: batchesUsed,
            batches_count: batchesUsed.length,
            weighted_average_cost: weightedAverageCost
        };
    };

    /**
     * Get inventory valuation for a product or all products
     * 
     * @param {string} [productId] - Optional product ID (if null, calculates for all products)
     * @returns {Promise<Object>} Inventory valuation result
     */
    const getInventoryValuation = useCallback(async (productId = null) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('product_batches')
                .select(`
                    *,
                    products (
                        id,
                        name,
                        sku,
                        category
                    )
                `)
                .eq('business_id', businessId)
                .gt('available_quantity', 0)
                .eq('status', 'active');

            if (productId) {
                query = query.eq('product_id', productId);
            }

            const { data: batches, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            if (!batches || batches.length === 0) {
                return {
                    total_value: 0,
                    total_quantity: 0,
                    products: [],
                    method: costingMethod
                };
            }

            // Group batches by product
            const productMap = new Map();

            for (const batch of batches) {
                const prodId = batch.product_id;
                if (!productMap.has(prodId)) {
                    productMap.set(prodId, {
                        product_id: prodId,
                        product_name: batch.products?.name || 'Unknown',
                        product_sku: batch.products?.sku || '',
                        category: batch.products?.category || '',
                        batches: [],
                        total_quantity: 0,
                        total_value: 0
                    });
                }

                const product = productMap.get(prodId);
                product.batches.push(batch);
                product.total_quantity += batch.available_quantity;
            }

            // Calculate valuation for each product based on costing method
            const products = [];
            let grandTotalValue = 0;
            let grandTotalQuantity = 0;

            for (const [prodId, product] of productMap) {
                let productValue = 0;

                switch (costingMethod.toUpperCase()) {
                    case 'FIFO':
                        // For FIFO valuation, use the cost of the oldest batches
                        const fifoSorted = [...product.batches].sort((a, b) => 
                            new Date(a.receipt_date || a.created_at) - new Date(b.receipt_date || b.created_at)
                        );
                        productValue = fifoSorted.reduce((sum, batch) => 
                            sum + (batch.available_quantity * batch.cost_price), 0
                        );
                        break;

                    case 'LIFO':
                        // For LIFO valuation, use the cost of the newest batches
                        const lifoSorted = [...product.batches].sort((a, b) => 
                            new Date(b.receipt_date || b.created_at) - new Date(a.receipt_date || a.created_at)
                        );
                        productValue = lifoSorted.reduce((sum, batch) => 
                            sum + (batch.available_quantity * batch.cost_price), 0
                        );
                        break;

                    case 'WAC':
                        // For WAC valuation, use weighted average cost
                        const totalCost = product.batches.reduce((sum, batch) => 
                            sum + (batch.available_quantity * batch.cost_price), 0
                        );
                        productValue = totalCost;
                        break;

                    default:
                        throw new Error(`Invalid costing method: ${costingMethod}`);
                }

                product.total_value = productValue;
                product.unit_cost = productValue / product.total_quantity;
                products.push(product);

                grandTotalValue += productValue;
                grandTotalQuantity += product.total_quantity;
            }

            return {
                total_value: grandTotalValue,
                total_quantity: grandTotalQuantity,
                average_unit_cost: grandTotalValue / grandTotalQuantity,
                products: products.sort((a, b) => b.total_value - a.total_value),
                method: costingMethod,
                calculated_at: new Date().toISOString()
            };
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, costingMethod, supabase]);

    /**
     * Record batch consumption after a sale
     * Updates available_quantity and reserved_quantity for consumed batches
     * 
     * @param {Array} batchesUsed - Array of batches consumed (from calculateCOGS result)
     * @param {string} saleId - Sale/invoice ID for tracking
     * @returns {Promise<void>}
     */
    const recordBatchConsumption = useCallback(async (batchesUsed, saleId) => {
        if (!batchesUsed || batchesUsed.length === 0) {
            throw new Error('No batches to record');
        }

        setLoading(true);
        setError(null);

        try {
            // Update each batch's available quantity
            const updates = batchesUsed.map(async (batchUsed) => {
                const { data: batch, error: fetchError } = await supabase
                    .from('product_batches')
                    .select('available_quantity')
                    .eq('id', batchUsed.batch_id)
                    .single();

                if (fetchError) throw fetchError;

                const newQuantity = batch.available_quantity - batchUsed.quantity_used;

                if (newQuantity < 0) {
                    throw new Error(`Insufficient quantity in batch ${batchUsed.batch_number}`);
                }

                const { error: updateError } = await supabase
                    .from('product_batches')
                    .update({
                        available_quantity: newQuantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', batchUsed.batch_id);

                if (updateError) throw updateError;

                // Record the consumption in batch_consumption table (if exists)
                // This is optional and depends on your schema
                try {
                    await supabase
                        .from('batch_consumption')
                        .insert({
                            business_id: businessId,
                            batch_id: batchUsed.batch_id,
                            sale_id: saleId,
                            quantity_consumed: batchUsed.quantity_used,
                            cost_price: batchUsed.cost_price,
                            total_cost: batchUsed.cost_total,
                            consumed_at: new Date().toISOString()
                        });
                } catch (err) {
                    // Ignore if table doesn't exist
                    console.warn('batch_consumption table not found:', err.message);
                }
            });

            await Promise.all(updates);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, supabase]);

    return {
        calculateCOGS,
        getInventoryValuation,
        recordBatchConsumption,
        loading,
        error
    };
}

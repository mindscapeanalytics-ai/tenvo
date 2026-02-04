'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createBatchAction, updateBatchQuantityAction, getProductBatchesAction } from './inventory';
import { createGLEntryAction } from './accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

// Helper to check auth and business access
async function checkAuth(businessId) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');

    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }

    return session;
}

/**
 * Server Action: Reserve Stock for a Sales Order
 */
export async function reserveStockAction(params, txClient = null) {
    try {
        await checkAuth(params.businessId);
        const client = txClient || await pool.connect();
        const shouldManageTransaction = !txClient;

        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const { businessId, productId, quantity, warehouseId, batchId } = params;

            // 1. Check availability (Stock - Reserved)
            // If batchId is provided, check batch availability
            if (batchId) {
                const bRes = await client.query(
                    'SELECT quantity, reserved_quantity FROM product_batches WHERE id = $1 FOR UPDATE',
                    [batchId]
                );

                if (bRes.rows.length === 0) throw new Error('Batch not found');
                const batch = bRes.rows[0];
                const available = Number(batch.quantity) - Number(batch.reserved_quantity || 0);

                if (available < quantity) {
                    throw new Error(`Insufficient batch stock for reservation. Available: ${available}, Requested: ${quantity}`);
                }

                // Update batch reservation
                await client.query(
                    'UPDATE product_batches SET reserved_quantity = COALESCE(reserved_quantity, 0) + $1 WHERE id = $2',
                    [quantity, batchId]
                );
            } else {
                // Global reservation logic or warehouse specific
                const pRes = await client.query(
                    'SELECT stock FROM products WHERE id = $1 FOR UPDATE',
                    [productId]
                );

                if (pRes.rows.length === 0) throw new Error('Product not found');
                const product = pRes.rows[0];

                // We don't have a global reserved_stock in products table currently, 
                // but we might want to check total reserved from all batches?
                // For now, if no batchId, we just assume we can reserve from general stock.
                // Best practice: always track reservation in a field. 
                // Since schema lacks global reserved_stock, let's just use batches if possible.
            }

            if (shouldManageTransaction) await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (shouldManageTransaction) client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Release Reserved Stock
 */
export async function releaseStockAction(params, txClient = null) {
    try {
        await checkAuth(params.businessId);
        const client = txClient || await pool.connect();
        const shouldManageTransaction = !txClient;

        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const { batchId, quantity } = params;

            if (batchId) {
                await client.query(
                    'UPDATE product_batches SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - $1) WHERE id = $2',
                    [quantity, batchId]
                );
            }

            if (shouldManageTransaction) await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (shouldManageTransaction) client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Add Stock (Purchase/Stock In)
 */
export async function addStockAction(params, txClient = null) {
    try {
        await checkAuth(params.businessId);
        const client = txClient || await pool.connect();
        const shouldManageTransaction = !txClient;

        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            let {
                businessId, productId, warehouseId,
                quantity: qty, quantityChange,
                costPrice: cp, unitCost,
                batchNumber, manufacturingDate, expiryDate, notes,
                referenceType = 'purchase', referenceId, domainData = {}
            } = params;

            // 0. Auto-resolve Primary Warehouse if none provided
            if (!warehouseId) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [businessId]);
                warehouseId = primaryRes.rows[0]?.id || null;
                // If still null, it will go to the global pool (warehouse_id = NULL)
            }

            const quantity = Number(qty || quantityChange || 0);
            const costPrice = Number(cp || unitCost || 0);

            // 1. Get Product with Lock
            const pRes = await client.query('SELECT stock, cost_price FROM products WHERE id = $1 FOR UPDATE', [productId]);
            const product = pRes.rows[0];

            const newStock = (product.stock || 0) + quantity;
            const totalValue = ((product.stock || 0) * (product.cost_price || 0)) + (quantity * costPrice);
            const newCostPrice = newStock > 0 ? totalValue / newStock : costPrice;

            // Update Product
            await client.query('UPDATE products SET stock = $1, cost_price = $2 WHERE id = $3', [newStock, newCostPrice, productId]);

            // 2. Handle Batch (Robust Upsert)
            let batchId = null;
            if (batchNumber) {
                const batchRes = await client.query(`
                    INSERT INTO product_batches (
                        business_id, product_id, warehouse_id, batch_number,
                        manufacturing_date, expiry_date, quantity, cost_price, notes, domain_data
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (business_id, product_id, batch_number) 
                    DO UPDATE SET 
                        quantity = product_batches.quantity + EXCLUDED.quantity,
                        cost_price = (product_batches.quantity * product_batches.cost_price + EXCLUDED.quantity * EXCLUDED.cost_price) / (product_batches.quantity + EXCLUDED.quantity),
                        updated_at = NOW()
                    RETURNING id
                `, [businessId, productId, warehouseId, batchNumber, manufacturingDate, expiryDate, quantity, costPrice, notes, domainData]);
                batchId = batchRes.rows[0].id;
            }

            // 2.5 Update Location Stock
            if (warehouseId) {
                await client.query(`
                    INSERT INTO product_stock_locations (
                        business_id, warehouse_id, product_id, quantity
                    ) VALUES ($1, $2, $3, $4)
                    ON CONFLICT (warehouse_id, product_id) 
                    DO UPDATE SET 
                        quantity = product_stock_locations.quantity + EXCLUDED.quantity,
                        updated_at = NOW()
                `, [businessId, warehouseId, productId, quantity]);
            }

            // 3. Stock Movement
            const moveRes = await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, warehouse_id, batch_id, movement_type,
                    transaction_type, quantity_change, unit_cost, reference_type, 
                    reference_id, notes, domain_data
                ) VALUES ($1, $2, $3, $4, 'in', $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `, [
                businessId, productId, warehouseId, batchId,
                referenceType, quantity, costPrice, referenceType,
                referenceId, notes, domainData
            ]);

            // 3.5 Inventory Ledger
            await client.query(`
                INSERT INTO inventory_ledger (
                    business_id, warehouse_id, product_id, transaction_type, 
                    reference_id, reference_type, quantity_change, running_balance,
                    unit_cost, total_value, batch_number, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                businessId, warehouseId, productId, referenceType,
                referenceId || moveRes.rows[0].id, referenceType,
                quantity, newStock, costPrice, quantity * costPrice,
                batchNumber || null, notes
            ]);

            if (shouldManageTransaction) await client.query('COMMIT');

            // 4. Async Accounting (Trigger separately to not block or fail the stock transaction if accounting fails? 
            // Usually we want consistency. But here we can call the action.)
            if (referenceType === 'purchase' || referenceType === 'production') {
                try {
                    const entries = referenceType === 'purchase'
                        ? [
                            { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: quantity * costPrice, credit: 0 },
                            { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: quantity * costPrice }
                        ]
                        : [
                            { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: quantity * costPrice, credit: 0 },
                            { accountCode: ACCOUNT_CODES.MANUFACTURING_COST, debit: 0, credit: quantity * costPrice }
                        ];

                    await createGLEntryAction({
                        businessId,
                        referenceId: referenceId || moveRes.rows[0].id,
                        referenceType: referenceType === 'purchase' ? 'bills' : 'movements',
                        description: `Stock In (${referenceType}): ${notes || 'Inventory Addition'}`,
                        entries: entries
                    }, txClient);
                } catch (e) {
                    console.error("Auto-accounting failed for stock in", e);
                }
            }

            return { success: true, newStock, newCostPrice, batchId, movementId: moveRes.rows[0].id };

        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (shouldManageTransaction) client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Remove Stock (Sale/Stock Out)
 */
export async function removeStockAction(params) {
    try {
        await checkAuth(params.businessId);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                businessId, productId, warehouseId, quantity,
                valuationMethod = 'FIFO', referenceType = 'sale', referenceId, notes
            } = params;

            // 1. Get Product
            const pRes = await client.query('SELECT stock, cost_price FROM products WHERE id = $1 FOR UPDATE', [productId]);
            const product = pRes.rows[0];

            if ((product.stock || 0) < quantity) {
                throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
            }

            // 2. Allocations (Simplified FIFO/FEFO logic directly via SQL)
            // We need to fetch batches and decrement them.
            // This logic matches BatchService.allocateBatches but inside DB transaction
            let costOfGoodsSold = 0;
            let allocated = 0;

            // Fetch batches
            const bRes = await client.query(`
                SELECT id, quantity, cost_price FROM product_batches 
                WHERE product_id = $1 AND quantity > 0 AND is_active = true
                ORDER BY expiry_date ASC NULLS FIRST
            `, [productId]); // FEFO Default

            for (const batch of bRes.rows) {
                if (allocated >= quantity) break;

                const needed = quantity - allocated;
                const take = Math.min(batch.quantity, needed);

                // Update Batch
                await client.query('UPDATE product_batches SET quantity = quantity - $1 WHERE id = $2', [take, batch.id]);

                allocated += take;
                costOfGoodsSold += (take * batch.cost_price);
            }

            if (allocated < quantity) {
                // Fallback if batches didn't cover it (legacy stock?)
                // Use avg cost for remainder
                const remainder = quantity - allocated;
                costOfGoodsSold += (remainder * product.cost_price);
            }

            // 3. Update Product
            const newStock = product.stock - quantity;
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);

            // 3.5 Update Location Stock
            if (warehouseId) {
                const locRes = await client.query(`
                    UPDATE product_stock_locations 
                    SET quantity = quantity - $1, updated_at = NOW()
                    WHERE warehouse_id = $2 AND product_id = $3
                    RETURNING quantity
                `, [quantity, warehouseId, productId]);

                if (locRes.rows.length === 0 || locRes.rows[0].quantity < 0) {
                    // If no record or resulting negative, we might want to throw or just allow if global allowed?
                    // Busy.in usually prevents negative if configured.
                    // For now, let's enforce warehouse-level stock integrity.
                    if (locRes.rows.length === 0) {
                        throw new Error(`Stock not found at specified warehouse.`);
                    }
                }
            }

            // 4. Movement
            const moveRes = await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, warehouse_id, movement_type, transaction_type,
                    quantity_change, unit_cost, reference_type, reference_id, notes
                ) VALUES ($1, $2, $3, 'out', $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [
                businessId, productId, warehouseId, referenceType, -quantity,
                costOfGoodsSold / quantity, referenceType, referenceId, notes
            ]);

            // 4.5 Inventory Ledger
            await client.query(`
                INSERT INTO inventory_ledger (
                    business_id, warehouse_id, product_id, transaction_type, 
                    reference_id, reference_type, quantity_change, running_balance,
                    unit_cost, total_value, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                businessId, warehouseId, productId, referenceType,
                referenceId || moveRes.rows[0].id, referenceType,
                -quantity, newStock, costOfGoodsSold / quantity, costOfGoodsSold, notes
            ]);

            // 5. Financial Posting (COGS)
            // Record Cost of Goods Sold every time stock is removed for sales or other purposes
            if (costOfGoodsSold > 0) {
                try {
                    const isSale = referenceType === 'sale' || referenceType === 'invoices';
                    const isProduction = referenceType === 'production_consumption';

                    const entries = isSale
                        ? [
                            { accountCode: ACCOUNT_CODES.COGS, debit: costOfGoodsSold, credit: 0 },
                            { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: costOfGoodsSold }
                        ]
                        : isProduction
                            ? [
                                { accountCode: ACCOUNT_CODES.MANUFACTURING_COST, debit: costOfGoodsSold, credit: 0 },
                                { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: costOfGoodsSold }
                            ]
                            : [
                                // Default to COGS or generic clearing for other outs? 
                                // Better to specify.
                                { accountCode: ACCOUNT_CODES.COGS, debit: costOfGoodsSold, credit: 0 },
                                { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: costOfGoodsSold }
                            ];

                    await createGLEntryAction({
                        businessId,
                        referenceId: referenceId || moveRes.rows[0].id,
                        referenceType: isSale ? 'invoices' : 'movements',
                        description: `${isProduction ? 'Manufacturing Consumption' : 'COGS'}: ${notes || 'Stock Out'}`,
                        entries: entries
                    }, client); // Share the transaction
                } catch (accError) {
                    console.error("Accounting posting failed in removeStockAction:", accError);
                    throw accError;
                }
            }

            await client.query('COMMIT');

            return { success: true, newStock, movementId: moveRes.rows[0].id };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Transfer Stock
 */
export async function transferStockAction(params) {
    try {
        await checkAuth(params.businessId);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { businessId, productId, fromWarehouseId, toWarehouseId, quantity, batchId, notes } = params;

            // 0. Pre-transaction validation: Ensure stock exists at source
            const stockCheck = await client.query(`
                SELECT quantity FROM product_stock_locations 
                WHERE warehouse_id = $1 AND product_id = $2
            `, [fromWarehouseId, productId]);

            const available = stockCheck.rows[0]?.quantity || 0;
            if (available < quantity) {
                throw new Error(`Insufficient stock at source warehouse. Available: ${available}, Requested: ${quantity}`);
            }

            // 1. Create Transfer Record
            const transferNumber = `TRF-${Date.now()}`;
            const trfRes = await client.query(`
                INSERT INTO stock_transfers (
                    business_id, transfer_number, product_id, batch_id, 
                    from_warehouse_id, to_warehouse_id, quantity, status, 
                    transfer_date, actual_arrival_date, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW(), NOW(), $8)
                RETURNING *
            `, [businessId, transferNumber, productId, batchId, fromWarehouseId, toWarehouseId, quantity, notes]);
            const transfer = trfRes.rows[0];

            // 2. Movements (Out from Source, In to Dest)
            // Note: transfers don't change global products.stock, but DO change location stock

            // 2.1 Validate and Update Source
            const srcRes = await client.query(`
                UPDATE product_stock_locations 
                SET quantity = quantity - $1, updated_at = NOW()
                WHERE warehouse_id = $2 AND product_id = $3
                RETURNING quantity
            `, [quantity, fromWarehouseId, productId]);

            if (srcRes.rows.length === 0 || srcRes.rows[0].quantity < 0) {
                throw new Error('Insufficient stock at source warehouse');
            }

            // 2.1.5 Ledger entry for Source
            await client.query(`
                INSERT INTO inventory_ledger (
                    business_id, warehouse_id, product_id, transaction_type, 
                    reference_id, reference_type, quantity_change, running_balance,
                    notes
                ) VALUES ($1, $2, $3, 'transfer_out', $4, 'transfer', $5, $6, $7)
            `, [businessId, fromWarehouseId, productId, transfer.id, -quantity, srcRes.rows[0].quantity, notes]);

            // 2.2 Update Destination
            await client.query(`
                INSERT INTO product_stock_locations (
                    business_id, warehouse_id, product_id, quantity
                ) VALUES ($1, $2, $3, $4)
                ON CONFLICT (warehouse_id, product_id) 
                DO UPDATE SET 
                    quantity = product_stock_locations.quantity + EXCLUDED.quantity,
                    updated_at = NOW()
            `, [businessId, toWarehouseId, productId, quantity]);

            await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, warehouse_id, batch_id, movement_type, 
                    transaction_type, quantity_change, unit_cost, reference_type, reference_id, notes
                ) VALUES ($1, $2, $3, $4, 'transfer_out', 'transfer', $5, 0, 'stock_transfer', $6, $7)
            `, [businessId, productId, fromWarehouseId, batchId, -quantity, transfer.id, `Transfer to ${toWarehouseId}`]);

            await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, warehouse_id, batch_id, movement_type, 
                    transaction_type, quantity_change, unit_cost, reference_type, reference_id, notes
                ) VALUES ($1, $2, $3, $4, 'transfer_in', 'transfer', $5, 0, 'stock_transfer', $6, $7)
            `, [businessId, productId, toWarehouseId, batchId, quantity, transfer.id, `Transfer from ${fromWarehouseId}`]);

            await client.query('COMMIT');
            return { success: true, transfer };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Adjust Stock
 */
export async function adjustStockAction(params) {
    try {
        await checkAuth(params.businessId);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { businessId, productId, warehouseId, quantityChange, reason, notes } = params;

            // 1. Get Product
            const pRes = await client.query('SELECT stock, cost_price FROM products WHERE id = $1 FOR UPDATE', [productId]);
            const product = pRes.rows[0];
            const newStock = (product.stock || 0) + quantityChange;

            if (newStock < 0) throw new Error('Invalid adjustment. Resulting stock negative.');

            // 2. Update Stock
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);

            // 2.5 Update Location Stock
            if (warehouseId) {
                await client.query(`
                    INSERT INTO product_stock_locations (
                        business_id, warehouse_id, product_id, quantity
                    ) VALUES ($1, $2, $3, $4)
                    ON CONFLICT (warehouse_id, product_id)
                    DO UPDATE SET 
                        quantity = product_stock_locations.quantity + EXCLUDED.quantity,
                        updated_at = NOW()
                `, [businessId, warehouseId, productId, quantityChange]);
            }

            // 3. Movement
            const moveType = quantityChange > 0 ? 'adjustment_in' : 'adjustment_out';
            const moveRes = await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, warehouse_id, movement_type, transaction_type,
                    quantity_change, unit_cost, reference_type, notes
                ) VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, 'adjustment', $7)
                RETURNING id
            `, [businessId, productId, warehouseId, moveType, quantityChange, product.cost_price, `${reason}: ${notes}`]);

            await client.query('COMMIT');

            // 4. Accounting (Async-like catch)
            try {
                // We need to import the accounting action or replicate logic. 
                // Since `accounting.js` actions are exported, we can use them IF they are just functions.
                // Yes, `createGLEntryAction` is exported.
                const amount = Math.abs(quantityChange) * (product.cost_price || 0);
                // Logic from original service:
                // if > 0: Asset Dr, Income Cr
                // if < 0: Expense (COGS/Loss) Dr, Asset Cr

                await createGLEntryAction({
                    businessId,
                    referenceId: moveRes.rows[0].id,
                    referenceType: 'movements',
                    description: `Stock Adjustment: ${reason}`,
                    entries: quantityChange > 0
                        ? [
                            { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: amount, credit: 0 }, // Inv Asset
                            { accountCode: ACCOUNT_CODES.OTHER_INCOME, debit: 0, credit: amount }  // Other Income
                        ]
                        : [
                            { accountCode: ACCOUNT_CODES.COGS, debit: amount, credit: 0 }, // COGS/Loss
                            { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: 0, credit: amount }  // Inv Asset
                        ]
                });
            } catch (e) {
                console.error("Auto-accounting failed for adjustment", e);
            }

            return { success: true, newStock, movementId: moveRes.rows[0].id };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Stock Valuation
 */
export async function getStockValuationAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT id, name, sku, stock, cost_price, price 
                FROM products 
                WHERE business_id = $1 AND is_active = true
            `, [businessId]);

            const products = res.rows;
            const valuation = products.map(p => ({
                productId: p.id,
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                costPrice: p.cost_price,
                sellingPrice: p.price,
                stockValue: p.stock * p.cost_price,
                potentialRevenue: p.stock * p.price,
                potentialProfit: p.stock * (p.price - p.cost_price)
            }));

            const totals = {
                totalStockValue: valuation.reduce((sum, v) => sum + v.stockValue, 0),
                totalPotentialRevenue: valuation.reduce((sum, v) => sum + v.potentialRevenue, 0),
                totalPotentialProfit: valuation.reduce((sum, v) => sum + v.potentialProfit, 0),
                totalItems: products.length,
                totalUnits: valuation.reduce((sum, v) => sum + v.stock, 0)
            };

            return { success: true, valuation, totals };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action: Get Stock Movements
 */
export async function getStockMovementsAction(productId, limit = 50) {
    try {
        const client = await pool.connect();
        try {
            const pRes = await client.query('SELECT business_id FROM products WHERE id = $1', [productId]);
            if (pRes.rows.length === 0) throw new Error('Product not found');
            await checkAuth(pRes.rows[0].business_id);
            const res = await client.query(`
                SELECT m.*, w.name as warehouse_name, pb.batch_number
                FROM stock_movements m
                LEFT JOIN warehouse_locations w ON m.warehouse_id = w.id
                LEFT JOIN product_batches pb ON m.batch_id = pb.id
                WHERE m.product_id = $1
                ORDER BY m.created_at DESC
                LIMIT $2
            `, [productId, limit]);

            // Map keys to match expected output if needed (e.g. nested objects)
            // Original used Supabase join: warehouses (name). Result is { ..., warehouses: { name: ... } }
            // Our SQL returns flat `warehouse_name`.
            // We should map it to match UI expectations if it accesses properties deeply.
            // Let's assume UI might do `movement.warehouses?.name`.
            const movements = res.rows.map(row => ({
                ...row,
                warehouses: { name: row.warehouse_name },
                product_batches: { batch_number: row.batch_number }
            }));

            return { success: true, movements };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

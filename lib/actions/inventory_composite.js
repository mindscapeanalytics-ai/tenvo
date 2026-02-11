'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { addStockAction, removeStockAction } from './stock';

/**
 * Server-side orchestration for atomic product creation/update with inventory
 * This ensures consistency and avoids race conditions or duplicate batch errors.
 */
export async function upsertIntegratedProductAction(params) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return { success: false, error: 'Unauthorized' };

    const {
        productData,
        batches = [],
        serialNumbers = [],
        initialStock = 0,
        isUpdate = false,
        productId = null
    } = params;

    const businessId = productData.business_id;
    await verifyBusinessAccess(session.user.id, businessId);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let finalProductId = productId;

        // Defined Safe Fields for Product Schema
        const safeFields = [
            'business_id', 'name', 'sku', 'barcode', 'category', 'brand', 'unit',
            'description', 'price', 'cost_price', 'tax_percent', 'min_stock', 'max_stock',
            'reorder_point', 'reorder_quantity', 'location', 'image_url', 'status',
            'is_featured', 'is_tax_inclusive', 'expiry_date', 'batch_number',
            'manufacturing_date', 'tracking_mode', 'attributes', 'variants',
            'domain_data'
            // NOTE: We deliberately EXCLUDE 'stock' here if batches/serials are present,
            // because we want stock to be a derived value from the batches.
            // If no batches/serials, we might allow direct stock updates via initialStock (handled later).
        ];

        const sanitizeProductData = (data) => {
            const sanitized = {};
            Object.keys(data).forEach(key => {
                if (safeFields.includes(key)) {
                    sanitized[key] = data[key];
                }
            });
            return sanitized;
        };

        const sanitizedData = sanitizeProductData(productData);

        // 1. Upsert Product
        if (isUpdate && productId) {
            // Update logic
            const fields = Object.keys(sanitizedData).filter(f => f !== 'id' && f !== 'business_id');
            const values = fields.map(f => sanitizedData[f]);
            const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');

            await client.query(`
                UPDATE products 
                SET ${setClause}, updated_at = NOW() 
                WHERE id = $1 AND business_id = $2
            `, [productId, businessId, ...values]);
        } else {
            // Create logic
            const fields = Object.keys(sanitizedData);
            const values = Object.values(sanitizedData);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const res = await client.query(`
                INSERT INTO products (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING id
            `, values);
            finalProductId = res.rows[0].id;
        }

        // 2. Handle Batches (Delta Reconciliation)
        if (batches && batches.length > 0) {
            // Fetch existing batches to compare
            const existingBatchesRes = await client.query(
                'SELECT id, quantity, batch_number FROM product_batches WHERE product_id = $1 AND business_id = $2',
                [finalProductId, businessId]
            );
            const existingBatches = existingBatchesRes.rows;

            for (const batch of batches) {
                const incomingQty = Number(batch.quantity) || 0;
                // Match by ID if exists (reliable), else fallback to batch_number+warehouse (if we had it), else treat as new
                const existing = existingBatches.find(eb =>
                    (batch.id && String(batch.id) === String(eb.id)) ||
                    (!batch.id && batch.batch_number === eb.batch_number) // fallback for new entries in UI that might match existing
                );

                if (existing) {
                    const currentQty = Number(existing.quantity);
                    const delta = incomingQty - currentQty;

                    if (delta > 0) {
                        // Stock In
                        await addStockAction({
                            businessId,
                            productId: finalProductId,
                            warehouseId: batch.warehouse_id || batch.warehouseId || null,
                            quantity: delta,
                            costPrice: batch.cost_price || batch.costPrice || productData.cost_price || 0,
                            batchNumber: existing.batch_number, // Use existing batch number
                            notes: 'Batch Quantity Adjustment (Increase)',
                            referenceType: 'adjustment',
                            referenceId: finalProductId
                        }, client);
                    } else if (delta < 0) {
                        // Stock Out
                        await removeStockAction({
                            businessId,
                            productId: finalProductId,
                            warehouseId: batch.warehouse_id || batch.warehouseId || null,
                            quantity: Math.abs(delta),
                            batch_id: existing.id, // Explicitly target this batch
                            notes: 'Batch Quantity Adjustment (Decrease)',
                            referenceType: 'adjustment',
                            referenceId: finalProductId
                        }, client);
                    } else {
                        // No quantity change, but maybe metadata update?
                        await client.query(`
                            UPDATE product_batches 
                            SET expiry_date = $1, manufacturing_date = $2, cost_price = $3, updated_at = NOW()
                            WHERE id = $4 AND business_id = $5
                        `, [
                            batch.expiry_date || batch.expiryDate || null,
                            batch.manufacturing_date || batch.manufacturingDate || null,
                            batch.cost_price || batch.costPrice || 0,
                            existing.id,
                            businessId
                        ]);
                    }
                } else {
                    // New Batch -> Stock In
                    if (incomingQty > 0) {
                        await addStockAction({
                            businessId,
                            productId: finalProductId,
                            warehouseId: batch.warehouse_id || batch.warehouseId || null,
                            quantity: incomingQty,
                            costPrice: batch.cost_price || batch.costPrice || productData.cost_price || 0,
                            batchNumber: batch.batch_number || batch.batchNumber,
                            manufacturingDate: batch.manufacturing_date || batch.manufacturingDate || null,
                            expiryDate: batch.expiry_date || batch.expiryDate || null,
                            notes: batch.notes || 'Opening Balance (Batch)',
                            referenceType: 'adjustment',
                            referenceId: finalProductId
                        }, client);
                    }
                }
            }
        }
        // 3. Handle Serials (Delta Reconciliation)
        else if (serialNumbers && serialNumbers.length > 0) {
            // For serials, "Quantity" is always 1 per serial.
            // We check if the serial exists. If not, add it.
            // If it exists but is 'sold', maybe we don't reactivate it here unless explicitly requested?
            // For now, let's assume this form only sends "Available" serials or new ones.

            // 1. Get existing active serials
            const existingSerialsRes = await client.query(
                `SELECT serial_number FROM product_serials WHERE product_id = $1 AND business_id = $2 AND status = 'available'`,
                [finalProductId, businessId]
            );
            const existingSet = new Set(existingSerialsRes.rows.map(r => r.serial_number));

            for (const serial of serialNumbers) {
                const sn = serial.serial_number || serial.serialNumber;
                if (!existingSet.has(sn)) {
                    // New Serial -> Add Stock (Qty 1)
                    // Insert Serial record first (or let addStock handle it? addStock handles basics, but we might want explicit control)
                    // addStockAction currently has a hacky "serialNumbers" param but it's better to explicitly insert here if possible, 
                    // OR just rely on addStockAction to do it. 
                    // Let's use addStockAction as it handles Ledger + Product Stock update.

                    // Insert Serial record
                    await client.query(`
                        INSERT INTO product_serials (
                            business_id, product_id, serial_number, imei, status, warehouse_id
                        ) VALUES ($1, $2, $3, $4, 'available', $5)
                        ON CONFLICT (business_id, serial_number) DO NOTHING
                    `, [businessId, finalProductId, sn, serial.imei || null, serial.warehouse_id || null]);

                    // Record movement
                    await addStockAction({
                        businessId,
                        productId: finalProductId,
                        warehouseId: serial.warehouse_id || null,
                        quantity: 1,
                        costPrice: productData.cost_price || 0,
                        notes: `Stock Addition (Serial: ${sn})`,
                        referenceType: 'adjustment',
                        referenceId: finalProductId
                    }, client);
                }
            }

            // Detect Deleted Serials? 
            // If a serial was in existingSet but NOT in incoming serialNumbers, it means it was removed from the list.
            // Should we mark it as 'removed'? 
            // For safety, let's strictly handle ADDITIONS for now to avoid accidental bulk deletions.
            // If user wants to delete a serial, they should use a specific "Delete Serial" action or we implement strictly mirroring the list.
            // PROCEEDING WITH ADDITION-ONLY FOR SAFETY as per "Split Brain" fix scope.
        }
        // 4. Handle Simple Stock (Only on Creation)
        else if (initialStock > 0 && !isUpdate) {
            await addStockAction({
                businessId,
                productId: finalProductId,
                warehouseId: null,
                quantity: initialStock,
                costPrice: productData.cost_price || 0,
                notes: 'Opening Balance',
                referenceType: 'adjustment',
                referenceId: finalProductId
            }, client);
        }

        await client.query('COMMIT');

        // Fetch final product state
        const finalRes = await client.query('SELECT * FROM products WHERE id = $1 AND business_id = $2', [finalProductId, businessId]);
        return { success: true, product: finalRes.rows[0] };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Composite Upsert Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

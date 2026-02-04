'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { addStockAction } from './stock';

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

        // 1. Upsert Product
        if (isUpdate && productId) {
            // Update logic
            const fields = Object.keys(productData).filter(f => f !== 'id' && f !== 'business_id');
            const values = fields.map(f => productData[f]);
            const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');

            await client.query(`
                UPDATE products 
                SET ${setClause}, updated_at = NOW() 
                WHERE id = $1 AND business_id = $2
            `, [productId, businessId, ...values]);
        } else {
            // Create logic
            const fields = Object.keys(productData);
            const values = Object.values(productData);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const res = await client.query(`
                INSERT INTO products (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING id
            `, values);
            finalProductId = res.rows[0].id;
        }

        // 2. Handle Batches (Atomic Upsert)
        if (batches && batches.length > 0) {
            for (const batch of batches) {
                const qty = Number(batch.quantity) || 0;
                if (qty <= 0) continue;

                // Call addStockAction which we will update to be transaction-aware and use upserts
                await addStockAction({
                    businessId,
                    productId: finalProductId,
                    warehouseId: batch.warehouse_id || batch.warehouseId || null,
                    quantity: qty,
                    costPrice: batch.cost_price || batch.costPrice || productData.cost_price || 0,
                    batchNumber: batch.batch_number || batch.batchNumber,
                    manufacturingDate: batch.manufacturing_date || batch.manufacturingDate || null,
                    expiryDate: batch.expiry_date || batch.expiryDate || null,
                    notes: batch.notes || 'Opening Balance (Batch)',
                    referenceType: 'adjustment',
                    referenceId: finalProductId
                }, client); // Passing client to share transaction
            }
        }
        // 3. Handle Serials
        else if (serialNumbers && serialNumbers.length > 0) {
            // Simplified Serial handling within transaction
            for (const serial of serialNumbers) {
                // Insert Serial record
                await client.query(`
                    INSERT INTO product_serials (
                        business_id, product_id, serial_number, imei, status, warehouse_id
                    ) VALUES ($1, $2, $3, $4, 'available', $5)
                    ON CONFLICT (business_id, serial_number) DO NOTHING
                `, [businessId, finalProductId, serial.serial_number || serial.serialNumber, serial.imei || null, serial.warehouse_id || null]);

                // Record movement for each serial (quantity 1)
                await addStockAction({
                    businessId,
                    productId: finalProductId,
                    warehouseId: serial.warehouse_id || null,
                    quantity: 1,
                    costPrice: productData.cost_price || 0,
                    notes: `Opening Balance (Serial: ${serial.serial_number || serial.serialNumber})`,
                    referenceType: 'adjustment',
                    referenceId: finalProductId
                }, client);
            }
        }
        // 4. Handle Simple Stock
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
        const finalRes = await client.query('SELECT * FROM products WHERE id = $1', [finalProductId]);
        return { success: true, product: finalRes.rows[0] };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Composite Upsert Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

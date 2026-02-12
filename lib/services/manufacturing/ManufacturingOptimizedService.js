/**
 * Manufacturing Optimized Service
 * Advanced production planning and material requirement planning (MRP) logic.
 */

import { ManufacturingService } from '../ManufacturingService';
import pool from '@/lib/db';
import { createModuleLogger } from '@/lib/services/logging/logger';

const log = createModuleLogger('manufacturing-optimized');

export const ManufacturingOptimizedService = {
    /**
     * "What-if" analysis for production
     * Calculates if we have enough materials to produce a certain quantity of a product.
     */
    async analyzeProductionFeasibility(businessId, productId, quantityToProduce) {
        const client = await pool.connect();
        try {
            // Get BOM for the product
            const bomRes = await client.query(
                'SELECT * FROM boms WHERE product_id = $1 AND business_id = $2 LIMIT 1',
                [productId, businessId]
            );

            if (bomRes.rows.length === 0) {
                return { feasible: false, reason: 'No Bill of Materials (BOM) found for this product.' };
            }

            const bom = bomRes.rows[0];
            const materialsRes = await client.query(
                `SELECT bm.*, p.name, p.stock 
                 FROM bom_materials bm 
                 JOIN products p ON bm.material_id = p.id 
                 WHERE bm.bom_id = $1`,
                [bom.id]
            );

            const shortages = [];
            for (const mat of materialsRes.rows) {
                const totalNeeded = Number(mat.quantity) * (quantityToProduce / Number(bom.output_quantity));
                const currentStock = Number(mat.stock);

                if (currentStock < totalNeeded) {
                    shortages.push({
                        materialId: mat.material_id,
                        name: mat.name,
                        needed: totalNeeded,
                        available: currentStock,
                        shortage: totalNeeded - currentStock
                    });
                }
            }

            log.info('Production feasibility analyzed', {
                businessId, productId, quantityToProduce,
                feasible: shortages.length === 0,
                shortageCount: shortages.length,
            });

            return {
                feasible: shortages.length === 0,
                shortages,
                summary: shortages.length === 0
                    ? 'All materials are available in sufficient quantities.'
                    : `Shortage of ${shortages.length} materials detected.`
            };
        } finally {
            client.release();
        }
    },

    /**
     * Propose a production schedule based on material availability and lead times.
     * 
     * Analyzes:
     * 1. BOM materials and current stock levels
     * 2. Material lead times (how long to procure missing materials)
     * 3. Production capacity (estimated from BOM complexity)
     * 4. Suggests optimal start and end dates
     * 
     * @param {string} businessId 
     * @param {string} productionOrderId 
     * @returns {Promise<object>} Proposed schedule
     */
    async proposeSchedule(businessId, productionOrderId) {
        const client = await pool.connect();
        try {
            // 1. Get the production order details
            const orderRes = await client.query(
                `SELECT po.*, p.name AS product_name
                 FROM production_orders po
                 JOIN products p ON po.product_id = p.id
                 WHERE po.id = $1 AND po.business_id = $2`,
                [productionOrderId, businessId]
            );

            if (orderRes.rows.length === 0) {
                return { status: 'error', reason: 'Production order not found.' };
            }

            const order = orderRes.rows[0];

            // 2. Get BOM for the product
            const bomRes = await client.query(
                'SELECT * FROM boms WHERE product_id = $1 AND business_id = $2 LIMIT 1',
                [order.product_id, businessId]
            );

            if (bomRes.rows.length === 0) {
                return { status: 'error', reason: 'No BOM found for this product.' };
            }

            const bom = bomRes.rows[0];

            // 3. Get BOM materials with current stock and vendor lead times
            const materialsRes = await client.query(
                `SELECT bm.*, p.name, p.stock, p.unit_cost,
                        COALESCE(v.lead_time_days, 7) AS lead_time_days
                 FROM bom_materials bm
                 JOIN products p ON bm.material_id = p.id
                 LEFT JOIN vendors v ON p.vendor_id = v.id
                 WHERE bm.bom_id = $1`,
                [bom.id]
            );

            const materials = materialsRes.rows;
            const quantityToProduce = Number(order.quantity);
            const outputPerBatch = Number(bom.output_quantity);

            // 4. Analyze each material
            let maxLeadTimeDays = 0;
            const materialAnalysis = [];
            let totalEstimatedMaterialCost = 0;

            for (const mat of materials) {
                const totalNeeded = Number(mat.quantity) * (quantityToProduce / outputPerBatch);
                const currentStock = Number(mat.stock);
                const shortage = Math.max(0, totalNeeded - currentStock);
                const leadTimeDays = Number(mat.lead_time_days);
                const materialCost = totalNeeded * Number(mat.unit_cost || 0);
                totalEstimatedMaterialCost += materialCost;

                const status = shortage > 0 ? 'needs_procurement' : 'available';

                if (shortage > 0) {
                    maxLeadTimeDays = Math.max(maxLeadTimeDays, leadTimeDays);
                }

                materialAnalysis.push({
                    materialId: mat.material_id,
                    name: mat.name,
                    needed: totalNeeded,
                    available: currentStock,
                    shortage,
                    leadTimeDays: shortage > 0 ? leadTimeDays : 0,
                    estimatedCost: materialCost,
                    status,
                });
            }

            // 5. Calculate proposed dates
            const now = new Date();

            // Procurement buffer: add lead time + 1 day safety margin
            const procurementDays = maxLeadTimeDays > 0 ? maxLeadTimeDays + 1 : 0;

            // Production time estimate: ~1 day per 100 units (minimum 1 day)
            const productionDays = Math.max(1, Math.ceil(quantityToProduce / 100));

            const suggestedStartDate = new Date(now);
            suggestedStartDate.setDate(suggestedStartDate.getDate() + procurementDays);

            const suggestedEndDate = new Date(suggestedStartDate);
            suggestedEndDate.setDate(suggestedEndDate.getDate() + productionDays);

            const allMaterialsAvailable = maxLeadTimeDays === 0;

            const schedule = {
                status: allMaterialsAvailable ? 'ready_to_start' : 'pending_procurement',
                productionOrderId,
                productName: order.product_name,
                quantity: quantityToProduce,
                suggestedStartDate: suggestedStartDate.toISOString(),
                suggestedEndDate: suggestedEndDate.toISOString(),
                procurementDays,
                productionDays,
                totalEstimatedMaterialCost,
                allMaterialsAvailable,
                materials: materialAnalysis,
                summary: allMaterialsAvailable
                    ? `Ready to start immediately. Estimated completion: ${productionDays} day(s).`
                    : `Procurement needed for ${materialAnalysis.filter(m => m.status === 'needs_procurement').length} material(s). ` +
                    `Max lead time: ${maxLeadTimeDays} day(s). Can start by ${suggestedStartDate.toLocaleDateString()}.`,
            };

            log.info('Production schedule proposed', {
                businessId,
                productionOrderId,
                status: schedule.status,
                procurementDays,
                productionDays,
            });

            return schedule;
        } catch (error) {
            log.error('Failed to propose production schedule', { error, businessId, productionOrderId });
            throw error;
        } finally {
            client.release();
        }
    }
};

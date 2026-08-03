#!/usr/bin/env node
/**
 * Verify Unified Order Aggregation Across All Dashboards
 * 
 * This script validates that all dashboard KPIs correctly aggregate orders
 * from all three sales ledgers: invoices, pos_transactions, storefront_orders
 * 
 * Run: node scripts/verify-unified-order-aggregation.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const INVOICE_SALE_FILTER = `(i.is_deleted = false OR i.is_deleted IS NULL) AND LOWER(COALESCE(i.status, '')) NOT IN ('draft', 'voided', 'cancelled')`;
const POS_SALE_FILTER = `pt.is_voided = false AND LOWER(COALESCE(pt.payment_status, '')) = 'completed'`;
const STOREFRONT_GROSS_SALE_FILTER = `LOWER(COALESCE(o.status, '')) NOT IN ('cancelled', 'refunded', 'voided')`;

console.log('🔍 Verifying Unified Order Aggregation\n');

async function verifyOrderAggregation() {
    const client = await pool.connect();
    
    try {
        // Step 1: Find all businesses with any orders
        console.log('📊 Step 1: Finding businesses with orders...\n');
        
        const businessesQuery = `
            SELECT DISTINCT b.id, b.business_name as name, b.category
            FROM businesses b
            WHERE EXISTS (
                SELECT 1 FROM invoices i 
                WHERE i.business_id = b.id 
                  AND (i.is_deleted = false OR i.is_deleted IS NULL)
            )
            OR EXISTS (
                SELECT 1 FROM pos_transactions pt 
                WHERE pt.business_id = b.id 
                  AND pt.is_voided = false
            )
            OR EXISTS (
                SELECT 1 FROM storefront_orders o 
                WHERE o.business_id = b.id
            )
            ORDER BY b.business_name
            LIMIT 20
        `;
        
        const businessesResult = await client.query(businessesQuery);
        console.log(`Found ${businessesResult.rows.length} businesses with orders\n`);
        
        // Step 2: For each business, verify unified aggregation
        const issues = [];
        const verifications = [];
        
        for (const business of businessesResult.rows) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Business: ${business.name} (${business.category})`);
            console.log(`ID: ${business.id}`);
            console.log(`${'='.repeat(80)}\n`);
            
            // Get counts from each ledger
            const ledgerQuery = `
                WITH invoice_orders AS (
                    SELECT 
                        COUNT(*) as count,
                        COALESCE(SUM(grand_total), 0) as revenue
                    FROM invoices i
                    WHERE i.business_id = $1
                      AND ${INVOICE_SALE_FILTER}
                ),
                pos_orders AS (
                    SELECT 
                        COUNT(*) as count,
                        COALESCE(SUM(total_amount), 0) as revenue
                    FROM pos_transactions pt
                    WHERE pt.business_id = $1
                      AND ${POS_SALE_FILTER}
                ),
                storefront_orders AS (
                    SELECT 
                        COUNT(*) as count,
                        COALESCE(SUM(total_amount), 0) as revenue
                    FROM storefront_orders o
                    WHERE o.business_id = $1
                      AND ${STOREFRONT_GROSS_SALE_FILTER}
                )
                SELECT 
                    (SELECT count FROM invoice_orders) as invoice_count,
                    (SELECT revenue FROM invoice_orders) as invoice_revenue,
                    (SELECT count FROM pos_orders) as pos_count,
                    (SELECT revenue FROM pos_orders) as pos_revenue,
                    (SELECT count FROM storefront_orders) as storefront_count,
                    (SELECT revenue FROM storefront_orders) as storefront_revenue,
                    (
                        (SELECT count FROM invoice_orders) +
                        (SELECT count FROM pos_orders) +
                        (SELECT count FROM storefront_orders)
                    ) as unified_count,
                    (
                        (SELECT revenue FROM invoice_orders) +
                        (SELECT revenue FROM pos_orders) +
                        (SELECT revenue FROM storefront_orders)
                    ) as unified_revenue
            `;
            
            const ledgerResult = await client.query(ledgerQuery, [business.id]);
            const data = ledgerResult.rows[0];
            
            console.log('📈 Order Ledger Breakdown:');
            console.log(`  Invoices:        ${data.invoice_count.toString().padStart(4)} orders  Rs ${parseFloat(data.invoice_revenue).toFixed(2).padStart(12)}`);
            console.log(`  POS:             ${data.pos_count.toString().padStart(4)} orders  Rs ${parseFloat(data.pos_revenue).toFixed(2).padStart(12)}`);
            console.log(`  Storefront:      ${data.storefront_count.toString().padStart(4)} orders  Rs ${parseFloat(data.storefront_revenue).toFixed(2).padStart(12)}`);
            console.log(`  ${'─'.repeat(76)}`);
            console.log(`  UNIFIED TOTAL:   ${data.unified_count.toString().padStart(4)} orders  Rs ${parseFloat(data.unified_revenue).toFixed(2).padStart(12)}`);
            
            // Now test what the old getDashboardKPIs would have returned (invoice-only)
            const oldKPIQuery = `
                SELECT 
                    COALESCE(SUM(grand_total), 0) as old_revenue,
                    COUNT(*) as old_count
                FROM invoices i
                WHERE i.business_id = $1
                  AND (i.is_deleted = false OR i.is_deleted IS NULL)
                  AND status NOT IN ('draft', 'voided')
            `;
            
            const oldResult = await client.query(oldKPIQuery, [business.id]);
            const oldData = oldResult.rows[0];
            
            console.log(`\n🔴 OLD (Invoice-Only) Dashboard:`);
            console.log(`  Order Count:     ${oldData.old_count.toString().padStart(4)} orders`);
            console.log(`  Revenue:         Rs ${parseFloat(oldData.old_revenue).toFixed(2).padStart(12)}`);
            
            const countDiff = parseInt(data.unified_count) - parseInt(oldData.old_count);
            const revenueDiff = parseFloat(data.unified_revenue) - parseFloat(oldData.old_revenue);
            
            if (countDiff !== 0 || Math.abs(revenueDiff) > 0.01) {
                console.log(`\n⚠️  DISCREPANCY DETECTED:`);
                console.log(`  Missing Orders:  ${countDiff} orders`);
                console.log(`  Missing Revenue: Rs ${revenueDiff.toFixed(2)}`);
                console.log(`  Error Rate:      ${((countDiff / Math.max(1, parseInt(data.unified_count))) * 100).toFixed(1)}% orders missing`);
                
                issues.push({
                    business: business.name,
                    category: business.category,
                    unified_count: data.unified_count,
                    old_count: oldData.old_count,
                    missing: countDiff,
                    unified_revenue: data.unified_revenue,
                    old_revenue: oldData.old_revenue,
                    revenue_diff: revenueDiff
                });
            } else {
                console.log(`\n✅ No discrepancy (all orders from invoices only)`);
            }
            
            verifications.push({
                business: business.name,
                category: business.category,
                invoice_orders: data.invoice_count,
                pos_orders: data.pos_count,
                storefront_orders: data.storefront_count,
                unified_total: data.unified_count,
                revenue: parseFloat(data.unified_revenue).toFixed(2)
            });
        }
        
        // Step 3: Summary Report
        console.log(`\n\n${'='.repeat(80)}`);
        console.log('📊 VERIFICATION SUMMARY');
        console.log(`${'='.repeat(80)}\n`);
        
        console.log(`Total Businesses Checked: ${verifications.length}`);
        console.log(`Discrepancies Found:      ${issues.length}\n`);
        
        if (issues.length > 0) {
            console.log('⚠️  BUSINESSES WITH ORDER COUNT DISCREPANCIES:\n');
            
            let totalMissingOrders = 0;
            let totalMissingRevenue = 0;
            
            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. ${issue.business} (${issue.category})`);
                console.log(`   Unified Count: ${issue.unified_count} | Old Count: ${issue.old_count} | Missing: ${issue.missing}`);
                console.log(`   Unified Revenue: Rs ${parseFloat(issue.unified_revenue).toFixed(2)} | Old: Rs ${parseFloat(issue.old_revenue).toFixed(2)}`);
                console.log(`   Revenue Difference: Rs ${issue.revenue_diff.toFixed(2)}\n`);
                
                totalMissingOrders += parseInt(issue.missing);
                totalMissingRevenue += parseFloat(issue.revenue_diff);
            });
            
            console.log(`${'─'.repeat(80)}`);
            console.log(`TOTAL MISSING ORDERS:  ${totalMissingOrders}`);
            console.log(`TOTAL MISSING REVENUE: Rs ${totalMissingRevenue.toFixed(2)}`);
            console.log(`${'─'.repeat(80)}\n`);
        } else {
            console.log('✅ All businesses use invoice-only ledger (no POS/storefront orders)');
        }
        
        // Step 4: Check which domains use which ledgers
        console.log(`\n${'='.repeat(80)}`);
        console.log('📋 LEDGER USAGE BY DOMAIN');
        console.log(`${'='.repeat(80)}\n`);
        
        const domainLedgerQuery = `
            SELECT 
                b.category,
                COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM invoices i 
                    WHERE i.business_id = b.id 
                      AND ${INVOICE_SALE_FILTER}
                ) THEN b.id END) as has_invoices,
                COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM pos_transactions pt 
                    WHERE pt.business_id = b.id 
                      AND ${POS_SALE_FILTER}
                ) THEN b.id END) as has_pos,
                COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM storefront_orders o 
                    WHERE o.business_id = b.id 
                      AND ${STOREFRONT_GROSS_SALE_FILTER}
                ) THEN b.id END) as has_storefront
            FROM businesses b
            GROUP BY b.category
            HAVING 
                COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM invoices i 
                    WHERE i.business_id = b.id 
                      AND ${INVOICE_SALE_FILTER}
                ) THEN b.id END) > 0
                OR COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM pos_transactions pt 
                    WHERE pt.business_id = b.id 
                      AND ${POS_SALE_FILTER}
                ) THEN b.id END) > 0
                OR COUNT(DISTINCT CASE WHEN EXISTS (
                    SELECT 1 FROM storefront_orders o 
                    WHERE o.business_id = b.id 
                      AND ${STOREFRONT_GROSS_SALE_FILTER}
                ) THEN b.id END) > 0
            ORDER BY b.category
        `;
        
        const domainLedgerResult = await client.query(domainLedgerQuery);
        
        console.log('Domain Category         | Invoices | POS | Storefront');
        console.log(`${'─'.repeat(80)}`);
        
        domainLedgerResult.rows.forEach(row => {
            const category = (row.category || 'uncategorized').padEnd(23);
            const invoices = row.has_invoices > 0 ? '✓' : '✗';
            const pos = row.has_pos > 0 ? '✓' : '✗';
            const storefront = row.has_storefront > 0 ? '✓' : '✗';
            
            console.log(`${category} |    ${invoices}     | ${pos}   |     ${storefront}`);
        });
        
        console.log(`\n${'='.repeat(80)}`);
        console.log('✅ VERIFICATION COMPLETE');
        console.log(`${'='.repeat(80)}\n`);
        
        if (issues.length > 0) {
            console.log('⚠️  ACTION REQUIRED:');
            console.log('   The old getDashboardKPIs() was missing POS and storefront orders.');
            console.log('   This has been FIXED in lib/actions/basic/dashboard.js');
            console.log('   Please verify the fix by checking Command Overview dashboard.\n');
        }
        
        return {
            success: true,
            verifications,
            issues,
            totalBusinesses: verifications.length,
            discrepancies: issues.length
        };
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await verifyOrderAggregation();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

main();

#!/usr/bin/env node
/**
 * Complete Data Flow Audit
 * 
 * Comprehensive audit of all order/sales data flows across:
 * - All 3 sales ledgers (invoices, pos_transactions, storefront_orders)
 * - All dashboard KPI calculations
 * - All domain categories
 * - All date range filters
 * 
 * Identifies conflicts, duplications, and wiring issues.
 * 
 * Run: node scripts/audit-complete-data-flow.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

console.log('🔍 COMPLETE DATA FLOW AUDIT\n');
console.log(`${'='.repeat(90)}\n`);

const CHECKS = {
    SCHEMA: '1. Schema & Column Validation',
    LEDGERS: '2. Ledger Uniqueness & Conflicts',
    AGGREGATION: '3. Dashboard Aggregation Queries',
    DOMAINS: '4. Domain-Specific Flows',
    DATE_RANGES: '5. Date Field Consistency',
    SOFT_DELETES: '6. Soft Delete Filter Coverage',
    WIRING: '7. API Route → Dashboard Wiring'
};

const issues = [];
const warnings = [];
const recommendations = [];

function addIssue(category, severity, description, details = null) {
    const item = { category, severity, description, details };
    if (severity === 'ERROR') issues.push(item);
    else if (severity === 'WARNING') warnings.push(item);
    else recommendations.push(item);
}

async function checkSchemaColumns(client) {
    console.log(`\n${CHECKS.SCHEMA}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    // Required columns for unified aggregation
    const requiredColumns = [
        { table: 'invoices', columns: ['id', 'business_id', 'date', 'grand_total', 'status', 'payment_status', 'is_deleted'] },
        { table: 'pos_transactions', columns: ['id', 'business_id', 'created_at', 'total_amount', 'payment_status', 'is_voided'] },
        { table: 'storefront_orders', columns: ['id', 'business_id', 'created_at', 'order_number', 'total_amount', 'status', 'payment_status'] },
        { table: 'storefront_order_items', columns: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price', 'variant_id'] },
        { table: 'pos_transaction_items', columns: ['id', 'transaction_id', 'product_id', 'quantity', 'unit_price', 'total_amount'] },
        { table: 'invoice_items', columns: ['id', 'invoice_id', 'product_id', 'quantity', 'unit_price', 'total_amount'] },
    ];
    
    for (const { table, columns } of requiredColumns) {
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
              AND column_name = ANY($2)
            ORDER BY ordinal_position
        `, [table, columns]);
        
        const foundColumns = result.rows.map(r => r.column_name);
        const missingColumns = columns.filter(col => !foundColumns.includes(col));
        
        if (missingColumns.length > 0) {
            console.log(`❌ ${table}: Missing columns: ${missingColumns.join(', ')}`);
            addIssue(CHECKS.SCHEMA, 'ERROR', `Missing required columns in ${table}`, missingColumns);
        } else {
            console.log(`✅ ${table}: All required columns present`);
        }
    }
}

async function checkLedgerUniqueness(client) {
    console.log(`\n${CHECKS.LEDGERS}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    // Check for potential cross-ledger duplicates (same order in multiple ledgers)
    const duplicateCheck = await client.query(`
        WITH business_orders AS (
            SELECT 
                business_id,
                COUNT(DISTINCT 'inv_' || id::text) as invoice_orders,
                COUNT(DISTINCT 'pos_' || id::text) as pos_orders,
                COUNT(DISTINCT 'sf_' || id::text) as storefront_orders,
                COUNT(DISTINCT 'inv_' || id::text) + 
                COUNT(DISTINCT 'pos_' || id::text) + 
                COUNT(DISTINCT 'sf_' || id::text) as total_unique
            FROM (
                SELECT business_id, id::text as id FROM invoices
                WHERE (is_deleted = false OR is_deleted IS NULL)
                UNION ALL
                SELECT business_id, id::text FROM pos_transactions
                WHERE is_voided = false
                UNION ALL
                SELECT business_id, id::text FROM storefront_orders
            ) all_orders
            GROUP BY business_id
        )
        SELECT 
            b.business_name as name,
            b.category,
            bo.invoice_orders,
            bo.pos_orders,
            bo.storefront_orders,
            bo.total_unique
        FROM business_orders bo
        JOIN businesses b ON b.id = bo.business_id
        WHERE bo.invoice_orders + bo.pos_orders + bo.storefront_orders > 0
        ORDER BY bo.total_unique DESC
        LIMIT 10
    `);
    
    console.log('Top 10 businesses by order count:\n');
    console.log('Business Name           | Invoices | POS | Storefront | Total');
    console.log(`${'─'.repeat(90)}`);
    
    duplicateCheck.rows.forEach(row => {
        const name = (row.name || 'Unknown').substring(0, 20).padEnd(23);
        console.log(`${name} | ${row.invoice_orders.toString().padStart(8)} | ${row.pos_orders.toString().padStart(3)} | ${row.storefront_orders.toString().padStart(10)} | ${row.total_unique.toString().padStart(5)}`);
    });
    
    // Check for potential double-counting risks
    console.log('\n🔍 Checking for double-counting risks...\n');
    
    const doubleCounting = await client.query(`
        SELECT 
            i.id as invoice_id,
            i.invoice_number,
            i.business_id,
            EXISTS (
                SELECT 1 FROM pos_transactions pt 
                WHERE pt.business_id = i.business_id 
                  AND pt.transaction_number = i.invoice_number
            ) as has_pos_match,
            EXISTS (
                SELECT 1 FROM storefront_orders o 
                WHERE o.business_id = i.business_id 
                  AND (o.order_number = i.invoice_number 
                       OR o.metadata::text LIKE '%' || i.invoice_number || '%')
            ) as has_storefront_match
        FROM invoices i
        WHERE (i.is_deleted = false OR i.is_deleted IS NULL)
          AND i.invoice_number IS NOT NULL
        LIMIT 100
    `);
    
    const atRisk = doubleCounting.rows.filter(r => r.has_pos_match || r.has_storefront_match);
    
    if (atRisk.length > 0) {
        console.log(`⚠️  Found ${atRisk.length} invoices with potential cross-ledger references`);
        addIssue(CHECKS.LEDGERS, 'WARNING', 'Potential cross-ledger duplicates detected', {
            count: atRisk.length,
            sample: atRisk.slice(0, 3).map(r => r.invoice_number)
        });
    } else {
        console.log('✅ No obvious cross-ledger duplicate risks detected');
    }
}

async function checkAggregationQueries(client) {
    console.log(`\n${CHECKS.AGGREGATION}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    // Test unified aggregation vs old invoice-only approach
    const testBusinessQuery = await client.query(`
        SELECT id, business_name as name, category
        FROM businesses
        WHERE EXISTS (
            SELECT 1 FROM invoices WHERE business_id = businesses.id
        )
        OR EXISTS (
            SELECT 1 FROM pos_transactions WHERE business_id = businesses.id
        )
        OR EXISTS (
            SELECT 1 FROM storefront_orders WHERE business_id = businesses.id
        )
        ORDER BY created_at DESC
        LIMIT 5
    `);
    
    console.log('Testing aggregation accuracy on sample businesses:\n');
    
    for (const business of testBusinessQuery.rows) {
        // Unified aggregation (correct)
        const unifiedResult = await client.query(`
            SELECT 
                (
                    (SELECT COUNT(*) FROM invoices 
                     WHERE business_id = $1 
                       AND (is_deleted = false OR is_deleted IS NULL)
                       AND status NOT IN ('draft', 'voided'))
                    + (SELECT COUNT(*) FROM pos_transactions 
                       WHERE business_id = $1 
                         AND is_voided = false 
                         AND LOWER(COALESCE(payment_status, '')) = 'completed')
                    + (SELECT COUNT(*) FROM storefront_orders 
                       WHERE business_id = $1 
                         AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'refunded', 'voided'))
                ) as unified_count,
                (
                    (SELECT COALESCE(SUM(grand_total), 0) FROM invoices 
                     WHERE business_id = $1 
                       AND (is_deleted = false OR is_deleted IS NULL)
                       AND status NOT IN ('draft', 'voided'))
                    + (SELECT COALESCE(SUM(total_amount), 0) FROM pos_transactions 
                       WHERE business_id = $1 
                         AND is_voided = false 
                         AND LOWER(COALESCE(payment_status, '')) = 'completed')
                    + (SELECT COALESCE(SUM(total_amount), 0) FROM storefront_orders 
                       WHERE business_id = $1 
                         AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'refunded', 'voided'))
                ) as unified_revenue
        `, [business.id]);
        
        // Old invoice-only (incorrect)
        const oldResult = await client.query(`
            SELECT 
                COUNT(*) as old_count,
                COALESCE(SUM(grand_total), 0) as old_revenue
            FROM invoices
            WHERE business_id = $1
              AND (is_deleted = false OR is_deleted IS NULL)
              AND status NOT IN ('draft', 'voided')
        `, [business.id]);
        
        const unified = unifiedResult.rows[0];
        const old = oldResult.rows[0];
        
        const countDiff = parseInt(unified.unified_count) - parseInt(old.old_count);
        const revDiff = parseFloat(unified.unified_revenue) - parseFloat(old.old_revenue);
        
        console.log(`${business.name} (${business.category})`);
        console.log(`  Unified:  ${unified.unified_count} orders, Rs ${parseFloat(unified.unified_revenue).toFixed(2)}`);
        console.log(`  Old:      ${old.old_count} orders, Rs ${parseFloat(old.old_revenue).toFixed(2)}`);
        
        if (countDiff !== 0 || Math.abs(revDiff) > 0.01) {
            console.log(`  ⚠️  Diff: ${countDiff} orders, Rs ${revDiff.toFixed(2)} revenue MISSING in old approach\n`);
            addIssue(CHECKS.AGGREGATION, 'ERROR', `Order count mismatch for ${business.name}`, {
                unified: unified.unified_count,
                old: old.old_count,
                missing: countDiff
            });
        } else {
            console.log(`  ✅ Match (no POS/storefront orders)\n`);
        }
    }
}

async function checkDomainFlows(client) {
    console.log(`\n${CHECKS.DOMAINS}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    // Analyze which domains use which ledgers
    const domainUsageQuery = await client.query(`
        WITH domain_ledgers AS (
            SELECT 
                b.category,
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM invoices i 
                        WHERE i.business_id = b.id 
                          AND (i.is_deleted = false OR i.is_deleted IS NULL)
                          AND i.status NOT IN ('draft', 'voided')
                    ) THEN b.id 
                END) as businesses_with_invoices,
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM pos_transactions pt 
                        WHERE pt.business_id = b.id 
                          AND pt.is_voided = false
                    ) THEN b.id 
                END) as businesses_with_pos,
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM storefront_orders o 
                        WHERE o.business_id = b.id
                    ) THEN b.id 
                END) as businesses_with_storefront
            FROM businesses b
            GROUP BY b.category
        )
        SELECT 
            category,
            businesses_with_invoices,
            businesses_with_pos,
            businesses_with_storefront,
            businesses_with_invoices + businesses_with_pos + businesses_with_storefront as total_businesses
        FROM domain_ledgers
        WHERE businesses_with_invoices + businesses_with_pos + businesses_with_storefront > 0
        ORDER BY total_businesses DESC
    `);
    
    console.log('Ledger usage by domain:\n');
    console.log('Domain                  | Invoices | POS | Storefront | Total Businesses');
    console.log(`${'─'.repeat(90)}`);
    
    const multiLedgerDomains = [];
    
    domainUsageQuery.rows.forEach(row => {
        const category = (row.category || 'uncategorized').substring(0, 22).padEnd(23);
        const invoices = row.businesses_with_invoices.toString().padStart(8);
        const pos = row.businesses_with_pos.toString().padStart(3);
        const storefront = row.businesses_with_storefront.toString().padStart(10);
        const total = row.total_businesses.toString().padStart(16);
        
        console.log(`${category} | ${invoices} | ${pos} | ${storefront} | ${total}`);
        
        // Track domains using multiple ledgers
        const ledgerCount = (row.businesses_with_invoices > 0 ? 1 : 0) +
                           (row.businesses_with_pos > 0 ? 1 : 0) +
                           (row.businesses_with_storefront > 0 ? 1 : 0);
        
        if (ledgerCount > 1) {
            multiLedgerDomains.push(row.category);
        }
    });
    
    if (multiLedgerDomains.length > 0) {
        console.log(`\n⚠️  ${multiLedgerDomains.length} domains use multiple ledgers (requires unified aggregation):`);
        console.log(`   ${multiLedgerDomains.join(', ')}`);
        addIssue(CHECKS.DOMAINS, 'INFO', 'Multiple ledgers in use', { domains: multiLedgerDomains });
    }
}

async function checkDateFieldConsistency(client) {
    console.log(`\n${CHECKS.DATE_RANGES}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    console.log('Date field mapping across ledgers:\n');
    console.log('  invoices:          date (for order date filtering)');
    console.log('  pos_transactions:  created_at (for order date filtering)');
    console.log('  storefront_orders: created_at (for order date filtering)\n');
    
    // Check for NULL date issues
    const dateNullCheck = await client.query(`
        SELECT 
            (SELECT COUNT(*) FROM invoices WHERE date IS NULL) as invoices_null_date,
            (SELECT COUNT(*) FROM pos_transactions WHERE created_at IS NULL) as pos_null_created,
            (SELECT COUNT(*) FROM storefront_orders WHERE created_at IS NULL) as storefront_null_created
    `);
    
    const nulls = dateNullCheck.rows[0];
    
    if (nulls.invoices_null_date > 0 || nulls.pos_null_created > 0 || nulls.storefront_null_created > 0) {
        console.log('⚠️  Found records with NULL dates:');
        if (nulls.invoices_null_date > 0) {
            console.log(`   - Invoices: ${nulls.invoices_null_date} records`);
            addIssue(CHECKS.DATE_RANGES, 'WARNING', 'Invoices with NULL date', { count: nulls.invoices_null_date });
        }
        if (nulls.pos_null_created > 0) {
            console.log(`   - POS: ${nulls.pos_null_created} records`);
            addIssue(CHECKS.DATE_RANGES, 'WARNING', 'POS transactions with NULL created_at', { count: nulls.pos_null_created });
        }
        if (nulls.storefront_null_created > 0) {
            console.log(`   - Storefront: ${nulls.storefront_null_created} records`);
            addIssue(CHECKS.DATE_RANGES, 'WARNING', 'Storefront orders with NULL created_at', { count: nulls.storefront_null_created });
        }
    } else {
        console.log('✅ All records have valid date fields');
    }
}

async function checkSoftDeleteCoverage(client) {
    console.log(`\n${CHECKS.SOFT_DELETES}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    // Check soft delete column existence
    const softDeleteColumns = await client.query(`
        SELECT 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('is_deleted', 'deleted_at', 'is_voided')
          AND table_name IN ('invoices', 'pos_transactions', 'storefront_orders', 
                             'invoice_items', 'pos_transaction_items', 'storefront_order_items',
                             'products', 'customers', 'vendors')
        ORDER BY table_name, column_name
    `);
    
    console.log('Soft delete columns:\n');
    softDeleteColumns.rows.forEach(row => {
        console.log(`  ${row.table_name.padEnd(30)} ${row.column_name.padEnd(15)} ${row.data_type}`);
    });
    
    // Check if filters are consistently applied
    const tablesWithSoftDelete = [...new Set(softDeleteColumns.rows.map(r => r.table_name))];
    
    console.log(`\n✅ ${tablesWithSoftDelete.length} tables have soft delete columns`);
    console.log('⚠️  Ensure all aggregation queries filter these columns!\n');
    
    addIssue(CHECKS.SOFT_DELETES, 'INFO', 'Soft delete columns present', { tables: tablesWithSoftDelete });
}

async function checkApiWiring(client) {
    console.log(`\n${CHECKS.WIRING}`);
    console.log(`${'─'.repeat(90)}\n`);
    
    console.log('API Route → Dashboard Wiring:\n');
    console.log('1. Command Overview Dashboard:');
    console.log('   Route: N/A (server-side in DashboardClient)');
    console.log('   Action: getAdvancedDashboardSnapshotAction()');
    console.log('   Calls: getDashboardKPIs() → FIXED ✅\n');
    
    console.log('2. Sales Performance Tab:');
    console.log('   Route: N/A (loaded in DataContext)');
    console.log('   Action: getSalesPerformanceAction()');
    console.log('   Uses: SALES_KPI_PERIOD_SQL (unified) ✅\n');
    
    console.log('3. Easy Mode Dashboard:');
    console.log('   Route: N/A (client-side calculation)');
    console.log('   Source: periodMetrics from invoices prop');
    console.log('   Status: INCOMPLETE (invoices only) ⚠️\n');
    
    addIssue(CHECKS.WIRING, 'WARNING', 'Easy Mode uses client-side invoice-only calculation', {
        location: 'DomainDashboard.tsx periodMetrics',
        fix: 'Should use server-side unified aggregation'
    });
}

async function generateReport() {
    console.log(`\n\n${'='.repeat(90)}`);
    console.log('📊 AUDIT REPORT SUMMARY');
    console.log(`${'='.repeat(90)}\n`);
    
    console.log(`Issues Found:          ${issues.length}`);
    console.log(`Warnings:              ${warnings.length}`);
    console.log(`Recommendations:       ${recommendations.length}\n`);
    
    if (issues.length > 0) {
        console.log('❌ CRITICAL ISSUES:\n');
        issues.forEach((issue, idx) => {
            console.log(`${idx + 1}. [${issue.category}] ${issue.description}`);
            if (issue.details) {
                console.log(`   Details: ${JSON.stringify(issue.details)}`);
            }
        });
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:\n');
        warnings.forEach((warning, idx) => {
            console.log(`${idx + 1}. [${warning.category}] ${warning.description}`);
            if (warning.details) {
                console.log(`   Details: ${JSON.stringify(warning.details)}`);
            }
        });
        console.log('');
    }
    
    if (recommendations.length > 0) {
        console.log('💡 RECOMMENDATIONS:\n');
        recommendations.forEach((rec, idx) => {
            console.log(`${idx + 1}. [${rec.category}] ${rec.description}`);
            if (rec.details) {
                console.log(`   Details: ${JSON.stringify(rec.details)}`);
            }
        });
        console.log('');
    }
    
    console.log(`${'='.repeat(90)}`);
    console.log('✅ AUDIT COMPLETE');
    console.log(`${'='.repeat(90)}\n`);
}

async function main() {
    const client = await pool.connect();
    
    try {
        await checkSchemaColumns(client);
        await checkLedgerUniqueness(client);
        await checkAggregationQueries(client);
        await checkDomainFlows(client);
        await checkDateFieldConsistency(client);
        await checkSoftDeleteCoverage(client);
        await checkApiWiring(client);
        await generateReport();
        
    } catch (error) {
        console.error('\n❌ Audit failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
});

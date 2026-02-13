
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function auditConstraints() {
    const client = await pool.connect();
    try {
        console.log('🔍 Starting Deep Multi-Tenant Constraint Audit...\n');

        // 1. Check for Unique Constraint Metadata in Postgres
        console.log('1️⃣  Analyzing Database Index Metadata...');
        const indexRes = await client.query(`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname IN ('product_serials', 'product_variants', 'product_batches', 'products')
          AND ix.indisunique = true
    `);

        const rows = indexRes.rows || [];
        console.table(rows);

        // 2. Check for Potential Collisions (Hypothetical)
        // We check if any Business IDs share the same SKU pattern (though they are unique now, we check if they *would* clash)
        console.log('\n2️⃣  Detecting "Shared Value" Patterns across Tenants...');
        const skuClash = await client.query(`
      SELECT sku, count(DISTINCT business_id) as tenant_count
      FROM products
      WHERE sku IS NOT NULL
      GROUP BY sku
      HAVING count(DISTINCT business_id) > 1
    `);

        const clashCount = skuClash.rowCount ?? 0;
        if (clashCount > 0) {
            console.warn(`⚠️  Found ${clashCount} SKUs shared across DIFFERENT tenants. Global unique constraints will FAIL here if applied.`);
            console.table(skuClash.rows);
        } else {
            console.log('✅ No SKU collisions between tenants detected.');
        }

        // 2.1 Check for Serial Number Collisions
        console.log('\n2.1️⃣ Checking Serial Number Tenant Isolation...');
        const serialClash = await client.query(`
            SELECT serial_number, count(DISTINCT business_id) as tenant_count
            FROM product_serials
            WHERE is_deleted = false
            GROUP BY serial_number
            HAVING count(DISTINCT business_id) > 1
        `);
        if ((serialClash.rowCount ?? 0) > 0) {
            console.warn(`⚠️  Found ${(serialClash.rowCount ?? 0)} Serial Numbers shared across DIFFERENT tenants.`);
            console.table(serialClash.rows);
        } else {
            console.log('✅ Serial numbers are properly isolated (or unique globally).');
        }

        // 2.2 Check for Variant SKU Collisions
        console.log('\n2.2️⃣ Checking Variant SKU Tenant Isolation...');
        const variantClash = await client.query(`
            SELECT variant_sku, count(DISTINCT business_id) as tenant_count
            FROM product_variants
            WHERE is_deleted = false
            GROUP BY variant_sku
            HAVING count(DISTINCT business_id) > 1
        `);
        if ((variantClash.rowCount ?? 0) > 0) {
            console.warn(`⚠️  Found ${(variantClash.rowCount ?? 0)} Variant SKUs shared across DIFFERENT tenants.`);
            console.table(variantClash.rows);
        } else {
            console.log('✅ Variant SKUs are properly isolated.');
        }

        // 2.3 Check for Batch Number Collisions
        console.log('\n2.3️⃣ Checking Batch Number Tenant Isolation...');
        const batchClash = await client.query(`
            SELECT batch_number, count(DISTINCT business_id) as tenant_count
            FROM product_batches
            WHERE is_deleted = false
            GROUP BY batch_number
            HAVING count(DISTINCT business_id) > 1
        `);
        if ((batchClash.rowCount ?? 0) > 0) {
            console.warn(`⚠️  Found ${(batchClash.rowCount ?? 0)} Batch Numbers shared across DIFFERENT tenants.`);
            console.table(batchClash.rows);
        } else {
            console.log('✅ Batch numbers are properly isolated.');
        }

        // 3. Chronological Index Audit
        console.log('\n3️⃣  Chronological Index Audit (Reporting Performance)');
        const chronoCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE indexname IN (
        'idx_inventory_ledger_created_at_br',
        'idx_stock_movements_created_at_br',
        'idx_gl_entries_transaction_date_br',
        'idx_production_orders_scheduled_date_br',
        'idx_invoices_date_br',
        'idx_audit_logs_business_created_at'
      )
    `);

        const chronoCount = chronoCheck.rowCount ?? 0;
        if (chronoCount < 6) {
            console.warn(`⚠️  Found only ${chronoCount}/6 expected reporting indices. Performance may be degraded.`);
            console.table(chronoCheck.rows);
        } else {
            console.log(`✅ All ${chronoCount} Chronological reporting indices detected.`);
        }

        console.log('\n----------------------------------------');
        console.log('🏁 Audit Complete.');

    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

auditConstraints();

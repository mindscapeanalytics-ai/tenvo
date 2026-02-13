
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function validateSchemaIntegrity() {
    const client = await pool.connect();
    try {
        console.log('🔍 Starting Schema Integrity Validation...\n');

        // 1. Check Legacy JSON Columns (Should be empty/null/default)
        console.log('1️⃣  Checking for residual data in Legacy JSON columns...');
        const legacyCheck = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE variants IS NOT NULL AND variants::text != '[]' AND variants::text != 'null') as dirty_variants,
        COUNT(*) FILTER (WHERE batches IS NOT NULL AND batches::text != '[]' AND batches::text != 'null') as dirty_batches,
        COUNT(*) FILTER (WHERE serial_numbers IS NOT NULL AND serial_numbers::text != '[]' AND serial_numbers::text != 'null') as dirty_serials,
        COUNT(*) as total_products
      FROM products
    `);

        const { dirty_variants, dirty_batches, dirty_serials } = legacyCheck.rows[0];

        if (parseInt(dirty_variants) > 0) console.error(`❌ Found ${dirty_variants} products with residual VARIANT JSON data!`);
        else console.log('✅ "variants" JSON column is clean.');

        if (parseInt(dirty_batches) > 0) console.error(`❌ Found ${dirty_batches} products with residual BATCH JSON data!`);
        else console.log('✅ "batches" JSON column is clean.');

        if (parseInt(dirty_serials) > 0) console.error(`❌ Found ${dirty_serials} products with residual SERIAL JSON data!`);
        else console.log('✅ "serial_numbers" JSON column is clean.');

        // 2. Check Relational Tables Population
        console.log('\n2️⃣  Checking Relational Table Population...');
        const variantsCount = await client.query('SELECT COUNT(*) FROM product_variants');
        const batchesCount = await client.query('SELECT COUNT(*) FROM product_batches');
        const serialsCount = await client.query('SELECT COUNT(*) FROM product_serials');

        console.log(`📊 Product Variants: ${variantsCount.rows[0].count}`);
        console.log(`📊 Product Batches:  ${batchesCount.rows[0].count}`);
        console.log(`📊 Product Serials:  ${serialsCount.rows[0].count}`);

        if (parseInt(variantsCount.rows[0].count) === 0 && parseInt(dirty_variants) > 0) {
            console.warn('⚠️  Warning: Relational variants table is empty but JSON has data. Migration might have failed?');
        }

        // 3. Check for Orphans
        console.log('\n3️⃣  Checking for Orphaned Records...');
        const orphanedVariants = await client.query(`
      SELECT COUNT(*) FROM product_variants pv 
      LEFT JOIN products p ON pv.product_id = p.id 
      WHERE p.id IS NULL
    `);

        if (parseInt(orphanedVariants.rows[0].count) > 0) {
            console.error(`❌ Found ${orphanedVariants.rows[0].count} orphaned variants!`);
        } else {
            console.log('✅ No orphaned variants found.');
        }

        console.log('\n----------------------------------------');
        console.log('🏁 Validation Complete.');

    } catch (error) {
        console.error('Validation failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

validateSchemaIntegrity();

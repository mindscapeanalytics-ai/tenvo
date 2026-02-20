const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local for local DATABASE_URL
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const client = await pool.connect();

    try {
        console.log('🔄 Running migration 030_add_business_domain_unique.sql...\n');

        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '030_add_business_domain_unique.sql');
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(sql);

        console.log('✅ Migration 030 completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();

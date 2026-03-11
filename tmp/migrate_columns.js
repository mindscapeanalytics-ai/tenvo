const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function migrate() {
    console.log('--- STARTING DB MIGRATION ---');

    const queries = [
        // Customers Table
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'individual';",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;",
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;",

        // Vendors Table
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_person VARCHAR;",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pincode VARCHAR;",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'Pakistan';",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS notes TEXT;",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;",
        "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;"
    ];

    for (const query of queries) {
        try {
            console.log(`Executing: ${query}`);
            await pool.query(query);
            console.log('Success.');
        } catch (err) {
            console.error(`Error executing ${query}:`, err.message);
        }
    }

    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});

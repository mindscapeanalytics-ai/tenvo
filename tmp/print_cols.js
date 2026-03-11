const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function run() {
    const tables = ['customers', 'vendors', 'invoices', 'purchases', 'products'];
    for (const table of tables) {
        console.log(`\n--- ${table.toUpperCase()} COLUMNS IN DB ---`);
        const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY column_name;
    `, [table]);
        res.rows.forEach(r => console.log(r.column_name));
    }
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

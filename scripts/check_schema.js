
const { Pool } = require('pg');

// Create a pool using environment variables
// Assuming connection string is in env or default
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_stock_locations';
    `);
        console.log('Columns in product_stock_locations:');
        res.rows.forEach(row => {
            console.log(`${row.column_name} (${row.data_type})`);
        });
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();

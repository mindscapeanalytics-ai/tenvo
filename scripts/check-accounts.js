const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAccounts() {
    try {
        const res = await pool.query("SELECT id, \"userId\", \"providerId\", \"password\" IS NOT NULL as has_password FROM account LIMIT 10");
        console.log("Accounts found:", res.rows);
    } catch (e) {
        console.error("Check failed:", e.message);
    } finally {
        await pool.end();
    }
}

checkAccounts();

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    try {
        const res = await pool.query("SELECT id, email, name FROM \"user\" LIMIT 10");
        console.log("Users found:", res.rows);
    } catch (e) {
        console.error("Check failed:", e.message);
    } finally {
        await pool.end();
    }
}

checkUsers();

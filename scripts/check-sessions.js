const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSessions() {
    try {
        const res = await pool.query("SELECT * FROM session LIMIT 10");
        console.log("Sessions found:", res.rows);
    } catch (e) {
        console.error("Check failed:", e.message);
    } finally {
        await pool.end();
    }
}

checkSessions();

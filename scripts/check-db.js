const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDb() {
    try {
        console.log("Connecting to:", process.env.DATABASE_URL.split('@')[1]);
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables found:", res.rows.map(r => r.table_name).join(", "));

        const userTable = res.rows.find(r => r.table_name === 'user');
        if (userTable) {
            const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user'");
            console.log("User table columns:", cols.rows.map(r => r.column_name).join(", "));
        } else {
            console.error("CRITICAL: 'user' table NOT found!");
        }
    } catch (e) {
        console.error("Connection failed:", e.message);
    } finally {
        await pool.end();
    }
}

checkDb();

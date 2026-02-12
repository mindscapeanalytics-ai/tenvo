const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check2FA() {
    try {
        const res = await pool.query("SELECT email, \"twoFactorEnabled\" FROM \"user\" WHERE \"twoFactorEnabled\" = true");
        console.log("Users with 2FA enabled:", res.rows);
    } catch (e) {
        console.error("Check failed:", e.message);
    } finally {
        await pool.end();
    }
}

check2FA();

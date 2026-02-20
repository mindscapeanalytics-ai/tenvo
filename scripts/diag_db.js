const { Pool } = require('pg');
const dotenv = require('dotenv');

async function run() {
    dotenv.config({ path: '.env.local' });
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Database Audit ---');

        const uRes = await pool.query('SELECT id, email FROM "user" LIMIT 5');
        console.log('Users found:', uRes.rows.length);
        uRes.rows.forEach(u => console.log(`- ${u.email} (${u.id})`));

        const bRes = await pool.query('SELECT id, user_id, domain, business_name FROM businesses LIMIT 5');
        console.log('Businesses found:', bRes.rows.length);
        bRes.rows.forEach(b => console.log(`- ${b.business_name} [${b.domain}] (Owner ID: ${b.user_id})`));

        const buRes = await pool.query('SELECT count(*) FROM business_users');
        console.log('Business Users count:', buRes.rows[0].count);

        const sRes = await pool.query('SELECT count(*) FROM session');
        console.log('Sessions count:', sRes.rows[0].count);

        if (buRes.rows[0].count === '0' && bRes.rows.length > 0) {
            console.log('\n[ALERT] business_users table is empty but businesses exist. Access is broken.');
        }

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await pool.end();
    }
}

run();

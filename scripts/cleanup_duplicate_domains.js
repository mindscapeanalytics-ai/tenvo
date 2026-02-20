const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function cleanup() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
        console.log('🔍 Identifying duplicate domains...');
        const duplicates = await client.query(`
            SELECT domain, array_agg(id) as ids 
            FROM businesses 
            GROUP BY domain 
            HAVING count(*) > 1
        `);

        if (duplicates.rows.length === 0) {
            console.log('✅ No duplicates found.');
            return;
        }

        console.log(`🛠️ Fixing ${duplicates.rows.length} duplicate domain groups...`);

        for (const row of duplicates.rows) {
            const { domain, ids } = row;
            console.log(`   Processing "${domain}" (${ids.length} copies)...`);

            // Keep the first one as is, suffix the rest
            for (let i = 1; i < ids.length; i++) {
                const id = ids[i];
                const newDomain = `${domain}-${id.substring(0, 4)}`;
                console.log(`      Updating ID ${id} -> ${newDomain}`);
                await client.query('UPDATE businesses SET domain = $1 WHERE id = $2', [newDomain, id]);
            }
        }

        console.log('✅ De-duplication complete.');

    } catch (err) {
        console.error('❌ Cleanup failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanup();

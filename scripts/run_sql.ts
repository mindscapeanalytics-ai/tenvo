import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pool from '../lib/db';

async function run() {
    const filename = process.argv[2];
    if (!filename) {
        console.error('❌ Please provide a SQL filename (e.g., scripts/fix_schema_mismatch.sql)');
        process.exit(1);
    }

    const sqlPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

    if (!fs.existsSync(sqlPath)) {
        console.error('❌ SQL file not found at:', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📝 Loaded SQL from ${filename}`);

    try {
        const client = await pool.connect();
        console.log('🔌 Connected to database.');

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log('✅ SQL executed successfully!');
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error('❌ Error executing SQL:', err.message);
            if (err.detail) console.error('Detail:', err.detail);
            if (err.hint) console.error('Hint:', err.hint);
            if (err.position) console.error('Position:', err.position);
            process.exit(1);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();

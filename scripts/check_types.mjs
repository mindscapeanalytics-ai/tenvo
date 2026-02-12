import 'dotenv/config';
import pool from './lib/db.js';

async function checkUserIdType() {
    const client = await pool.connect();

    try {
        const result = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      AND column_name = 'user_id';
    `);

        console.log('businesses.user_id type:', result.rows[0]);

        // Check auth schema
        const authResult = await client.query(`
      SELECT routine_name, data_type
      FROM information_schema.routines 
      WHERE routine_schema = 'auth' 
      AND routine_name = 'uid';
    `);

        console.log('auth.uid() return type:', authResult.rows[0]);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUserIdType();

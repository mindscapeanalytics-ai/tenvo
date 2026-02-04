
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const client = await pool.connect();
    try {
        await client.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
    `);
        return NextResponse.json({ success: true, message: 'Migration successful' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    } finally {
        client.release();
    }
}

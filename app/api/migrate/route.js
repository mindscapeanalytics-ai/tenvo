
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    const runtimeMigrationEnabled = process.env.ALLOW_RUNTIME_MIGRATION === 'true';
    const maintenanceKey = process.env.MAINTENANCE_API_KEY;
    const providedKey = request.headers.get('x-maintenance-key');

    if (!runtimeMigrationEnabled) {
        return NextResponse.json(
            { success: false, error: 'Runtime migrations are disabled. Use Prisma migrations instead.' },
            { status: 403 }
        );
    }

    if (!maintenanceKey || providedKey !== maintenanceKey) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized maintenance request' },
            { status: 401 }
        );
    }

    const client = await pool.connect();
    try {
        await client.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
    `);
        return NextResponse.json({ success: true, message: 'Migration successful' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

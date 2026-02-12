import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Health Check API Endpoint
 * 
 * Returns system health status including:
 * - Overall status (healthy/degraded/unhealthy)
 * - Database connectivity
 * - Version info
 * - Uptime
 * - Memory usage
 * 
 * GET /api/health
 */

const startTime = Date.now();

export async function GET() {
    const checks = {
        database: { status: 'unknown', latencyMs: 0 },
    };

    // 1. Database health check
    const dbStart = Date.now();
    try {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT 1 AS healthy, NOW() AS server_time');
            checks.database = {
                status: 'healthy',
                latencyMs: Date.now() - dbStart,
                serverTime: res.rows[0].server_time,
            };
        } finally {
            client.release();
        }
    } catch (error) {
        checks.database = {
            status: 'unhealthy',
            latencyMs: Date.now() - dbStart,
            error: error.message,
        };
    }

    // 2. Memory usage
    const memUsage = process.memoryUsage();

    // 3. Determine overall status
    const isHealthy = checks.database.status === 'healthy';

    const healthReport = {
        status: isHealthy ? 'healthy' : 'degraded',
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: {
            seconds: Math.floor((Date.now() - startTime) / 1000),
            human: formatUptime(Date.now() - startTime),
        },
        checks,
        memory: {
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthReport, {
        status: isHealthy ? 200 : 503,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

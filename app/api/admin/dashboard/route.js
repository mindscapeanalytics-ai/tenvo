import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isPlatformLevel } from '@/lib/config/platform';
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/dashboard
 * Returns platform-wide stats for the admin dashboard.
 * Restricted to platform owner and BetterAuth admins.
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || !isPlatformLevel(session.user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            // Parallel queries for stats
            const [businessStats, userStats, planStats, recentBusinesses, recentUsers] = await Promise.all([
                client.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
                        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
                    FROM businesses
                `),
                client.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
                        COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
                    FROM "user"
                `),
                client.query(`
                    SELECT 
                        plan_tier, 
                        COUNT(*) as count,
                        COUNT(CASE WHEN plan_expires_at IS NOT NULL AND plan_expires_at > NOW() THEN 1 END) as active_trials,
                        COUNT(CASE WHEN plan_expires_at IS NOT NULL AND plan_expires_at <= NOW() THEN 1 END) as expired_trials
                    FROM businesses
                    GROUP BY plan_tier
                    ORDER BY count DESC
                `),
                client.query(`
                    SELECT b.id, b.business_name, b.domain, b.plan_tier, b.created_at,
                           u.name as owner_name, u.email as owner_email
                    FROM businesses b
                    LEFT JOIN "user" u ON b.user_id = u.id
                    ORDER BY b.created_at DESC
                    LIMIT 10
                `),
                client.query(`
                    SELECT id, name, email, role as platform_role, "createdAt"
                    FROM "user"
                    ORDER BY "createdAt" DESC
                    LIMIT 10
                `),
            ]);

            return NextResponse.json({
                businesses: businessStats.rows[0],
                users: userStats.rows[0],
                planDistribution: planStats.rows,
                recentBusinesses: recentBusinesses.rows,
                recentUsers: recentUsers.rows,
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Admin API] Dashboard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

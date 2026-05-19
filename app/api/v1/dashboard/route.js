export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDashboardKPIs, getRecentActivity, getSalesTrend, getTopCustomers, getTopProducts } from '@/lib/actions/basic/dashboard';

/**
 * GET /api/v1/dashboard?businessId=xxx&period=month
 * Returns comprehensive dashboard KPIs
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

        const period = searchParams.get('period') || 'month';
        const section = searchParams.get('section') || 'all';

        // Allow fetching specific sections for lazy loading
        switch (section) {
            case 'kpis': {
                const kpis = await getDashboardKPIs(businessId, { period });
                return NextResponse.json(kpis);
            }
            case 'activity': {
                const limit = parseInt(searchParams.get('limit') || '20');
                const activity = await getRecentActivity(businessId, limit);
                return NextResponse.json(activity);
            }
            case 'trend': {
                const days = parseInt(searchParams.get('days') || '30');
                const groupBy = searchParams.get('groupBy') || 'day';
                const trend = await getSalesTrend(businessId, { days, groupBy });
                return NextResponse.json(trend);
            }
            case 'top-customers': {
                const limit = parseInt(searchParams.get('limit') || '10');
                const result = await getTopCustomers(businessId, limit);
                return NextResponse.json(result);
            }
            case 'top-products': {
                const limit = parseInt(searchParams.get('limit') || '10');
                const result = await getTopProducts(businessId, limit);
                return NextResponse.json(result);
            }
            default: {
                // Return all sections for full dashboard load
                const [kpis, activity, trend, topCustomers, topProducts] = await Promise.all([
                    getDashboardKPIs(businessId, { period }),
                    getRecentActivity(businessId, 15),
                    getSalesTrend(businessId, { days: 30, groupBy: 'day' }),
                    getTopCustomers(businessId, 5),
                    getTopProducts(businessId, 5),
                ]);

                return NextResponse.json({
                    success: true,
                    kpis: kpis.data,
                    activity: activity.data?.activities || [],
                    trend: trend.data?.trend || [],
                    topCustomers: topCustomers.data?.customers || [],
                    topProducts: topProducts.data?.products || [],
                });
            }
        }
    } catch (error) {
        console.error('GET /api/v1/dashboard error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


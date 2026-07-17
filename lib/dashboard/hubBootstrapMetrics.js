/**
 * Map advanced dashboard snapshot KPIs into the shape expected by DomainDashboard
 * reminders / period fallbacks — avoids a separate getDashboardMetricsAction on cold load.
 */
export function buildDashboardMetricsFromSnapshot(snapshot) {
    const kpis = snapshot?.kpis;
    if (!kpis) return null;

    const revenue = kpis.revenue || {};
    const orders = kpis.orders || {};
    const receivables = kpis.receivables || {};
    const inventory = kpis.inventory || {};

    return {
        revenue: {
            total: Number(revenue.total || 0),
            orderCount: Number(orders.total ?? revenue.orderCount ?? 0),
        },
        orders: {
            total: Number(orders.total || 0),
            invoices: Number(orders.invoices || 0),
            pos: Number(orders.pos || 0),
            storefront: Number(orders.storefront || 0),
        },
        alerts: {
            lowStock: Number(inventory.lowStockCount || 0),
            overdueInvoices: Number(receivables.overdueCount || 0),
        },
        inventory: {
            activeProducts: Number(inventory.activeProducts || 0),
            lowStockCount: Number(inventory.lowStockCount || 0),
            totalValue: Number(inventory.totalValue || 0),
            totalStockUnits: Number(inventory.totalStockUnits || 0),
        },
    };
}

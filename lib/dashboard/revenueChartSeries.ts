/**
 * Build date-filtered revenue chart series for Advanced dashboard.
 * Monthly GL series (chartSeries) + invoice buckets for daily/weekly within the hub range.
 */

interface InvoiceLike {
    date?: string | Date;
    status?: string;
    grand_total?: number | string;
    amount?: number | string;
}

export type RevenueGranularity = 'daily' | 'weekly' | 'monthly';

function inRange(rawDate: string | Date | undefined, from: Date, to: Date): boolean {
    const parsed = rawDate ? new Date(rawDate) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return false;
    return parsed >= from && parsed <= to;
}

function isBillableInvoice(inv: InvoiceLike): boolean {
    const status = String(inv?.status || '').toLowerCase();
    if (['cancelled', 'draft', 'voided'].includes(status)) return false;
    if (status.includes('return') || status.includes('refund') || status.includes('credit')) return false;
    return true;
}

function invoiceRevenue(inv: InvoiceLike): number {
    return Number(inv?.grand_total) || Number(inv?.amount) || 0;
}

function formatDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function formatWeekKey(date: Date): string {
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(date.getDate() - date.getDay());
    return formatDayKey(weekStart);
}

function formatMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export function buildInvoiceRevenueSeries(
    invoices: InvoiceLike[],
    dateRange: { from: Date; to: Date },
    granularity: RevenueGranularity
): Array<{ date: string; revenue: number; profit: number }> {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const buckets = new Map<string, { date: string; revenue: number; profit: number; sortKey: string }>();

    for (const inv of invoices) {
        if (!isBillableInvoice(inv) || !inRange(inv.date, from, to)) continue;
        const parsed = new Date(inv.date!);
        const sortKey =
            granularity === 'daily'
                ? formatDayKey(parsed)
                : granularity === 'weekly'
                  ? formatWeekKey(parsed)
                  : formatMonthKey(parsed);
        const label =
            granularity === 'monthly'
                ? parsed.toLocaleString('default', { month: 'short' })
                : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const existing = buckets.get(sortKey) ?? { date: label, revenue: 0, profit: 0, sortKey };
        const amount = invoiceRevenue(inv);
        existing.revenue += amount;
        existing.profit += amount;
        buckets.set(sortKey, existing);
    }

    return Array.from(buckets.values())
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ date, revenue, profit }) => ({ date, revenue, profit }));
}

function normalizeGlMonthlySeries(
    chartData: Array<Record<string, unknown>>
): Array<{ date: string; revenue: number; profit: number }> {
    return chartData.map((row) => ({
        date: String(row.date ?? row.name ?? ''),
        revenue: Number(row.revenue) || 0,
        profit: Number(row.profit) ?? (Number(row.revenue) || 0) - (Number(row.expenses) || 0),
    }));
}

function aggregateIsoChartData(
    chartData: Array<Record<string, unknown>>,
    granularity: RevenueGranularity
): Array<{ date: string; revenue: number; profit: number }> {
    if (!chartData.length) return [];

    if (granularity === 'monthly') {
        return normalizeGlMonthlySeries(chartData);
    }

    const buckets = new Map<string, { date: string; revenue: number; profit: number; sortKey: string }>();
    for (const row of chartData) {
        const raw = String(row.date ?? row.name ?? '');
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) continue;
        const sortKey = granularity === 'weekly' ? formatWeekKey(parsed) : formatDayKey(parsed);
        const label = parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const existing = buckets.get(sortKey) ?? { date: label, revenue: 0, profit: 0, sortKey };
        existing.revenue += Number(row.revenue) || 0;
        existing.profit += Number(row.profit) || 0;
        buckets.set(sortKey, existing);
    }
    return Array.from(buckets.values())
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ date, revenue, profit }) => ({ date, revenue, profit }));
}

function hasRevenueSignal(series: Array<{ revenue?: number }>): boolean {
    return series.some((row) => Math.abs(Number(row.revenue) || 0) > 0);
}

function formatWeekKeyFromIso(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return formatWeekKey(parsed);
}

function buildUnifiedDailySeries(
    dailyTrend: Array<{ date: string; revenue: number; profit?: number }>,
    granularity: RevenueGranularity
): Array<{ date: string; revenue: number; profit: number }> {
    if (!dailyTrend.length) return [];

    const buckets = new Map<string, { date: string; revenue: number; profit: number; sortKey: string }>();
    for (const row of dailyTrend) {
        const parsed = new Date(row.date);
        if (Number.isNaN(parsed.getTime())) continue;
        const sortKey =
            granularity === 'weekly' ? formatWeekKeyFromIso(row.date) : formatDayKey(parsed);
        const label = parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const existing = buckets.get(sortKey) ?? { date: label, revenue: 0, profit: 0, sortKey };
        const amount = Number(row.revenue) || 0;
        existing.revenue += amount;
        existing.profit += Number(row.profit) ?? amount;
        buckets.set(sortKey, existing);
    }

    return Array.from(buckets.values())
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ date, revenue, profit }) => ({ date, revenue, profit }));
}

function normalizeMonthlyTrendSeries(
    salesTrend: Array<{ date: string; revenue: number; profit?: number }>
): Array<{ date: string; revenue: number; profit: number }> {
    return salesTrend.map((row) => {
        const revenue = Number(row.revenue) || 0;
        const profitNum = Number(row.profit);
        const profit = Number.isFinite(profitNum) ? profitNum : revenue;
        return { date: row.date, revenue, profit };
    });
}

/** Pick the best revenue series for the active hub date filter + granularity tab. */
export function resolveRevenueChartSeries(
    chartData: Array<Record<string, unknown>>,
    invoices: InvoiceLike[],
    dateRange: { from: Date; to: Date },
    granularity: RevenueGranularity,
    options: {
        dailyRevenueTrend?: Array<{ date: string; revenue: number; profit?: number }>;
        monthlySalesTrend?: Array<{ date: string; revenue: number; profit?: number }>;
    } = {}
): Array<{ date: string; revenue: number; profit: number }> {
    const { dailyRevenueTrend = [], monthlySalesTrend = [] } = options;

    if (granularity === 'monthly' && monthlySalesTrend.length > 0) {
        const unifiedMonthly = normalizeMonthlyTrendSeries(monthlySalesTrend);
        if (hasRevenueSignal(unifiedMonthly)) return unifiedMonthly;
    }

    if ((granularity === 'daily' || granularity === 'weekly') && dailyRevenueTrend.length > 0) {
        const unifiedDaily = buildUnifiedDailySeries(dailyRevenueTrend, granularity);
        if (hasRevenueSignal(unifiedDaily)) return unifiedDaily;
    }

    const invoiceSeries = buildInvoiceRevenueSeries(invoices, dateRange, granularity);

    if (granularity === 'monthly' && chartData.length > 0) {
        const glSeries = normalizeGlMonthlySeries(chartData);
        if (hasRevenueSignal(glSeries)) return glSeries;
    }

    const isoAggregated = aggregateIsoChartData(chartData, granularity);
    if (hasRevenueSignal(isoAggregated)) return isoAggregated;

    if (hasRevenueSignal(invoiceSeries)) return invoiceSeries;

    if (chartData.length > 0) return normalizeGlMonthlySeries(chartData);
    return invoiceSeries;
}

export function defaultRevenueGranularity(dateRange: { from: Date; to: Date }): RevenueGranularity {
    const days = Math.max(
        1,
        Math.ceil(
            (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) /
                (24 * 60 * 60 * 1000)
        )
    );
    if (days <= 14) return 'daily';
    if (days <= 60) return 'weekly';
    return 'monthly';
}

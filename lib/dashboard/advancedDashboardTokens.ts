/** Screenshot-aligned tokens for Advanced hub dashboard (main column only). */

export const ADVANCED_CHART_COLORS = {
    primary: '#3b82f6',
    primaryLight: '#93c5fd',
} as const;

export const ADVANCED_DONUT_COLORS = ['#3b82f6', '#14b8a6', '#f97316', '#8b5cf6', '#94a3b8'] as const;

export const ADVANCED_HEALTH_DIMENSION_COLORS = {
    Finance: 'bg-blue-500',
    Inventory: 'bg-amber-500',
    Operations: 'bg-teal-500',
    Customers: 'bg-rose-500',
    Growth: 'bg-violet-500',
} as const;

export function formatTrendBadge(trend: number, invert = false): string {
    if (!Number.isFinite(trend) || trend === 0) return '0%';
    const positive = invert ? trend < 0 : trend > 0;
    const sign = positive ? '+' : '-';
    return `${sign}${Math.abs(trend).toFixed(0)}%`;
}

export function shouldShowTrendBadge(trend?: number): boolean {
    return trend !== undefined && Number.isFinite(trend) && trend !== 0;
}

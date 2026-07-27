'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HUB_MICRO_LABEL, MARKETING_STAT_VALUE } from '@/lib/utils/typography';
import { BRAND_PRIMARY, CHART_PALETTE } from '@/lib/theme/brandTokens';
import {
  EASY_PRESET_OPTIONS,
  buildTopProductsFromInvoices,
  normalizeExpenseRows,
  normalizeSparklineBars,
} from '@/lib/dashboard/easyDashboardHelpers';
import {
  buildRetailSimpleActions,
  buildRetailSimpleSecondaryActions,
  resolveOnlineOrderCount,
  resolveOnlineSalesAmount,
} from '@/lib/dashboard/retailSimpleActions';
import { buildRetailTopSellingItems, buildRetailPeriodChartRows, resolveRetailKpiValue } from '@/lib/dashboard/retailSimpleSidebar';
import { hubSalesPerformanceQueryKey, sameTenantPlaceholderData } from '@/lib/dashboard/hubQueryKeys';
import { getSalesPerformanceAction } from '@/lib/actions/basic/dashboard';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { MobilePresetPills } from '@/components/mobile/MobileHubPrimitives';
import { RetailTopSellingCard } from '@/components/dashboard/easy/RetailTopSellingCard.client';
import {
  RetailRecentActivityCard,
  mapAuditActivityRows,
  mapSalesActivityRows,
} from '@/components/dashboard/easy/RetailRecentActivityCard.client';
import { AdvancedRemindersCard } from '@/components/dashboard/advanced/AdvancedRemindersCard.client';
import toast from 'react-hot-toast';

export interface RetailSimpleDashboardProps {
  businessId?: string;
  business?: { name?: string } | null;
  category: string;
  domainKnowledge?: Record<string, unknown> | null;
  currency: string;
  periodLabel: string;
  activePreset: string;
  dateRange?: { from: Date; to: Date };
  invoices?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
  activityFeed?: Array<Record<string, unknown>>;
  activityFeedReady?: boolean;
  onQuickAction?: (actionId: string) => void;
  onDateRangePresetChange?: (
    preset: 'today' | '7d' | '30d' | 'mtd' | '90d' | 'last_month' | 'ytd'
  ) => void;
  chartData?: Array<Record<string, unknown>>;
  expenseBreakdown?: Array<Record<string, unknown>>;
  dashboardMetrics?: Record<string, unknown> | null;
  formatCurrencyCompact: (amount: number) => string;
  userName: string;
  periodMetrics: {
    currentRevenue: number;
    currentOrders: number;
    currentExpenses: number;
    soldUnits: number;
  };
  /** Optional override; defaults to hub KPI channel revenue. */
  onlineSalesAmount?: number;
  metricsPending?: boolean;
  isSalesLoading?: boolean;
  isFinanceLoading?: boolean;
  reminders?: { lowStock?: number; overdueInvoices?: number; pendingOrders?: number };
  remindersLoading?: boolean;
  inventoryValue?: number;
  inStockUnits?: number;
  outstandingAmount?: number;
  openInvoicesCount?: number;
  domainEfficiency?: number;
}

type ActionTone = ReturnType<typeof buildRetailSimpleActions>[number];

const PIE_COLORS = [BRAND_PRIMARY, CHART_PALETTE[1], CHART_PALETTE[3], CHART_PALETTE[2], CHART_PALETTE[4]];

function RetailActionTile({
  action,
  onClick,
}: {
  action: ActionTone;
  onClick?: () => void;
}) {
  const Icon = action.icon;
  const locked = action.status === 'locked';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={locked || undefined}
      title={locked ? action.lockReason || 'Not available' : undefined}
      className={cn(
        'group relative flex min-h-[5.25rem] flex-col items-start justify-between gap-2 rounded-2xl p-3.5 text-left shadow-sm transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400',
        locked
          ? 'cursor-not-allowed opacity-90'
          : 'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]',
        action.tile
      )}
    >
      <span
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200',
          !locked && 'group-hover:scale-105',
          action.iconWrap
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight tracking-tight">{action.label}</span>
        <span className="mt-0.5 block text-[11px] font-medium opacity-80">
          {locked ? action.lockReason || 'Upgrade or ask an owner' : action.hint}
        </span>
      </span>
      {locked ? (
        <Lock className="absolute right-3 top-3 h-3.5 w-3.5 opacity-70" aria-hidden />
      ) : (
        <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-80" aria-hidden />
      )}
    </button>
  );
}

function RetailKpiBox({
  label,
  value,
  hint,
  onClick,
  isLoading,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
  isLoading?: boolean;
  accent: string;
}) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm">
        <div className={cn('mb-2 h-1 w-8 rounded-full', accent)} />
        <div className="h-3 w-16 rounded bg-neutral-200" />
        <div className="mt-2 h-6 w-24 rounded bg-neutral-300" />
      </div>
    );
  }

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white p-3.5 text-left shadow-sm transition-colors min-h-[5.5rem]',
        onClick && 'hover:border-neutral-300 hover:bg-neutral-50/80'
      )}
    >
      <div className={cn('mb-2 h-1 w-8 rounded-full', accent)} aria-hidden />
      <p className={HUB_MICRO_LABEL}>{label}</p>
      <p className={cn(MARKETING_STAT_VALUE, 'mt-1 text-lg text-neutral-900')}>{value}</p>
      {hint ? <p className="mt-1 text-[10px] font-medium text-neutral-500">{hint}</p> : null}
    </Tag>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-[11rem] flex-col items-center justify-center gap-1 text-center">
      <TrendingUp className="h-5 w-5 text-neutral-300" aria-hidden />
      <p className="text-xs font-medium text-neutral-500">{label}</p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[11rem] items-end justify-between gap-1.5 px-4 pb-2 animate-pulse" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`chart-skel-${i}`}
          className="w-full max-w-[2rem] rounded-t-md bg-neutral-200"
          style={{ height: `${35 + ((i * 17) % 50)}%` }}
        />
      ))}
    </div>
  );
}

export function RetailSimpleDashboard(props: RetailSimpleDashboardProps) {
  const {
    businessId,
    business,
    category,
    domainKnowledge = null,
    currency,
    periodLabel,
    activePreset,
    dateRange,
    invoices = [],
    products = [],
    activityFeed,
    activityFeedReady = false,
    onQuickAction,
    onDateRangePresetChange,
    chartData = [],
    expenseBreakdown = [],
    dashboardMetrics = null,
    formatCurrencyCompact,
    userName,
    periodMetrics,
    onlineSalesAmount: onlineSalesOverride,
    metricsPending = false,
    isSalesLoading = false,
    isFinanceLoading = false,
    reminders = {},
    remindersLoading = false,
    inventoryValue = 0,
    inStockUnits = 0,
    outstandingAmount = 0,
    openInvoicesCount = 0,
    domainEfficiency = 0,
  } = props;

  const { canNav, planCan } = usePermissions();
  const milkRelevant = isMilkHisabRelevant(category);
  const ordersNav = canNav('orders');
  const canOpenOrders = ordersNav.visible !== false && ordersNav.locked !== true;

  const hasBootstrapKpis = Boolean(
    dashboardMetrics?.revenue != null || dashboardMetrics?.orders != null
  );
  const salesLoading = isSalesLoading && !hasBootstrapKpis;
  const financeLoading = isFinanceLoading && !hasBootstrapKpis;
  const chartsLoading = salesLoading || financeLoading;

  const actions = useMemo(
    () =>
      buildRetailSimpleActions({
        category,
        domainKnowledge: domainKnowledge || undefined,
        canNav,
        planCan,
      }),
    [category, domainKnowledge, canNav, planCan]
  );

  const secondaryActions = useMemo(
    () => buildRetailSimpleSecondaryActions({ category, canNav }),
    [category, canNav]
  );

  const handleAction = (action: ActionTone) => {
    if (action.status === 'locked') {
      toast.error(action.lockReason || 'This action is not available yet');
      return;
    }
    onQuickAction?.(action.id);
  };

  const totalExpense = periodMetrics.currentExpenses;

  const dateFromISO =
    toAnalyticsIsoDate(dateRange?.from) || toAnalyticsIsoDate(new Date()) || '';
  const dateToISO =
    toAnalyticsIsoDate(dateRange?.to) || toAnalyticsIsoDate(new Date()) || '';

  const salesPerfQuery = useQuery({
    queryKey: hubSalesPerformanceQueryKey(businessId ?? '', dateFromISO, dateToISO, 'all', null),
    queryFn: async () => {
      if (!businessId || !dateFromISO || !dateToISO) return null;
      const res = await getSalesPerformanceAction(businessId, {
        from: dateFromISO,
        to: dateToISO,
        channel: 'all',
        category: null,
        topLimit: 50,
      });
      const payload = res as unknown as {
        success?: boolean;
        topProducts?: Array<Record<string, unknown>>;
        recentActivity?: Array<Record<string, unknown>>;
        salesTrend?: Array<Record<string, unknown>>;
        kpi?: { grossTotal?: number; orderCount?: number; totalUnits?: number };
      };
      if (!payload?.success) return null;
      return {
        topProducts: Array.isArray(payload.topProducts) ? payload.topProducts : [],
        recentActivity: Array.isArray(payload.recentActivity) ? payload.recentActivity : [],
        salesTrend: Array.isArray(payload.salesTrend) ? payload.salesTrend : [],
        kpi: payload.kpi ?? null,
      };
    },
    enabled: Boolean(businessId && dateFromISO && dateToISO),
    staleTime: 60_000,
    placeholderData: (previousData, previousQuery) =>
      sameTenantPlaceholderData(previousData, previousQuery, businessId),
  });

  const salesPerfKpi = salesPerfQuery.data?.kpi;

  const displayRevenue = resolveRetailKpiValue(
    periodMetrics.currentRevenue,
    Number(salesPerfKpi?.grossTotal)
  );
  const displayOrders = resolveRetailKpiValue(
    periodMetrics.currentOrders,
    Number(salesPerfKpi?.orderCount)
  );
  const unitsSold = resolveRetailKpiValue(
    periodMetrics.soldUnits,
    Number(salesPerfKpi?.totalUnits)
  );

  const revenueBars = useMemo(() => {
    const periodTrend = buildRetailPeriodChartRows(
      salesPerfQuery.data?.salesTrend as Array<{ date?: unknown; revenue?: number }> | undefined,
      totalExpense
    );
    if (periodTrend.length > 0) {
      const maxVal = Math.max(
        ...periodTrend.map((r) => Math.max(r.revenue, r.expenses)),
        1
      );
      return periodTrend.map((row) => ({
        ...row,
        heightPct: Math.max(8, Math.round((row.revenue / maxVal) * 100)),
      }));
    }
    return normalizeSparklineBars(chartData, 8);
  }, [chartData, salesPerfQuery.data?.salesTrend, totalExpense]);

  const salesTrend = useMemo(
    () =>
      revenueBars.map((b) => ({
        label: b.label,
        revenue: b.revenue,
        expenses: b.expenses,
      })),
    [revenueBars]
  );

  const expenseRows = useMemo(() => normalizeExpenseRows(expenseBreakdown, 5), [expenseBreakdown]);

  const expensePie = useMemo(
    () =>
      expenseRows.map((row) => ({
        name: row.label.length > 12 ? `${row.label.slice(0, 11)}…` : row.label,
        value: row.value,
      })),
    [expenseRows]
  );

  const onlineOrders = resolveOnlineOrderCount(dashboardMetrics);
  const onlineSalesAmount =
    onlineSalesOverride != null && Number.isFinite(Number(onlineSalesOverride))
      ? Number(onlineSalesOverride)
      : resolveOnlineSalesAmount(dashboardMetrics);
  const totalSalesAmount = displayRevenue;

  const sidebarLoading = salesPerfQuery.isLoading && !salesPerfQuery.data;

  const topSellingItems = useMemo(() => {
    // Prefer unified sales-performance (invoice + POS + storefront + restaurant).
    const analyticsRows = salesPerfQuery.data?.topProducts;
    if (Array.isArray(analyticsRows) && analyticsRows.length > 0) {
      return buildRetailTopSellingItems(analyticsRows, products, 5);
    }
    const fromInvoices = buildTopProductsFromInvoices(
      invoices,
      dateRange ?? { from: new Date(), to: new Date() },
      5
    );
    if (fromInvoices.length === 0) return [];
    return buildRetailTopSellingItems(
      fromInvoices.map((row) => ({
        name: row.name,
        product_id: row.product_id,
        volume: row.qty,
        revenue: row.revenue,
      })),
      products,
      5
    );
  }, [invoices, dateRange, products, salesPerfQuery.data]);

  const recentActivityItems = useMemo(() => {
    if (activityFeedReady && Array.isArray(activityFeed) && activityFeed.length > 0) {
      return mapAuditActivityRows(activityFeed);
    }
    const salesRows = salesPerfQuery.data?.recentActivity;
    if (Array.isArray(salesRows) && salesRows.length > 0) {
      return mapSalesActivityRows(salesRows);
    }
    return [];
  }, [activityFeed, activityFeedReady, salesPerfQuery.data]);

  const easyPresetIds = useMemo(() => new Set(EASY_PRESET_OPTIONS.map((p) => p.id)), []);
  const resolvedPreset = easyPresetIds.has(activePreset) ? activePreset : 'custom';
  const presetOptions =
    resolvedPreset === 'custom'
      ? [...EASY_PRESET_OPTIONS, { id: 'custom', label: periodLabel || 'Custom' }]
      : EASY_PRESET_OPTIONS;

  const milkOrUnitsAction = milkRelevant ? 'route-hisab' : 'invoices';

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80 p-0 lg:p-1">
      {metricsPending ? (
        <p className="sr-only" aria-live="polite">
          Loading live metrics
        </p>
      ) : null}

      {/* Greeting + period */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
            Hello, {userName}!
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here&apos;s what&apos;s happening with your business today.
          </p>
          {business?.name ? (
            <p className="mt-1 text-xs font-medium text-neutral-400">
              {business.name} · {periodLabel} · {currency}
            </p>
          ) : null}
        </div>
        <div className="w-full min-w-0 sm:max-w-md">
          <MobilePresetPills
            compact
            options={presetOptions}
            activeId={resolvedPreset}
            onSelect={(id) => {
              if (id === 'custom') return;
              onDateRangePresetChange?.(
                id as 'today' | '7d' | '30d' | 'mtd' | '90d' | 'last_month' | 'ytd'
              );
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:items-stretch lg:gap-4">
        <div className="col-span-12 flex min-w-0 flex-col gap-4 lg:col-span-9">
      {/* Quick entry — gated colored tiles */}
      <section aria-label="Quick entry">
        <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Quick entry
          </h2>
          <p className="hidden text-[11px] font-medium text-neutral-400 sm:block">
            Tap a tile to open the form
          </p>
        </div>
        {actions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-xs font-medium text-neutral-500">
            No quick actions available for this role. Ask an owner to adjust access.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {actions.map((action) => (
              <RetailActionTile
                key={action.id}
                action={action}
                onClick={() => handleAction(action)}
              />
            ))}
          </div>
        )}
        {secondaryActions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {secondaryActions.map((extra) => (
              <Button
                key={extra.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700"
                onClick={() => onQuickAction?.(extra.id)}
              >
                {extra.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      {/* Primary KPI strip — wireframe four-up */}
      <section aria-label="Key metrics">
        <div className="mb-2 px-0.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Key metrics
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <RetailKpiBox
            label={milkRelevant ? 'Total Milk Sold' : 'Units Sold'}
            value={unitsSold.toLocaleString()}
            hint={periodLabel}
            accent="bg-sky-500"
            isLoading={salesLoading || sidebarLoading}
            onClick={() => onQuickAction?.(milkOrUnitsAction)}
          />
          <RetailKpiBox
            label="Total Expense"
            value={formatCurrencyCompact(totalExpense)}
            hint={periodLabel}
            accent="bg-rose-500"
            isLoading={financeLoading}
            onClick={
              planCan('expense_tracking')
                ? () => onQuickAction?.('log-expense')
                : undefined
            }
          />
          <RetailKpiBox
            label="Total Revenue"
            value={formatCurrencyCompact(displayRevenue)}
            hint={periodLabel}
            accent="bg-brand-primary"
            isLoading={salesLoading || sidebarLoading}
            onClick={() => onQuickAction?.('reports')}
          />
          <RetailKpiBox
            label="Online Orders"
            value={onlineOrders.toLocaleString()}
            hint="Storefront"
            accent="bg-cyan-500"
            isLoading={salesLoading}
            onClick={canOpenOrders ? () => onQuickAction?.('orders') : undefined}
          />
          <RetailKpiBox
            label="Online Sales"
            value={formatCurrencyCompact(onlineSalesAmount)}
            hint="Storefront revenue"
            accent="bg-teal-500"
            isLoading={salesLoading}
            onClick={canOpenOrders ? () => onQuickAction?.('orders') : undefined}
          />
          <RetailKpiBox
            label="Total Sales"
            value={formatCurrencyCompact(totalSalesAmount)}
            hint={`${displayOrders} orders`}
            accent="bg-emerald-500"
            isLoading={salesLoading || sidebarLoading}
            onClick={() => onQuickAction?.('invoices')}
          />
          <RetailKpiBox
            label="Receivables"
            value={formatCurrencyCompact(outstandingAmount)}
            hint={`${openInvoicesCount} open`}
            accent="bg-violet-500"
            isLoading={financeLoading}
            onClick={() => onQuickAction?.('invoices')}
          />
          <RetailKpiBox
            label="Low stock"
            value={String(reminders.lowStock ?? 0)}
            hint="SKUs to review"
            accent="bg-amber-500"
            onClick={() => onQuickAction?.('inventory')}
          />
        </div>
      </section>

      {/* Graphs — desktop full row; mobile stacked after KPIs for fast entry first */}
      <section
        aria-label="Performance graphs"
        className="hidden lg:grid gap-3 lg:grid-cols-12"
      >
        <Card className="overflow-hidden border-neutral-200 shadow-sm lg:col-span-3">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-neutral-800">Expenses</CardTitle>
            <CardDescription className="text-[11px]">Category mix</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsLoading ? (
              <ChartSkeleton />
            ) : expensePie.length === 0 ? (
              <ChartEmpty label="No expenses in this period" />
            ) : (
              <div className="h-[11rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={36}
                      outerRadius={58}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {expensePie.map((_, i) => (
                        <Cell key={`exp-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-neutral-900/10 shadow-md ring-1 ring-neutral-900/5 lg:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Sales trend</CardTitle>
              <CardDescription className="text-[11px]">Revenue vs expenses</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-neutral-500"
              onClick={() => onQuickAction?.('reports')}
            >
              Full reports
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-3 sm:px-3">
            {chartsLoading ? (
              <div className="h-[12.5rem]">
                <ChartSkeleton />
              </div>
            ) : salesTrend.length === 0 ? (
              <ChartEmpty label="Not enough sales history yet" />
            ) : (
              <div className="h-[12.5rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retailRevFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND_PRIMARY} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={BRAND_PRIMARY} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={BRAND_PRIMARY}
                      fill="url(#retailRevFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke={CHART_PALETTE[1]}
                      fill="transparent"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-neutral-200 shadow-sm lg:col-span-3">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-neutral-800">Daily revenue</CardTitle>
            <CardDescription className="text-[11px]">Period bars</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsLoading ? (
              <ChartSkeleton />
            ) : revenueBars.length === 0 ? (
              <ChartEmpty label="No revenue bars yet" />
            ) : (
              <div className="h-[11rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBars} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill={CHART_PALETTE[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Shop health — compact second band */}
      <section aria-label="Shop health">
        <div className="mb-2 px-0.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Shop health
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <RetailKpiBox
          label="Overdue"
          value={String(reminders.overdueInvoices ?? 0)}
          hint="Open invoices"
          accent="bg-rose-400"
          onClick={() => onQuickAction?.('overdue')}
        />
        <RetailKpiBox
          label="Pending orders"
          value={String(reminders.pendingOrders ?? 0)}
          hint="Needs attention"
          accent="bg-orange-400"
          onClick={() => onQuickAction?.('pending-orders')}
        />
        <RetailKpiBox
          label="Stock value"
          value={formatCurrencyCompact(inventoryValue)}
          hint={`${inStockUnits.toLocaleString()} units`}
          accent="bg-slate-600"
          onClick={() => onQuickAction?.('inventory')}
        />
        <RetailKpiBox
          label="Efficiency"
          value={`${domainEfficiency}%`}
          hint={domainEfficiency >= 85 ? 'Healthy' : 'Review alerts'}
          accent="bg-neutral-800"
          onClick={() => onQuickAction?.('reports')}
        />
        </div>
      </section>

      {/* Mobile charts — below KPIs so entry + numbers come first */}
      <section aria-label="Performance graphs (mobile)" className="grid gap-3 lg:hidden">
        <Card className="overflow-hidden border-2 border-neutral-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">Sales trend</CardTitle>
              <CardDescription className="text-[11px]">Revenue vs expenses</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-neutral-500"
              onClick={() => onQuickAction?.('reports')}
            >
              Reports
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsLoading ? (
              <ChartSkeleton />
            ) : salesTrend.length === 0 ? (
              <ChartEmpty label="Not enough sales history yet" />
            ) : (
              <div className="h-[11rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retailRevFillMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND_PRIMARY} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={BRAND_PRIMARY} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={BRAND_PRIMARY}
                      fill="url(#retailRevFillMobile)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="overflow-hidden border-neutral-200 shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-800">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {chartsLoading ? (
                <ChartSkeleton />
              ) : expensePie.length === 0 ? (
                <ChartEmpty label="No expenses in this period" />
              ) : (
                <div className="h-[10rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {expensePie.map((_, i) => (
                          <Cell key={`m-exp-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-neutral-200 shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-800">Daily revenue</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              {chartsLoading ? (
                <ChartSkeleton />
              ) : revenueBars.length === 0 ? (
                <ChartEmpty label="No revenue bars yet" />
              ) : (
                <div className="h-[10rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueBars} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: number) => formatCurrencyCompact(Number(value) || 0)}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill={CHART_PALETTE[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
        </div>

        <aside className="col-span-12 flex min-w-0 flex-col gap-3 lg:col-span-3 lg:min-h-0">
          <RetailTopSellingCard
            items={topSellingItems}
            formatCurrency={formatCurrencyCompact}
            isLoading={sidebarLoading}
          />
          <RetailRecentActivityCard
            items={recentActivityItems}
            formatCurrency={formatCurrencyCompact}
            isLoading={sidebarLoading && !activityFeedReady}
            onViewAll={() => onQuickAction?.('invoices')}
            className="min-h-0 flex-1"
          />
          <AdvancedRemindersCard
            data={reminders}
            onItemClick={(id) => onQuickAction?.(id)}
            isLoading={remindersLoading}
            className="mt-auto shrink-0"
          />
        </aside>
      </div>
    </div>
  );
}

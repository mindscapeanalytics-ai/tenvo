'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp, Users, ShoppingCart,
    Clock,
    Zap,
    Boxes, Warehouse, RotateCcw, BadgeDollarSign,
    Package, PackageCheck, PackageX, FileText, BarChart3, Plus, Wallet, Table2,
    DollarSign, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useAppMode } from '@/lib/context/BusyModeContext';
import { useFilters } from '@/lib/context/FilterContext';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { getDomainColors } from '@/lib/domainColors';
import { isCampaignRelevant } from '@/lib/config/domains';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { KPIMeter } from '../islands/portlets/KPIMeter.client';
import { QuickActionTiles } from '../islands/portlets/QuickActionTiles.client';
import { RemindersPortlet } from '../islands/portlets/RemindersPortlet.client';
import { RecentActivityFeed } from '../islands/portlets/RecentActivityFeed.client';
import { AnalyticsDashboard } from '../islands/AnalyticsDashboard.client';
import { MergedActionInsights } from '../islands/MergedActionInsights.client';
import NetsuiteDashboard from '../islands/NetsuiteDashboard.client';
import { DashboardMobileHub } from '@/components/dashboard/mobile/DashboardMobileHub';
import { EasyBusinessDashboard } from '@/components/dashboard/easy/EasyBusinessDashboard';
import { RetailSimpleDashboard } from '@/components/dashboard/easy/RetailSimpleDashboard';
import { DomainOperationsPanel } from '@/components/dashboard/easy/DomainOperationsPanel';
import { useDomainOperationsSnapshot } from '@/lib/hooks/useDomainOperationsSnapshot';
import { AdvancedDashboardLayout } from '@/components/dashboard/advanced/AdvancedDashboardLayout.client';
import type { SecondaryMetricItem } from '@/components/dashboard/advanced/AdvancedSecondaryMetricsSection.client';
import type { ChannelMixItem } from '@/components/dashboard/advanced/AdvancedChannelMixStrip.client';
import type { AiInsightItem } from '@/components/dashboard/advanced/AdvancedAiAssistantPanel.client';
import { PerformanceKPIs } from '../islands/portlets/PerformanceKPIs.client';
import { countLowStockProducts, resolveInvoiceOpenBalance, resolveProductStock } from '@/lib/dashboard/easyDashboardHelpers';
import { metricActionId } from '@/lib/dashboard/metricNavigation';
import { resolveSparklineSeries } from '@/lib/dashboard/sparklineSeries';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { hubAnalyticsQueryKey, sameTenantPlaceholderData } from '@/lib/dashboard/hubQueryKeys';
import {
    fetchHubAnalyticsBundle,
    normalizeDailyRevenueTrend,
} from '@/lib/dashboard/hubAnalyticsBundle';
import {
    resolveEasyDomainProfile,
    getDomainKpiLabels,
    buildDomainCapabilityBadges,
    buildDomainSeasonBadge,
    buildVerticalInsightCards,
} from '@/lib/dashboard/easyDomainIntelligence';
import { isPendingInvoice } from '@/lib/utils/analytics';
import { calculateBusinessHealth } from '@/lib/analytics/health';
import type { KpiTheme } from '@/lib/dashboard/kpiThemes';

// ===============================================================
// TYPES & INTERFACES
// ===============================================================

interface DomainDashboardProps {
    businessId?: string;
    category: string;
    invoices: InvoiceLike[];
    products: ProductLike[];
    customers: CustomerLike[];
    dateRange: { from: Date; to: Date };
    currency?: string;
    onQuickAction?: (actionId: string) => void;
    onDateRangePresetChange?: (preset: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd') => void;
    dashboardMetrics?: DashboardMetrics | null;
    chartData?: Array<Record<string, unknown>>;
    accountingSummary?: AccountingSummaryLike | null;
    expenseBreakdown?: ExpenseBreakdownItem[];
    expenses?: ExpenseLike[];
    advancedDashboardSnapshot?: AdvancedDashboardSnapshotLike | null;
    domainKnowledge?: DomainKnowledgeLike;
    user?: { email?: string; user_metadata?: { full_name?: string } } | null;
    isAnalyticsLoading?: boolean;
    isSalesLoading?: boolean;
    isInventoryLoading?: boolean;
    isFinanceLoading?: boolean;
    isExpensesLoading?: boolean;
    /** True once lean hub bootstrap settled — used to defer Advanced domain-ops SQL. */
    isDataLoaded?: boolean;
    /** Recent Activity rows from hub shell bootstrap (skips feed self-fetch when provided). */
    activityFeed?: Array<Record<string, unknown>>;
    productTotal?: number;
    hasMoreProducts?: boolean;
    onLoadMoreProducts?: () => void | Promise<void>;
}

interface InvoiceItemLike {
    quantity?: number | string;
}

interface InvoiceLike {
    status?: string;
    date?: string | Date;
    due_date?: string | Date;
    customer_id?: string | number | null;
    customer_name?: string;
    grand_total?: number | string;
    amount?: number | string;
    balance?: number | string;
    remaining_balance?: number | string;
    amount_due?: number | string;
    items?: InvoiceItemLike[];
}

interface ProductLike {
    id?: string | number;
    stock?: number | string;
    min_stock?: number | string;
    minStock?: number | string;
    reorder_point?: number | string;
    cost_price?: number | string;
    purchase_price?: number | string;
    price?: number | string;
    max_stock?: number | string;
    max_stock_level?: number | string;
    stock_checked_at?: string | Date;
    updated_at?: string | Date;
    created_at?: string | Date;
}

interface CustomerLike {
    id?: string | number;
}

interface ExpenseLike {
    date?: string | Date;
    expense_date?: string | Date;
    created_at?: string | Date;
    amount?: number | string;
    total?: number | string;
    grand_total?: number | string;
}

interface ExpenseBreakdownItem {
    value?: number;
}

interface DashboardMetrics {
    revenue?: number | {
        total?: number;
        orderCount?: number;
        storefront?: number;
        pos?: number;
        invoices?: number;
    };
    channels?: { storefront?: number; pos?: number; invoice?: number };
    orders?: { total?: number; pending?: number; paid?: number; invoices?: number; pos?: number; storefront?: number };
    products?: number;
    customers?: { active?: number; growth?: number };
    cashFlow?: { current?: number; growth?: number };
    growth?: { trend?: 'up' | 'down'; percentage?: number; value?: string };
    alerts?: { lowStock?: number; overdueInvoices?: number };
    inventory?: {
        activeProducts?: number;
        lowStockCount?: number;
        totalValue?: number;
        totalStockUnits?: number;
    };
    timeline?: Array<Record<string, unknown>>;
}

interface AccountingSummaryLike {
    inventoryValue?: number;
    accountsReceivable?: number;
    accountsPayable?: number;
    grossProfit?: number;
    margin?: number;
}

interface AdvancedDashboardSnapshotLike {
    finance?: {
        netProfit?: number;
        grossProfit?: number;
        netMargin?: number;
        receivables?: number;
        receivableCount?: number;
        payables?: number;
        netCashFlow?: number;
        periodRevenue?: number;
        periodExpenses?: number;
    };
    comparison?: {
        priorRevenue?: number;
        priorOrders?: number;
        priorCollected?: number;
        periodRevenue?: number;
        periodOrders?: number;
        periodCustomers?: number;
        priorCustomers?: number;
    } | null;
    orderStatus?: {
        current?: { open?: number; pending?: number; completed?: number; cancelled?: number };
        previous?: { open?: number; pending?: number; completed?: number; cancelled?: number };
    } | null;
}

interface DomainKnowledgeLike {
    multiLocationEnabled?: boolean;
    /** Used by `isCampaignRelevant` for non-catalog categories */
    retailMode?: boolean;
    serviceMode?: boolean;
    /** Optional AI / analytics intelligence blob for forecasting */
    intelligence?: Record<string, unknown>;
}

// ===============================================================
// MAIN COMPONENT
// ===============================================================

export function DomainDashboard({
    businessId,
    category,
    invoices,
    products,
    customers,
    dateRange,
    currency,
    onQuickAction,
    onDateRangePresetChange,
    dashboardMetrics,
    chartData = [],
    accountingSummary,
    expenseBreakdown = [],
    expenses = [],
    advancedDashboardSnapshot = null,
    domainKnowledge,
    user,
    isAnalyticsLoading = false,
    isSalesLoading = false,
    isInventoryLoading = false,
    isFinanceLoading = false,
    isExpensesLoading = false,
    isDataLoaded = false,
    activityFeed,
    productTotal: catalogProductTotal = 0,
    hasMoreProducts: _hasMoreProducts = false,
    onLoadMoreProducts: _onLoadMoreProducts,
}: DomainDashboardProps) {
    void _hasMoreProducts;
    void _onLoadMoreProducts;
    const { business, currency: businessCurrency } = useBusiness() as {
        business?: { id?: string; name?: string; country?: string; city?: string } | null;
        currency?: string;
    };
    // EasyBusinessDashboard requires string; hub may omit prop until regional pack settles.
    const resolvedCurrency = (currency || businessCurrency || 'PKR').trim() || 'PKR';
    const { isEasyMode, isRetailSimpleDashboard, modeReady } = useAppMode();
    const { datePresetKey } = useFilters();
    const activeBusinessId = useResolvedBusinessId(businessId);
    const advancedOpsSnapshot = useDomainOperationsSnapshot({
        businessId: activeBusinessId,
        category,
        dateRange,
        // Defer heavy ops SQL until lean bootstrap + core modules settle (no race with Overview KPIs).
        // Retail Simple Online Sales uses hub KPIs (dashboard.view), not this ai_analytics-gated snapshot.
        enabled:
            !isEasyMode &&
            Boolean(activeBusinessId) &&
            isDataLoaded &&
            !isFinanceLoading &&
            !isSalesLoading,
    });
    const colors = getDomainColors(category) as Record<string, unknown>;
    const campaignEnabled = isCampaignRelevant(category, domainKnowledge ?? null);
    const multiLocationEnabled = Boolean(domainKnowledge?.multiLocationEnabled);

    const formatCurrencyCompact = useCallback(
        (amount: number) => `${resolvedCurrency} ${Math.round(amount || 0).toLocaleString()}`,
        [resolvedCurrency]
    );
    const handleMetricNavigate = useCallback(
        (actionId: string) => {
            if (!actionId) return;
            onQuickAction?.(actionId);
        },
        [onQuickAction]
    );

    const dateFilter = useMemo(() => {
        const from = toAnalyticsIsoDate(dateRange.from);
        const to = toAnalyticsIsoDate(dateRange.to);
        if (!from || !to) return {};
        return { from, to };
    }, [dateRange]);

    const analyticsQuery = useQuery({
        queryKey: hubAnalyticsQueryKey(
            activeBusinessId || '__pending__',
            dateFilter.from || '',
            dateFilter.to || ''
        ),
        enabled: !isEasyMode && Boolean(activeBusinessId && dateFilter.from && dateFilter.to),
        queryFn: async () => {
            if (!activeBusinessId) throw new Error('businessId required');
            return fetchHubAnalyticsBundle(activeBusinessId, dateFilter);
        },
        staleTime: 60_000,
        placeholderData: (previousData, previousQuery) =>
            sameTenantPlaceholderData(previousData, previousQuery, activeBusinessId),
    });

    const unifiedComparison = useMemo(
        () => advancedDashboardSnapshot?.comparison ?? analyticsQuery.data?.comparison ?? null,
        [advancedDashboardSnapshot?.comparison, analyticsQuery.data?.comparison]
    );

    const unifiedOrderStatus = useMemo(
        () => advancedDashboardSnapshot?.orderStatus ?? analyticsQuery.data?.orderStatus ?? null,
        [advancedDashboardSnapshot?.orderStatus, analyticsQuery.data?.orderStatus]
    );

    const dailyRevenueTrend = useMemo(
        () => normalizeDailyRevenueTrend(analyticsQuery.data),
        [analyticsQuery.data]
    );

    const easyProfile = useMemo(
        () =>
            resolveEasyDomainProfile(
                category,
                (domainKnowledge as Record<string, unknown> | undefined) ?? undefined,
                business ?? undefined
            ),
        [category, domainKnowledge, business]
    );
    const domainKpiLabels = useMemo(() => getDomainKpiLabels(easyProfile), [easyProfile]);
    const domainBadges = useMemo(
        () =>
            buildDomainCapabilityBadges(easyProfile).map((badge) => ({
                label: badge.label,
                tone: 'capability' as const,
            })),
        [easyProfile]
    );
    const seasonLabel = useMemo(() => buildDomainSeasonBadge(easyProfile)?.label ?? null, [easyProfile]);

    const catalogTotalCount = useMemo(
        () => (catalogProductTotal > 0 ? catalogProductTotal : products.length),
        [catalogProductTotal, products.length]
    );
    const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

    const calcGrowth = (current: number, previous: number) => {
        if (previous > 0) return ((current - previous) / previous) * 100;
        if (current > 0) return 100;
        return 0;
    };

    // Shared by Easy + Advanced: shell KPIs unlock Overview instantly (warm cache / bootstrap).
    const hasBootstrapKpis = Boolean(
        dashboardMetrics?.revenue != null ||
            dashboardMetrics?.orders != null ||
            dashboardMetrics?.inventory != null
    );
    const salesTilesLoading = isSalesLoading && !hasBootstrapKpis;
    const inventoryTilesLoading =
        isInventoryLoading && dashboardMetrics?.inventory == null;
    const financeTilesLoading =
        (isFinanceLoading || isExpensesLoading) &&
        !hasBootstrapKpis &&
        !advancedDashboardSnapshot?.finance;

    const periodMetrics = useMemo(() => {
        const currentFrom = new Date(dateRange.from);
        const currentTo = new Date(dateRange.to);
        const duration = Math.max(1, currentTo.getTime() - currentFrom.getTime());
        const prevFrom = new Date(currentFrom.getTime() - duration);
        const prevTo = new Date(currentTo.getTime() - duration);

        const inRange = (rawDate: string | Date | undefined, from: Date, to: Date) => {
            const parsed = rawDate ? new Date(rawDate) : null;
            if (!parsed || Number.isNaN(parsed.getTime())) return false;
            return parsed >= from && parsed <= to;
        };

        const validInvoices = invoices.filter(inv => !['cancelled', 'draft'].includes(String(inv?.status || '').toLowerCase()));
        const isReturnLike = (inv: InvoiceLike) => {
            const status = String(inv?.status || '').toLowerCase();
            return status.includes('return') || status.includes('refund') || status.includes('credit');
        };
        // Billed sales (not cash-only): aligns Revenue with Orders for wholesale credit.
        // Paid ratio / receivables stay separate for collections health.
        const billableInvoices = validInvoices.filter(inv => !isReturnLike(inv));

        // UNIFIED ORDER COUNT: Prefer server-side aggregation (includes invoices + POS + storefront).
        // While sales is still loading without shell KPIs, do not undercount via invoice-only fallback.
        const serverOrderCount = dashboardMetrics?.orders?.total;
        const clientInvoiceCount = billableInvoices.filter(inv => inRange(inv?.date, currentFrom, currentTo)).length;
        const currentOrders = serverOrderCount !== undefined && serverOrderCount !== null
            ? Number(serverOrderCount)
            : (isSalesLoading ? 0 : clientInvoiceCount);
        
        // Previous period: unified server comparison when available
        const previousOrders =
            unifiedComparison?.priorOrders != null
                ? Number(unifiedComparison.priorOrders)
                : billableInvoices.filter((inv) => inRange(inv?.date, prevFrom, prevTo)).length;

        const serverRevenueRaw = dashboardMetrics?.revenue;
        const serverRevenue =
            typeof serverRevenueRaw === 'number'
                ? serverRevenueRaw
                : serverRevenueRaw && typeof serverRevenueRaw === 'object'
                  ? serverRevenueRaw.total
                  : undefined;
        const clientRevenue = billableInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .reduce((sum, inv) => sum + (Number(inv?.grand_total) || Number(inv?.amount) || 0), 0);
        const currentRevenue = serverRevenue !== undefined && serverRevenue !== null
            ? Number(serverRevenue)
            : (isSalesLoading ? 0 : clientRevenue);
        const previousRevenue =
            unifiedComparison?.priorRevenue != null
                ? Number(unifiedComparison.priorRevenue)
                : billableInvoices
                      .filter((inv) => inRange(inv?.date, prevFrom, prevTo))
                      .reduce((sum, inv) => sum + (Number(inv?.grand_total) || Number(inv?.amount) || 0), 0);

        const getExpenseDate = (exp: ExpenseLike) => exp?.date || exp?.expense_date || exp?.created_at;
        const getExpenseAmount = (exp: ExpenseLike) => Number(exp?.amount) || Number(exp?.total) || Number(exp?.grand_total) || 0;

        const currentExpenses = expenses
            .filter(exp => inRange(getExpenseDate(exp), currentFrom, currentTo))
            .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
        const previousExpenses = expenses
            .filter(exp => inRange(getExpenseDate(exp), prevFrom, prevTo))
            .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);

        const currentCustomers =
            unifiedComparison?.periodCustomers != null
                ? Number(unifiedComparison.periodCustomers)
                : new Set(
                      validInvoices
                          .filter((inv) => inRange(inv?.date, currentFrom, currentTo))
                          .map((inv) => inv?.customer_id || inv?.customer_name)
                          .filter(Boolean)
                  ).size;
        const previousCustomers =
            unifiedComparison?.priorCustomers != null
                ? Number(unifiedComparison.priorCustomers)
                : new Set(
                      validInvoices
                          .filter((inv) => inRange(inv?.date, prevFrom, prevTo))
                          .map((inv) => inv?.customer_id || inv?.customer_name)
                          .filter(Boolean)
                  ).size;

        const soldUnits = billableInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .reduce((sum, inv) => sum + (inv?.items || []).reduce((itemSum: number, item: InvoiceItemLike) => itemSum + (Number(item?.quantity) || 0), 0), 0);

        const returnInvoices = validInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .filter(inv => {
                const status = String(inv?.status || '').toLowerCase();
                return status.includes('return') || status.includes('refund') || status.includes('credit');
            }).length;

        const previousReturnInvoices = validInvoices
            .filter(inv => inRange(inv?.date, prevFrom, prevTo))
            .filter(inv => {
                const status = String(inv?.status || '').toLowerCase();
                return status.includes('return') || status.includes('refund') || status.includes('credit');
            }).length;

        const pendingReturns = validInvoices
            .filter(inv => inRange(inv?.date, currentFrom, currentTo))
            .filter(inv => String(inv?.status || '').toLowerCase().includes('return-pending')).length;

        return {
            currentOrders,
            previousOrders,
            currentRevenue,
            previousRevenue,
            currentExpenses,
            previousExpenses,
            currentCustomers,
            previousCustomers,
            soldUnits,
            returnInvoices,
            previousReturnInvoices,
            pendingReturns
        };
    }, [dateRange, invoices, expenses, dashboardMetrics, isSalesLoading, unifiedComparison]);

    const revenueTrendSigned = calcGrowth(periodMetrics.currentRevenue, periodMetrics.previousRevenue);

    const ordersTrend = calcGrowth(periodMetrics.currentOrders, periodMetrics.previousOrders);
    const expenseTrend = calcGrowth(periodMetrics.currentExpenses, periodMetrics.previousExpenses);
    const customerTrend = calcGrowth(periodMetrics.currentCustomers, periodMetrics.previousCustomers);

    /** Date-range-aligned cash flow (shared by Easy + Advanced). Prefer GL snapshot, else operational period net. */
    const periodCashFlow = useMemo(() => {
        const snapshotFlow = Number(advancedDashboardSnapshot?.finance?.netCashFlow);
        if (Number.isFinite(snapshotFlow) && advancedDashboardSnapshot?.finance) {
            return snapshotFlow;
        }
        return periodMetrics.currentRevenue - periodMetrics.currentExpenses;
    }, [advancedDashboardSnapshot, periodMetrics.currentRevenue, periodMetrics.currentExpenses]);

    const periodCashFlowGrowth = useMemo(
        () =>
            calcGrowth(
                periodCashFlow,
                periodMetrics.previousRevenue - periodMetrics.previousExpenses
            ),
        [periodCashFlow, periodMetrics.previousRevenue, periodMetrics.previousExpenses]
    );

    const lowStockFallback = useMemo(() => countLowStockProducts(products), [products]);

    const overdueInvoicesFallback = useMemo(() => {
        const now = new Date();
        return invoices.filter((invoice: InvoiceLike) => {
            const status = String(invoice?.status || '').toLowerCase();
            if (status.includes('overdue')) return true;
            if (['paid', 'cancelled', 'draft', 'voided'].includes(status)) return false;
            const dueRaw = invoice?.due_date;
            if (dueRaw) {
                const due = new Date(dueRaw);
                if (!Number.isNaN(due.getTime()) && due < now) return true;
            }
            return status.includes('unpaid');
        }).length;
    }, [invoices]);

    const pendingOrdersFallback = useMemo(() => {
        return invoices.filter((invoice: InvoiceLike) => isPendingInvoice(invoice as Record<string, unknown>)).length;
    }, [invoices]);

    // Prefer filter-range client counts once modules settle. Avoid Math.max with
    // calendar-month server alerts (different stock field + threshold) that inflate Attention.
    const remindersData = useMemo(() => {
        const serverLow = dashboardMetrics?.alerts?.lowStock
            ?? dashboardMetrics?.inventory?.lowStockCount
            ?? 0;
        const serverOverdue = dashboardMetrics?.alerts?.overdueInvoices ?? 0;
        const serverPending = dashboardMetrics?.orders?.pending;
        const catalogLoaded = products.length > 0;
        const preferServerAlerts = hasBootstrapKpis && (isSalesLoading || invoices.length === 0);
        return {
            // Lean bootstrap may unlock inventory before products hydrate — keep server KPIs until then.
            lowStock: (!catalogLoaded || isInventoryLoading) ? serverLow : lowStockFallback,
            overdueInvoices: preferServerAlerts ? serverOverdue : overdueInvoicesFallback,
            pendingOrders:
                preferServerAlerts && serverPending != null
                    ? Number(serverPending)
                    : invoices.length === 0 && serverPending != null
                      ? Number(serverPending)
                      : pendingOrdersFallback,
        };
    }, [
        dashboardMetrics,
        products.length,
        invoices.length,
        hasBootstrapKpis,
        isInventoryLoading,
        isSalesLoading,
        lowStockFallback,
        overdueInvoicesFallback,
        pendingOrdersFallback,
    ]);

    const domainEfficiency = useMemo(() => {
        const productBase = Math.max(products.length, 1);
        const orderBase = Math.max(periodMetrics.currentOrders || dashboardMetrics?.orders?.total || 1, 1);

        const inventoryScore = Math.max(0, 100 - ((remindersData.lowStock || 0) / productBase) * 100);
        const pendingScore = Math.max(0, 100 - ((remindersData.pendingOrders || 0) / orderBase) * 100);
        const overdueScore = Math.max(0, 100 - ((remindersData.overdueInvoices || 0) / orderBase) * 120);
        const growthBoost = Math.max(-10, Math.min(10, revenueTrendSigned / 2));

        const score = Math.round((inventoryScore * 0.45) + (pendingScore * 0.3) + (overdueScore * 0.25) + growthBoost);
        return Math.max(0, Math.min(100, score));
    }, [products.length, dashboardMetrics, periodMetrics.currentOrders, remindersData, revenueTrendSigned]);

    const inventoryValue = useMemo(() => {
        const summaryInventory = Number(accountingSummary?.inventoryValue);
        const metricsInventory = Number(dashboardMetrics?.inventory?.totalValue);
        const catalogValue = products.reduce((sum: number, product: ProductLike) => {
            const stock = resolveProductStock(product);
            const unitCost = Number(product?.cost_price) || Number(product?.purchase_price) || Number(product?.price) || 0;
            return sum + Math.max(0, stock) * Math.max(0, unitCost);
        }, 0);
        // Prefer positive GL/summary figures only; negative or zero summary falls back to catalog at cost (never show negative asset for this tile).
        if (Number.isFinite(summaryInventory) && summaryInventory > 0) {
            return summaryInventory;
        }
        if (products.length === 0 && Number.isFinite(metricsInventory) && metricsInventory > 0) {
            return metricsInventory;
        }
        return Math.max(0, catalogValue);
    }, [products, accountingSummary?.inventoryValue, dashboardMetrics?.inventory?.totalValue]);

    const inStockUnits = useMemo(() => {
        if (products.length === 0) {
            const fromMetrics = Number(dashboardMetrics?.inventory?.totalStockUnits);
            if (Number.isFinite(fromMetrics) && fromMetrics > 0) return fromMetrics;
        }
        return products.reduce((sum: number, product: ProductLike) => sum + resolveProductStock(product), 0);
    }, [products, dashboardMetrics?.inventory?.totalStockUnits]);

    const avgOrderValue = useMemo(() => {
        const orders = Math.max(periodMetrics.currentOrders, 1);
        return periodMetrics.currentRevenue / orders;
    }, [periodMetrics.currentOrders, periodMetrics.currentRevenue]);

    const returnRate = useMemo(() => {
        const orders = Math.max(periodMetrics.currentOrders, 1);
        return (periodMetrics.returnInvoices / orders) * 100;
    }, [periodMetrics.currentOrders, periodMetrics.returnInvoices]);

    const coverageDays = useMemo(() => {
        const msInDay = 1000 * 60 * 60 * 24;
        const daysInRange = Math.max(1, Math.round((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / msInDay));
        const dailyVelocity = periodMetrics.soldUnits / daysInRange;
        // No velocity yet (or sales still settling) — avoid flashing a false "365+" healthy signal.
        if (dailyVelocity <= 0) return null;
        return Math.round(inStockUnits / dailyVelocity);
    }, [dateRange.from, dateRange.to, periodMetrics.soldUnits, inStockUnits]);

    const stockCheckRecency = useMemo(() => {
        const referenceTime = new Date(dateRange.to).getTime();
        const latestStockTouch = products.reduce((latest: number, product: ProductLike) => {
            const stockDate = product?.stock_checked_at || product?.updated_at || product?.created_at;
            if (!stockDate) return latest;
            const parsed = new Date(stockDate).getTime();
            if (Number.isNaN(parsed)) return latest;
            return Math.max(latest, parsed);
        }, 0);

        if (!latestStockTouch) return null;
        const validReference = Number.isNaN(referenceTime) ? latestStockTouch : referenceTime;
        const days = Math.floor((validReference - latestStockTouch) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }, [products, dateRange.to]);

    const outstandingAmount = useMemo(() => {
        return invoices.reduce((sum: number, invoice: InvoiceLike) => {
            return sum + resolveInvoiceOpenBalance(invoice);
        }, 0);
    }, [invoices]);

    /** Open / unpaid sales documents, Easy Mode header uses this instead of duplicating low-stock count. */
    const openInvoicesCount = useMemo(
        () =>
            invoices.filter((inv: InvoiceLike) => {
                const status = String(inv?.status || '').toLowerCase();
                return !['paid', 'cancelled', 'draft', 'voided'].includes(status);
            }).length,
        [invoices]
    );

    const paidOrderRate = useMemo(() => {
        const currentFrom = new Date(dateRange.from);
        const currentTo = new Date(dateRange.to);

        const eligibleInvoices = invoices.filter((invoice: InvoiceLike) => {
            const status = String(invoice?.status || '').toLowerCase();
            if (['draft', 'cancelled'].includes(status)) return false;
            const parsed = invoice?.date ? new Date(invoice.date) : null;
            if (!parsed || Number.isNaN(parsed.getTime())) return false;
            return parsed >= currentFrom && parsed <= currentTo;
        });

        if (eligibleInvoices.length === 0) return null;

        const paidInvoices = eligibleInvoices.filter(
            (invoice: InvoiceLike) => String(invoice?.status || '').toLowerCase() === 'paid'
        ).length;
        return clamp((paidInvoices / eligibleInvoices.length) * 100, 0, 100);
    }, [invoices, dateRange.from, dateRange.to]);

    const warehouseUtilization = useMemo(() => {
        const capacityFromConfiguredProducts = products.reduce((sum: number, product: ProductLike) => {
            const maxStock = Number(product?.max_stock) || Number(product?.max_stock_level) || 0;
            return sum + Math.max(maxStock, 10);
        }, 0);

        if (capacityFromConfiguredProducts <= 0) return null;
        return clamp((inStockUnits / capacityFromConfiguredProducts) * 100, 0, 100);
    }, [products, inStockUnits]);

    const paidOrderRateValue = paidOrderRate ?? 0;
    const paidOrderRateDisplay = `${paidOrderRateValue.toFixed(1)}%`;
    const paidOrderRateDetail = paidOrderRate === null ? 'Awaiting paid order history' : 'From paid vs total orders';

    const warehouseUtilizationValue = warehouseUtilization ?? 0;
    const warehouseUtilizationDisplay = `${warehouseUtilizationValue.toFixed(1)}%`;
    const warehouseUtilizationDetail = warehouseUtilization === null
        ? 'Using baseline capacity model'
        : 'Configured capacity usage';

    const stockCheckRecencyValue = stockCheckRecency ?? 0;
    const stockCheckRecencyDisplay = `${stockCheckRecencyValue}d`;
    const stockCheckRecencyDetail = stockCheckRecency === null ? 'No stock touch timestamps yet' : 'Since last stock touch';

    /** Compact header strip: cash + throughput (low stock stays in reminders only). */
    const dashboardHeaderHighlights = useMemo(
        () => [
            {
                label: 'Pending Returns',
                value: periodMetrics.pendingReturns,
                tone: periodMetrics.pendingReturns > 0 ? 'text-amber-600' : 'text-slate-800',
                icon: RotateCcw,
                actionId: metricActionId('pending_returns'),
            },
            {
                label: 'Warehouse Util.',
                value: warehouseUtilizationDisplay,
                tone: warehouseUtilizationValue >= 90 ? 'text-amber-600' : 'text-slate-800',
                icon: Warehouse,
                actionId: metricActionId('warehouse_util'),
            },
            {
                label: 'Cash Flow',
                value: formatCurrencyCompact(periodCashFlow),
                tone: periodCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700',
                icon: BadgeDollarSign,
                actionId: metricActionId('cash_flow'),
            },
            {
                label: 'Efficiency',
                value: `${domainEfficiency}%`,
                tone: domainEfficiency >= 85 ? 'text-emerald-600' : 'text-amber-600',
                icon: TrendingUp,
                actionId: metricActionId('efficiency'),
            },
        ],
        [
            periodMetrics.pendingReturns,
            warehouseUtilizationDisplay,
            warehouseUtilizationValue,
            formatCurrencyCompact,
            periodCashFlow,
            domainEfficiency,
        ]
    );

    const hasCoreData = (products.length + invoices.length + customers.length) > 0;

    const activePreset = useMemo<'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd' | 'custom'>(() => {
        const key = String(datePresetKey || '').toLowerCase();
        if (
            key === 'today' ||
            key === '7d' ||
            key === '30d' ||
            key === '90d' ||
            key === 'mtd' ||
            key === 'last_month' ||
            key === 'ytd' ||
            key === 'custom'
        ) {
            return key;
        }
        return 'custom';
    }, [datePresetKey]);

    const periodLabel = useMemo(() => {
        const labels: Record<
            'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd' | 'custom',
            string
        > = {
            today: 'Today',
            '7d': 'Last 7 Days',
            '30d': 'Last 30 Days',
            '90d': 'Last 90 Days',
            mtd: 'This Month',
            last_month: 'Last Month',
            ytd: 'Year to Date',
            custom: 'Custom Range',
        };
        return labels[activePreset];
    }, [activePreset]);

    const netProfitValue = useMemo(() => {
        const fin = advancedDashboardSnapshot?.finance;
        const gl = accountingSummary;
        return Number(fin?.netProfit ?? gl?.grossProfit ?? 0);
    }, [advancedDashboardSnapshot, accountingSummary]);

    const previousNetProfitEstimate = useMemo(() => {
        return periodMetrics.previousRevenue - periodMetrics.previousExpenses;
    }, [periodMetrics.previousRevenue, periodMetrics.previousExpenses]);

    const netProfitTrend = useMemo(
        () => calcGrowth(netProfitValue, previousNetProfitEstimate),
        [netProfitValue, previousNetProfitEstimate]
    );

    const outOfStockCount = useMemo(
        () => products.filter((p) => resolveProductStock(p) <= 0).length,
        [products]
    );

    const orderStatusCounts = useMemo(() => {
        if (unifiedOrderStatus?.current) {
            return {
                current: {
                    open: Number(unifiedOrderStatus.current.open) || 0,
                    pending: Number(unifiedOrderStatus.current.pending) || 0,
                    completed: Number(unifiedOrderStatus.current.completed) || 0,
                    cancelled: Number(unifiedOrderStatus.current.cancelled) || 0,
                },
                previous: {
                    open: Number(unifiedOrderStatus.previous?.open) || 0,
                    pending: Number(unifiedOrderStatus.previous?.pending) || 0,
                    completed: Number(unifiedOrderStatus.previous?.completed) || 0,
                    cancelled: Number(unifiedOrderStatus.previous?.cancelled) || 0,
                },
            };
        }

        const currentFrom = new Date(dateRange.from);
        const currentTo = new Date(dateRange.to);
        const prevFrom = new Date(currentFrom.getTime() - (currentTo.getTime() - currentFrom.getTime()));
        const prevTo = new Date(currentTo.getTime() - (currentTo.getTime() - currentFrom.getTime()));

        const countInRange = (from: Date, to: Date) => {
            let open = 0;
            let pending = 0;
            let completed = 0;
            let cancelled = 0;
            for (const inv of invoices) {
                const raw = inv?.date;
                const parsed = raw ? new Date(raw) : null;
                if (!parsed || Number.isNaN(parsed.getTime()) || parsed < from || parsed > to) continue;
                const status = String(inv?.status || '').toLowerCase();
                if (status === 'cancelled' || status === 'voided') {
                    cancelled += 1;
                    continue;
                }
                if (status === 'paid') {
                    completed += 1;
                    continue;
                }
                if (isPendingInvoice(inv as Record<string, unknown>)) {
                    pending += 1;
                    continue;
                }
                if (!['draft'].includes(status)) open += 1;
            }
            return { open, pending, completed, cancelled };
        };

        return {
            current: countInRange(currentFrom, currentTo),
            previous: countInRange(prevFrom, prevTo),
        };
    }, [unifiedOrderStatus, invoices, dateRange.from, dateRange.to]);

    const keyPerformanceMetrics = useMemo(() => {
        const revenueSeries =
            resolveSparklineSeries(chartData, invoices, dateRange, 'revenue', dailyRevenueTrend) ?? [];
        const orderSeries = resolveSparklineSeries(chartData, invoices, dateRange, 'orders');
        const profitFromChart =
            chartData?.length >= 2 ? chartData.map((p) => Number(p.profit) || 0) : undefined;
        const profitSeries =
            profitFromChart && profitFromChart.length >= 2 ? profitFromChart : revenueSeries;
        const cashSeries =
            revenueSeries.length >= 2
                ? revenueSeries.map((v, i) => {
                      const expSlice = periodMetrics.currentExpenses / Math.max(revenueSeries.length, 1);
                      return Math.max(0, v - (expSlice * (i + 1)) / revenueSeries.length);
                  })
                : undefined;

        return [
            {
                id: 'revenue',
                label: 'Total Revenue',
                value: formatCurrencyCompact(periodMetrics.currentRevenue),
                comparisonLabel: `vs ${formatCurrencyCompact(periodMetrics.previousRevenue)}`,
                trend: Number(revenueTrendSigned.toFixed(1)),
                icon: DollarSign,
                theme: 'blue' as KpiTheme,
                sparkline: revenueSeries,
                actionId: metricActionId('revenue'),
                isLoading: salesTilesLoading,
            },
            {
                id: 'net_profit',
                label: 'Net Profit',
                value: formatCurrencyCompact(netProfitValue),
                comparisonLabel: `vs ${formatCurrencyCompact(previousNetProfitEstimate)}`,
                trend: Number(netProfitTrend.toFixed(1)),
                icon: BadgeDollarSign,
                theme: (netProfitValue >= 0 ? 'emerald' : 'rose') as KpiTheme,
                sparkline: profitSeries.length >= 2 ? profitSeries : revenueSeries,
                actionId: metricActionId('net_profit'),
                isLoading: financeTilesLoading,
            },
            {
                id: 'orders',
                label: domainKpiLabels.ordersLabel || 'Total Orders',
                value: periodMetrics.currentOrders,
                comparisonLabel: `vs ${periodMetrics.previousOrders}`,
                trend: Number(ordersTrend.toFixed(1)),
                icon: ShoppingCart,
                theme: 'amber' as KpiTheme,
                sparkline: orderSeries,
                actionId: metricActionId('orders'),
                isLoading: salesTilesLoading,
            },
            {
                id: 'cash_flow',
                label: 'Cash Flow',
                value: formatCurrencyCompact(periodCashFlow),
                comparisonLabel: `vs ${formatCurrencyCompact(periodMetrics.previousRevenue - periodMetrics.previousExpenses)}`,
                trend: Number(periodCashFlowGrowth.toFixed(1)),
                icon: Wallet,
                theme: 'violet' as KpiTheme,
                sparkline:
                    (cashSeries ?? revenueSeries).length >= 2 ? (cashSeries ?? revenueSeries) : undefined,
                actionId: metricActionId('cash_flow'),
                isLoading: financeTilesLoading,
            },
        ];
    }, [
        chartData,
        invoices,
        dateRange,
        dailyRevenueTrend,
        domainKpiLabels.ordersLabel,
        periodMetrics,
        revenueTrendSigned,
        ordersTrend,
        netProfitValue,
        netProfitTrend,
        previousNetProfitEstimate,
        periodCashFlow,
        periodCashFlowGrowth,
        formatCurrencyCompact,
        salesTilesLoading,
        financeTilesLoading,
    ]);

    const orderSummaryTiles = useMemo(
        () => [
            {
                label: 'In Progress',
                value: orderStatusCounts.current.open,
                trend: calcGrowth(orderStatusCounts.current.open, orderStatusCounts.previous.open),
                icon: Package,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
            },
            {
                label: 'Pending Orders',
                value: orderStatusCounts.current.pending,
                trend: calcGrowth(orderStatusCounts.current.pending, orderStatusCounts.previous.pending),
                icon: ShoppingCart,
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
            },
            {
                label: 'Completed Orders',
                value: orderStatusCounts.current.completed,
                trend: calcGrowth(orderStatusCounts.current.completed, orderStatusCounts.previous.completed),
                icon: PackageCheck,
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
            },
            {
                label: 'Cancelled Orders',
                value: orderStatusCounts.current.cancelled,
                trend: calcGrowth(orderStatusCounts.current.cancelled, orderStatusCounts.previous.cancelled),
                icon: PackageX,
                iconBg: 'bg-rose-50',
                iconColor: 'text-rose-600',
                invertTrend: true,
            },
        ],
        [orderStatusCounts, remindersData.pendingOrders]
    );

    const inventoryHealthTiles = useMemo(
        () => [
            {
                label: 'Low Stock Items',
                value: remindersData.lowStock,
                actionLabel: 'View Items',
                actionId: 'low-stock',
                actionTone: 'rose' as const,
                icon: AlertTriangle,
                iconBg: 'bg-rose-50',
                iconColor: 'text-rose-600',
            },
            {
                label: 'Out of Stock Items',
                value: outOfStockCount,
                actionLabel: 'View Items',
                actionId: 'inventory',
                actionTone: 'teal' as const,
                icon: PackageX,
                iconBg: 'bg-teal-50',
                iconColor: 'text-teal-600',
            },
            {
                label: 'Total Items',
                value: catalogTotalCount.toLocaleString(),
                actionLabel: 'All Items',
                actionId: 'inventory',
                actionTone: 'blue' as const,
                icon: Boxes,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
            },
            {
                label: domainKpiLabels.inventoryLabel || 'Inventory Value',
                value: formatCurrencyCompact(inventoryValue),
                actionLabel: 'View Report',
                actionId: 'reports',
                actionTone: 'amber' as const,
                icon: BadgeDollarSign,
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
            },
        ],
        [remindersData.lowStock, outOfStockCount, catalogTotalCount, inventoryValue, formatCurrencyCompact, domainKpiLabels]
    );

    const channelMixItems = useMemo((): ChannelMixItem[] => {
        const revenueRaw = dashboardMetrics?.revenue;
        const channels = dashboardMetrics?.channels;
        const invoice =
            Number(typeof revenueRaw === 'object' ? revenueRaw?.invoices : 0) ||
            Number(channels?.invoice) ||
            0;
        const pos =
            Number(typeof revenueRaw === 'object' ? revenueRaw?.pos : 0) || Number(channels?.pos) || 0;
        const storefront =
            Number(typeof revenueRaw === 'object' ? revenueRaw?.storefront : 0) ||
            Number(channels?.storefront) ||
            0;
        const total = invoice + pos + storefront;
        if (total <= 0) return [];

        const rows: ChannelMixItem[] = [
            { id: 'invoice', label: 'Invoices', value: formatCurrencyCompact(invoice), sharePct: (invoice / total) * 100 },
            { id: 'pos', label: 'POS', value: formatCurrencyCompact(pos), sharePct: (pos / total) * 100 },
            {
                id: 'storefront',
                label: 'Storefront',
                value: formatCurrencyCompact(storefront),
                sharePct: (storefront / total) * 100,
            },
        ];
        return rows.filter((row) => row.sharePct > 0).sort((a, b) => b.sharePct - a.sharePct);
    }, [dashboardMetrics?.revenue, dashboardMetrics?.channels, formatCurrencyCompact]);

    const secondaryMetrics = useMemo((): SecondaryMetricItem[] => {
        const receivables = Number(
            advancedDashboardSnapshot?.finance?.receivables ??
                accountingSummary?.accountsReceivable ??
                outstandingAmount
        );
        const netMarginPct =
            periodMetrics.currentRevenue > 0
                ? ((netProfitValue / periodMetrics.currentRevenue) * 100).toFixed(1)
                : '0.0';

        const topProduct = analyticsQuery.data?.topProducts?.[0] as Record<string, unknown> | undefined;
        const retentionRate = analyticsQuery.data?.kpi?.retention;
        const retentionDetail = analyticsQuery.data?.kpi?.retentionDetail;

        const metrics: SecondaryMetricItem[] = [
            {
                id: 'receivables',
                label: 'Receivables',
                value: formatCurrencyCompact(receivables),
                hint: 'Outstanding customer balance',
                actionId: 'payments',
            },
            {
                id: 'aov',
                label: 'Avg Order Value',
                value: formatCurrencyCompact(avgOrderValue),
                hint: `${periodMetrics.currentOrders} orders in period`,
                actionId: 'reports',
            },
            {
                id: 'margin',
                label: 'Net Margin',
                value: `${netMarginPct}%`,
                hint: 'Profit as % of revenue',
                tone: Number(netMarginPct) >= 0 ? 'text-emerald-700' : 'text-rose-600',
                actionId: 'view-profit-loss',
            },
            {
                id: 'customers',
                label: 'Customers',
                value: periodMetrics.currentCustomers,
                hint: `vs ${periodMetrics.previousCustomers} prior period`,
                actionId: 'customers',
            },
        ];

        if (retentionRate) {
            metrics.push({
                id: 'retention',
                label: 'Retention',
                value: retentionRate,
                hint: retentionDetail?.repeatCustomers
                    ? `${retentionDetail.repeatCustomers} repeat buyers`
                    : 'Repeat customer rate',
                tone: 'text-indigo-700',
                actionId: 'customers',
            });
        }

        metrics.push(
            {
                id: 'returns',
                label: 'Pending Returns',
                value: periodMetrics.pendingReturns,
                hint: 'Return requests in period',
                tone: periodMetrics.pendingReturns > 0 ? 'text-amber-600' : undefined,
                actionId: metricActionId('pending_returns'),
            },
            {
                id: 'warehouse',
                label: 'Warehouse Util.',
                value: warehouseUtilizationDisplay,
                hint: warehouseUtilizationDetail,
                actionId: metricActionId('warehouse_util'),
            }
        );

        if (topProduct?.name) {
            metrics.push({
                id: 'top_product',
                label: 'Top Product',
                value: String(topProduct.name).slice(0, 18),
                hint: formatCurrencyCompact(Number(topProduct.revenue) || 0),
                actionId: 'reports',
            });
        }

        return metrics;
    }, [
        advancedDashboardSnapshot?.finance?.receivables,
        accountingSummary?.accountsReceivable,
        outstandingAmount,
        netProfitValue,
        periodMetrics,
        formatCurrencyCompact,
        avgOrderValue,
        warehouseUtilizationDisplay,
        warehouseUtilizationDetail,
        analyticsQuery.data?.topProducts,
        analyticsQuery.data?.kpi,
    ]);

    const aiInsights = useMemo((): AiInsightItem[] => {
        const verticalCards = buildVerticalInsightCards(easyProfile, {
            reminders: remindersData,
            coverageDays,
            revenueTrend: revenueTrendSigned,
        }).map((card, index) => ({
            id: `vertical-${index}-${card.title}`,
            title: card.title,
            description: card.text,
            actionLabel: 'View Details',
            actionId: card.actionTab || 'reports',
            icon: Zap,
            iconBg:
                card.tone === 'rose'
                    ? 'bg-rose-50'
                    : card.tone === 'amber'
                      ? 'bg-amber-50'
                      : 'bg-indigo-50',
            iconColor:
                card.tone === 'rose'
                    ? 'text-rose-600'
                    : card.tone === 'amber'
                      ? 'text-amber-600'
                      : 'text-indigo-600',
        }));

        const items: AiInsightItem[] = [...verticalCards];

        if (remindersData.lowStock > 0) {
            items.push({
                id: 'restock',
                title: `Restock ${remindersData.lowStock} low-stock item${remindersData.lowStock > 1 ? 's' : ''}`,
                description: 'Safety stock is running low. Replenish before you miss sales.',
                actionLabel: 'View Details',
                actionId: 'low-stock',
                icon: Package,
                iconBg: 'bg-violet-50',
                iconColor: 'text-violet-600',
            });
        }

        if (remindersData.overdueInvoices > 0) {
            items.push({
                id: 'collections',
                title: 'Payment Due',
                description: `${remindersData.overdueInvoices} overdue invoice${remindersData.overdueInvoices > 1 ? 's' : ''} need follow-up.`,
                actionLabel: 'Collect',
                actionId: 'payments',
                icon: Wallet,
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
            });
        }

        if (revenueTrendSigned <= 0 && campaignEnabled) {
            items.push({
                id: 'campaign',
                title: 'Revenue Opportunity',
                description: 'Launch a targeted campaign to recover demand momentum.',
                actionLabel: 'View Details',
                actionId: 'campaigns',
                icon: TrendingUp,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
            });
        } else if (netProfitValue > 0 && periodMetrics.currentRevenue > 0) {
            const marginPct = ((netProfitValue / periodMetrics.currentRevenue) * 100).toFixed(0);
            items.push({
                id: 'margin',
                title: 'Margin Opportunity',
                description: `Net margin is ${marginPct}%. Bundle high-margin SKUs to lift profit.`,
                actionLabel: 'View Details',
                actionId: 'reports',
                icon: TrendingUp,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
            });
        }

        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.title)) return false;
            seen.add(item.title);
            return true;
        }).slice(0, 3);
    }, [
        easyProfile,
        remindersData,
        coverageDays,
        revenueTrendSigned,
        campaignEnabled,
        netProfitValue,
        periodMetrics.currentRevenue,
    ]);

    const healthStats = useMemo(
        () => ({
            revenue: periodMetrics.currentRevenue,
            grossProfit: netProfitValue,
            inventoryValue,
            accountsReceivable: Number(accountingSummary?.accountsReceivable ?? outstandingAmount),
            lowStockCount: remindersData.lowStock,
            totalProducts: catalogTotalCount,
            pendingInvoices: remindersData.pendingOrders || openInvoicesCount,
        }),
        [
            periodMetrics.currentRevenue,
            netProfitValue,
            inventoryValue,
            accountingSummary?.accountsReceivable,
            outstandingAmount,
            remindersData.lowStock,
            remindersData.pendingOrders,
            catalogTotalCount,
            openInvoicesCount,
        ]
    );

    const businessHealthScore = useMemo(
        () => calculateBusinessHealth(healthStats),
        [healthStats]
    );

    const intelligentInsights = useMemo(() => {
        const insights = [] as Array<{ title: string; text: string; tone: string; actionTab: string }>;
        const intel = (domainKnowledge?.intelligence ?? {}) as Record<string, unknown>;

        if (intel.seasonality) {
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            const peakMonths = Array.isArray(intel.peakMonths) ? intel.peakMonths as string[] : [];
            const isPeak = peakMonths.includes(currentMonth);
            if (isPeak) {
                insights.push({
                    title: 'Seasonal Peak',
                    text: `${String(intel.seasonality)} peak (${currentMonth}). Buffer safety stock on fast movers before demand spikes.`,
                    tone: 'indigo',
                    actionTab: 'inventory',
                });
            } else if (peakMonths.length > 0) {
                insights.push({
                    title: 'Seasonal Planning',
                    text: `Next peak window: ${peakMonths[0]}. Align procurement ${Number(intel.leadTime) || 14} days ahead of demand.`,
                    tone: 'slate',
                    actionTab: 'purchases',
                });
            }
        }

        if (intel.perishability && String(intel.perishability).toLowerCase() !== 'low') {
            insights.push({
                title: 'Shelf-Life Risk',
                text: `${String(intel.perishability).toUpperCase()} perishability vertical. Prioritize FEFO picks and expiry checks on inbound stock.`,
                tone: 'amber',
                actionTab: 'inventory',
            });
        }

        if (Number(intel.demandVolatility) > 0.6) {
            insights.push({
                title: 'Demand Volatility',
                text: 'Elevated demand swings detected for this vertical. Widen reorder buffers on A-class SKUs.',
                tone: 'rose',
                actionTab: 'reports',
            });
        }

        if (remindersData.lowStock > 0) {
            insights.push({
                title: 'Predictive Restock',
                text: `${remindersData.lowStock} item${remindersData.lowStock > 1 ? 's are' : ' is'} below safety stock. Generate replenishment early to avoid stock-outs.`,
                tone: 'indigo',
                actionTab: 'inventory'
            });
        }

        if (remindersData.overdueInvoices > 0) {
            insights.push({
                title: 'Collections Alert',
                text: `${remindersData.overdueInvoices} overdue invoice${remindersData.overdueInvoices > 1 ? 's' : ''} need follow-up to protect cash flow health.`,
                tone: 'amber',
                actionTab: 'invoices'
            });
        }

        if (campaignEnabled && revenueTrendSigned <= 0) {
            insights.push({
                title: 'Campaign Opportunity',
                text: 'Revenue momentum softened. Launch a targeted win-back or bundle campaign to recover demand quickly.',
                tone: 'emerald',
                actionTab: 'campaigns'
            });
        }

        if (periodMetrics.currentExpenses > 0 && expenseTrend > 10) {
            insights.push({
                title: 'Expense Pressure',
                text: `Period expenses rose ${expenseTrend.toFixed(1)}%. Review high-cost categories and tighten discretionary spend.`,
                tone: 'rose',
                actionTab: 'expenses'
            });
        }

        if (insights.length === 0) {
            insights.push({
                title: 'Operational Stability',
                text: 'Core KPIs are stable. Use analytics projections to identify the next growth lever.',
                tone: 'slate',
                actionTab: 'reports'
            });
        }

        if (insights.length < 2) {
            insights.push({
                title: 'Tracking Coverage',
                text: 'Open analytics and verify trends by segment, product, and period to improve decision confidence.',
                tone: 'slate',
                actionTab: 'reports'
            });
        }

        return insights;
    }, [remindersData, campaignEnabled, revenueTrendSigned, periodMetrics.currentExpenses, expenseTrend, domainKnowledge?.intelligence]);

    const insightStripItems = useMemo(() => {
        const alertCount =
            (remindersData.lowStock > 0 ? 1 : 0) +
            (remindersData.overdueInvoices > 0 ? 1 : 0) +
            (remindersData.pendingOrders > 0 ? 1 : 0);
        const opportunityCount = Math.max(
            aiInsights.length,
            intelligentInsights.filter((i) => i.tone === 'emerald' || i.tone === 'indigo').length
        );

        return [
            {
                id: 'opportunities',
                label: '',
                value: `${opportunityCount} ${opportunityCount === 1 ? 'Opportunity' : 'Opportunities'}`,
                sublabel: 'Increase your profit',
                tone: 'emerald' as const,
                actionId: metricActionId('efficiency'),
            },
            {
                id: 'alerts',
                label: '',
                value: `${alertCount} ${alertCount === 1 ? 'Alert' : 'Alerts'}`,
                sublabel: 'Action needed',
                tone: alertCount > 0 ? ('amber' as const) : ('slate' as const),
                actionId: metricActionId('inventory_value'),
            },
            {
                id: 'profit',
                label: '',
                value: formatCurrencyCompact(netProfitValue),
                sublabel: 'Net profit',
                tone: 'teal' as const,
                actionId: metricActionId('net_profit'),
            },
            {
                id: 'health',
                label: '',
                value: `${businessHealthScore}%`,
                sublabel: 'Business health score',
                tone: 'violet' as const,
                actionId: metricActionId('efficiency'),
            },
        ];
    }, [
        remindersData.lowStock,
        remindersData.overdueInvoices,
        remindersData.pendingOrders,
        aiInsights.length,
        intelligentInsights,
        formatCurrencyCompact,
        netProfitValue,
        businessHealthScore,
    ]);

    // Easy/Advanced tiles unlock from owning modules — do not gate the cockpit on expenses list.
    const metricsPending =
        !hasBootstrapKpis &&
        (salesTilesLoading || inventoryTilesLoading || financeTilesLoading);
    // Avoid false empty-state while sales/inventory modules are still hydrating ([] arrays).
    const showQuickSetup = !metricsPending && !hasCoreData;

    // modeReady is sync on client hub; keep a tiny SSR-safe fallback without blocking warm paint.
    if (!modeReady) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center p-6 bg-neutral-50/50 rounded-xl border border-neutral-100 animate-pulse">
                <div className="text-center space-y-3">
                    <div className="h-6 w-32 bg-slate-200 rounded mx-auto animate-pulse" />
                    <div className="h-4 w-48 bg-slate-200/60 rounded mx-auto animate-pulse" />
                </div>
            </div>
        );
    }

    // ===============================================================
    // EASY MODE DASHBOARD -- Clean, beginner-friendly view
    // ===============================================================
    if (isEasyMode) {
        const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
        const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

        const easyCommandStrip = [
            {
                label: 'Open invoices',
                value: openInvoicesCount,
                tone: openInvoicesCount > 0 ? 'text-amber-600' : 'text-emerald-600',
                icon: FileText,
            },
            {
                label: 'Pending Orders',
                value: remindersData.pendingOrders || 0,
                tone: remindersData.pendingOrders > 0 ? 'text-amber-600' : 'text-emerald-600',
                icon: ShoppingCart,
            },
            {
                label: 'Overdue Invoices',
                value: remindersData.overdueInvoices || 0,
                tone: remindersData.overdueInvoices > 0 ? 'text-rose-600' : 'text-emerald-600',
                icon: Clock,
            },
            {
                label: 'Units Sold',
                value: periodMetrics.soldUnits.toLocaleString(),
                tone: periodMetrics.soldUnits > 0 ? 'text-slate-900' : 'text-slate-400',
                icon: BarChart3,
            },
        ];

        /** Avoid repeating low-stock counts: header + health strip + KPI already cover inventory. */
        const easySmartInsights = intelligentInsights.filter(
            (insight) => !(remindersData.lowStock > 0 && insight.title === 'Predictive Restock')
        );
        const easyOperationalInsights =
            easySmartInsights.length > 0 ? easySmartInsights : intelligentInsights;

        const easyActions = [
            { id: 'new-invoice', label: 'New Invoice', desc: 'Create a sale', icon: Plus, color: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900' },
            { id: 'add-product', label: 'Add Product', desc: 'Record inventory', icon: Package, color: 'bg-brand-50 hover:bg-brand-100 text-brand-primary-dark border border-brand-100' },
            { id: 'add-customer', label: 'Add Customer', desc: 'Grow customer base', icon: Users, color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' },
            { id: 'log-expense', label: 'Record Expense', desc: 'Money paid from shop', icon: Wallet, color: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200' },
            { id: 'inventory', label: 'Review Inventory', desc: 'Fix stock issues', icon: Warehouse, color: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' },
            { id: 'reports', label: 'View Reports', desc: 'Open analytics', icon: BarChart3, color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200' },
            { id: 'excel-mode', label: 'Excel data entry', desc: 'Bulk spreadsheet entry', icon: Table2, color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' },
        ];

        const easyHealthPanels = [
            {
                label: 'Efficiency Score',
                value: `${domainEfficiency}%`,
                detail: domainEfficiency >= 85 ? 'Operations in control' : 'Needs attention',
                tone: domainEfficiency >= 85 ? 'text-emerald-600' : 'text-amber-600'
            },
            {
                label: 'Avg Order Value',
                value: formatCurrencyCompact(avgOrderValue),
                detail: 'Revenue per closed order',
                tone: 'text-slate-900'
            },
            {
                label: 'Paid Order Ratio',
                value: paidOrderRateDisplay,
                detail: paidOrderRateDetail,
                tone: paidOrderRate !== null && paidOrderRate < 60 ? 'text-rose-600' : 'text-slate-900'
            },
            {
                label: multiLocationEnabled ? 'Warehouse Utilization' : 'Stock Check Recency',
                value: multiLocationEnabled
                    ? warehouseUtilizationDisplay
                    : stockCheckRecencyDisplay,
                detail: multiLocationEnabled ? warehouseUtilizationDetail : stockCheckRecencyDetail,
                tone: 'text-slate-900'
            }
        ];

        const quickSetupSteps = [
            { id: 'add-product', label: 'Add your first product' },
            { id: 'add-customer', label: 'Create a customer record' },
            { id: 'new-invoice', label: 'Issue your first invoice' }
        ];

        const domainVerticalLabel =
            (domainKnowledge as { name?: string } | undefined)?.name || getDomainKnowledge(category).name;

        // Retail Simple: standalone one-page home (wireframe). Guided Easy tabs via Retail/Guided toggle.
        if (isRetailSimpleDashboard) {
            return (
                <>
                    {metricsPending ? (
                        <p className="sr-only" aria-live="polite">
                            Loading live metrics
                        </p>
                    ) : null}
                    <RetailSimpleDashboard
                        businessId={activeBusinessId}
                        business={business}
                        category={category}
                        domainKnowledge={domainKnowledge as Record<string, unknown> | undefined}
                        currency={resolvedCurrency}
                        periodLabel={periodLabel}
                        activePreset={activePreset}
                        dateRange={dateRange}
                        invoices={invoices as unknown as Array<Record<string, unknown>>}
                        products={products as unknown as Array<Record<string, unknown>>}
                        activityFeed={activityFeed as Array<Record<string, unknown>> | undefined}
                        activityFeedReady={Boolean(isDataLoaded || (!isSalesLoading && !isFinanceLoading))}
                        onQuickAction={onQuickAction}
                        onDateRangePresetChange={onDateRangePresetChange}
                        chartData={chartData}
                        expenseBreakdown={expenseBreakdown as unknown as Array<Record<string, unknown>>}
                        dashboardMetrics={dashboardMetrics as unknown as Record<string, unknown> | null}
                        formatCurrencyCompact={formatCurrencyCompact}
                        userName={userName}
                        periodMetrics={{
                            currentRevenue: periodMetrics.currentRevenue,
                            currentOrders: periodMetrics.currentOrders,
                            currentExpenses: periodMetrics.currentExpenses,
                            soldUnits: periodMetrics.soldUnits,
                        }}
                        metricsPending={metricsPending}
                        isSalesLoading={salesTilesLoading}
                        isFinanceLoading={financeTilesLoading}
                        reminders={remindersData}
                        remindersLoading={
                            metricsPending ||
                            ((isInventoryLoading && products.length === 0) ||
                                (isSalesLoading && invoices.length === 0 && !hasBootstrapKpis))
                        }
                        inventoryValue={inventoryValue}
                        inStockUnits={inStockUnits}
                        outstandingAmount={outstandingAmount}
                        openInvoicesCount={openInvoicesCount}
                        domainEfficiency={domainEfficiency}
                    />
                </>
            );
        }

        return (
            <>
                {metricsPending ? (
                    <p className="sr-only" aria-live="polite">
                      Loading live metrics
                    </p>
                ) : null}
            <EasyBusinessDashboard
                businessId={activeBusinessId}
                business={business}
                category={category}
                currency={resolvedCurrency}
                metricsPending={metricsPending}
                isSalesLoading={salesTilesLoading}
                isInventoryLoading={inventoryTilesLoading}
                isFinanceLoading={financeTilesLoading}
                isAnalyticsLoading={isAnalyticsLoading && !hasBootstrapKpis}
                domainKnowledge={domainKnowledge as Record<string, unknown> | undefined}
                domainVerticalLabel={domainVerticalLabel}
                periodLabel={periodLabel}
                activePreset={activePreset}
                onQuickAction={onQuickAction}
                onDateRangePresetChange={onDateRangePresetChange}
                dateRange={dateRange}
                invoices={invoices as unknown as Array<Record<string, unknown>>}
                products={products as unknown as Array<Record<string, unknown>>}
                customers={customers as unknown as Array<Record<string, unknown>>}
                expenseBreakdown={expenseBreakdown as unknown as Array<Record<string, unknown>>}
                chartData={chartData}
                dashboardMetrics={dashboardMetrics as unknown as Record<string, unknown> | null}
                formatCurrencyCompact={formatCurrencyCompact}
                greeting={greeting}
                userName={userName}
                commandStrip={easyCommandStrip}
                healthPanels={easyHealthPanels}
                insights={easyOperationalInsights}
                reminders={remindersData}
                hasCoreData={hasCoreData || metricsPending}
                quickSetupSteps={quickSetupSteps}
                quickActions={easyActions}
                domainEfficiency={domainEfficiency}
                periodMetrics={periodMetrics}
                revenueTrend={Number(revenueTrendSigned)}
                ordersTrend={Number(ordersTrend)}
                customerTrend={Number(customerTrend)}
                expenseTrend={Number(expenseTrend)}
                outstandingAmount={outstandingAmount}
                openInvoicesCount={openInvoicesCount}
                inventoryValue={inventoryValue}
                inStockUnits={inStockUnits}
                coverageDays={coverageDays}
                avgOrderValue={avgOrderValue}
                returnRate={returnRate}
                paidOrderRateDisplay={paidOrderRateDisplay}
                paidOrderRate={paidOrderRate}
                cashFlowCurrent={periodCashFlow}
                cashFlowGrowth={periodCashFlowGrowth}
                campaignEnabled={campaignEnabled}
                multiLocationEnabled={multiLocationEnabled}
                warehouseUtilizationDisplay={warehouseUtilizationDisplay}
                stockCheckRecencyDisplay={stockCheckRecencyDisplay}
            />
            </>
        );
    }

    // ===============================================================
    // ADVANCED MODE DASHBOARD -- Full power view
    // ===============================================================

    const advancedUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
    const advancedGreeting =
        new Date().getHours() < 12
            ? 'Good Morning'
            : new Date().getHours() < 17
              ? 'Good Afternoon'
              : 'Good Evening';
    const advancedPresetOptions: Array<{ id: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd'; label: string }> = [
        { id: 'today', label: 'Today' },
        { id: '7d', label: '7 Days' },
        { id: '30d', label: '30 Days' },
        { id: '90d', label: '90 Days' },
        { id: 'mtd', label: 'MTD' },
        { id: 'last_month', label: 'Last Mo' },
        { id: 'ytd', label: 'YTD' },
    ];
    const advancedQuickActions = [
        { id: 'new-invoice', label: 'New Invoice', sublabel: 'Direct sale', icon: FileText },
        {
            id: multiLocationEnabled ? 'warehouses' : 'purchases',
            label: multiLocationEnabled ? 'Transfer' : 'Purchase',
            sublabel: multiLocationEnabled ? 'Inter-branch' : 'Procurement',
            icon: Warehouse,
        },
        { id: 'inventory', label: 'Adjust', sublabel: 'Stock fix', icon: Package },
        { id: 'new-customer', label: 'Customer', sublabel: 'CRM', icon: Users },
        { id: 'new-product', label: 'Product', sublabel: 'Catalog', icon: Plus },
        campaignEnabled
            ? { id: 'campaigns', label: 'Campaigns', sublabel: 'Marketing', icon: Zap }
            : { id: 'reports', label: 'Analytics', sublabel: 'Insights', icon: BarChart3 },
    ];

    return (
        <>
            {metricsPending ? (
                <p className="sr-only" aria-live="polite">
                    Loading live metrics
                </p>
            ) : null}
            <DashboardMobileHub
                mode="advanced"
                metricsPending={metricsPending}
                greeting={advancedGreeting}
                userName={advancedUserName}
                businessName={business?.name}
                periodLabel={periodLabel}
                presetOptions={
                    activePreset === 'custom'
                        ? [...advancedPresetOptions, { id: 'custom', label: 'Custom' }]
                        : advancedPresetOptions
                }
                activePreset={activePreset}
                onDateRangePresetChange={(preset) => {
                    if (preset === 'custom') return;
                    onDateRangePresetChange?.(preset as 'today' | '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'ytd');
                }}
                kpiStrip={dashboardHeaderHighlights.map((item) => ({
                    label: item.label.replace(' Invoices', '').replace(' Orders', ''),
                    value: item.value,
                    alert: item.tone.includes('rose') || item.tone.includes('amber'),
                    tone: item.tone,
                }))}
                quickActions={advancedQuickActions}
                onQuickAction={onQuickAction}
                healthPanels={[
                    {
                        label: 'Revenue',
                        value: formatCurrencyCompact(periodMetrics.currentRevenue),
                        tone: 'text-emerald-600',
                    },
                    {
                        label: 'Orders',
                        value: periodMetrics.currentOrders,
                        tone: 'text-slate-900',
                    },
                    {
                        label: 'Efficiency',
                        value: `${domainEfficiency}%`,
                        tone: domainEfficiency >= 85 ? 'text-emerald-600' : 'text-amber-600',
                    },
                    {
                        label: 'Low stock',
                        value: remindersData.lowStock,
                        tone: remindersData.lowStock > 0 ? 'text-amber-600' : 'text-emerald-600',
                    },
                ]}
                reminders={remindersData}
                hasCoreData={hasCoreData || metricsPending}
                quickSetupSteps={[
                    { id: 'add-product', label: 'Add product' },
                    { id: 'add-customer', label: 'Add customer' },
                    { id: 'new-invoice', label: 'New invoice' },
                ]}
            />

        <NetsuiteDashboard>
            {/* Desktop: one stacked shell so bands share spacing and never leave column voids */}
            <div className="hidden w-full min-w-0 lg:col-span-12 lg:flex lg:flex-col lg:gap-2">
                <QuickActionTiles
                    layout="toolbar"
                    onAction={onQuickAction}
                    campaignEnabled={campaignEnabled}
                    multiLocationEnabled={multiLocationEnabled}
                />

                {!showQuickSetup ? null : (
                    <Card className="border border-brand-100 bg-brand-50/40 shadow-sm">
                        <CardContent className="flex flex-col gap-2.5 p-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-primary">Quick Setup</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                    Start by adding products, customers, or your first invoice to unlock richer KPI insights.
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button size="sm" className="h-8 text-[11px] font-semibold" onClick={() => onQuickAction?.('add-product')}>
                                    Add Product
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-semibold" onClick={() => onQuickAction?.('add-customer')}>
                                    Add Customer
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-semibold" onClick={() => onQuickAction?.('new-invoice')}>
                                    New Invoice
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <AdvancedDashboardLayout
                    key={activeBusinessId || 'dashboard'}
                    businessId={activeBusinessId}
                    category={category}
                    domainKnowledge={domainKnowledge as Record<string, unknown> | undefined}
                    business={business as Record<string, unknown> | null}
                    dateRange={dateRange}
                    currency={resolvedCurrency}
                    periodLabel={periodLabel}
                    activePreset={activePreset}
                    onDateRangePresetChange={(preset) => {
                        if (preset === 'yesterday') return;
                        onDateRangePresetChange?.(preset);
                    }}
                    domainBadges={domainBadges}
                    seasonLabel={seasonLabel}
                    insightStripItems={insightStripItems}
                    keyPerformanceMetrics={keyPerformanceMetrics}
                    secondaryMetrics={secondaryMetrics}
                    channelMixItems={channelMixItems}
                    totalRevenueLabel={formatCurrencyCompact(periodMetrics.currentRevenue)}
                    revenueTrend={Number(revenueTrendSigned.toFixed(1))}
                    chartData={chartData}
                    invoices={invoices as Array<Record<string, unknown>>}
                    orderSummaryTiles={orderSummaryTiles}
                    inventoryHealthTiles={inventoryHealthTiles}
                    aiInsights={aiInsights}
                    reminders={remindersData}
                    healthStats={healthStats}
                    activityFeed={activityFeed as Array<Record<string, unknown>> | undefined}
                    activityFeedReady={Boolean(isDataLoaded || (!isSalesLoading && !isFinanceLoading))}
                    domainOpsEnabled={Boolean(isDataLoaded && !isFinanceLoading && !isSalesLoading)}
                    formatCurrencyCompact={formatCurrencyCompact}
                    isLoading={metricsPending}
                    onNavigate={handleMetricNavigate}
                />
            </div>

            {/* Mobile — hub covers KPIs/actions; show insights & activity only */}
            <div className="min-w-0 space-y-3 overflow-x-hidden lg:hidden lg:col-span-12">
                <AnalyticsDashboard
                    businessId={activeBusinessId}
                    category={category}
                    currency={resolvedCurrency}
                    business={business}
                    chartData={chartData}
                    invoices={invoices}
                    products={products}
                    colors={colors}
                    domainKnowledge={domainKnowledge}
                    dateRange={dateRange}
                    onQuickAction={onQuickAction}
                />

                <RemindersPortlet data={remindersData} onItemClick={onQuickAction} />

                <PerformanceKPIs
                    revenue={formatCurrencyCompact(periodMetrics.currentRevenue)}
                    revenueChange={Number(revenueTrendSigned)}
                    orders={periodMetrics.currentOrders}
                    ordersChange={Number(ordersTrend)}
                    customers={periodMetrics.currentCustomers}
                    customersChange={Number(customerTrend)}
                    avgOrderValue={formatCurrencyCompact(avgOrderValue)}
                />

                <MergedActionInsights
                    category={category}
                    domainKnowledge={domainKnowledge as Record<string, unknown> | undefined}
                    operationalInsights={intelligentInsights}
                    reminders={remindersData}
                    onQuickAction={onQuickAction}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RecentActivityFeed
                        businessId={activeBusinessId}
                        onViewAll={() => onQuickAction?.('reports')}
                        feedLimit={25}
                        visibleRows={5}
                        awaitBootstrap
                        initialActivities={
                            isDataLoaded || (!isSalesLoading && !isFinanceLoading)
                                ? ((activityFeed as Array<Record<string, unknown>> | undefined) ?? [])
                                : undefined
                        }
                    />
                    <KPIMeter
                        title="Domain Efficiency"
                        value={domainEfficiency}
                        target={95}
                        suffix="%"
                        trendValue={Number(revenueTrendSigned.toFixed(1))}
                        trendLabel="vs previous period"
                    />
                </div>

                <DomainOperationsPanel
                    businessId={activeBusinessId}
                    business={business}
                    category={category}
                    domainKnowledge={domainKnowledge as Record<string, unknown> | undefined}
                    dateRange={dateRange}
                    periodLabel={periodLabel}
                    formatCurrencyCompact={formatCurrencyCompact}
                    onQuickAction={onQuickAction}
                    isActive
                    variant="compact"
                    sections={['inquiries', 'collections']}
                    hideKpiStrip
                    hideMiddleCharts
                    hideOrderTimeline
                    snapshot={advancedOpsSnapshot.snapshot}
                    snapshotLoading={advancedOpsSnapshot.loading}
                    snapshotError={advancedOpsSnapshot.error}
                    onSnapshotRetry={advancedOpsSnapshot.reload}
                />
            </div>
        </NetsuiteDashboard>
        </>
    );
}

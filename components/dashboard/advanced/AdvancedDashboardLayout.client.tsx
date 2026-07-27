'use client';

import { AdvancedInsightStrip, type InsightStripItem } from './AdvancedInsightStrip.client';
import { AdvancedKeyPerformanceSection, type KeyPerformanceMetric } from './AdvancedKeyPerformanceSection.client';
import { AdvancedRevenueOverviewCard } from './AdvancedRevenueOverviewCard.client';
import { AdvancedTopCategoriesCard } from './AdvancedTopCategoriesCard.client';
import { AdvancedOrdersSummaryCard, type OrderSummaryTile } from './AdvancedOrdersSummaryCard.client';
import { AdvancedInventoryHealthCard, type InventoryHealthTile } from './AdvancedInventoryHealthCard.client';
import { AdvancedAiAssistantPanel, type AiInsightItem } from './AdvancedAiAssistantPanel.client';
import { AdvancedRemindersCard } from './AdvancedRemindersCard.client';
import { AdvancedBusinessHealthScoreCard } from './AdvancedBusinessHealthScoreCard.client';
import { AdvancedRecentActivityCard } from './AdvancedRecentActivityCard.client';
import type { DashboardDatePreset } from './AdvancedPeriodFilter.client';

export interface AdvancedDashboardLayoutProps {
    businessId?: string;
    category?: string;
    dateRange: { from: Date; to: Date };
    currency?: string;
    periodLabel: string;
    activePreset?: DashboardDatePreset;
    onDateRangePresetChange?: (preset: Exclude<DashboardDatePreset, 'custom'>) => void;
    insightStripItems: InsightStripItem[];
    keyPerformanceMetrics: KeyPerformanceMetric[];
    totalRevenueLabel: string;
    revenueTrend: number;
    chartData?: Array<Record<string, unknown>>;
    invoices?: Array<Record<string, unknown>>;
    orderSummaryTiles: OrderSummaryTile[];
    inventoryHealthTiles: InventoryHealthTile[];
    aiInsights: AiInsightItem[];
    reminders?: { lowStock?: number; overdueInvoices?: number; pendingOrders?: number };
    healthStats: {
        revenue?: number;
        grossProfit?: number;
        inventoryValue?: number;
        accountsReceivable?: number;
        lowStockCount?: number;
        totalProducts?: number;
        pendingInvoices?: number;
    };
    activityFeed?: Array<Record<string, unknown>>;
    activityFeedReady?: boolean;
    isLoading?: boolean;
    onNavigate?: (actionId: string) => void;
}

export function AdvancedDashboardLayout({
    businessId,
    dateRange,
    currency,
    periodLabel,
    activePreset,
    onDateRangePresetChange,
    insightStripItems,
    keyPerformanceMetrics,
    totalRevenueLabel,
    revenueTrend,
    chartData,
    invoices,
    orderSummaryTiles,
    inventoryHealthTiles,
    aiInsights,
    reminders,
    healthStats,
    activityFeed,
    activityFeedReady,
    isLoading = false,
    onNavigate,
}: AdvancedDashboardLayoutProps) {
    return (
        <div className="grid grid-cols-12 gap-2 lg:gap-3">
            <div className="col-span-12 flex min-w-0 flex-col gap-2 lg:col-span-9">
                <AdvancedInsightStrip items={insightStripItems} onNavigate={onNavigate} />

                <AdvancedKeyPerformanceSection
                    metrics={keyPerformanceMetrics}
                    periodLabel={periodLabel}
                    activePreset={activePreset}
                    onDateRangePresetChange={onDateRangePresetChange}
                    onNavigate={onNavigate}
                    isLoading={isLoading}
                />

                <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-12">
                    <AdvancedRevenueOverviewCard
                        className="h-full lg:col-span-8"
                        businessId={businessId}
                        totalRevenue={totalRevenueLabel}
                        revenueTrend={revenueTrend}
                        chartData={chartData}
                        invoices={invoices}
                        dateRange={dateRange}
                        currency={currency}
                        periodLabel={periodLabel}
                        isLoading={isLoading}
                    />
                    <AdvancedTopCategoriesCard
                        className="h-full lg:col-span-4"
                        businessId={businessId}
                        dateRange={dateRange}
                        totalRevenueLabel={totalRevenueLabel}
                        currency={currency}
                    />
                </div>

                <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2">
                    <AdvancedOrdersSummaryCard
                        className="h-full"
                        tiles={orderSummaryTiles}
                        periodLabel={periodLabel}
                        activePreset={activePreset}
                        onDateRangePresetChange={onDateRangePresetChange}
                        isLoading={isLoading}
                    />
                    <AdvancedInventoryHealthCard
                        className="h-full"
                        tiles={inventoryHealthTiles}
                        onAction={onNavigate}
                        isLoading={isLoading}
                    />
                </div>

                <AdvancedBusinessHealthScoreCard stats={healthStats} />
            </div>

            <div className="col-span-12 flex min-w-0 flex-col gap-2 lg:col-span-3">
                <AdvancedAiAssistantPanel insights={aiInsights} onAction={onNavigate} className="shrink-0" />
                <AdvancedRemindersCard data={reminders} onItemClick={onNavigate} />
                <AdvancedRecentActivityCard
                    businessId={businessId}
                    onViewAll={() => onNavigate?.('reports')}
                    initialActivities={activityFeedReady ? activityFeed : undefined}
                    awaitBootstrap={!activityFeedReady}
                    currency={currency}
                    className="min-h-0 flex-1"
                />
            </div>
        </div>
    );
}

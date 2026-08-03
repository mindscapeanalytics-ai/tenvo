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
import { AdvancedSecondaryMetricsSection, type SecondaryMetricItem } from './AdvancedSecondaryMetricsSection.client';
import { AdvancedChannelMixStrip, type ChannelMixItem } from './AdvancedChannelMixStrip.client';
import { AdvancedDomainChromeStrip } from './AdvancedDomainChromeStrip.client';
import { AdvancedDomainOpsStrip } from './AdvancedDomainOpsStrip.client';
import type { DashboardDatePreset } from './AdvancedPeriodFilter.client';

export interface AdvancedDashboardLayoutProps {
    businessId?: string;
    category?: string;
    domainKnowledge?: Record<string, unknown>;
    business?: Record<string, unknown> | null;
    dateRange: { from: Date; to: Date };
    currency?: string;
    periodLabel: string;
    activePreset?: DashboardDatePreset;
    onDateRangePresetChange?: (preset: Exclude<DashboardDatePreset, 'custom'>) => void;
    domainBadges?: Array<{ label: string; tone?: 'default' | 'season' | 'capability' }>;
    seasonLabel?: string | null;
    insightStripItems: InsightStripItem[];
    keyPerformanceMetrics: KeyPerformanceMetric[];
    secondaryMetrics?: SecondaryMetricItem[];
    channelMixItems?: ChannelMixItem[];
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
    domainOpsEnabled?: boolean;
    formatCurrencyCompact?: (value: number) => string;
    isLoading?: boolean;
    onNavigate?: (actionId: string) => void;
}

export function AdvancedDashboardLayout({
    businessId,
    category = 'retail-shop',
    domainKnowledge,
    business,
    dateRange,
    currency,
    periodLabel,
    activePreset,
    onDateRangePresetChange,
    domainBadges = [],
    seasonLabel,
    insightStripItems,
    keyPerformanceMetrics,
    secondaryMetrics = [],
    channelMixItems = [],
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
    domainOpsEnabled = true,
    formatCurrencyCompact,
    isLoading = false,
    onNavigate,
}: AdvancedDashboardLayoutProps) {
    const formatValue = formatCurrencyCompact ?? ((value: number) => String(value));

    return (
        <div className="grid grid-cols-12 gap-2 lg:gap-3">
            <div className="col-span-12 flex min-w-0 flex-col gap-2 lg:col-span-9">
                <AdvancedDomainChromeStrip badges={domainBadges} seasonLabel={seasonLabel} />

                <AdvancedInsightStrip items={insightStripItems} onNavigate={onNavigate} />

                <AdvancedKeyPerformanceSection
                    metrics={keyPerformanceMetrics}
                    periodLabel={periodLabel}
                    activePreset={activePreset}
                    onDateRangePresetChange={onDateRangePresetChange}
                    onNavigate={onNavigate}
                    isLoading={isLoading}
                />

                <AdvancedChannelMixStrip channels={channelMixItems} />

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

                <AdvancedSecondaryMetricsSection
                    metrics={secondaryMetrics}
                    onNavigate={onNavigate}
                    isLoading={isLoading}
                />

                <AdvancedDomainOpsStrip
                    businessId={businessId}
                    category={category}
                    domainKnowledge={domainKnowledge}
                    business={business}
                    dateRange={dateRange}
                    formatCurrencyCompact={formatValue}
                    onNavigate={onNavigate}
                    enabled={domainOpsEnabled}
                />

                <AdvancedBusinessHealthScoreCard stats={healthStats} />
            </div>

            <div className="col-span-12 flex min-w-0 flex-col gap-2 lg:col-span-3">
                <AdvancedAiAssistantPanel
                    insights={aiInsights}
                    onAction={onNavigate}
                    showEmptyState={aiInsights.length === 0}
                    className="shrink-0"
                />
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

'use client';

import { MoreHorizontal, Sparkles, TrendingUp, Wallet, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AiInsightItem {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionId: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
}

interface AdvancedAiAssistantPanelProps {
    insights: AiInsightItem[];
    onAction?: (actionId: string) => void;
    className?: string;
}

const DEFAULT_INSIGHTS: AiInsightItem[] = [
    {
        id: 'restock',
        title: 'Restock fast movers',
        description: 'Review low-stock SKUs and replenish before demand spikes.',
        actionLabel: 'View Details',
        actionId: 'inventory',
        icon: Package,
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
    },
    {
        id: 'collections',
        title: 'Payment Due',
        description: 'Follow up on overdue invoices to protect cash flow.',
        actionLabel: 'Pay Now',
        actionId: 'invoices',
        icon: Wallet,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
    },
    {
        id: 'growth',
        title: 'Revenue Opportunity',
        description: 'Bundle high-margin items to lift average order value.',
        actionLabel: 'View Details',
        actionId: 'reports',
        icon: TrendingUp,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
];

export function AdvancedAiAssistantPanel({
    insights,
    onAction,
    className,
}: AdvancedAiAssistantPanelProps) {
    const displayInsights = insights.length > 0 ? insights.slice(0, 3) : DEFAULT_INSIGHTS;

    return (
        <Card className={cn('flex flex-col border border-slate-200/80 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
                            <CardTitle className="text-base font-semibold text-slate-900">AI Assistant</CardTitle>
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                Beta
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Here are smart insights for your business</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 p-3">
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/40 p-2">
                    {displayInsights.map((insight) => (
                        <div
                            key={insight.id}
                            className="flex items-start gap-3 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
                        >
                            <div
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                    insight.iconBg
                                )}
                            >
                                <insight.icon className={cn('h-4 w-4', insight.iconColor)} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                                <p className="mt-0.5 text-xs leading-snug text-slate-500">{insight.description}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1.5 h-7 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => onAction?.(insight.actionId)}
                                >
                                    {insight.actionLabel}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => onAction?.('reports')}
                    className="text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                    View All Insights →
                </button>
            </CardContent>
        </Card>
    );
}

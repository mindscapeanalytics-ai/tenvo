'use client';

import { memo, useEffect, useState } from 'react';
import { Clock, CreditCard, FileText, RefreshCw, UserPlus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';
import { useClientMounted } from '@/lib/hooks/useClientMounted';
import { cn } from '@/lib/utils';

const VISIBLE_ROWS = 5;

type ActivityType = 'invoice' | 'payment' | 'customer' | 'alert' | string;

interface ActivityItem {
    id?: string | number;
    type?: ActivityType;
    description?: string;
    amount?: number;
    status?: string;
    date?: string | Date;
}

interface AdvancedRecentActivityCardProps {
    businessId?: string;
    onViewAll?: () => void;
    feedLimit?: number;
    initialActivities?: ActivityItem[];
    awaitBootstrap?: boolean;
    currency?: string;
    className?: string;
}

function formatRelativeTime(date: string | Date | undefined): string {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';
    const diffMs = Date.now() - parsed.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RelativeTimeLabel({ date }: { date?: string | Date }) {
    const mounted = useClientMounted();
    if (!mounted) {
        return <span className="text-[11px] text-slate-400">&nbsp;</span>;
    }
    return <span className="text-[11px] text-slate-400">{formatRelativeTime(date)}</span>;
}

function ActivityIcon({ type }: { type?: ActivityType }) {
    switch (type) {
        case 'invoice':
            return <FileText className="h-3.5 w-3.5 text-blue-600" />;
        case &apos;payment&apos;:
            return <CreditCard className="h-3.5 w-3.5 text-emerald-600" />;
        case &apos;customer&apos;:
            return <UserPlus className="h-3.5 w-3.5 text-violet-600" />;
        case &apos;alert&apos;:
            return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
        default:
            return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
}

function iconBg(type?: ActivityType): string {
    switch (type) {
        case 'invoice':
            return 'bg-blue-50';
        case 'payment':
            return 'bg-emerald-50';
        case 'customer':
            return 'bg-violet-50';
        case 'alert':
            return 'bg-amber-50';
        default:
            return 'bg-slate-50';
    }
}

export const AdvancedRecentActivityCard = memo(function AdvancedRecentActivityCard({
    businessId,
    onViewAll,
    feedLimit = 25,
    initialActivities,
    awaitBootstrap = false,
    currency = 'PKR',
    className,
}: AdvancedRecentActivityCardProps) {
    const resolvedBusinessId = useResolvedBusinessId(businessId);
    const hasInitial = initialActivities !== undefined;
    const [activities, setActivities] = useState<ActivityItem[]>(hasInitial ? initialActivities || [] : []);
    const [loading, setLoading] = useState(awaitBootstrap ? !hasInitial : !hasInitial);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (hasInitial) {
            setActivities(initialActivities || []);
            setLoading(false);
        }
    }, [hasInitial, initialActivities]);

    useEffect(() => {
        if (!resolvedBusinessId || hasInitial || awaitBootstrap) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getUnifiedActivityFeedAction(resolvedBusinessId, feedLimit);
                if (!cancelled && res.success) setActivities(res.data);
            } catch (e) {
                console.error('Failed to load activity feed', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resolvedBusinessId, feedLimit, hasInitial, awaitBootstrap]);

    const refresh = async () => {
        if (!resolvedBusinessId || refreshing) return;
        setRefreshing(true);
        try {
            const res = await getUnifiedActivityFeedAction(resolvedBusinessId, feedLimit);
            if (res.success) setActivities(res.data);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={cn('border border-slate-200/80 bg-white shadow-sm animate-pulse', className)}>
                <CardHeader className="border-b border-slate-100 px-4 py-3">
                    <div className="h-5 w-32 bg-slate-100 rounded" />
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                    {Array.from({ length: VISIBLE_ROWS }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 bg-slate-100 rounded" />
                                <div className="h-2 w-1/4 bg-slate-50 rounded" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col border border-slate-200/80 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-slate-900">Recent Activity</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400"
                            onClick={() => void refresh()}
                            disabled={refreshing}
                            aria-label="Refresh activity"
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                        </Button>
                        {onViewAll ? (
                            <button
                                type="button"
                                onClick={onViewAll}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                View All
                            </button>
                        ) : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                {activities.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">No recent activity yet</p>
                ) : (
                    <ul className="divide-y divide-slate-50">
                        {activities.slice(0, VISIBLE_ROWS).map((item) => (
                            <li key={String(item.id)} className="flex items-start gap-3 px-4 py-3">
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                        iconBg(item.type)
                                    )}
                                >
                                    <ActivityIcon type={item.type} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {item.description || 'Activity'}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {Number(item.amount) > 0 ? (
                                        <p className="text-xs font-semibold tabular-nums text-emerald-600">
                                            {currency} {Number(item.amount).toLocaleString()}
                                        </p>
                                    ) : null}
                                    <RelativeTimeLabel date={item.date} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
});

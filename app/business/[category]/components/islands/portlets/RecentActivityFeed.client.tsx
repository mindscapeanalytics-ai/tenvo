'use client';

import { memo, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { FileText, CreditCard, UserPlus, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/** ~5 compact rows; remaining items scroll inside the list. */
const VISIBLE_ACTIVITY_ROWS = 5;
const ACTIVITY_ROW_CLASS = 'flex min-h-[2.5rem] items-center gap-2.5 border-b border-slate-100 py-1.5 last:border-b-0';
const ACTIVITY_LIST_MAX_HEIGHT_CLASS = 'max-h-[12.5rem]';

interface RecentActivityFeedProps {
    businessId?: string;
    onViewAll?: () => void;
    /** How many events to load from the server */
    feedLimit?: number;
    /** Max rows visible before scrolling (default 5) */
    visibleRows?: number;
    className?: string;
}

type ActivityType = 'invoice' | 'payment' | 'customer' | 'alert' | 'system';

interface ActivityItem {
    id: string | number;
    type?: ActivityType;
    description?: string;
    date?: string | Date;
    amount?: number;
    status?: string;
}

function formatRelativeDate(dateValue?: string | Date): string {
    if (!dateValue) return 'just now';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'just now';
    return formatDistanceToNow(parsed, { addSuffix: true });
}

export const RecentActivityFeed = memo(function RecentActivityFeed({
    businessId,
    onViewAll,
    feedLimit = 40,
    visibleRows = VISIBLE_ACTIVITY_ROWS,
    className,
}: RecentActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const listMaxHeightClass =
        visibleRows === 5 ? ACTIVITY_LIST_MAX_HEIGHT_CLASS : undefined;
    const listMaxHeightStyle =
        visibleRows !== 5 ? { maxHeight: `${visibleRows * 2.5}rem` } : undefined;

    useEffect(() => {
        if (!businessId) return;

        const fetchActivity = async () => {
            try {
                const res = await getUnifiedActivityFeedAction(businessId, feedLimit);
                if (res.success) {
                    setActivities(res.data);
                }
            } catch (error) {
                console.error('Failed to load activity feed', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [businessId, feedLimit]);

    const getIcon = (type?: ActivityType) => {
        switch (type) {
            case 'invoice':
                return <FileText className="h-3.5 w-3.5 text-brand-primary" />;
            case 'payment':
                return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />;
            case 'customer':
                return <UserPlus className="h-3.5 w-3.5 text-brand-primary" />;
            case 'alert':
                return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
            default:
                return <Clock className="h-3.5 w-3.5 text-slate-400" />;
        }
    };

    const getBg = (type?: ActivityType) => {
        switch (type) {
            case 'invoice':
                return 'bg-brand-50';
            case 'payment':
                return 'bg-emerald-50';
            case 'customer':
                return 'bg-brand-50';
            case 'alert':
                return 'bg-amber-50';
            default:
                return 'bg-slate-50';
        }
    };

    if (loading) {
        return (
            <Card className={cn('flex flex-col border border-slate-200 bg-white shadow-sm', className)}>
                <CardHeader className="shrink-0 border-b border-slate-100 px-3.5 py-2">
                    <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col p-0">
                    <div
                        className={cn(
                            'overflow-hidden px-3.5 py-1',
                            listMaxHeightClass
                        )}
                        style={listMaxHeightStyle}
                    >
                        <div className="flex flex-col">
                            {Array.from({ length: visibleRows }, (_, i) => (
                                <div key={i} className={cn(ACTIVITY_ROW_CLASS, 'animate-pulse border-slate-50')}>
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="h-2.5 w-[80%] max-w-[12rem] rounded bg-slate-100" />
                                        <div className="h-2 w-1/3 rounded bg-slate-50" />
                                    </div>
                                    <div className="h-5 w-16 shrink-0 rounded bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="shrink-0 border-t border-slate-100 px-3.5 pb-2.5 pt-1.5">
                        <div className="h-8 w-full animate-pulse rounded-lg bg-slate-100" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card className={cn('flex flex-col border border-slate-200 bg-white shadow-sm', className)}>
                <CardHeader className="shrink-0 border-b border-slate-100 px-3.5 py-2">
                    <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center px-3.5 py-8 text-center text-xs italic text-slate-400">
                    No recent activity recorded.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col border border-slate-200 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-3.5 py-2">
                <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <ul
                    className={cn(
                        'min-h-0 flex-1 list-none overflow-y-auto overscroll-y-contain px-3.5 py-1 [scrollbar-gutter:stable]',
                        !className?.includes('h-full') && listMaxHeightClass
                    )}
                    style={className?.includes('h-full') ? undefined : listMaxHeightStyle}
                    aria-label="Recent activity list"
                >
                    {activities.map((item) => (
                        <li key={item.id} className={ACTIVITY_ROW_CLASS}>
                            <div
                                className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                                    getBg(item.type)
                                )}
                            >
                                {getIcon(item.type)}
                            </div>
                            <div className="min-w-0 flex-1 pr-1">
                                <p className="truncate text-[11px] font-semibold leading-tight text-slate-700">
                                    {item.description}
                                </p>
                                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                                    {formatRelativeDate(item.date)}
                                </span>
                            </div>
                            {Number(item.amount || 0) > 0 ? (
                                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-right text-[10px] font-semibold tabular-nums text-slate-600">
                                    {item.status === 'warning'
                                        ? Number(item.amount || 0)
                                        : `PKR ${Number(item.amount || 0).toLocaleString()}`}
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
                <div className="shrink-0 border-t border-slate-100 px-3.5 pb-2.5 pt-1.5">
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="w-full rounded-full border border-slate-200 bg-white py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    >
                        View All Activity
                    </button>
                </div>
            </CardContent>
        </Card>
    );
});

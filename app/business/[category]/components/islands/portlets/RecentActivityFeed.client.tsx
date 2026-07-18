'use client';

import React, { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, FileText, CreditCard, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { cn } from '@/lib/utils';

const VISIBLE_ACTIVITY_ROWS = 5;
const ACTIVITY_LIST_MAX_HEIGHT_CLASS = 'max-h-[12.5rem]';
const ACTIVITY_ROW_CLASS = 'flex items-center gap-2.5 border-b border-slate-50 py-2 last:border-0';

type ActivityType = 'invoice' | 'payment' | 'customer' | 'alert' | string;

interface ActivityItem {
    id?: string | number;
    type?: ActivityType;
    description?: string;
    amount?: number;
    status?: string;
    date?: string | Date;
    iconType?: string;
}

interface RecentActivityFeedProps {
    businessId?: string;
    onViewAll?: () => void;
    feedLimit?: number;
    visibleRows?: number;
    className?: string;
    /** When provided (including empty array), skip cold self-fetch — hub shell bootstrap path. */
    initialActivities?: ActivityItem[] | null;
    /** When true, stay in skeleton until initialActivities is defined (hub Overview). */
    awaitBootstrap?: boolean;
}

export const RecentActivityFeed = memo(function RecentActivityFeed({
    businessId,
    onViewAll,
    feedLimit = 40,
    visibleRows = VISIBLE_ACTIVITY_ROWS,
    className,
    initialActivities,
    awaitBootstrap = false,
}: RecentActivityFeedProps) {
    const hasInitial = initialActivities !== undefined && initialActivities !== null;
    const [activities, setActivities] = useState<ActivityItem[]>(
        hasInitial ? initialActivities : []
    );
    const [loading, setLoading] = useState(awaitBootstrap ? !hasInitial : !hasInitial);
    const [refreshing, setRefreshing] = useState(false);
    const listMaxHeightClass =
        visibleRows === 5 ? ACTIVITY_LIST_MAX_HEIGHT_CLASS : undefined;
    const listMaxHeightStyle =
        visibleRows !== 5 ? { maxHeight: `${visibleRows * 2.5}rem` } : undefined;

    useEffect(() => {
        if (hasInitial) {
            setActivities(initialActivities || []);
            setLoading(false);
        }
    }, [hasInitial, initialActivities]);

    useEffect(() => {
        if (!businessId || hasInitial || awaitBootstrap) return;

        let cancelled = false;
        const fetchActivity = async () => {
            try {
                const res = await getUnifiedActivityFeedAction(businessId, feedLimit);
                if (cancelled) return;
                if (res.success) {
                    setActivities(res.data);
                }
            } catch (error) {
                console.error('Failed to load activity feed', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchActivity();
        return () => {
            cancelled = true;
        };
    }, [businessId, feedLimit, hasInitial, awaitBootstrap]);

    const refresh = async () => {
        if (!businessId || refreshing) return;
        setRefreshing(true);
        try {
            const res = await getUnifiedActivityFeedAction(businessId, feedLimit);
            if (res.success) {
                setActivities(res.data);
            }
        } catch (error) {
            console.error('Failed to refresh activity feed', error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

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
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col border border-slate-200 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-3.5 py-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Recent Activity
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                            onClick={() => void refresh()}
                            disabled={refreshing || !businessId}
                            aria-label="Refresh activity"
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                        </Button>
                        {onViewAll ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] font-semibold text-slate-500"
                                onClick={onViewAll}
                            >
                                View all
                            </Button>
                        ) : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col p-0">
                <div
                    className={cn('overflow-y-auto px-3.5 py-1', listMaxHeightClass)}
                    style={listMaxHeightStyle}
                >
                    {activities.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">No recent activity yet</p>
                    ) : (
                        <div className="flex flex-col">
                            {activities.slice(0, Math.max(visibleRows, activities.length)).map((item) => (
                                <div key={String(item.id)} className={ACTIVITY_ROW_CLASS}>
                                    <div
                                        className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                                            getBg(item.type)
                                        )}
                                    >
                                        {getIcon(item.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-slate-800">
                                            {item.description || 'Activity'}
                                        </p>
                                        <p className="truncate text-[10px] text-slate-400">
                                            {item.date
                                                ? new Date(item.date).toLocaleString(undefined, {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : ''}
                                        </p>
                                    </div>
                                    {Number(item.amount) > 0 ? (
                                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-600">
                                            {Number(item.amount).toLocaleString()}
                                        </span>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

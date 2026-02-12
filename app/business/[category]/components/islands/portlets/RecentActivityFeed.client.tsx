'use client';

import { memo, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getUnifiedActivityFeedAction } from '@/lib/actions/basic/audit';
import { FileText, CreditCard, UserPlus, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityFeedProps {
    businessId?: string;
}

export const RecentActivityFeed = memo(function RecentActivityFeed({ businessId }: RecentActivityFeedProps) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!businessId) return;

        const fetchActivity = async () => {
            try {
                const res = await getUnifiedActivityFeedAction(businessId, 6);
                if (res.success) {
                    setActivities(res.data);
                }
            } catch (error) {
                console.error("Failed to load activity feed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [businessId]);

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                            <div className="h-2 bg-slate-50 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 text-xs italic">
                No recent activity recorded.
            </div>
        );
    }

    const getIcon = (type: any) => {
        switch (type) {
            case 'invoice': return <FileText className="w-3.5 h-3.5 text-blue-500" />;
            case 'payment': return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
            case 'customer': return <UserPlus className="w-3.5 h-3.5 text-purple-500" />;
            case 'alert': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
            default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    const getBg = (type: any) => {
        switch (type) {
            case 'invoice': return 'bg-blue-50';
            case 'payment': return 'bg-emerald-50';
            case 'customer': return 'bg-purple-50';
            case 'alert': return 'bg-amber-50';
            default: return 'bg-slate-50';
        }
    };

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 py-2 border-b border-slate-100 mb-2">
                <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {activities.map((item) => (
                    <div key={item.id} className="flex gap-3 group items-start">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", getBg(item.type))}>
                            {getIcon(item.type)}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors truncate">
                                {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                </span>
                                {item.amount > 0 && (
                                    <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.status === 'warning' ? item.amount : `PKR ${item.amount.toLocaleString()}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <button className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-wine uppercase tracking-wider transition-colors py-2 border border-slate-100 rounded-lg hover:border-wine/20 hover:bg-wine/5">
                        View All Activity
                    </button>
                </div>
            </CardContent>
        </Card>
    );
});

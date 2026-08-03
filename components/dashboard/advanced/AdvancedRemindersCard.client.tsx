'use client';

import { ArrowRight, Clock, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RemindersData {
    lowStock?: number;
    overdueInvoices?: number;
    pendingOrders?: number;
}

interface AdvancedRemindersCardProps {
    data?: RemindersData;
    onItemClick?: (id: string) => void;
    isLoading?: boolean;
    className?: string;
}

export function AdvancedRemindersCard({
    data = {},
    onItemClick,
    isLoading = false,
    className,
}: AdvancedRemindersCardProps) {
    const items = [
        {
            id: 'low-stock',
            label: 'Items to Reorder',
            count: data.lowStock || 0,
            icon: Package,
            tone: 'text-rose-600',
            bg: 'bg-rose-50',
        },
        {
            id: 'overdue',
            label: 'Overdue Invoices',
            count: data.overdueInvoices || 0,
            icon: Clock,
            tone: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            id: 'pending-orders',
            label: 'Pending Orders',
            count: data.pendingOrders || 0,
            icon: ShoppingCart,
            tone: 'text-blue-700',
            bg: 'bg-blue-50',
        },
    ];

    return (
        <Card className={cn('border border-slate-200/80 bg-white shadow-sm', className)}>
            <CardHeader className="border-b border-slate-100 px-4 py-3">
                <CardTitle className="text-base font-semibold text-slate-900">Reminders</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-50 p-0">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex animate-pulse items-center justify-between gap-2 px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-slate-100" />
                                  <div className="h-3.5 w-28 rounded bg-slate-100" />
                              </div>
                              <div className="h-5 w-6 rounded bg-slate-100" />
                          </div>
                      ))
                    : items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onItemClick?.(item.id)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50/80"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', item.bg)}>
                                <item.icon className={cn('h-4 w-4', item.tone)} aria-hidden />
                            </div>
                            <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span className={cn('text-base font-semibold tabular-nums', item.count > 0 ? item.tone : 'text-slate-300')}>
                                {item.count}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
                        </div>
                    </button>
                ))}
            </CardContent>
        </Card>
    );
}

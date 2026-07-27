'use client';

import { AlertTriangle, Boxes, Coins, PackageX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface InventoryHealthTile {
    label: string;
    value: number | string;
    actionLabel?: string;
    actionId?: string;
    actionTone?: 'rose' | 'teal' | 'blue' | 'amber';
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
}

interface AdvancedInventoryHealthCardProps {
    tiles: InventoryHealthTile[];
    onAction?: (actionId: string) => void;
    isLoading?: boolean;
    className?: string;
}

const ACTION_TONE_CLASS = {
    rose: 'text-rose-600 hover:text-rose-700',
    teal: 'text-teal-600 hover:text-teal-700',
    blue: 'text-blue-600 hover:text-blue-700',
    amber: 'text-amber-600 hover:text-amber-700',
} as const;

function InventoryTile({
    tile,
    bordered,
    onAction,
}: {
    tile: InventoryHealthTile;
    bordered?: 'right' | 'bottom' | 'both';
    onAction?: (actionId: string) => void;
}) {
    const actionClass = tile.actionTone ? ACTION_TONE_CLASS[tile.actionTone] : 'text-blue-600 hover:text-blue-700';

    return (
        <div
            className={cn(
                'flex min-h-[72px] items-start gap-2.5 p-3',
                bordered === 'right' && 'border-r border-slate-100',
                bordered === 'bottom' && 'border-b border-slate-100',
                bordered === 'both' && 'border-r border-b border-slate-100'
            )}
        >
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tile.iconBg)}>
                <tile.icon className={cn('h-3.5 w-3.5', tile.iconColor)} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-500">{tile.label}</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{tile.value}</p>
                {tile.actionLabel && tile.actionId ? (
                    <button
                        type="button"
                        onClick={() => onAction?.(tile.actionId!)}
                        className={cn('mt-0.5 text-[11px] font-semibold hover:underline', actionClass)}
                    >
                        {tile.actionLabel}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export function AdvancedInventoryHealthCard({
    tiles,
    onAction,
    isLoading = false,
    className,
}: AdvancedInventoryHealthCardProps) {
    const defaultTiles: InventoryHealthTile[] = [
        {
            label: 'Low Stock Items',
            value: 0,
            actionLabel: 'View Items',
            actionId: 'inventory',
            actionTone: 'rose',
            icon: AlertTriangle,
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
        },
        {
            label: 'Out of Stock Items',
            value: 0,
            actionLabel: 'View Items',
            actionId: 'inventory',
            actionTone: 'teal',
            icon: PackageX,
            iconBg: 'bg-teal-50',
            iconColor: 'text-teal-600',
        },
        {
            label: 'Total Items',
            value: 0,
            actionLabel: 'All Items',
            actionId: 'inventory',
            actionTone: 'blue',
            icon: Boxes,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Inventory Value',
            value: '—',
            actionLabel: 'View Report',
            actionId: 'reports',
            actionTone: 'amber',
            icon: Coins,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
    ];

    const displayTiles = tiles.length >= 4 ? tiles.slice(0, 4) : defaultTiles;

    if (isLoading) {
        return (
            <Card className={cn('rounded-xl border border-slate-200/90 bg-white shadow-sm animate-pulse', className)}>
                <CardHeader className="border-b border-slate-100 px-3 py-2.5">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 p-0">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[72px] border border-slate-50 p-3" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm', className)}>
            <CardHeader className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-slate-900">Inventory Health</CardTitle>
                    <button
                        type="button"
                        onClick={() => onAction?.('inventory')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        View All
                    </button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 p-0">
                <InventoryTile tile={displayTiles[0]!} bordered="both" onAction={onAction} />
                <InventoryTile tile={displayTiles[1]!} bordered="bottom" onAction={onAction} />
                <InventoryTile tile={displayTiles[2]!} bordered="right" onAction={onAction} />
                <InventoryTile tile={displayTiles[3]!} onAction={onAction} />
            </CardContent>
        </Card>
    );
}

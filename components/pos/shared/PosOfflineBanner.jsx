'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PosOfflineBanner({
    isOnline,
    pendingCount = 0,
    isSyncing = false,
    catalogReady = true,
    offlineEnabled = true,
    onSync,
    className,
}) {
    if (!offlineEnabled) return null;
    if (isOnline && pendingCount <= 0) return null;

    let message;
    if (!isOnline && !catalogReady) {
        message = 'Offline - product cache missing. Reconnect to enable sales.';
    } else if (!isOnline) {
        message = 'Offline - sales will queue and sync when connected';
    } else {
        message = `${pendingCount} offline sale${pendingCount === 1 ? '' : 's'} pending sync`;
    }

    return (
        <div
            className={cn(
                'mx-3 mt-2 px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2',
                isOnline
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-800',
                className
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{message}</span>
            </div>
            {isOnline && pendingCount > 0 && onSync && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] shrink-0"
                    disabled={isSyncing}
                    onClick={onSync}
                >
                    <RefreshCw className={cn('w-3 h-3 mr-1', isSyncing && 'animate-spin')} />
                    Sync
                </Button>
            )}
        </div>
    );
}

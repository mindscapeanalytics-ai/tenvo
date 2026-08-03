'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Compact offline / pending-sync banner for Route Hisab.
 */
export function MilkHisabOfflineBanner({
  isOnline,
  pendingCount = 0,
  isSyncing = false,
  daySnapshotReady = true,
  offlineEnabled = true,
  view = 'daily',
  onSync,
  className,
}) {
  if (!offlineEnabled) return null;
  if (isOnline && pendingCount <= 0) return null;

  let message;
  if (!isOnline && view === 'daily' && !daySnapshotReady) {
    message = 'Offline — open this day once while online so the route sheet can work offline.';
  } else if (!isOnline && view === 'bills') {
    message =
      'Offline — showing cached bills if available. Generate, reminders, and new sync need internet.';
  } else if (!isOnline) {
    message = 'Offline — day edits will queue and sync when you are back online.';
  } else {
    message = `${pendingCount} day sheet${pendingCount === 1 ? '' : 's'} waiting to sync`;
  }

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-between gap-2',
        isOnline
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-rose-200 bg-rose-50 text-rose-900',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      {isOnline && pendingCount > 0 && onSync ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 text-[10px]"
          disabled={isSyncing}
          onClick={onSync}
        >
          <RefreshCw className={cn('mr-1 h-3 w-3', isSyncing && 'animate-spin')} />
          Sync
        </Button>
      ) : null}
    </div>
  );
}

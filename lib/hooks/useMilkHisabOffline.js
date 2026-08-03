'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveMilkHisabDayAction } from '@/lib/actions/standard/milkHisab';
import {
  countPendingMilkHisabDaySaves,
  enqueueMilkHisabDaySave,
  incrementMilkHisabDaySaveAttempt,
  listPendingMilkHisabDaySaves,
  markMilkHisabDaySaveFailed,
  markMilkHisabDaySaveSynced,
  newMilkHisabClientRef,
} from '@/lib/utils/milkHisabOfflineQueue';
import {
  readMilkHisabDaySnapshot,
  writeMilkHisabDaySnapshot,
  readMilkHisabPeriodSnapshot,
  writeMilkHisabPeriodSnapshot,
} from '@/lib/utils/milkHisabOfflineCache';

const MAX_SYNC_ATTEMPTS = 8;

/**
 * Offline detection + day-save queue sync for Route Hisab.
 * `isOnline` always tracks the browser; queue/sync only when `enabled`.
 */
export function useMilkHisabOffline(businessId, { enabled = false } = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    if (!businessId || !enabled) {
      setPendingCount(0);
      return;
    }
    try {
      setPendingCount(await countPendingMilkHisabDaySaves(businessId));
    } catch {
      setPendingCount(0);
    }
  }, [businessId, enabled]);

  const syncPending = useCallback(async () => {
    if (!businessId || !enabled || syncingRef.current) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }
    syncingRef.current = true;
    setIsSyncing(true);
    let synced = 0;
    let failed = 0;
    try {
      const pending = await listPendingMilkHisabDaySaves(businessId);
      for (const row of pending) {
        try {
          const payload = row.payload || {};
          const res = await saveMilkHisabDayAction({
            businessId,
            category: payload.category || row.category,
            deliveryDate: payload.deliveryDate || row.deliveryDate,
            rows: payload.rows || [],
          });
          if (res?.success) {
            await markMilkHisabDaySaveSynced(row.id);
            synced += 1;
          } else {
            const errMsg = res?.error || 'Sync failed';
            const attempts = (row.attempts || 0) + 1;
            if (attempts >= MAX_SYNC_ATTEMPTS) {
              await markMilkHisabDaySaveFailed(row.id, errMsg);
              failed += 1;
            } else {
              await incrementMilkHisabDaySaveAttempt(row.id, errMsg);
            }
          }
        } catch (err) {
          const errMsg = err?.message || 'Sync failed';
          const attempts = (row.attempts || 0) + 1;
          if (attempts >= MAX_SYNC_ATTEMPTS) {
            await markMilkHisabDaySaveFailed(row.id, errMsg);
            failed += 1;
          } else {
            await incrementMilkHisabDaySaveAttempt(row.id, errMsg);
          }
        }
      }
      if (synced > 0) setLastSyncAt(new Date().toISOString());
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPending();
    }
    return { synced, failed };
  }, [businessId, enabled, refreshPending]);

  const queueDaySave = useCallback(
    async ({ category, deliveryDate, rows }) => {
      if (!businessId || !enabled) {
        throw new Error('Offline hisab not enabled');
      }
      const clientRef = newMilkHisabClientRef();
      await enqueueMilkHisabDaySave({
        businessId,
        category,
        deliveryDate,
        rows,
        clientRef,
      });
      await refreshPending();
      return { clientRef };
    },
    [businessId, enabled, refreshPending]
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    void refreshPending();
    return undefined;
  }, [enabled, refreshPending]);

  useEffect(() => {
    if (!enabled || !isOnline || pendingCount <= 0) return undefined;
    const t = window.setTimeout(() => {
      void syncPending();
    }, 600);
    return () => window.clearTimeout(t);
  }, [enabled, isOnline, pendingCount, syncPending]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncAt,
    refreshPending,
    syncPending,
    queueDaySave,
    cacheDaySnapshot: writeMilkHisabDaySnapshot,
    readDaySnapshot: readMilkHisabDaySnapshot,
    cachePeriodSnapshot: writeMilkHisabPeriodSnapshot,
    readPeriodSnapshot: readMilkHisabPeriodSnapshot,
  };
}
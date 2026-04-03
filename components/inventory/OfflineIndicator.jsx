'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getQueueStats, getUnresolvedConflicts } from '@/lib/utils/offlineQueue';

/**
 * OfflineIndicator Component
 * 
 * Displays online/offline status and queued operations count
 * Shows sync status and conflict alerts
 * 
 * Features:
 * - Real-time online/offline detection
 * - Queued operations count
 * - Sync status indicator
 * - Conflict resolution alerts
 * - Manual sync trigger
 * 
 * @param {Object} props
 * @param {Function} [props.onSyncRequest] - Callback when manual sync is requested
 * @param {boolean} [props.isSyncing] - Whether sync is in progress
 * @param {boolean} [props.compact] - Compact mode for mobile
 */
export function OfflineIndicator({ 
  onSyncRequest, 
  isSyncing = false,
  compact = false 
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStats, setQueueStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load queue stats and conflicts
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getQueueStats();
        setQueueStats(stats);

        const unresolvedConflicts = await getUnresolvedConflicts();
        setConflicts(unresolvedConflicts);
      } catch (error) {
        console.error('Failed to load queue stats:', error);
      }
    };

    loadStats();

    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && queueStats?.pending > 0 && onSyncRequest && !isSyncing) {
      onSyncRequest();
    }
  }, [isOnline, queueStats?.pending, onSyncRequest, isSyncing]);

  const hasPendingOperations = queueStats && queueStats.pending > 0;
  const hasConflicts = conflicts.length > 0;

  // Compact mode for mobile
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!isOnline && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </Badge>
        )}
        {hasPendingOperations && (
          <Badge variant="warning" className="flex items-center gap-1 bg-orange-500 text-white">
            <Cloud className="w-3 h-3" />
            {queueStats.pending}
          </Badge>
        )}
        {hasConflicts && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {conflicts.length}
          </Badge>
        )}
      </div>
    );
  }

  // Full mode for desktop
  return (
    <div className="relative">
      <div 
        className="flex items-center gap-3 p-2 rounded-lg border bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Online/Offline Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Offline</span>
            </>
          )}
        </div>

        {/* Sync Status */}
        {isSyncing && (
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-600">Syncing...</span>
          </div>
        )}

        {/* Queued Operations */}
        {hasPendingOperations && !isSyncing && (
          <Badge variant="warning" className="bg-orange-500 text-white">
            {queueStats.pending} queued
          </Badge>
        )}

        {/* Conflicts */}
        {hasConflicts && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
          </Badge>
        )}

        {/* All synced indicator */}
        {isOnline && !hasPendingOperations && !isSyncing && queueStats && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">All synced</span>
          </div>
        )}
      </div>

      {/* Details Dropdown */}
      {showDetails && queueStats && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Queue Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-orange-600">{queueStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Syncing:</span>
                  <span className="font-medium text-blue-600">{queueStats.syncing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{queueStats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{queueStats.failed}</span>
                </div>
              </div>
            </div>

            {queueStats.oldestPending && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">
                  Oldest pending: {new Date(queueStats.oldestPending.timestamp).toLocaleString()}
                </p>
              </div>
            )}

            {hasConflicts && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Concurrent updates require manual resolution
                </p>
              </div>
            )}

            {isOnline && hasPendingOperations && onSyncRequest && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSyncRequest();
                  setShowDetails(false);
                }}
                disabled={isSyncing}
                className="w-full bg-wine hover:bg-wine/90"
                size="sm"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}

            {!isOnline && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-orange-600">
                  <CloudOff className="w-4 h-4" />
                  <span className="text-xs">
                    Operations will sync automatically when connection is restored
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

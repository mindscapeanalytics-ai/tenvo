'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SyncIndicator Component
 * 
 * Displays real-time sync status for multi-location inventory
 * Shows last synced timestamp and connection status
 * 
 * @param {Object} props
 * @param {boolean} props.syncing - Whether sync is in progress
 * @param {Date|null} props.lastSyncTime - Last successful sync timestamp
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.compact] - Compact mode (icon only)
 */
export function SyncIndicator({ syncing, lastSyncTime, className, compact = false }) {
  const [timeAgo, setTimeAgo] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Update time ago every second
  useEffect(() => {
    if (!lastSyncTime) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now - lastSyncTime) / 1000); // seconds

      if (diff < 5) {
        setTimeAgo('just now');
      } else if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine status color and icon
  const getStatus = () => {
    if (!isOnline) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        icon: WifiOff,
        label: 'Offline'
      };
    }

    if (syncing) {
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        icon: RefreshCw,
        label: 'Syncing...'
      };
    }

    if (lastSyncTime) {
      const now = new Date();
      const diff = Math.floor((now - lastSyncTime) / 1000);

      // Warning if last sync was more than 5 seconds ago
      if (diff > 5) {
        return {
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          icon: Wifi,
          label: `Synced ${timeAgo}`
        };
      }

      return {
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        icon: Wifi,
        label: `Synced ${timeAgo}`
      };
    }

    return {
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      icon: Wifi,
      label: 'Not synced'
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full p-1.5',
          status.bgColor,
          className
        )}
        title={status.label}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            status.color,
            syncing && 'animate-spin'
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm',
        status.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          status.color,
          syncing && 'animate-spin'
        )}
      />
      <span className={cn('font-medium', status.color)}>
        {status.label}
      </span>
    </div>
  );
}

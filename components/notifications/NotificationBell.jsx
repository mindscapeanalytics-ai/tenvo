'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ShoppingCart, DollarSign, Package, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

// Simple distance formatter
function formatDistanceToNow(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const notificationIcons = {
  order: ShoppingCart,
  payment: DollarSign,
  inventory: Package,
  system: AlertCircle,
};

const notificationColors = {
  order: 'bg-blue-500/10 text-blue-500',
  payment: 'bg-green-500/10 text-green-500',
  inventory: 'bg-amber-500/10 text-amber-500',
  system: 'bg-red-500/10 text-red-500',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        
        {/* Connection Status */}
        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
          {isConnected ? (
            <Wifi className="h-2 w-2 text-white" />
          ) : (
            <WifiOff className="h-2 w-2 text-white" />
          )}
        </span>
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3 text-green-500" />
                        Live updates
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3 text-red-500" />
                        Disconnected
                      </span>
                    )}
                  </p>
                </div>
                
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Bell className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs text-gray-400">New orders will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      const colorClass = notificationColors[notification.type] || 'bg-gray-500/10 text-gray-500';
                      
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.is_read ? 'bg-indigo-50/30' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-400 shrink-0">
                                  {formatDistanceToNow(notification.created_at)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>

                              {/* Metadata for orders */}
                              {notification.type === 'order' && notification.metadata && (
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">
                                    {notification.metadata.currency} {notification.metadata.total_amount}
                                  </span>
                                  <span>•</span>
                                  <span className="capitalize">{notification.metadata.status}</span>
                                </div>
                              )}

                              {/* Action Link */}
                              {notification.action_url && (
                                <Link
                                  href={notification.action_url}
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  View details →
                                </Link>
                              )}
                            </div>

                            {/* Dismiss Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/notifications"
                    className="text-xs text-center block text-gray-500 hover:text-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

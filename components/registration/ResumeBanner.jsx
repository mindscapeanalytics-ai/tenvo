'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Non-blocking banner shown when registration data is auto-resumed
 * Replaces the blocking DataRecoveryDialog for better UX
 */
export function ResumeBanner({ 
  onDismiss, 
  onStartFresh,
  savedAt,
  className 
}) {
  const formatRelativeTime = (date) => {
    if (!date) return 'earlier';
    
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Alert 
      variant="default" 
      className={cn(
        "relative border-blue-200 bg-blue-50/50 text-blue-900 animate-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <RotateCcw className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">
        Restored your registration
      </AlertTitle>
      <AlertDescription className="text-blue-800 text-sm">
        We recovered your progress from {formatRelativeTime(savedAt)}.
        <Button 
          variant="link" 
          size="sm"
          onClick={onStartFresh}
          className="h-auto p-0 ml-1 text-blue-700 hover:text-blue-900 underline font-medium"
        >
          Start fresh instead?
        </Button>
      </AlertDescription>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 rounded-md p-1 text-blue-600 hover:bg-blue-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

/**
 * Inline compact variant for mobile or less prominent placement
 */
export function ResumeToast({ 
  onDismiss, 
  savedAt 
}) {
  const formatRelativeTime = (date) => {
    if (!date) return 'earlier';
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60));
    if (minutes < 5) return 'a few minutes ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    return 'earlier today';
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800 animate-in slide-in-from-top-1 duration-200">
      <RotateCcw className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
      <span className="flex-1">
        Restored from {formatRelativeTime(savedAt)}
      </span>
      <button
        onClick={onDismiss}
        className="rounded-md p-0.5 text-blue-600 hover:bg-blue-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

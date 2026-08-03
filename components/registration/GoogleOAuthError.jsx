'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Contextual error messages for Google OAuth failures
 * Provides clear guidance and recovery options
 */
export function GoogleOAuthError({ 
  errorType = 'generic',
  onRetry,
  onDismiss,
  className 
}) {
  const errorConfig = {
    popup_closed: {
      title: 'Sign-in window closed',
      message: 'The Google sign-in window was closed before completing. Would you like to try again?',
      showRetry: true,
      icon: AlertTriangle
    },
    popup_blocked: {
      title: 'Pop-up blocked',
      message: 'Your browser blocked the Google sign-in window. Please enable pop-ups for this site and try again.',
      showRetry: true,
      icon: AlertTriangle
    },
    network_error: {
      title: 'Connection issue',
      message: 'Could not reach Google\'s servers. Please check your internet connection and try again.',
      showRetry: true,
      icon: AlertTriangle
    },
    access_denied: {
      title: 'Access denied',
      message: 'Google sign-in was cancelled or access was denied. You can try again or register with email below.',
      showRetry: true,
      icon: AlertTriangle
    },
    generic: {
      title: 'Sign-in unsuccessful',
      message: 'Google sign-in did not complete. This can happen if cookies are blocked or you\'re using private browsing mode.',
      showRetry: true,
      icon: AlertTriangle
    }
  };

  const config = errorConfig[errorType] || errorConfig.generic;
  const IconComponent = config.icon;

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "relative border-amber-300 bg-amber-50 text-amber-900 animate-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <IconComponent className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold">
        {config.title}
      </AlertTitle>
      <AlertDescription className="text-amber-800 text-sm">
        {config.message}
      </AlertDescription>
      
      {config.showRetry && onRetry && (
        <div className="mt-3 flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRetry}
            className="h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try Google again
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDismiss}
            className="h-8 text-amber-700 hover:bg-amber-100"
          >
            Use email instead
          </Button>
        </div>
      )}
      
      {onDismiss && !config.showRetry && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 rounded-md p-1 text-amber-600 hover:bg-amber-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}

/**
 * Compact inline variant for subtle placement
 */
export function GoogleOAuthErrorInline({ 
  errorType = 'generic',
  onRetry,
  onDismiss 
}) {
  const getMessage = (type) => {
    switch (type) {
      case 'popup_closed':
        return 'Sign-in window was closed';
      case 'popup_blocked':
        return 'Pop-up was blocked by your browser';
      case 'network_error':
        return 'Connection issue occurred';
      case 'access_denied':
        return 'Sign-in was cancelled';
      default:
        return 'Sign-in was unsuccessful';
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 animate-in fade-in duration-200">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
      <span className="flex-1">{getMessage(errorType)}</span>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-amber-700 hover:text-amber-900 font-medium underline text-xs"
        >
          Retry
        </button>
      )}
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-0.5 text-amber-600 hover:bg-amber-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

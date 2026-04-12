/**
 * ErrorState Component
 * 
 * Displays error state with retry functionality.
 * Used in widgets and data-fetching components.
 * 
 * Features:
 * - User-friendly error messages
 * - Retry button
 * - Error details (collapsible)
 * - Consistent styling
 * 
 * Usage:
 *   <ErrorState
 *     error={error}
 *     onRetry={handleRetry}
 *     message="Failed to load data"
 *   />
 */

'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ErrorHandlingService } from '@/lib/services/errorHandling';

export function ErrorState({
  error = null,
  message = null,
  onRetry = null,
  showDetails = false,
  className = ''
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // Get user-friendly error message
  const errorMessage = message || 
    (error ? ErrorHandlingService.getErrorMessage(error) : 'An error occurred');
  
  // Get error details
  const errorDetails = error ? {
    message: error.message,
    type: error.type || ErrorHandlingService.categorizeError(error),
    stack: error.stack
  } : null;
  
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Error icon */}
      <div className="mb-4 p-4 rounded-full bg-red-100">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      {/* Error message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {errorMessage}
      </h3>
      
      {/* Retry button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="default"
          className="mb-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
      
      {/* Error details (collapsible) */}
      {showDetails && errorDetails && (
        <div className="w-full max-w-md mt-4">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mx-auto"
          >
            {detailsExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Details
              </>
            )}
          </button>
          
          {detailsExpanded && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="font-semibold">Type:</span> {errorDetails.type}
                </div>
                <div>
                  <span className="font-semibold">Message:</span> {errorDetails.message}
                </div>
                {errorDetails.stack && (
                  <div>
                    <span className="font-semibold">Stack:</span>
                    <pre className="mt-1 text-xs overflow-auto max-h-32">
                      {errorDetails.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

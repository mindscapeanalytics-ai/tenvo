/**
 * WidgetContainer Component
 * 
 * Wrapper component for dashboard widgets providing consistent chrome,
 * error boundaries, and common functionality.
 * 
 * Features:
 * - Consistent header with title and icon
 * - Refresh button
 * - Error boundary
 * - Loading state
 * - Empty state handling
 * - Responsive design
 * 
 * Usage:
 *   <WidgetContainer
 *     title="Team Performance"
 *     icon={Users}
 *     onRefresh={handleRefresh}
 *     loading={isLoading}
 *     error={error}
 *   >
 *     <YourWidgetContent />
 *   </WidgetContainer>
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MoreVertical } from 'lucide-react';
import { ErrorState } from './ErrorState';
import { WidgetLoadingSkeleton } from './DashboardLoadingSkeleton';
import { EmptyState } from './EmptyState';
import { Component } from 'react';

/**
 * Error Boundary for widgets
 */
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          error={this.state.error}
          onRetry={this.props.onRetry}
          message="Widget failed to load"
        />
      );
    }

    return this.props.children;
  }
}

export function WidgetContainer({
  children,
  title,
  icon: Icon = null,
  onRefresh = null,
  onSettings = null,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  className = ''
}) {
  return (
    <Card className={`glass-card border-none ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-200">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <CardTitle className="text-sm font-bold">{title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {onSettings && (
              <Button
                onClick={onSettings}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Content */}
      <CardContent>
        <WidgetErrorBoundary onRetry={onRefresh}>
          {loading ? (
            <div className="py-4">
              <WidgetLoadingSkeleton />
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={onRefresh} />
          ) : empty ? (
            <EmptyState message={emptyMessage} />
          ) : (
            children
          )}
        </WidgetErrorBoundary>
      </CardContent>
    </Card>
  );
}

/**
 * DashboardLoadingSkeleton Component
 * 
 * Loading skeleton for dashboard components.
 * Provides visual feedback while data is being fetched.
 * 
 * Features:
 * - Configurable card count
 * - Grid or list layout
 * - Shimmer animation
 * - Responsive design
 * 
 * Usage:
 *   <DashboardLoadingSkeleton cardCount={4} layout="grid" />
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardLoadingSkeleton({
  cardCount = 4,
  layout = 'grid',
  className = ''
}) {
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    list: 'space-y-4',
    '2-col': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    '3-col': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
  };
  
  return (
    <div className={`${layoutClasses[layout] || layoutClasses.grid} ${className}`}>
      {Array.from({ length: cardCount }).map((_, index) => (
        <Card key={index} className="glass-card border-none">
          <CardContent className="p-6">
            {/* Label skeleton */}
            <Skeleton className="h-4 w-24 mb-2" />
            
            {/* Value skeleton */}
            <Skeleton className="h-8 w-32 mb-4" />
            
            {/* Trend/progress skeleton */}
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Widget Loading Skeleton
 * Specialized skeleton for individual widgets
 */
export function WidgetLoadingSkeleton({ className = '' }) {
  return (
    <Card className={`glass-card border-none ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Title skeleton */}
          <Skeleton className="h-5 w-32" />
          
          {/* Icon skeleton */}
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
        
        {/* Content skeletons */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Footer skeleton */}
        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Table Loading Skeleton
 * Specialized skeleton for table/list views
 */
export function TableLoadingSkeleton({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 flex-1" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Loading Skeleton
 * Specialized skeleton for chart components
 */
export function ChartLoadingSkeleton({ className = '' }) {
  return (
    <Card className={`glass-card border-none ${className}`}>
      <CardContent className="p-6">
        {/* Chart header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        {/* Chart area */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-end gap-2 h-32">
              {Array.from({ length: 7 }).map((_, barIndex) => (
                <Skeleton 
                  key={barIndex} 
                  className="flex-1" 
                  style={{ 
                    height: `${Math.random() * 80 + 20}%` 
                  }} 
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Chart legend */}
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

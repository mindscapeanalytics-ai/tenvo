/**
 * StatsCard Component
 * 
 * Reusable card component for displaying individual statistics/metrics.
 * Used as building block for DashboardStatsGrid.
 * 
 * Features:
 * - Displays label, value, icon, and trend
 * - Supports color themes
 * - Click handler for navigation
 * - Responsive design
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'default',
  trend = null,
  onClick = null,
  className = ''
}) {
  // Color theme mappings
  const colorClasses = {
    default: 'bg-gray-50 border-gray-200 text-gray-900',
    primary: 'bg-wine-50 border-wine-200 text-slate-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  };
  
  const iconColorClasses = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-wine-100 text-wine-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  };
  
  // Trend indicator
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const trendValue = typeof trend === 'object' ? trend.value : trend;
    
    if (trendValue > 0) {
      return <ArrowUp className="w-4 h-4 text-green-600" />;
    } else if (trendValue < 0) {
      return <ArrowDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getTrendText = () => {
    if (!trend) return null;
    
    const trendValue = typeof trend === 'object' ? trend.value : trend;
    const trendLabel = typeof trend === 'object' ? trend.label : '';
    
    const absValue = Math.abs(trendValue);
    const trendColor = trendValue > 0 ? 'text-green-600' : trendValue < 0 ? 'text-red-600' : 'text-gray-400';
    
    return (
      <span className={cn('text-xs font-medium', trendColor)}>
        {absValue}% {trendLabel}
      </span>
    );
  };
  
  return (
    <Card
      className={cn(
        'glass-card border transition-all duration-200',
        colorClasses[color] || colorClasses.default,
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold mb-2">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {getTrendText()}
              </div>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              'p-2.5 rounded-2xl',
              iconColorClasses[color] || iconColorClasses.default
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

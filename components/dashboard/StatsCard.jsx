'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

/**
 * Stats Card Component
 * Professional stat card following shadcn/ui dashboard patterns
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Stat value
 * @param {string} props.description - Description text
 * @param {LucideIcon} props.icon - Icon component
 * @param {string} props.change - Change percentage (e.g., "+20.1%")
 * @param {'up'|'down'|'neutral'} props.trend - Trend direction
 * @param {string} props.currency - Currency code
 * @param {Object} props.colors - Color scheme
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  change,
  trend = 'neutral',
  currency = 'PKR',
  colors = {},
  className,
}) {
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /[\d,]+/.test(value));
  const displayValue = isNumeric && typeof value === 'number'
    ? formatCurrency(value, currency)
    : value;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && (
          <div
            className="rounded-lg p-2"
            style={{
              backgroundColor: colors.bg || 'rgba(59, 130, 246, 0.1)',
            }}
          >
            <Icon
              className="h-4 w-4"
              style={{
                color: colors.icon || colors.primary || '#3B82F6',
              }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: colors.text || '#111827' }}>
          {displayValue}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-gray-600'
              )}
            >
              {change}
            </span>
            <span className="text-xs text-gray-500">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


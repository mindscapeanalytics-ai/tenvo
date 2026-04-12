/**
 * DashboardStatsGrid Component
 * 
 * Reusable grid component for displaying multiple statistics.
 * Eliminates duplication of stats grid implementations across dashboards.
 * 
 * Features:
 * - Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
 * - Accepts array of stat objects
 * - Supports color themes
 * - Click handlers for individual stats
 * - Consistent styling across all dashboards
 * 
 * Usage:
 *   <DashboardStatsGrid
 *     stats={[
 *       { label: 'Total Revenue', value: '₨50,000', icon: DollarSign, trend: { value: 12, label: 'vs last month' } },
 *       { label: 'Products', value: '150', icon: Package, color: 'primary' }
 *     ]}
 *     colorTheme="default"
 *     onStatClick={(stat) => console.log('Clicked:', stat)}
 *   />
 */

'use client';

import { StatsCard } from './StatsCard';

export function DashboardStatsGrid({
  stats = [],
  colorTheme = 'default',
  onStatClick = null,
  className = ''
}) {
  if (!stats || stats.length === 0) {
    return null;
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.id || index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color || colorTheme}
          trend={stat.trend}
          onClick={onStatClick ? () => onStatClick(stat) : null}
        />
      ))}
    </div>
  );
}

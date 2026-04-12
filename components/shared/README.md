# Shared Dashboard Components

This directory contains reusable components for building dashboard interfaces. These components provide consistent styling, error handling, and functionality across all dashboard templates.

## Components

### DashboardStatsGrid

Grid layout for displaying multiple stat cards.

```jsx
import { DashboardStatsGrid } from '@/components/shared/DashboardStatsGrid';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

const stats = [
  {
    label: 'Total Revenue',
    value: '₨150,000',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign
  },
  {
    label: 'Total Orders',
    value: '245',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart
  }
];

<DashboardStatsGrid 
  stats={stats}
  colorTheme="blue"
  onStatClick={(stat) => console.log('Clicked:', stat)}
/>
```

### StatsCard

Individual stat card component.

```jsx
import { StatsCard } from '@/components/shared/StatsCard';
import { DollarSign } from 'lucide-react';

<StatsCard
  label="Total Revenue"
  value="₨150,000"
  change="+12.5%"
  trend="up"
  icon={DollarSign}
  colorTheme="blue"
  onClick={() => console.log('Clicked')}
/>
```

### DashboardLoadingSkeleton

Loading skeleton for dashboard components.

```jsx
import { DashboardLoadingSkeleton } from '@/components/shared/DashboardLoadingSkeleton';

// Widget skeleton
<DashboardLoadingSkeleton variant="widget" />

// Table skeleton
<DashboardLoadingSkeleton variant="table" rows={5} />

// Chart skeleton
<DashboardLoadingSkeleton variant="chart" />

// Multiple cards
<DashboardLoadingSkeleton variant="card" cardCount={4} />
```

### RevenueChartSection

Revenue chart with time range selection and export.

```jsx
import { RevenueChartSection } from '@/components/shared/RevenueChartSection';

<RevenueChartSection
  title="Revenue Performance"
  defaultTimeRange="30d"
  showExport={true}
  chartType="area" // or "line"
  colors={{
    primary: '#8B1538',
    secondary: '#A01A42'
  }}
/>
```

### WidgetContainer

Wrapper for dashboard widgets with error boundaries and consistent chrome.

```jsx
import { WidgetContainer } from '@/components/shared/WidgetContainer';
import { Users } from 'lucide-react';

<WidgetContainer
  title="Team Performance"
  icon={Users}
  onRefresh={handleRefresh}
  loading={isLoading}
  error={error}
  empty={data.length === 0}
  emptyMessage="No team data available"
>
  <YourWidgetContent />
</WidgetContainer>
```

### EmptyState

Display when no data is available.

```jsx
import { EmptyState } from '@/components/shared/EmptyState';
import { Package } from 'lucide-react';

<EmptyState
  icon={Package}
  message="No products found"
  description="Add your first product to get started"
  action={{
    label: 'Add Product',
    onClick: handleAdd,
    icon: Plus
  }}
/>
```

### ErrorState

Display error state with retry functionality.

```jsx
import { ErrorState } from '@/components/shared/ErrorState';

<ErrorState
  error={error}
  onRetry={handleRetry}
  message="Failed to load data"
  showDetails={true}
/>
```

## Hooks

### useDashboardMetrics

Hook for fetching dashboard metrics with caching and error handling.

```jsx
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics';

function MyDashboard() {
  const { 
    metrics, 
    chartData, 
    loading, 
    error, 
    refetch 
  } = useDashboardMetrics({
    timeRange: '30d',
    includeChartData: true
  });

  if (loading) return <DashboardLoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <DashboardStatsGrid stats={metrics.stats} />
      <RevenueChartSection />
    </div>
  );
}
```

## Migration Guide

### Replacing Inline Stats Grids

**Before:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat, idx) => (
    <Card key={idx}>
      <CardHeader>
        <CardTitle>{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
      </CardContent>
    </Card>
  ))}
</div>
```

**After:**
```jsx
<DashboardStatsGrid stats={stats} colorTheme="blue" />
```

### Replacing Inline Loading States

**Before:**
```jsx
{loading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
) : (
  <YourContent />
)}
```

**After:**
```jsx
{loading ? (
  <DashboardLoadingSkeleton variant="widget" />
) : (
  <YourContent />
)}
```

### Replacing Inline Error Handling

**Before:**
```jsx
{error ? (
  <div className="text-red-600">
    <p>Error: {error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
) : (
  <YourContent />
)}
```

**After:**
```jsx
{error ? (
  <ErrorState error={error} onRetry={retry} />
) : (
  <YourContent />
)}
```

## Best Practices

1. **Use WidgetContainer for all widgets** - Provides consistent error boundaries and chrome
2. **Use shared loading skeletons** - Maintains consistent loading experience
3. **Use ErrorState for all errors** - Provides consistent error handling with retry
4. **Use EmptyState for no-data scenarios** - Better UX than blank screens
5. **Use useDashboardMetrics hook** - Centralized data fetching with caching
6. **Use DashboardStatsGrid for stat cards** - Consistent responsive layout

## Performance Considerations

- All shared components use React.memo for optimization
- useDashboardMetrics hook implements 5-minute caching
- Loading skeletons prevent layout shift
- Error boundaries prevent widget failures from crashing the dashboard

## Accessibility

- All components include proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratios meet WCAG AA standards

# OwnerDashboard Usage Guide

## Quick Start

```jsx
import { OwnerDashboard } from '@/components/dashboard/templates/OwnerDashboard';

export default function OwnerDashboardPage() {
  const handleQuickAction = (action) => {
    switch (action) {
      case 'view-system-logs':
        // Navigate to system logs page
        router.push('/admin/system-logs');
        break;
      case 'view-team-details':
        // Navigate to team performance page
        router.push('/admin/team-performance');
        break;
      default:
        console.log('Quick action:', action);
    }
  };

  return (
    <OwnerDashboard
      businessId="your-business-id"
      category="retail"
      currency="PKR"
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Integration with RoleBasedDashboardController

```jsx
// In RoleBasedDashboardController.jsx
import { OwnerDashboard } from './templates/OwnerDashboard';

export function RoleBasedDashboardController({ 
  businessId, 
  category, 
  user,
  onQuickAction 
}) {
  const userRole = user?.role || 'owner';

  // Load owner dashboard for owner role
  if (userRole === 'owner') {
    return (
      <OwnerDashboard
        businessId={businessId}
        category={category}
        onQuickAction={onQuickAction}
      />
    );
  }

  // Load other role dashboards...
  return (
    <DashboardTemplateSelector
      businessId={businessId}
      category={category}
      onQuickAction={onQuickAction}
      userRole={userRole}
    />
  );
}
```

## Features Overview

### 1. Financial Summary Section
Displays prominent financial metrics:
- **Total Revenue**: Current month revenue with growth indicator
- **Total Expenses**: Current month expenses with percentage of revenue
- **Net Profit**: Calculated profit with profit margin percentage

### 2. Complete Business Overview
Includes all widgets from EnhancedDashboard:
- Revenue Chart
- Inventory Valuation
- Batch Expiry (if applicable)
- Serial Warranty (if applicable)
- Warehouse Distribution (if applicable)
- Recent Activity
- System Alerts

### 3. System Health Monitoring
Real-time system health metrics:
- Server status and uptime
- Database performance
- Error logs count
- Auto-refresh every 30 seconds

### 4. Team Performance Tracking
Sales performance by team member:
- Individual sales totals
- Order counts
- Target achievement percentages
- Visual progress bars

### 5. Comprehensive Audit Trail
Full audit trail with:
- Stock adjustments history
- User activity tracking
- Filterable by date, user, product
- Export to PDF/Excel

## Customization

### Custom Currency
```jsx
<OwnerDashboard
  businessId="business-id"
  category="retail"
  currency="USD" // or "EUR", "GBP", etc.
  onQuickAction={handleQuickAction}
/>
```

### Custom Quick Actions
```jsx
const handleQuickAction = (action) => {
  const actions = {
    'view-system-logs': () => router.push('/admin/logs'),
    'view-team-details': () => router.push('/admin/team'),
    'view-inventory': () => router.push('/inventory'),
    'view-financials': () => router.push('/financials'),
  };

  if (actions[action]) {
    actions[action]();
  }
};
```

## Responsive Behavior

### Desktop (≥1024px)
- Full grid layout with 2-3 columns
- All widgets visible
- Side-by-side system health and team performance

### Tablet (768px - 1023px)
- 2-column grid
- Widgets stack appropriately
- Maintained readability

### Mobile (<768px)
- Single column stack
- Touch-optimized controls
- Simplified financial summary
- Collapsible sections

## Performance Optimization

### Lazy Loading
```jsx
import dynamic from 'next/dynamic';

const OwnerDashboard = dynamic(
  () => import('@/components/dashboard/templates/OwnerDashboard').then(mod => mod.OwnerDashboard),
  { loading: () => <DashboardSkeleton /> }
);
```

### Memoization
```jsx
import { useMemo } from 'react';

const MemoizedOwnerDashboard = useMemo(
  () => (
    <OwnerDashboard
      businessId={businessId}
      category={category}
      onQuickAction={handleQuickAction}
    />
  ),
  [businessId, category]
);
```

## Translation Support

The dashboard supports multiple languages through the translation system:

```jsx
// English
<OwnerDashboard ... /> // Default

// Urdu (RTL)
// Automatically uses Urdu translations when language context is set to 'ur'
```

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Enter/Space activate buttons

### Screen Readers
- Proper ARIA labels on all elements
- Semantic HTML structure
- Live regions for dynamic updates

### Color Contrast
- All text meets WCAG 2.1 AA standards (≥4.5:1)
- Status indicators use icons + text
- Not relying on color alone

## Troubleshooting

### Dashboard Not Loading
1. Check businessId is valid
2. Verify user has owner role
3. Check console for errors
4. Ensure all dependencies are installed

### System Health Not Updating
1. Verify auto-refresh interval (30s)
2. Check network connectivity
3. Verify monitoring API is accessible
4. Check browser console for errors

### Team Performance Not Showing
1. Verify team data is available
2. Check database queries
3. Ensure proper permissions
4. Verify data format matches expected structure

### Audit Trail Empty
1. Check if there are any stock adjustments
2. Verify businessId filter
3. Check date range filters
4. Ensure database connection is working

## Best Practices

### 1. Error Handling
Always wrap dashboard in error boundary:
```jsx
<ErrorBoundary fallback={<DashboardError />}>
  <OwnerDashboard {...props} />
</ErrorBoundary>
```

### 2. Loading States
Show loading indicator while data loads:
```jsx
{loading ? (
  <DashboardSkeleton />
) : (
  <OwnerDashboard {...props} />
)}
```

### 3. Data Refresh
Implement manual refresh option:
```jsx
const [refreshKey, setRefreshKey] = useState(0);

<Button onClick={() => setRefreshKey(k => k + 1)}>
  Refresh
</Button>

<OwnerDashboard key={refreshKey} {...props} />
```

### 4. Permission Checks
Always verify user role before rendering:
```jsx
if (user?.role !== 'owner') {
  return <AccessDenied />;
}

return <OwnerDashboard {...props} />;
```

## Related Components

- **EnhancedDashboard**: Base dashboard with core widgets
- **SystemHealthWidget**: System monitoring widget
- **AuditTrailViewer**: Comprehensive audit trail from Phase 2
- **RoleBasedDashboardController**: Role-based dashboard routing

## Support

For issues or questions:
1. Check the implementation documentation
2. Review the design document
3. Check existing tests
4. Consult the team lead

## Version History

- **v1.0.0** (2024-01-03): Initial implementation
  - OwnerDashboard component
  - SystemHealthWidget component
  - Financial summary section
  - Team performance tracking
  - Audit trail integration

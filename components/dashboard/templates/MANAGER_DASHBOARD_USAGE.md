# ManagerDashboard Component - Usage Guide

## Overview

The `ManagerDashboard` component provides a manager-specific dashboard view with approval queue management and team performance tracking. It extends the existing `EnhancedDashboard` with manager-specific features.

## Features

- **Prominent Pending Approvals Widget**: Displays approval queue with priority sorting
- **Team Productivity Widget**: Shows team member performance and sales metrics
- **Inventory Alerts Widget**: Highlights low stock, expiring batches, and warranty alerts
- **Sales Targets Widget**: Tracks monthly and quarterly sales targets vs actual
- **Integration with Phase 2**: Uses existing ApprovalQueue and multiLevelApproval service

## Requirements

**Validates**: Requirements 6.4

## Installation

```bash
# No additional dependencies required
# Uses existing components and services from Phase 2
```

## Basic Usage

```jsx
import { ManagerDashboard } from '@/components/dashboard/templates/ManagerDashboard';

function DashboardPage() {
  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'view-approval-queue':
        // Navigate to approval queue page
        router.push('/approvals');
        break;
      case 'view-team-details':
        // Navigate to team performance page
        router.push('/team');
        break;
      case 'view-low-stock':
        // Navigate to inventory with low stock filter
        router.push('/inventory?filter=low-stock');
        break;
      case 'view-expiring-batches':
        // Navigate to batch tracking with expiry filter
        router.push('/inventory/batches?filter=expiring');
        break;
      case 'view-warranty-expiring':
        // Navigate to serial tracking with warranty filter
        router.push('/inventory/serials?filter=warranty-expiring');
        break;
      case 'view-sales-reports':
        // Navigate to sales reports
        router.push('/reports/sales');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  return (
    <ManagerDashboard
      businessId="business-123"
      userId="user-456"
      category="pharmacy"
      currency="PKR"
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | string | Yes | - | Business ID for data fetching |
| `userId` | string | Yes | - | User ID for approval queue filtering |
| `category` | string | Yes | - | Business category slug (pharmacy, textile, etc.) |
| `currency` | string | No | 'PKR' | Currency code for formatting |
| `onQuickAction` | function | No | - | Callback for quick action clicks |

## Integration with RoleBasedDashboardController

```jsx
import { RoleBasedDashboardController } from '@/components/dashboard/RoleBasedDashboardController';

function DashboardPage({ user, business }) {
  return (
    <RoleBasedDashboardController
      businessId={business.id}
      category={business.category}
      user={user}
      onQuickAction={handleQuickAction}
    />
  );
}

// RoleBasedDashboardController will automatically load ManagerDashboard
// when user.role === 'manager'
```

## Widget Sections

### 1. Pending Approvals Widget (Top Priority)

Displays pending stock adjustments requiring manager approval:
- High/Medium/Low priority counts
- Recent approval requests (top 3)
- Quick action to view full approval queue
- Real-time updates every 30 seconds

### 2. Team Productivity Widget

Shows team performance metrics:
- Total sales and orders
- Top performer highlight
- Individual team member progress bars
- Achievement percentages vs targets

### 3. Inventory Alerts Widget

Highlights items requiring attention:
- Low stock items count
- Expiring batches (within 90 days)
- Warranty expiring (within 30 days)
- Clickable alerts to view details

### 4. Sales Targets Widget

Tracks sales performance:
- Monthly target progress with days remaining
- Quarterly target overview
- Actual vs target comparison
- Remaining amount to reach target

## Styling

The component uses:
- **Glass-card styling**: Consistent with existing dashboard components
- **Wine color scheme**: Primary brand color (#722F37)
- **Responsive design**: Mobile-first approach with grid layouts
- **shadcn/ui components**: Card, Badge, Progress, Button

## Real-Time Updates

The dashboard automatically refreshes:
- **Pending Approvals**: Every 30 seconds
- **Team Productivity**: On-demand (manual refresh)
- **Inventory Alerts**: On-demand (manual refresh)
- **Sales Targets**: On-demand (manual refresh)

## Error Handling

The component handles:
- **Loading states**: Skeleton loaders for all widgets
- **Empty states**: Friendly messages when no data available
- **API errors**: Graceful fallback with error messages
- **Permission errors**: Hides restricted widgets

## Accessibility

- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Screen reader support**: Proper ARIA labels and semantic HTML
- **Color contrast**: WCAG AA compliant color combinations
- **Touch targets**: Minimum 44px for mobile devices

## Performance Optimization

- **useMemo hooks**: Memoized calculations for team and alert data
- **Lazy loading**: Widgets load independently
- **Debounced updates**: Prevents excessive re-renders
- **Efficient queries**: Optimized database queries with proper indexes

## Testing

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import { ManagerDashboard } from './ManagerDashboard';

describe('ManagerDashboard', () => {
  it('should render all manager-specific widgets', () => {
    render(
      <ManagerDashboard
        businessId="test-business"
        userId="test-user"
        category="pharmacy"
      />
    );

    expect(screen.getByText(/Manager Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Approvals/i)).toBeInTheDocument();
    expect(screen.getByText(/Team Productivity/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Sales Targets/i)).toBeInTheDocument();
  });

  it('should call onQuickAction when approval queue is clicked', async () => {
    const handleQuickAction = jest.fn();
    
    render(
      <ManagerDashboard
        businessId="test-business"
        userId="test-user"
        category="pharmacy"
        onQuickAction={handleQuickAction}
      />
    );

    const viewQueueButton = await screen.findByText(/View Approval Queue/i);
    fireEvent.click(viewQueueButton);

    expect(handleQuickAction).toHaveBeenCalledWith('view-approval-queue');
  });
});
```

## Related Components

- **PendingApprovalsWidget**: Displays approval queue summary
- **EnhancedDashboard**: Base dashboard with inventory widgets
- **ApprovalQueue**: Full approval queue component (Phase 2)
- **RoleBasedDashboardController**: Role-based dashboard routing

## Migration from Default Dashboard

If you're migrating from the default dashboard:

1. Update your dashboard routing to use `RoleBasedDashboardController`
2. Ensure user role is properly set in user context
3. Test all quick actions work correctly
4. Verify approval queue integration with Phase 2 components

## Troubleshooting

### Approvals not loading
- Check `userId` and `userRole` props are correct
- Verify `getPendingApprovalsForUser` service is working
- Check database permissions for approval_chain table

### Team productivity shows mock data
- Replace mock data with actual API calls
- Implement team performance tracking service
- Update data fetching logic in component

### Widgets not responsive on mobile
- Verify Tailwind CSS is properly configured
- Check grid breakpoints (lg:grid-cols-2)
- Test on various screen sizes (320px - 2560px)

## Future Enhancements

- [ ] Real-time team productivity updates via WebSocket
- [ ] Customizable widget arrangement (drag-and-drop)
- [ ] Export team performance reports
- [ ] Push notifications for high-priority approvals
- [ ] Advanced filtering and sorting options
- [ ] Historical trend analysis for sales targets

## Support

For issues or questions:
- Check existing Phase 2 documentation for ApprovalQueue
- Review multiLevelApproval service documentation
- Refer to EnhancedDashboard implementation guide

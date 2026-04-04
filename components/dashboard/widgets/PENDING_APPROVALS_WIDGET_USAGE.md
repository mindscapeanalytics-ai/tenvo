# PendingApprovalsWidget Component - Usage Guide

## Overview

The `PendingApprovalsWidget` component displays pending stock adjustments requiring manager approval. It integrates with the existing Phase 2 multi-level approval system and provides a quick overview of the approval queue.

## Features

- **Priority-based grouping**: High/Medium/Low priority counts
- **Recent requests display**: Shows top 3 pending approvals
- **Real-time updates**: Refreshes every 30 seconds
- **Quick action button**: Opens full ApprovalQueue component
- **Integration with Phase 2**: Uses multiLevelApproval service

## Requirements

**Validates**: Requirements 6.4, 5.3, 5.4

## Installation

```bash
# No additional dependencies required
# Uses existing multiLevelApproval service from Phase 2
```

## Basic Usage

```jsx
import { PendingApprovalsWidget } from '@/components/dashboard/widgets/PendingApprovalsWidget';

function ManagerDashboard() {
  const handleViewQueue = () => {
    // Navigate to full approval queue page
    router.push('/approvals');
  };

  return (
    <PendingApprovalsWidget
      businessId="business-123"
      userId="user-456"
      userRole="manager"
      currency="PKR"
      onViewQueue={handleViewQueue}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | string | Yes | - | Business ID for filtering approvals |
| `userId` | string | Yes | - | User ID for role-based filtering |
| `userRole` | string | No | 'manager' | User role (manager, director, admin) |
| `currency` | string | No | 'PKR' | Currency code for value formatting |
| `onViewQueue` | function | No | - | Callback when "View Approval Queue" is clicked |

## Priority Levels

The widget categorizes approvals into three priority levels based on adjustment value:

| Priority | Value Range | Color | Description |
|----------|-------------|-------|-------------|
| **High** | ≥ Rs 100,000 | Red | Critical approvals requiring immediate attention |
| **Medium** | Rs 50,000 - 99,999 | Orange | Important approvals |
| **Low** | < Rs 50,000 | Gray | Standard approvals |

## Data Structure

The widget expects approval data from `getPendingApprovalsForUser`:

```typescript
interface ApprovalData {
  id: string;
  adjustment_id: string;
  approval_level: number;
  required_role: string;
  decision: 'pending' | 'approved' | 'rejected';
  adjustment: {
    id: string;
    product_id: string;
    quantity_change: number;
    adjustment_value: number;
    requested_at: string;
    products: {
      name: string;
      sku: string;
    };
  };
}
```

## Display Sections

### 1. Summary Counts

Three colored boxes showing:
- **High Priority**: Red gradient, count of high-value approvals
- **Medium Priority**: Orange gradient, count of medium-value approvals
- **Low Priority**: Gray gradient, count of low-value approvals

### 2. Recent Requests

Shows top 3 pending approvals with:
- Product name and SKU
- Priority badge
- Quantity change (with +/- indicator)
- Adjustment value
- Time ago (e.g., "2h ago")
- Clickable to open full queue

### 3. Quick Action Button

- **Text**: "View Approval Queue"
- **Badge**: Shows "+X" if more than 3 approvals pending
- **Action**: Calls `onViewQueue` callback
- **Style**: Wine-colored button with icon

## Empty State

When no approvals are pending:
- Green checkmark icon
- "All Clear!" heading
- "No pending approvals at this time" message

## Real-Time Updates

The widget automatically refreshes:
- **Interval**: Every 30 seconds
- **Method**: Calls `getPendingApprovalsForUser` from multiLevelApproval service
- **Indicator**: "Last updated" timestamp at bottom

## Integration with ApprovalQueue

The widget is designed to work seamlessly with the existing `ApprovalQueue` component:

```jsx
import { PendingApprovalsWidget } from '@/components/dashboard/widgets/PendingApprovalsWidget';
import ApprovalQueue from '@/components/inventory/ApprovalQueue';

function ApprovalsPage() {
  const [showQueue, setShowQueue] = useState(false);

  return (
    <div>
      {!showQueue ? (
        <PendingApprovalsWidget
          businessId={businessId}
          userId={userId}
          userRole="manager"
          onViewQueue={() => setShowQueue(true)}
        />
      ) : (
        <ApprovalQueue
          businessId={businessId}
          userId={userId}
          userRole="manager"
        />
      )}
    </div>
  );
}
```

## Styling

The component uses:
- **Glass-card**: Consistent with dashboard styling
- **Wine color**: Primary brand color for buttons
- **Gradient backgrounds**: For priority boxes
- **Responsive grid**: 3-column layout for summary counts
- **Hover effects**: Subtle transitions on clickable items

## Loading State

While fetching data:
- Skeleton loaders for header
- Animated pulse effects
- Three skeleton boxes for content

## Error Handling

The component handles:
- **API errors**: Logs to console, shows empty state
- **Missing data**: Gracefully handles null/undefined values
- **Invalid user role**: Falls back to 'manager' role

## Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **ARIA labels**: Descriptive labels for screen readers
- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Color contrast**: WCAG AA compliant

## Performance Optimization

- **useMemo**: Memoized grouping and sorting calculations
- **useEffect cleanup**: Clears interval on unmount
- **Efficient queries**: Uses indexed database queries
- **Debounced updates**: Prevents excessive re-renders

## Testing

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import * as multiLevelApproval from '@/lib/services/multiLevelApproval';

jest.mock('@/lib/services/multiLevelApproval');

describe('PendingApprovalsWidget', () => {
  it('should display approval counts by priority', async () => {
    const mockApprovals = [
      {
        id: '1',
        adjustment: {
          adjustment_value: 150000, // High priority
          quantity_change: -10,
          products: { name: 'Product A', sku: 'SKU-001' }
        }
      },
      {
        id: '2',
        adjustment: {
          adjustment_value: 75000, // Medium priority
          quantity_change: 5,
          products: { name: 'Product B', sku: 'SKU-002' }
        }
      }
    ];

    multiLevelApproval.getPendingApprovalsForUser.mockResolvedValue(mockApprovals);

    render(
      <PendingApprovalsWidget
        businessId="test-business"
        userId="test-user"
        userRole="manager"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // High priority count
      expect(screen.getByText('1')).toBeInTheDocument(); // Medium priority count
    });
  });

  it('should show empty state when no approvals', async () => {
    multiLevelApproval.getPendingApprovalsForUser.mockResolvedValue([]);

    render(
      <PendingApprovalsWidget
        businessId="test-business"
        userId="test-user"
        userRole="manager"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/All Clear!/i)).toBeInTheDocument();
    });
  });

  it('should call onViewQueue when button is clicked', async () => {
    const handleViewQueue = jest.fn();
    const mockApprovals = [
      {
        id: '1',
        adjustment: {
          adjustment_value: 50000,
          quantity_change: -5,
          products: { name: 'Product A', sku: 'SKU-001' }
        }
      }
    ];

    multiLevelApproval.getPendingApprovalsForUser.mockResolvedValue(mockApprovals);

    render(
      <PendingApprovalsWidget
        businessId="test-business"
        userId="test-user"
        userRole="manager"
        onViewQueue={handleViewQueue}
      />
    );

    const viewQueueButton = await screen.findByText(/View Approval Queue/i);
    fireEvent.click(viewQueueButton);

    expect(handleViewQueue).toHaveBeenCalled();
  });
});
```

## Time Formatting

The widget uses a custom `formatTimeAgo` function:

```javascript
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
```

## Localization

The component supports Urdu translations:

```javascript
const t = translations[language] || translations['en'] || {};

// Usage examples:
t.pending_approvals || 'Pending Approvals'
t.high_priority || 'High Priority'
t.view_approval_queue || 'View Approval Queue'
```

## Related Components

- **ApprovalQueue**: Full approval queue with approve/reject actions
- **ManagerDashboard**: Manager dashboard template using this widget
- **multiLevelApproval**: Service for approval workflow management

## Troubleshooting

### Widget shows no data
- Verify `getPendingApprovalsForUser` is returning data
- Check user role matches approval chain requirements
- Ensure database has pending approvals for the user

### Priority colors not showing
- Check adjustment_value is a number
- Verify Tailwind CSS classes are compiled
- Inspect browser console for styling errors

### Real-time updates not working
- Check interval is not cleared prematurely
- Verify component is not unmounting/remounting
- Test API endpoint is responding correctly

## Future Enhancements

- [ ] WebSocket integration for instant updates
- [ ] Batch approval actions from widget
- [ ] Filtering by product category
- [ ] Export approval queue to CSV
- [ ] Push notifications for high-priority approvals
- [ ] Approval history timeline

## Support

For issues or questions:
- Review multiLevelApproval service documentation
- Check ApprovalQueue component implementation
- Refer to Phase 2 approval workflow documentation

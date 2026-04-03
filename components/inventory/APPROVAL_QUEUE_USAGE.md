# ApprovalQueue Component Usage Guide

## Overview

The ApprovalQueue component provides a comprehensive UI for approvers to review and act on pending stock adjustments. It displays detailed adjustment information, supports filtering and sorting, and enables approve/reject actions with mandatory comments.

**Requirements**: 5.7  
**File**: `components/inventory/ApprovalQueue.jsx`

## Features

- ✅ Display pending adjustments for current user's approval level
- ✅ Show detailed adjustment information (product, quantity, value, requester, reason)
- ✅ Approve/reject actions with mandatory comments
- ✅ Real-time updates via Supabase Realtime
- ✅ Search by product name, SKU, or reason
- ✅ Filter by priority (high, medium, low)
- ✅ Sort by date or value
- ✅ Priority-based visual indicators
- ✅ Responsive design for mobile and desktop
- ✅ Automatic notification sending on approval/rejection

## Props

```typescript
interface ApprovalQueueProps {
  businessId: string;      // Business ID
  userId: string;          // Current user ID
  userRole: string;        // User role (for multi-level approval)
}
```

## Usage

### Basic Usage

```jsx
import ApprovalQueue from '@/components/inventory/ApprovalQueue';

export default function ApprovalsPage() {
  const businessId = 'business-uuid';
  const userId = 'user-uuid';
  const userRole = 'manager';

  return (
    <div className="container mx-auto p-6">
      <ApprovalQueue
        businessId={businessId}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
}
```

### Integration with Dashboard

```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApprovalQueue from '@/components/inventory/ApprovalQueue';

export default function InventoryDashboard() {
  return (
    <Tabs defaultValue="products">
      <TabsList>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="approvals">
          Approvals
          <Badge className="ml-2">{pendingCount}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        {/* Product list */}
      </TabsContent>

      <TabsContent value="approvals">
        <ApprovalQueue
          businessId={businessId}
          userId={userId}
          userRole={userRole}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### With Permission Check

```jsx
import { useEffect, useState } from 'react';
import ApprovalQueue from '@/components/inventory/ApprovalQueue';

export default function ApprovalsPage() {
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    // Check if user has approval permission
    const checkPermission = async () => {
      const hasPermission = await checkUserPermission('approve_adjustments');
      setCanApprove(hasPermission);
    };
    checkPermission();
  }, []);

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          You don't have permission to approve adjustments.
        </p>
      </div>
    );
  }

  return (
    <ApprovalQueue
      businessId={businessId}
      userId={userId}
      userRole={userRole}
    />
  );
}
```

## Features in Detail

### 1. Priority-Based Display

Adjustments are color-coded by priority based on their value:

- **High Priority** (≥100K PKR): Red border, destructive badge
- **Medium Priority** (50K-100K PKR): Orange border, default badge
- **Low Priority** (<50K PKR): Gray border, secondary badge

```jsx
// Priority calculation
const getPriorityColor = (value) => {
  if (value >= 100000) return 'destructive'; // High
  if (value >= 50000) return 'default';      // Medium
  return 'secondary';                         // Low
};
```

### 2. Search Functionality

Search across multiple fields:
- Product name
- Product SKU
- Reason notes

```jsx
// Search implementation
const filteredAdjustments = adjustments.filter(
  (adj) =>
    adj.product?.name?.toLowerCase().includes(query) ||
    adj.product?.sku?.toLowerCase().includes(query) ||
    adj.reason_notes?.toLowerCase().includes(query)
);
```

### 3. Filter Options

Filter by priority level:
- All Priorities
- High (≥100K PKR)
- Medium (50K-100K PKR)
- Low (<50K PKR)

### 4. Sort Options

Sort adjustments by:
- Newest First (default)
- Oldest First
- Highest Value
- Lowest Value

### 5. Real-Time Updates

Automatically refreshes when new adjustments are created or existing ones are updated:

```jsx
// Supabase Realtime subscription
const channel = supabase
  .channel('approval_queue')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'stock_adjustments',
    filter: `business_id=eq.${businessId}`,
  }, (payload) => {
    fetchPendingAdjustments();
  })
  .subscribe();
```

### 6. Approval Workflow

When approving an adjustment:
1. User clicks "Approve" button
2. Dialog opens requesting approval notes (mandatory)
3. User enters notes and confirms
4. Adjustment status updated to 'approved'
5. Product stock updated to new quantity
6. Notification sent to requester
7. Adjustment removed from queue

```jsx
const handleApprove = async () => {
  // Update adjustment status
  await supabase
    .from('stock_adjustments')
    .update({
      approval_status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: actionNotes,
    })
    .eq('id', adjustmentId);

  // Update product stock
  await supabase
    .from('products')
    .update({ stock: newQuantity })
    .eq('id', productId);

  // Send notification
  await sendApprovalDecision({...});
};
```

### 7. Rejection Workflow

When rejecting an adjustment:
1. User clicks "Reject" button
2. Dialog opens requesting rejection reason (mandatory)
3. User enters reason and confirms
4. Adjustment status updated to 'rejected'
5. Notification sent to requester with reason
6. Adjustment removed from queue

```jsx
const handleReject = async () => {
  // Update adjustment status
  await supabase
    .from('stock_adjustments')
    .update({
      approval_status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_notes: actionNotes,
    })
    .eq('id', adjustmentId);

  // Send notification
  await sendApprovalDecision({
    decision: 'rejected',
    notes: actionNotes,
    ...
  });
};
```

## Adjustment Card Layout

Each adjustment is displayed in a card with:

### Header Section
- Product name with priority badge
- SKU and requester information
- Adjustment value (large, prominent)
- Request timestamp

### Content Section
- **Quantity Change**: Visual indicator (up/down arrow) with change amount
- **Before/After**: Shows stock levels before and after adjustment
- **Reason**: Displays reason code (damage, theft, count_error, return, other)
- **Reason Notes**: Full explanation in highlighted box

### Actions Section
- **Approve Button**: Green, with checkmark icon
- **Reject Button**: Red, with X icon

## Responsive Design

### Desktop (≥768px)
- 3-column grid for adjustment details
- Side-by-side approve/reject buttons
- Full-width cards with hover effects

### Mobile (<768px)
- Single-column layout
- Stacked adjustment details
- Full-width buttons
- Touch-optimized spacing

## Empty States

### No Pending Adjustments
```jsx
<Card>
  <CardContent className="py-12 text-center">
    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
    <h3 className="text-lg font-bold">All Clear!</h3>
    <p className="text-sm text-gray-600">
      No pending adjustments require your approval.
    </p>
  </CardContent>
</Card>
```

### No Search Results
When search/filter returns no results, the empty state is shown with appropriate message.

## Error Handling

### Network Errors
```jsx
try {
  await fetchPendingAdjustments();
} catch (error) {
  console.error('Error fetching adjustments:', error);
  toast.error('Failed to load pending adjustments');
}
```

### Approval Errors
```jsx
try {
  await handleApprove();
  toast.success('Adjustment approved successfully');
} catch (error) {
  console.error('Error approving adjustment:', error);
  toast.error('Failed to approve adjustment');
}
```

### Validation Errors
```jsx
if (!actionNotes.trim()) {
  toast.error('Please provide approval notes');
  return;
}
```

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels for screen readers
- ✅ Focus management in dialogs
- ✅ Color contrast meets WCAG 2.1 AA
- ✅ Touch targets ≥44px for mobile

## Performance Optimizations

### Memoization
```jsx
const filteredAdjustments = useMemo(() => {
  // Filter and sort logic
}, [adjustments, searchQuery, priorityFilter, sortBy]);
```

### Lazy Loading
- Only loads adjustments when component mounts
- Real-time updates are incremental

### Debounced Search
Consider adding debounce for search input:
```jsx
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

const debouncedSearch = useDebouncedValue(searchQuery, 300);
```

## Integration with Multi-Level Approval

When multi-level approval is enabled (Task 9.3), the component automatically:
- Filters adjustments by user's approval level
- Routes high-value adjustments to appropriate approvers
- Tracks approval chain in audit trail

```jsx
// Filter by approval level
const { data } = await supabase
  .from('stock_adjustments')
  .select('*')
  .eq('business_id', businessId)
  .eq('approval_status', 'pending')
  .eq('current_approval_level', userApprovalLevel);
```

## Testing

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApprovalQueue from './ApprovalQueue';

describe('ApprovalQueue', () => {
  it('should display pending adjustments', async () => {
    render(<ApprovalQueue businessId="test" userId="user" userRole="manager" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    });
  });

  it('should filter by search query', async () => {
    render(<ApprovalQueue {...props} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });
    
    await waitFor(() => {
      expect(screen.getByText(/iPhone/i)).toBeInTheDocument();
    });
  });

  it('should approve adjustment with notes', async () => {
    render(<ApprovalQueue {...props} />);
    
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    const notesInput = screen.getByPlaceholderText(/approval notes/i);
    fireEvent.change(notesInput, { target: { value: 'Verified' } });
    
    const confirmButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/approved successfully/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

```javascript
describe('Approval Workflow Integration', () => {
  it('should complete full approval workflow', async () => {
    // 1. Create adjustment requiring approval
    const adjustment = await createAdjustment({...});
    
    // 2. Render approval queue
    render(<ApprovalQueue {...props} />);
    
    // 3. Verify adjustment appears
    await waitFor(() => {
      expect(screen.getByText(adjustment.product.name)).toBeInTheDocument();
    });
    
    // 4. Approve adjustment
    fireEvent.click(screen.getByText('Approve'));
    fireEvent.change(screen.getByPlaceholderText(/notes/i), {
      target: { value: 'Approved' }
    });
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    
    // 5. Verify adjustment removed from queue
    await waitFor(() => {
      expect(screen.queryByText(adjustment.product.name)).not.toBeInTheDocument();
    });
    
    // 6. Verify notification sent
    const notifications = await getUnreadNotifications(requesterId, businessId);
    expect(notifications[0].type).toBe('approval_approved');
  });
});
```

## Best Practices

1. **Always require notes/reason** - Enforce mandatory comments for audit trail
2. **Show clear priority indicators** - Use color coding for quick identification
3. **Provide context** - Display all relevant information for informed decisions
4. **Enable real-time updates** - Keep queue current with Supabase Realtime
5. **Optimize for mobile** - Ensure touch-friendly interface for on-the-go approvals
6. **Handle errors gracefully** - Show user-friendly error messages
7. **Log all actions** - Maintain comprehensive audit trail
8. **Validate permissions** - Check user has approval rights before showing queue

## Troubleshooting

### Adjustments not appearing

1. Check if user has approval permission
2. Verify business_id is correct
3. Check if adjustments have `approval_status = 'pending'`
4. Verify RLS policies allow user to view adjustments

### Real-time updates not working

1. Check Supabase Realtime is enabled
2. Verify channel subscription is active
3. Check network connectivity
4. Verify filter matches business_id

### Approval/rejection failing

1. Check user authentication
2. Verify user has permission to approve
3. Check network connectivity
4. Verify adjustment still exists and is pending

## Future Enhancements

### Batch Approval
```jsx
// Select multiple adjustments
const [selectedIds, setSelectedIds] = useState([]);

// Approve all selected
const handleBatchApprove = async () => {
  await Promise.all(
    selectedIds.map(id => approveAdjustment(id, batchNotes))
  );
};
```

### Approval History
```jsx
// Show approval history for each adjustment
const ApprovalHistory = ({ adjustmentId }) => {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    fetchApprovalHistory(adjustmentId).then(setHistory);
  }, [adjustmentId]);
  
  return (
    <div>
      {history.map(entry => (
        <div key={entry.id}>
          {entry.approver} {entry.decision} on {entry.date}
        </div>
      ))}
    </div>
  );
};
```

### Email Digest
```jsx
// Send daily digest of pending approvals
const sendApprovalDigest = async (approverId) => {
  const pending = await getPendingAdjustments(approverId);
  
  await sendEmail({
    to: approverEmail,
    subject: `${pending.length} Adjustments Awaiting Approval`,
    body: renderDigestTemplate(pending),
  });
};
```

## Support

For issues or questions:
- Component file: `components/inventory/ApprovalQueue.jsx`
- Notification service: `lib/services/notifications.js`
- Multi-level approval: `lib/services/multiLevelApproval.js`
- Database schema: `supabase/migrations/020_enterprise_inventory_features.sql`

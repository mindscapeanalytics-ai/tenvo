

# Notification Service Usage Guide

## Overview

The notification service provides a comprehensive system for sending and managing in-app notifications for approval workflows, stock alerts, and inventory events. It integrates seamlessly with the existing notification UI in the Header component.

**Requirements**: 5.3, 5.5

## Features

- ✅ Approval request notifications
- ✅ Approval decision notifications (approved/rejected)
- ✅ Stock transfer notifications
- ✅ Batch expiry alerts
- ✅ In-app notification management
- ✅ Priority-based notifications
- ✅ Metadata support for rich notifications
- 🔄 Email notifications (Phase 2 - requires SMTP setup)

## Database Schema

The service uses a `notifications` table with the following structure:

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Notification Types

```javascript
NOTIFICATION_TYPES = {
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  BATCH_EXPIRING: 'batch_expiring',
  LOW_STOCK: 'low_stock',
  TRANSFER_INITIATED: 'transfer_initiated',
  TRANSFER_RECEIVED: 'transfer_received',
}
```

## Priority Levels

```javascript
NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}
```

## Usage Examples

### 1. Send Approval Request Notification

When a stock adjustment requires approval:

```javascript
import { sendApprovalRequest } from '@/lib/services/notifications';

const result = await sendApprovalRequest({
  businessId: 'business-uuid',
  adjustmentId: 'adjustment-uuid',
  productName: 'iPhone 14 Pro',
  quantityChange: -50,
  adjustmentValue: 250000, // PKR
  requesterName: 'Ali Ahmed',
  requesterId: 'user-uuid',
  approverIds: ['manager-uuid-1', 'manager-uuid-2'],
  reasonCode: 'damage',
  reasonNotes: 'Water damage during monsoon',
});

if (result.success) {
  console.log(`Sent to ${result.notificationIds.length} approvers`);
}
```

### 2. Send Approval Decision Notification

When an adjustment is approved or rejected:

```javascript
import { sendApprovalDecision } from '@/lib/services/notifications';

// Approval
const approvalResult = await sendApprovalDecision({
  businessId: 'business-uuid',
  adjustmentId: 'adjustment-uuid',
  productName: 'iPhone 14 Pro',
  quantityChange: -50,
  adjustmentValue: 250000,
  requesterId: 'requester-uuid',
  approverName: 'Manager Fatima',
  approverId: 'manager-uuid',
  decision: 'approved',
  notes: 'Approved after verification',
});

// Rejection
const rejectionResult = await sendApprovalDecision({
  businessId: 'business-uuid',
  adjustmentId: 'adjustment-uuid',
  productName: 'iPhone 14 Pro',
  quantityChange: -50,
  adjustmentValue: 250000,
  requesterId: 'requester-uuid',
  approverName: 'Manager Fatima',
  approverId: 'manager-uuid',
  decision: 'rejected',
  notes: 'Insufficient documentation provided',
});
```

### 3. Send Stock Transfer Notification

When stock is transferred between locations:

```javascript
import { sendTransferNotification } from '@/lib/services/notifications';

const result = await sendTransferNotification({
  businessId: 'business-uuid',
  transferId: 'transfer-uuid',
  productName: 'Samsung Galaxy S24',
  quantity: 100,
  fromWarehouse: 'Lahore Main Warehouse',
  toWarehouse: 'Karachi Branch',
  initiatorName: 'Hassan Ali',
  receiverIds: ['receiver-uuid-1', 'receiver-uuid-2'],
});
```

### 4. Send Batch Expiry Notification

When a batch is approaching expiry:

```javascript
import { sendBatchExpiryNotification } from '@/lib/services/notifications';

const result = await sendBatchExpiryNotification({
  businessId: 'business-uuid',
  batchId: 'batch-uuid',
  productName: 'Panadol 500mg',
  batchNumber: 'BATCH-2024-001',
  expiryDate: '2026-05-15',
  daysUntilExpiry: 7,
  quantity: 500,
  managerIds: ['manager-uuid-1', 'manager-uuid-2'],
});
```

### 5. Get Unread Notifications

Fetch unread notifications for a user:

```javascript
import { getUnreadNotifications } from '@/lib/services/notifications';

const notifications = await getUnreadNotifications(
  'user-uuid',
  'business-uuid',
  50 // limit
);

console.log(`${notifications.length} unread notifications`);
```

### 6. Mark Notification as Read

When user clicks on a notification:

```javascript
import { markNotificationAsRead } from '@/lib/services/notifications';

const success = await markNotificationAsRead('notification-uuid');
```

### 7. Mark All Notifications as Read

Clear all unread notifications:

```javascript
import { markAllNotificationsAsRead } from '@/lib/services/notifications';

const success = await markAllNotificationsAsRead(
  'user-uuid',
  'business-uuid'
);
```

### 8. Get Notification Statistics

Get notification counts by type:

```javascript
import { getNotificationStats } from '@/lib/services/notifications';

const stats = await getNotificationStats('user-uuid', 'business-uuid');

console.log(`Unread: ${stats.unreadCount}`);
console.log('By type:', stats.countByType);
// Output: { approval_request: 3, batch_expiring: 2, low_stock: 5 }
```

## Integration with useStockAdjustment Hook

The notification service is automatically integrated with the `useStockAdjustment` hook:

```javascript
import { useStockAdjustment } from '@/lib/hooks/useStockAdjustment';

const { createAdjustment, approveAdjustment, rejectAdjustment } = useStockAdjustment(
  productId,
  businessId,
  warehouseId,
  approvalThreshold
);

// Create adjustment - automatically sends approval request if needed
const adjustment = await createAdjustment({
  adjustment_type: 'decrease',
  quantity_change: -50,
  quantity_before: 100,
  reason_code: 'damage',
  reason_notes: 'Water damage',
});

// Approve adjustment - automatically sends approval notification
await approveAdjustment(adjustmentId, 'Verified and approved');

// Reject adjustment - automatically sends rejection notification
await rejectAdjustment(adjustmentId, 'Insufficient documentation');
```

## Notification Metadata

Each notification includes metadata specific to its type:

### Approval Request Metadata
```javascript
{
  adjustment_id: 'uuid',
  requester_id: 'uuid',
  requester_name: 'Ali Ahmed',
  product_name: 'iPhone 14 Pro',
  quantity_change: -50,
  adjustment_value: 250000,
  reason_code: 'damage',
  reason_notes: 'Water damage during monsoon'
}
```

### Approval Decision Metadata
```javascript
{
  adjustment_id: 'uuid',
  approver_id: 'uuid',
  approver_name: 'Manager Fatima',
  product_name: 'iPhone 14 Pro',
  quantity_change: -50,
  adjustment_value: 250000,
  decision: 'approved',
  notes: 'Approved after verification'
}
```

### Transfer Metadata
```javascript
{
  transfer_id: 'uuid',
  product_name: 'Samsung Galaxy S24',
  quantity: 100,
  from_warehouse: 'Lahore Main Warehouse',
  to_warehouse: 'Karachi Branch',
  initiator_name: 'Hassan Ali'
}
```

### Batch Expiry Metadata
```javascript
{
  batch_id: 'uuid',
  product_name: 'Panadol 500mg',
  batch_number: 'BATCH-2024-001',
  expiry_date: '2026-05-15',
  days_until_expiry: 7,
  quantity: 500
}
```

## UI Integration

The notification service integrates with the existing Header component notification dropdown:

```javascript
// In Header.jsx or similar component
import { getUnreadNotifications, markNotificationAsRead } from '@/lib/services/notifications';

// Fetch notifications
const notifications = await getUnreadNotifications(userId, businessId);

// Handle notification click
const handleNotificationClick = async (notificationId, actionUrl) => {
  await markNotificationAsRead(notificationId);
  router.push(actionUrl);
};
```

## Priority-Based Styling

Use priority levels to style notifications:

```javascript
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 border-red-500';
    case 'high': return 'bg-orange-100 border-orange-500';
    case 'medium': return 'bg-blue-100 border-blue-500';
    case 'low': return 'bg-gray-100 border-gray-500';
    default: return 'bg-gray-100 border-gray-500';
  }
};
```

## Error Handling

The service includes comprehensive error handling:

```javascript
const result = await sendApprovalRequest({...});

if (!result.success) {
  console.error('Notification failed:', result.error);
  // Handle error gracefully - don't fail the main operation
}
```

## Future Enhancements (Phase 2)

### Email Notifications

Email notifications will be added in Phase 2 with SMTP configuration:

```javascript
// Future implementation
async function sendEmailNotification(userId, { subject, body, actionUrl }) {
  // Send email via SMTP
  // Use templates for consistent formatting
  // Include action button linking to actionUrl
}
```

### Push Notifications

Mobile push notifications for critical alerts:

```javascript
// Future implementation
async function sendPushNotification(userId, { title, body, data }) {
  // Send push notification via Firebase Cloud Messaging
  // Include deep link to relevant screen
}
```

### WhatsApp Notifications

WhatsApp Business API integration for Pakistani users:

```javascript
// Future implementation
async function sendWhatsAppNotification(phoneNumber, message) {
  // Send WhatsApp message via Business API
  // Use templates approved by WhatsApp
}
```

## Testing

### Unit Tests

```javascript
import { sendApprovalRequest, sendApprovalDecision } from '@/lib/services/notifications';

describe('Notification Service', () => {
  it('should send approval request notification', async () => {
    const result = await sendApprovalRequest({...});
    expect(result.success).toBe(true);
    expect(result.notificationIds).toHaveLength(2);
  });

  it('should send approval decision notification', async () => {
    const result = await sendApprovalDecision({...});
    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();
  });
});
```

### Integration Tests

```javascript
describe('Notification Integration', () => {
  it('should create notification when adjustment requires approval', async () => {
    const adjustment = await createAdjustment({...});
    const notifications = await getUnreadNotifications(approverId, businessId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('approval_request');
  });
});
```

## Best Practices

1. **Always handle notification failures gracefully** - Don't fail the main operation if notification fails
2. **Use appropriate priority levels** - Urgent for critical issues, Low for informational
3. **Include actionable URLs** - Always provide action_url for user navigation
4. **Store rich metadata** - Include all relevant data for notification context
5. **Clean up old notifications** - Implement periodic cleanup of read notifications older than 90 days
6. **Batch notifications** - Group similar notifications to avoid spam
7. **Respect user preferences** - Allow users to configure notification preferences (Phase 2)

## Troubleshooting

### Notifications not appearing

1. Check if notifications table exists: `SELECT * FROM notifications LIMIT 1;`
2. Verify RLS policies are enabled
3. Check user_id matches authenticated user
4. Verify business_id is correct

### Notifications not sending

1. Check console for errors
2. Verify Supabase client is initialized
3. Check network tab for failed requests
4. Verify user has permission to create notifications

### Performance issues

1. Add indexes on frequently queried columns
2. Implement pagination for notification list
3. Archive old notifications
4. Use Supabase Realtime for live updates

## Support

For issues or questions:
- Check migration file: `supabase/migrations/021_notifications_table.sql`
- Review service code: `lib/services/notifications.js`
- Check integration: `lib/hooks/useStockAdjustment.js`

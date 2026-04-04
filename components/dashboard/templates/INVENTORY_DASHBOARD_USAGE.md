# InventoryDashboard Component Usage Guide

## Overview

The `InventoryDashboard` component provides a comprehensive dashboard view optimized for inventory staff, focusing on stock management operations and efficiency.

## Features

### 1. Stock Levels Widget (Prominent)
- **Total Value**: Real-time inventory valuation across all locations
- **Total Products**: Count of unique products in inventory
- **Low Stock**: Items below minimum stock level
- **Out of Stock**: Items with zero stock
- **Location Breakdown**: Stock distribution by warehouse/location
  - Individual location value and product count
  - Utilization percentage with progress bar
  - Low stock alerts per location
- **Quick Actions**: 
  - Adjust Stock
  - Transfer Stock

### 2. Reorder Alerts Widget
- **Alert Categories**:
  - Critical: Out of stock items
  - Urgent: Below reorder point
  - Warning: Approaching reorder point
- **Item Details**:
  - Product name and SKU
  - Current stock vs reorder point
  - Recommended order quantity
  - Severity badge
- **Click to Action**: Create purchase order for item

### 3. Cycle Count Tasks Widget
- **Task Summary**:
  - Pending tasks count
  - In-progress tasks count
  - Completed today count
- **Task List**:
  - Task name and product count
  - Due date with countdown
  - Priority badge (High/Medium/Low)
  - Progress bar for in-progress tasks
- **Integration**: Links to existing CycleCountTask component from Phase 2
- **Click to Action**: Start cycle count task

### 4. Receiving Queue Widget
- **Queue Summary**:
  - Pending receipts count
  - Partial receipts count
  - Total value of pending receipts
- **Receipt Details**:
  - PO number and supplier
  - Expected date
  - Items received vs total
  - Receipt value
  - Status badge (Overdue/Partial/Pending)
- **Quick Actions**:
  - View all receipts
  - Quick receive button

## Usage

```jsx
import { InventoryDashboard } from '@/components/dashboard/templates/InventoryDashboard';

function InventoryPage() {
  const handleQuickAction = (action, data) => {
    switch (action) {
      case 'view-location-stock':
        // Navigate to location stock view
        break;
      case 'stock-adjustment':
        // Open stock adjustment form
        break;
      case 'stock-transfer':
        // Open stock transfer form
        break;
      case 'create-purchase-order':
        // Create PO for item
        break;
      case 'start-cycle-count':
        // Open CycleCountTask component
        break;
      case 'receive-goods':
        // Open goods receipt form
        break;
      case 'quick-receive':
        // Open quick receive dialog
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <InventoryDashboard
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
| `userId` | string | Yes | - | Current user ID |
| `category` | string | Yes | - | Business category slug |
| `currency` | string | No | 'PKR' | Currency code for formatting |
| `onQuickAction` | function | No | - | Callback for quick action clicks |

## Quick Actions

The component supports the following quick actions via the `onQuickAction` callback:

1. **view-location-stock** - View stock details for a specific location
2. **stock-adjustment** - Open stock adjustment form
3. **stock-transfer** - Open stock transfer form
4. **create-purchase-order** - Create purchase order for reorder item
5. **view-all-reorder-alerts** - View complete reorder alerts list
6. **start-cycle-count** - Start cycle count task (opens CycleCountTask)
7. **view-all-cycle-counts** - View all cycle count tasks
8. **receive-goods** - Receive goods for specific PO
9. **view-all-receipts** - View all pending receipts
10. **quick-receive** - Quick receive dialog

## Data Integration

### Mock Data (Current)
The component currently uses mock data for demonstration. In production, replace with API calls:

```javascript
// Stock Levels
const { data: stockLevels } = await supabase
  .from('inventory_summary')
  .select('*')
  .eq('business_id', businessId);

// Reorder Alerts
const { data: reorderAlerts } = await supabase
  .from('products')
  .select('*')
  .eq('business_id', businessId)
  .lte('stock_quantity', 'reorder_point');

// Cycle Count Tasks
const { data: cycleCountTasks } = await supabase
  .from('cycle_count_tasks')
  .select('*, cycle_count_schedules(*)')
  .eq('assigned_to', userId)
  .in('status', ['pending', 'in_progress']);

// Receiving Queue
const { data: receivingQueue } = await supabase
  .from('purchase_orders')
  .select('*')
  .eq('business_id', businessId)
  .in('status', ['pending', 'partial']);
```

## Styling

The component uses:
- **Glass-card** styling for modern appearance
- **Wine color scheme** for primary actions
- **Severity-based colors**:
  - Red: Critical/Overdue
  - Orange: Urgent
  - Yellow: Warning/Partial
  - Green: Success/Completed
  - Blue: Pending/In Progress
  - Purple: Inventory theme
- **Responsive design**: Mobile-optimized with touch-friendly targets

## Integration with Phase 2 Components

### CycleCountTask Integration
When user clicks "Start Cycle Count" on a task:

```javascript
import CycleCountTask from '@/components/inventory/CycleCountTask';

function handleStartCycleCount(scheduleId) {
  // Navigate to cycle count page or open modal
  router.push(`/inventory/cycle-count/${scheduleId}`);
  
  // Or render in modal
  setModalContent(
    <CycleCountTask
      scheduleId={scheduleId}
      businessId={businessId}
      onComplete={() => {
        // Refresh dashboard
        loadCycleCountTasks();
        closeModal();
      }}
    />
  );
}
```

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Color is not the only indicator (icons + text)
- Touch targets ≥44px for mobile
- Screen reader friendly

## Performance

- Uses `useMemo` for expensive calculations
- Lazy loading for large lists
- Optimistic UI updates
- Real-time subscriptions for live data

## Requirements

**Validates: Requirements 6.6**

- ✅ Stock levels widget (all locations)
- ✅ Reorder alerts widget (items below reorder point)
- ✅ Cycle count tasks widget (pending cycle counts)
- ✅ Receiving queue widget (pending receipts)
- ✅ Integration with existing CycleCountTask from Phase 2
- ✅ Responsive design
- ✅ Quick actions for common operations

## Related Components

- `CycleCountTask` - Phase 2 cycle counting component
- `StockAdjustmentManager` - Stock adjustment form
- `StockTransferForm` - Stock transfer form
- `TransferReceiptConfirmation` - Goods receipt form
- `EnhancedDashboard` - Base dashboard with additional widgets

## Future Enhancements

1. Real-time stock level updates via WebSocket
2. Barcode scanning for quick receive
3. Voice commands for hands-free operation
4. Predictive reorder suggestions using ML
5. Mobile app integration for warehouse operations
6. Batch operations for multiple items
7. Export reports (PDF/Excel)
8. Custom alert thresholds per product

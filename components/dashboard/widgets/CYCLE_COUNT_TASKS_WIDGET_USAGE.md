# CycleCountTasksWidget Usage Guide

## Overview

The `CycleCountTasksWidget` is a standalone, reusable dashboard widget that displays pending cycle count tasks with priority and due dates. It shows assigned tasks for the current user with progress tracking and includes a quick action to start cycle counts.

## Features

- ✅ Display pending cycle count tasks
- ✅ Show task priority (high, medium, low) with color coding
- ✅ Display due dates with smart formatting (Today, Tomorrow, Xd)
- ✅ List assigned tasks for current user
- ✅ Show progress for in-progress tasks
- ✅ Quick action: "Start Cycle Count" → opens CycleCountTask component
- ✅ Integrates with existing cycle counting system from Phase 2
- ✅ Responsive design with glass-card styling
- ✅ Loading and empty states
- ✅ Multi-language support (English/Urdu)
- ✅ Auto-refresh every 5 minutes

## Requirements

**Validates**: Requirements 6.6, 8.1, 8.2

## Installation

```jsx
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';
```

## Basic Usage

### With Data Prop (Recommended for Dashboard Integration)

```jsx
<CycleCountTasksWidget
  businessId="business-123"
  userId="user-456"
  data={cycleCountData}
  onStartCycleCount={(scheduleId) => {
    // Open CycleCountTask component with scheduleId
    router.push(`/inventory/cycle-count/${scheduleId}`);
  }}
  onViewAllTasks={() => {
    // Navigate to full cycle count tasks page
    router.push('/inventory/cycle-count');
  }}
/>
```

### Without Data Prop (Auto-fetch Mode)

```jsx
<CycleCountTasksWidget
  businessId="business-123"
  userId="user-456"
  onStartCycleCount={(scheduleId) => {
    console.log('Start cycle count:', scheduleId);
  }}
  onViewAllTasks={() => {
    console.log('View all tasks');
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | `string` | Yes | - | Business ID for fetching cycle count tasks |
| `userId` | `string` | Yes | - | User ID to filter assigned tasks |
| `data` | `object` | No | `null` | Pre-fetched cycle count data (see Data Structure below) |
| `onStartCycleCount` | `function` | No | - | Callback when user clicks a task. Receives `scheduleId` as parameter |
| `onViewAllTasks` | `function` | No | - | Callback when user clicks "View All Tasks" button |

## Data Structure

When providing the `data` prop, use the following structure:

```typescript
interface CycleCountData {
  pendingCount: number;        // Number of pending tasks
  inProgressCount: number;     // Number of in-progress tasks
  completedToday: number;      // Number of tasks completed today
  tasks: CycleCountTask[];     // Array of cycle count tasks
}

interface CycleCountTask {
  id: number | string;         // Unique task ID
  name: string;                // Task name (e.g., "Monthly Count - Zone A")
  scheduleId: string;          // Schedule ID for CycleCountTask component
  dueDate: Date;               // Due date
  priority: 'high' | 'medium' | 'low';  // Task priority
  productCount: number;        // Total number of products to count
  completedCount: number;      // Number of products already counted
  assignedTo: string;          // User ID of assigned user
  status: 'pending' | 'in_progress' | 'completed';  // Task status
}
```

## Example Data

```javascript
const cycleCountData = {
  pendingCount: 3,
  inProgressCount: 1,
  completedToday: 2,
  tasks: [
    {
      id: 1,
      name: 'Monthly Count - Zone A',
      scheduleId: 'cc-001',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'high',
      productCount: 45,
      completedCount: 0,
      assignedTo: 'user-123',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Quarterly Count - Electronics',
      scheduleId: 'cc-002',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'medium',
      productCount: 120,
      completedCount: 35,
      assignedTo: 'user-123',
      status: 'in_progress'
    }
  ]
};
```

## Integration with InventoryDashboard

The widget is already integrated into the `InventoryDashboard` component:

```jsx
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';

function InventoryDashboard({ businessId, userId, onQuickAction }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Other widgets */}
      
      <CycleCountTasksWidget
        businessId={businessId}
        userId={userId}
        onStartCycleCount={(scheduleId) => 
          onQuickAction?.('start-cycle-count', scheduleId)
        }
        onViewAllTasks={() => 
          onQuickAction?.('view-all-cycle-counts')
        }
      />
    </div>
  );
}
```

## Integration with CycleCountTask Component

When a user clicks on a task, open the existing `CycleCountTask` component from Phase 2:

```jsx
import CycleCountTask from '@/components/inventory/CycleCountTask';

function CycleCountPage({ scheduleId, businessId }) {
  return (
    <CycleCountTask
      scheduleId={scheduleId}
      businessId={businessId}
      onComplete={() => {
        // Handle completion
        router.push('/dashboard/inventory');
      }}
    />
  );
}
```

## Styling

The widget uses the existing design system:

- **Glass-card styling**: `glass-card border-none`
- **Wine color scheme**: Consistent with app theme
- **Responsive design**: Works on mobile and desktop
- **Touch-optimized**: ≥44px touch targets

## Priority Color Coding

- **High**: Red background (`bg-red-100 text-red-700`)
- **Medium**: Yellow background (`bg-yellow-100 text-yellow-700`)
- **Low**: Green background (`bg-green-100 text-green-700`)

## Due Date Formatting

- **Overdue**: "Xd overdue" (red text)
- **Today**: "Today"
- **Tomorrow**: "Tomorrow"
- **Future**: "Xd" (e.g., "3d")

## Auto-Refresh

The widget automatically refreshes data every 5 minutes (300,000ms) when not using the `data` prop.

## Loading State

The widget displays a skeleton loading state while fetching data:

```jsx
// Automatically shown when loading={true}
<Card className="glass-card border-none">
  <CardHeader className="pb-3">
    <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2" />
    <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="h-24 bg-gray-100 rounded animate-pulse" />
      <div className="h-16 bg-gray-100 rounded animate-pulse" />
      <div className="h-12 bg-gray-100 rounded animate-pulse" />
    </div>
  </CardContent>
</Card>
```

## Empty State

When no tasks are available:

```jsx
<div className="py-8 text-center">
  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
  <p className="text-sm text-gray-500">
    No cycle count tasks available
  </p>
</div>
```

## Multi-Language Support

The widget supports English and Urdu through the `useLanguage` hook:

```javascript
const { language } = useLanguage();
const t = translations[language] || translations['en'] || {};

// Usage
<CardTitle>{t.cycle_count_tasks || 'Cycle Count Tasks'}</CardTitle>
```

## Testing

Unit tests are available in `__tests__/CycleCountTasksWidget.test.js`:

```bash
npm test -- CycleCountTasksWidget
```

## Related Components

- **CycleCountTask**: Phase 2 component for executing cycle counts
- **InventoryDashboard**: Dashboard template that includes this widget
- **TodaysSalesWidget**: Similar widget pattern for reference

## API Integration (Future)

When implementing real API integration, replace the mock data in `loadCycleCountTasks()`:

```javascript
const loadCycleCountTasks = async () => {
  try {
    setLoading(true);
    
    const response = await fetch(`/api/cycle-count/tasks?businessId=${businessId}&userId=${userId}`);
    const data = await response.json();
    
    setCycleCountData(data);
  } catch (err) {
    console.error('Failed to load cycle count tasks:', err);
  } finally {
    setLoading(false);
  }
};
```

## Troubleshooting

### Widget not displaying data

1. Check that `businessId` and `userId` props are provided
2. Verify the `data` prop structure matches the expected format
3. Check browser console for errors

### Callbacks not firing

1. Ensure `onStartCycleCount` and `onViewAllTasks` props are provided
2. Check that the callbacks are properly bound

### Styling issues

1. Verify Tailwind CSS is properly configured
2. Check that `glass-card` class is defined in your CSS
3. Ensure shadcn/ui components are installed

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/dashboard-enterprise-enhancement/design.md`
- Requirements: `.kiro/specs/dashboard-enterprise-enhancement/requirements.md`
- Tasks: `.kiro/specs/dashboard-enterprise-enhancement/tasks.md`

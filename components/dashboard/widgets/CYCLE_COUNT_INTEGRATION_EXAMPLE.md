# CycleCountTasksWidget Integration Example

## Complete Integration with InventoryDashboard

This example shows how the `CycleCountTasksWidget` is integrated into the `InventoryDashboard` component.

### Step 1: Import the Widget

```jsx
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';
```

### Step 2: Use in Dashboard Layout

The widget is already integrated in `InventoryDashboard.jsx` in the secondary widgets grid:

```jsx
{/* Secondary Widgets Grid */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Reorder Alerts Widget */}
  <Card className="glass-card border-none">
    {/* ... */}
  </Card>

  {/* Cycle Count Tasks Widget */}
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
```

### Step 3: Handle Quick Actions

In the parent component that renders `InventoryDashboard`, handle the quick actions:

```jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDashboard } from '@/components/dashboard/templates/InventoryDashboard';
import CycleCountTask from '@/components/inventory/CycleCountTask';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function InventoryDashboardPage() {
  const router = useRouter();
  const [cycleCountDialog, setCycleCountDialog] = useState(null);

  const handleQuickAction = (action, data) => {
    switch (action) {
      case 'start-cycle-count':
        // Option 1: Open in dialog
        setCycleCountDialog(data); // data is scheduleId
        
        // Option 2: Navigate to dedicated page
        // router.push(`/inventory/cycle-count/${data}`);
        break;

      case 'view-all-cycle-counts':
        router.push('/inventory/cycle-count');
        break;

      // ... other actions
    }
  };

  return (
    <>
      <InventoryDashboard
        businessId="business-123"
        userId="user-456"
        category="pharmacy"
        currency="PKR"
        onQuickAction={handleQuickAction}
      />

      {/* Cycle Count Dialog */}
      {cycleCountDialog && (
        <Dialog 
          open={!!cycleCountDialog} 
          onOpenChange={() => setCycleCountDialog(null)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <CycleCountTask
              scheduleId={cycleCountDialog}
              businessId="business-123"
              onComplete={() => {
                setCycleCountDialog(null);
                // Optionally refresh dashboard data
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
```

## Standalone Usage (Outside Dashboard)

You can also use the widget standalone in any page:

```jsx
'use client';

import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';
import { useRouter } from 'next/navigation';

export default function CycleCountOverviewPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cycle Count Overview</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CycleCountTasksWidget
          businessId="business-123"
          userId="user-456"
          onStartCycleCount={(scheduleId) => {
            router.push(`/inventory/cycle-count/${scheduleId}`);
          }}
          onViewAllTasks={() => {
            router.push('/inventory/cycle-count/all');
          }}
        />
        
        {/* Other widgets or content */}
      </div>
    </div>
  );
}
```

## With Custom Data Fetching

If you want to fetch data at the parent level and pass it down:

```jsx
'use client';

import { useState, useEffect } from 'react';
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CustomDashboard() {
  const [cycleCountData, setCycleCountData] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCycleCountData();
  }, []);

  const loadCycleCountData = async () => {
    try {
      // Fetch from your API or Supabase
      const { data: tasks, error } = await supabase
        .from('cycle_count_tasks')
        .select('*')
        .eq('business_id', 'business-123')
        .eq('assigned_to', 'user-456')
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;

      // Transform data to match widget format
      const widgetData = {
        pendingCount: tasks.filter(t => t.status === 'pending').length,
        inProgressCount: tasks.filter(t => t.status === 'in_progress').length,
        completedToday: 0, // Fetch separately if needed
        tasks: tasks.map(task => ({
          id: task.id,
          name: task.name,
          scheduleId: task.schedule_id,
          dueDate: new Date(task.due_date),
          priority: task.priority,
          productCount: task.product_count,
          completedCount: task.completed_count || 0,
          assignedTo: task.assigned_to,
          status: task.status
        }))
      };

      setCycleCountData(widgetData);
    } catch (error) {
      console.error('Error loading cycle count data:', error);
    }
  };

  return (
    <div className="p-6">
      <CycleCountTasksWidget
        businessId="business-123"
        userId="user-456"
        data={cycleCountData}
        onStartCycleCount={(scheduleId) => {
          console.log('Start cycle count:', scheduleId);
        }}
      />
    </div>
  );
}
```

## Real-Time Updates with Supabase

For real-time updates when cycle count tasks change:

```jsx
'use client';

import { useState, useEffect } from 'react';
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RealtimeCycleCountWidget() {
  const [cycleCountData, setCycleCountData] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCycleCountData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('cycle_count_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cycle_count_tasks',
          filter: `business_id=eq.business-123`
        },
        (payload) => {
          console.log('Cycle count task changed:', payload);
          loadCycleCountData(); // Reload data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCycleCountData = async () => {
    // ... fetch logic from previous example
  };

  return (
    <CycleCountTasksWidget
      businessId="business-123"
      userId="user-456"
      data={cycleCountData}
      onStartCycleCount={(scheduleId) => {
        // Handle action
      }}
    />
  );
}
```

## Mobile-Responsive Layout

The widget is fully responsive and works great on mobile:

```jsx
{/* Mobile: Full width, Desktop: Half width */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <CycleCountTasksWidget
    businessId={businessId}
    userId={userId}
    onStartCycleCount={(scheduleId) => {
      // On mobile, navigate to full page
      router.push(`/inventory/cycle-count/${scheduleId}`);
    }}
  />
</div>
```

## With Loading State Management

If you want to control the loading state externally:

```jsx
'use client';

import { useState } from 'react';
import { CycleCountTasksWidget } from '@/components/dashboard/widgets/CycleCountTasksWidget';

export default function ControlledWidget() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  // The widget will show loading state when data is null
  // and isLoading is managed internally

  return (
    <CycleCountTasksWidget
      businessId="business-123"
      userId="user-456"
      data={data} // null = loading, object = loaded
      onStartCycleCount={(scheduleId) => {
        console.log('Start:', scheduleId);
      }}
    />
  );
}
```

## Summary

The `CycleCountTasksWidget` is:

1. ✅ **Standalone**: Can be used anywhere in the app
2. ✅ **Reusable**: Works with any business/user combination
3. ✅ **Flexible**: Supports both auto-fetch and controlled data modes
4. ✅ **Integrated**: Already embedded in InventoryDashboard
5. ✅ **Responsive**: Works on mobile and desktop
6. ✅ **Real-time ready**: Can be connected to Supabase Realtime
7. ✅ **Accessible**: Follows WCAG guidelines with proper touch targets

For more details, see:
- Usage guide: `CYCLE_COUNT_TASKS_WIDGET_USAGE.md`
- Component source: `CycleCountTasksWidget.jsx`
- Tests: `__tests__/CycleCountTasksWidget.test.js`

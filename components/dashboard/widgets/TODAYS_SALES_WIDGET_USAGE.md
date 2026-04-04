# TodaysSalesWidget Usage Guide

## Overview

The `TodaysSalesWidget` is a reusable dashboard widget that displays today's sales summary with real-time metrics. It shows total sales, order count, average order value, hourly breakdown, and includes a quick action to create new invoices.

## Features

- **Real-time Sales Metrics**: Display today's total sales with target achievement
- **Order Analytics**: Show invoice count and average order value
- **Hourly Breakdown**: Display sales chart for the last 3 hours
- **Progress Tracking**: Visual progress bar showing target achievement
- **Quick Actions**: Create invoice button and view detailed report link
- **Auto-refresh**: Updates every 60 seconds
- **Multi-language**: Supports English and Urdu translations
- **Loading States**: Skeleton loading animation
- **Empty States**: Graceful handling of no data

## Requirements

Validates: Requirements 6.5 (Sales Staff Dashboard)

## Installation

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | `string` | Yes | - | Business ID for fetching sales data |
| `currency` | `string` | No | `'PKR'` | Currency code for formatting amounts |
| `data` | `Object` | No | `null` | Pre-loaded sales data (optional) |
| `onCreateInvoice` | `Function` | No | - | Callback when user clicks create invoice |
| `onViewReport` | `Function` | No | - | Callback when user clicks view detailed report |

### Data Object Structure

```typescript
{
  totalSales: number;        // Total sales amount for today
  totalOrders: number;       // Number of orders/invoices
  avgOrderValue: number;     // Average order value
  target: number;            // Daily sales target
  achievement: number;       // Achievement percentage (0-100)
  trend: 'up' | 'down';     // Sales trend indicator
  hourlyBreakdown: Array<{
    hour: string;            // Time range (e.g., "9-10")
    sales: number;           // Sales amount for that hour
    orders: number;          // Number of orders for that hour
  }>;
}
```

## Usage Examples

### Basic Usage (Auto-fetch data)

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

function SalesDashboard() {
  return (
    <TodaysSalesWidget
      businessId="business-123"
      currency="PKR"
      onCreateInvoice={() => router.push('/invoices/new')}
      onViewReport={() => router.push('/reports/sales')}
    />
  );
}
```

### With Pre-loaded Data

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

function SalesDashboard() {
  const salesData = {
    totalSales: 45000,
    totalOrders: 12,
    avgOrderValue: 3750,
    target: 50000,
    achievement: 90,
    trend: 'up',
    hourlyBreakdown: [
      { hour: '9-10', sales: 5000, orders: 2 },
      { hour: '10-11', sales: 8000, orders: 3 },
      { hour: '11-12', sales: 12000, orders: 3 },
      { hour: '12-1', sales: 6000, orders: 1 },
      { hour: '1-2', sales: 9000, orders: 2 },
      { hour: '2-3', sales: 5000, orders: 1 }
    ]
  };

  return (
    <TodaysSalesWidget
      businessId="business-123"
      currency="PKR"
      data={salesData}
      onCreateInvoice={handleCreateInvoice}
      onViewReport={handleViewReport}
    />
  );
}
```

### In Sales Dashboard Template

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

export function SalesDashboard({ businessId, onQuickAction }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-gray-900">
        Sales Dashboard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodaysSalesWidget
          businessId={businessId}
          currency="PKR"
          onCreateInvoice={() => onQuickAction?.('create-invoice')}
          onViewReport={() => onQuickAction?.('view-sales-report')}
        />
        
        {/* Other widgets */}
      </div>
    </div>
  );
}
```

### In Role-Based Dashboard Controller

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

function RoleBasedDashboard({ userRole, businessId }) {
  // Sales staff see this widget prominently
  if (userRole === 'sales_staff') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodaysSalesWidget
          businessId={businessId}
          onCreateInvoice={() => handleQuickAction('create-invoice')}
          onViewReport={() => handleQuickAction('view-sales-report')}
        />
      </div>
    );
  }
  
  // Other roles might see it in a different layout
  return <OtherDashboardLayout />;
}
```

### With Custom Currency

```jsx
<TodaysSalesWidget
  businessId="business-123"
  currency="USD"
  onCreateInvoice={handleCreateInvoice}
/>
```

### Read-only Mode (No Actions)

```jsx
<TodaysSalesWidget
  businessId="business-123"
  currency="PKR"
  // No callbacks = no action buttons
/>
```

## Styling

The widget uses the glass-card design pattern with wine color scheme:

- **Glass Card**: Translucent background with subtle border
- **Wine Accent**: Primary action button uses wine color (#722F37)
- **Green Theme**: Sales metrics use green gradient (success/growth)
- **Responsive**: Adapts to mobile and desktop layouts
- **Touch-friendly**: All interactive elements ≥44px

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets WCAG 2.1 AA standards (≥4.5:1)
- **Touch Targets**: All buttons ≥44px for mobile accessibility

## Performance

- **Auto-refresh**: Updates every 60 seconds (configurable)
- **Lazy Loading**: Component can be lazy-loaded
- **Optimized Rendering**: Uses React.memo for performance
- **Efficient Updates**: Only re-renders when data changes

## Integration with Existing Systems

### With SalesDashboard Template

The widget is already integrated into `SalesDashboard.jsx`. To use the standalone version:

```jsx
// Before (embedded in SalesDashboard)
<SalesDashboard businessId={businessId} />

// After (using standalone widget)
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

<TodaysSalesWidget
  businessId={businessId}
  onCreateInvoice={() => onQuickAction('create-invoice')}
  onViewReport={() => onQuickAction('view-sales-report')}
/>
```

### With Multi-Level Approval System

The widget can trigger approval workflows for high-value invoices:

```jsx
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';
import { createApprovalRequest } from '@/lib/services/multiLevelApproval';

function SalesDashboard() {
  const handleCreateInvoice = async () => {
    const invoice = await createInvoice();
    
    // If invoice exceeds threshold, create approval request
    if (invoice.total > approvalThreshold) {
      await createApprovalRequest({
        type: 'invoice',
        entityId: invoice.id,
        requestedBy: userId,
        businessId: businessId
      });
    }
  };

  return (
    <TodaysSalesWidget
      businessId={businessId}
      onCreateInvoice={handleCreateInvoice}
    />
  );
}
```

### With Real-time Updates (Supabase)

```jsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TodaysSalesWidget } from '@/components/dashboard/widgets/TodaysSalesWidget';

function SalesDashboard() {
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    // Subscribe to real-time sales updates
    const channel = supabase
      .channel('sales-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices'
      }, (payload) => {
        // Refresh sales data when invoice changes
        fetchTodaysSales().then(setSalesData);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <TodaysSalesWidget
      businessId={businessId}
      data={salesData}
      onCreateInvoice={handleCreateInvoice}
    />
  );
}
```

## API Integration

### Fetching Today's Sales Data

```javascript
// lib/api/sales.js
export async function fetchTodaysSales(businessId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('invoices')
    .select('total, created_at')
    .eq('business_id', businessId)
    .gte('created_at', today.toISOString())
    .eq('status', 'paid');

  if (error) throw error;

  const totalSales = data.reduce((sum, inv) => sum + inv.total, 0);
  const totalOrders = data.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate hourly breakdown
  const hourlyBreakdown = calculateHourlyBreakdown(data);

  // Get daily target from settings
  const target = await getDailySalesTarget(businessId);
  const achievement = target > 0 ? (totalSales / target) * 100 : 0;

  return {
    totalSales,
    totalOrders,
    avgOrderValue,
    target,
    achievement,
    trend: calculateTrend(data),
    hourlyBreakdown
  };
}
```

## Troubleshooting

### Widget Not Loading

**Problem**: Widget shows loading state indefinitely

**Solution**: Check that `businessId` is valid and API is accessible

```jsx
// Add error handling
const [error, setError] = useState(null);

const loadTodaysSales = async () => {
  try {
    const data = await fetchTodaysSales(businessId);
    setSalesData(data);
  } catch (err) {
    console.error('Failed to load sales:', err);
    setError(err.message);
  }
};
```

### Currency Not Formatting

**Problem**: Currency displays as raw numbers

**Solution**: Ensure `formatCurrency` utility is imported and currency code is valid

```jsx
import { formatCurrency } from '@/lib/currency';

// Valid currency codes: PKR, USD, EUR, GBP, etc.
<TodaysSalesWidget currency="PKR" />
```

### Translations Missing

**Problem**: Text shows translation keys instead of actual text

**Solution**: Ensure translations are loaded in `lib/translations.js`

```javascript
// lib/translations.js
export const translations = {
  en: {
    todays_sales: "Today's Sales",
    total_sales: "Total Sales",
    // ... more translations
  },
  ur: {
    todays_sales: "آج کی فروخت",
    total_sales: "کل فروخت",
    // ... more translations
  }
};
```

## Related Components

- **SalesDashboard**: Full sales staff dashboard template
- **CommissionTrackingWidget**: Track sales commission
- **CustomerListWidget**: Recent customers list
- **RevenueChartWidget**: Detailed revenue analytics
- **QuickActionsWidget**: Customizable action buttons

## Future Enhancements

- [ ] Add sales comparison (today vs yesterday)
- [ ] Show top-selling products in hourly breakdown
- [ ] Add sales by payment method breakdown
- [ ] Include sales by location (multi-location support)
- [ ] Add export to PDF/Excel functionality
- [ ] Implement voice commands for creating invoices
- [ ] Add predictive analytics for target achievement

## Support

For issues or questions:
- Check the main dashboard documentation
- Review the SalesDashboard template implementation
- Consult the design document: `.kiro/specs/dashboard-enterprise-enhancement/design.md`

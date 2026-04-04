# SalesDashboard Usage Guide

## Overview

The `SalesDashboard` component provides a sales staff-optimized dashboard with quick access to daily sales operations. It's designed for speed and simplicity, focusing on the most common sales tasks.

## Features

### 1. Quick Invoice Creation
- **Prominent Action Button**: Large, easy-to-access button for creating new invoices
- **One-Click Access**: Minimal clicks to start invoice creation
- **Visual Emphasis**: Highlighted with wine color scheme

### 2. Today's Sales Widget
- **Real-Time Summary**: Current day's sales performance
- **Target Tracking**: Visual progress bar showing achievement percentage
- **Hourly Breakdown**: Recent hourly sales data
- **Key Metrics**:
  - Total sales amount
  - Number of orders
  - Average order value
  - Target achievement percentage

### 3. Commission Tracking Widget
- **Today's Earnings**: Commission earned today
- **Monthly Progress**: Progress toward monthly commission target
- **Payout Information**:
  - Pending amount awaiting payout
  - Next payout date
  - Days until next payout
- **Commission Rate Display**: Shows current commission percentage

### 4. Recent Customers Widget
- **Quick Access**: List of recent customers with key information
- **Customer Status**: Visual badges (VIP, Regular, New)
- **Customer Details**:
  - Name and phone number
  - Total spent
  - Order count
  - Last purchase time
- **Quick Actions**:
  - View customer details
  - Add new customer
  - Search customers
  - View all customers

## Usage Example

```jsx
import { SalesDashboard } from '@/components/dashboard/templates/SalesDashboard';

function SalesPage() {
  const handleQuickAction = (action, data) => {
    switch (action) {
      case 'create-invoice':
        // Navigate to invoice creation
        router.push('/invoices/new');
        break;
      case 'view-customer':
        // Navigate to customer details
        router.push(`/customers/${data}`);
        break;
      case 'view-sales-report':
        // Navigate to sales report
        router.push('/reports/sales');
        break;
      case 'view-commission-history':
        // Navigate to commission history
        router.push('/commission/history');
        break;
      case 'add-customer':
        // Open add customer modal
        setShowAddCustomerModal(true);
        break;
      case 'search-customer':
        // Open customer search
        setShowCustomerSearch(true);
        break;
      case 'view-all-customers':
        // Navigate to customers list
        router.push('/customers');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <SalesDashboard
      businessId="business-123"
      userId="user-456"
      category="retail"
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
| `userId` | string | Yes | - | User ID for personalized data |
| `category` | string | Yes | - | Business category slug |
| `currency` | string | No | 'PKR' | Currency code for formatting |
| `onQuickAction` | function | No | - | Callback for quick action buttons |

## Quick Actions

The dashboard supports the following quick actions via the `onQuickAction` callback:

1. **create-invoice**: Create a new invoice
2. **view-sales-report**: View detailed sales report
3. **view-commission-history**: View commission history
4. **view-customer**: View customer details (passes customer ID)
5. **add-customer**: Add a new customer
6. **search-customer**: Search for customers
7. **view-all-customers**: View all customers list

## Data Integration

### Today's Sales Data

The component expects sales data in the following format:

```typescript
interface TodaysSalesData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  target: number;
  achievement: number; // percentage
  trend: 'up' | 'down' | 'stable';
  hourlyBreakdown: Array<{
    hour: string;
    sales: number;
    orders: number;
  }>;
}
```

### Commission Data

```typescript
interface CommissionData {
  todayEarned: number;
  monthlyEarned: number;
  monthlyTarget: number;
  achievement: number; // percentage
  rate: number; // percentage
  pendingAmount: number;
  lastPayout: Date;
  nextPayout: Date;
}
```

### Customer Data

```typescript
interface CustomerData {
  id: string;
  name: string;
  phone: string;
  lastPurchase: Date;
  totalSpent: number;
  orderCount: number;
  status: 'vip' | 'regular' | 'new';
}
```

## API Integration

To integrate with real data, replace the mock data with API calls:

```jsx
import { useState, useEffect } from 'react';

export function SalesDashboard({ businessId, userId, ...props }) {
  const [todaysSales, setTodaysSales] = useState(null);
  const [commission, setCommission] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch today's sales
    fetch(`/api/sales/today?businessId=${businessId}&userId=${userId}`)
      .then(res => res.json())
      .then(data => setTodaysSales(data));

    // Fetch commission data
    fetch(`/api/commission?businessId=${businessId}&userId=${userId}`)
      .then(res => res.json())
      .then(data => setCommission(data));

    // Fetch recent customers
    fetch(`/api/customers/recent?businessId=${businessId}&limit=4`)
      .then(res => res.json())
      .then(data => setCustomers(data));
  }, [businessId, userId]);

  // ... rest of component
}
```

## Styling

The dashboard uses the existing glass-card styling and wine color scheme:

- **Primary Color**: Wine (#722F37 or similar)
- **Card Style**: Glass-card with subtle background
- **Typography**: Bold headings, clear hierarchy
- **Spacing**: Consistent 4-6 spacing units

## Mobile Responsiveness

The dashboard is fully responsive:

- **Desktop (≥1024px)**: 2-column grid layout
- **Tablet (768px-1023px)**: 2-column grid with adjusted spacing
- **Mobile (<768px)**: Single column, stacked layout

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Touch Targets**: All buttons ≥44px for mobile

## Performance

- **Lazy Loading**: Widgets load on-demand
- **Memoization**: Uses `useMemo` for expensive calculations
- **Optimized Rendering**: Minimal re-renders with proper dependencies

## Localization

The dashboard supports multiple languages via the translation system:

```javascript
const t = translations[language] || translations['en'] || {};
```

Key translation keys:
- `sales_dashboard`
- `todays_sales`
- `commission_tracking`
- `recent_customers`
- `create_new_invoice`
- `total_sales`
- `orders`
- `avg_order`
- `target`
- `achievement`
- And more...

## Integration with RoleBasedDashboardController

The SalesDashboard is automatically loaded for users with the `sales_staff` role:

```jsx
import { RoleBasedDashboardController } from '@/components/dashboard/RoleBasedDashboardController';

// The controller will automatically load SalesDashboard for sales staff
<RoleBasedDashboardController
  businessId={businessId}
  userId={userId}
  userRole="sales_staff"
  category={category}
/>
```

## Best Practices

1. **Keep It Simple**: Sales staff need speed, not complexity
2. **Prominent Actions**: Most common actions should be one click away
3. **Real-Time Updates**: Update sales data frequently (every 30-60 seconds)
4. **Visual Feedback**: Show clear progress indicators and status badges
5. **Quick Access**: Recent customers and quick invoice creation are priorities
6. **Commission Transparency**: Show clear commission tracking and payout information

## Troubleshooting

### Sales data not updating
- Check API endpoint connectivity
- Verify businessId and userId are correct
- Check browser console for errors

### Commission not calculating correctly
- Verify commission rate is set correctly
- Check that sales data includes commission-eligible transactions
- Ensure commission calculation logic matches business rules

### Customers not loading
- Verify customer API endpoint
- Check that businessId has associated customers
- Ensure proper permissions for customer data access

## Related Components

- `OwnerDashboard`: Full business overview
- `ManagerDashboard`: Team management and approvals
- `RoleBasedDashboardController`: Automatic role-based dashboard selection
- `EnhancedDashboard`: Base dashboard with all widgets

## Requirements

**Validates: Requirements 6.5** - Sales Staff Dashboard with quick access to sales operations

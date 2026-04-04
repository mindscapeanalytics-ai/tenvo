# Role-Based Dashboard Integration Guide

## Overview

This guide explains how to integrate role-based dashboards (OwnerDashboard, ManagerDashboard, SalesDashboard) with the existing dashboard system.

## Current Architecture

### Domain Templates (Phase 1 & 2)
- **PharmacyDashboard**: Specialized for pharmaceutical businesses
- **TextileDashboard**: Specialized for textile businesses
- **ElectronicsDashboard**: Specialized for electronics businesses
- **GarmentsDashboard**: Specialized for garment businesses
- **RetailDashboard**: Specialized for general retail businesses

### Role Templates (Phase 3)
- **OwnerDashboard**: Complete business overview for owners/admins
- **ManagerDashboard**: Team management and approvals for managers
- **SalesDashboard**: Quick sales operations for sales staff
- **InventoryDashboard**: Stock management for inventory staff (pending)
- **AccountantDashboard**: Financial management for accountants (pending)

## Integration Approach

### Option 1: Role-First Routing (Recommended)

Route users to role-specific dashboards first, which then include domain-specific widgets:

```jsx
// pages/dashboard.jsx
import { OwnerDashboard } from '@/components/dashboard/templates/OwnerDashboard';
import { ManagerDashboard } from '@/components/dashboard/templates/ManagerDashboard';
import { SalesDashboard } from '@/components/dashboard/templates/SalesDashboard';
import { DashboardTemplateSelector } from '@/components/dashboard/DashboardTemplateSelector';

export default function DashboardPage() {
  const { user, business } = useAuth();
  
  // Route based on user role
  switch (user.role) {
    case 'owner':
    case 'admin':
      return (
        <OwnerDashboard
          businessId={business.id}
          category={business.category}
          currency={business.currency}
          onQuickAction={handleQuickAction}
        />
      );
    
    case 'manager':
      return (
        <ManagerDashboard
          businessId={business.id}
          userId={user.id}
          category={business.category}
          currency={business.currency}
          onQuickAction={handleQuickAction}
        />
      );
    
    case 'sales_staff':
      return (
        <SalesDashboard
          businessId={business.id}
          userId={user.id}
          category={business.category}
          currency={business.currency}
          onQuickAction={handleQuickAction}
        />
      );
    
    case 'inventory_staff':
      // TODO: Implement InventoryDashboard
      return (
        <DashboardTemplateSelector
          businessId={business.id}
          category={business.category}
          onQuickAction={handleQuickAction}
        />
      );
    
    case 'accountant':
      // TODO: Implement AccountantDashboard
      return (
        <DashboardTemplateSelector
          businessId={business.id}
          category={business.category}
          onQuickAction={handleQuickAction}
        />
      );
    
    default:
      // Fallback to domain template
      return (
        <DashboardTemplateSelector
          businessId={business.id}
          category={business.category}
          onQuickAction={handleQuickAction}
        />
      );
  }
}
```

### Option 2: Enhanced RoleBasedDashboardController

Update the RoleBasedDashboardController to load role templates:

```jsx
// components/dashboard/RoleBasedDashboardController.jsx
'use client';

import { useMemo } from 'react';
import { OwnerDashboard } from './templates/OwnerDashboard';
import { ManagerDashboard } from './templates/ManagerDashboard';
import { SalesDashboard } from './templates/SalesDashboard';
import { DashboardTemplateSelector } from './DashboardTemplateSelector';

export function RoleBasedDashboardController({ 
  businessId, 
  category, 
  user,
  currency = 'PKR',
  onQuickAction 
}) {
  const userRole = user?.role || 'owner';

  // Load role-specific dashboard
  const DashboardComponent = useMemo(() => {
    switch (userRole) {
      case 'owner':
      case 'admin':
        return OwnerDashboard;
      
      case 'manager':
        return ManagerDashboard;
      
      case 'sales_staff':
        return SalesDashboard;
      
      case 'inventory_staff':
      case 'accountant':
      default:
        // Fallback to domain template for roles without specific dashboards
        return DashboardTemplateSelector;
    }
  }, [userRole]);

  // Render the selected dashboard
  return (
    <DashboardComponent
      businessId={businessId}
      userId={user?.id}
      category={category}
      currency={currency}
      onQuickAction={onQuickAction}
    />
  );
}
```

### Option 3: Hybrid Approach (Most Flexible)

Allow users to switch between role view and domain view:

```jsx
// pages/dashboard.jsx
import { useState } from 'react';
import { OwnerDashboard } from '@/components/dashboard/templates/OwnerDashboard';
import { ManagerDashboard } from '@/components/dashboard/templates/ManagerDashboard';
import { SalesDashboard } from '@/components/dashboard/templates/SalesDashboard';
import { DashboardTemplateSelector } from '@/components/dashboard/DashboardTemplateSelector';

export default function DashboardPage() {
  const { user, business } = useAuth();
  const [viewMode, setViewMode] = useState('role'); // 'role' or 'domain'
  
  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'role' ? 'domain' : 'role');
  };

  // Role-based view
  if (viewMode === 'role') {
    switch (user.role) {
      case 'owner':
        return <OwnerDashboard {...props} />;
      case 'manager':
        return <ManagerDashboard {...props} />;
      case 'sales_staff':
        return <SalesDashboard {...props} />;
      default:
        return <DashboardTemplateSelector {...props} />;
    }
  }

  // Domain-based view
  return (
    <DashboardTemplateSelector
      businessId={business.id}
      category={business.category}
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Role Dashboard Features

### OwnerDashboard
**Target Users**: Business owners, administrators

**Key Features**:
- Complete business overview
- Financial summary (revenue, expenses, profit)
- Team performance metrics
- System health indicators
- Audit logs viewer
- All widgets available

**Widgets**:
- Financial Summary Card
- System Health Widget
- Team Performance Widget
- Audit Trail Viewer
- All EnhancedDashboard widgets

### ManagerDashboard
**Target Users**: Department managers, team leads

**Key Features**:
- Team management
- Approval queue (prominent)
- Team productivity metrics
- Inventory alerts
- Sales targets progress

**Widgets**:
- Pending Approvals Widget (prominent)
- Team Productivity Widget
- Inventory Alerts Widget
- Sales Targets Widget
- Selected EnhancedDashboard widgets

### SalesDashboard
**Target Users**: Sales staff, sales representatives

**Key Features**:
- Quick invoice creation (prominent)
- Today's sales summary
- Commission tracking
- Recent customers list
- Simplified layout for speed

**Widgets**:
- Quick Invoice Creation Widget
- Today's Sales Widget
- Commission Tracking Widget
- Customer List Widget
- Limited EnhancedDashboard widgets

### InventoryDashboard (Pending)
**Target Users**: Inventory staff, warehouse managers

**Planned Features**:
- Stock levels (all locations)
- Reorder alerts (prominent)
- Batch/serial management
- Stock transfers
- Cycle counting tasks
- Receiving goods queue

### AccountantDashboard (Pending)
**Target Users**: Accountants, financial staff

**Planned Features**:
- Financial summary
- Tax calculations (PST/FST)
- Expense tracking
- Profit/loss analysis
- Bank reconciliation
- FBR compliance status

## Widget Permissions

Each role has specific widget permissions:

```javascript
const widgetPermissions = {
  owner: ['all'], // Can see everything
  
  manager: [
    'revenue', 'inventory', 'batch_expiry', 'serial_warranty',
    'warehouse_distribution', 'approvals', 'team_performance',
    'inventory_alerts', 'sales_targets', 'fbr_compliance'
  ],
  
  sales_staff: [
    'revenue', 'todays_sales', 'customers', 'quick_invoice',
    'commission', 'top_products'
  ],
  
  inventory_staff: [
    'inventory', 'batch_expiry', 'serial_warranty', 'warehouse_distribution',
    'stock_levels', 'reorder_alerts', 'cycle_count_tasks', 'receiving_queue'
  ],
  
  accountant: [
    'revenue', 'financial_summary', 'tax_calculations', 'expense_tracking',
    'bank_reconciliation', 'fbr_compliance', 'inventory'
  ]
};
```

## Quick Actions by Role

### Owner Quick Actions
- View system logs
- View team details
- Manage users
- Configure settings
- View audit trail

### Manager Quick Actions
- View approval queue
- View team details
- View sales reports
- View low stock
- View expiring batches

### Sales Staff Quick Actions
- Create invoice
- View sales report
- View commission history
- View customer details
- Add customer
- Search customers
- View all customers

### Inventory Staff Quick Actions
- Add stock
- Transfer stock
- Adjust stock
- View batch details
- View serial details
- Create cycle count

### Accountant Quick Actions
- View financial reports
- Calculate taxes
- Track expenses
- Reconcile bank
- View FBR status

## Implementation Checklist

### Phase 3 (Current)
- [x] OwnerDashboard component
- [x] ManagerDashboard component
- [x] SalesDashboard component
- [ ] InventoryDashboard component
- [ ] AccountantDashboard component
- [ ] Update RoleBasedDashboardController
- [ ] Add role-based routing
- [ ] Add view mode toggle (optional)

### Testing
- [ ] Test each role dashboard independently
- [ ] Test role-based routing
- [ ] Test widget permissions
- [ ] Test quick actions
- [ ] Test with different business categories
- [ ] Test mobile responsiveness
- [ ] Test accessibility

### Documentation
- [x] SalesDashboard usage guide
- [x] Integration guide (this document)
- [ ] Update main dashboard documentation
- [ ] Add role-based routing examples
- [ ] Add troubleshooting guide

## Migration Strategy

### Step 1: Feature Flag
Add a feature flag to enable role-based dashboards:

```javascript
const ENABLE_ROLE_DASHBOARDS = process.env.NEXT_PUBLIC_ENABLE_ROLE_DASHBOARDS === 'true';

if (ENABLE_ROLE_DASHBOARDS) {
  // Use role-based routing
} else {
  // Use domain-based routing
}
```

### Step 2: Gradual Rollout
1. Enable for internal testing (dev team)
2. Enable for beta users (5%)
3. Enable for all owners/admins (20%)
4. Enable for all managers (40%)
5. Enable for all sales staff (60%)
6. Enable for all users (100%)

### Step 3: Monitor and Adjust
- Track user satisfaction
- Monitor performance metrics
- Collect feedback
- Fix issues
- Optimize based on usage patterns

## Best Practices

1. **Role Detection**: Always detect role from authenticated user context
2. **Fallback**: Provide fallback to domain template for unknown roles
3. **Permissions**: Enforce permissions on both client and server
4. **Performance**: Lazy load role dashboards to reduce bundle size
5. **Consistency**: Maintain consistent design patterns across all role dashboards
6. **Accessibility**: Ensure all role dashboards are accessible
7. **Mobile**: Optimize all role dashboards for mobile devices
8. **Testing**: Test each role dashboard with real user scenarios

## Troubleshooting

### Dashboard not loading
- Check user role is correctly set
- Verify businessId and userId are valid
- Check browser console for errors
- Verify component imports are correct

### Wrong dashboard showing
- Verify role detection logic
- Check role-based routing
- Ensure user role is correctly stored
- Check for role override in development

### Widgets not displaying
- Check widget permissions for role
- Verify widget data is loading
- Check API endpoints
- Verify businessId is correct

### Quick actions not working
- Verify onQuickAction callback is passed
- Check action handler implementation
- Verify routing for actions
- Check permissions for actions

## Related Documentation

- [SalesDashboard Usage Guide](./SALES_DASHBOARD_USAGE.md)
- [OwnerDashboard Usage Guide](./OWNER_DASHBOARD_USAGE.md)
- [ManagerDashboard Usage Guide](./MANAGER_DASHBOARD_USAGE.md)
- [Dashboard Template Selector](./DashboardTemplateSelector.jsx)
- [Role-Based Dashboard Controller](./RoleBasedDashboardController.jsx)

## Conclusion

Role-based dashboards provide a tailored experience for each user type, improving efficiency and user satisfaction. The recommended approach is **Option 1: Role-First Routing** for simplicity and clarity, with the flexibility to add view mode toggling later if needed.

---

**Status**: In Progress  
**Phase**: 3 (Role-Based Dashboard Views)  
**Last Updated**: 2026-04-03

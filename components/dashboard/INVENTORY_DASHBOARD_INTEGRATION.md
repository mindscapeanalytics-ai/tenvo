# InventoryDashboard Integration Guide

## Overview

This guide demonstrates how to integrate the InventoryDashboard component into the role-based dashboard system.

## Integration with RoleBasedDashboardController

### Step 1: Import the Component

```javascript
// components/dashboard/RoleBasedDashboardController.jsx
import { OwnerDashboard } from './templates/OwnerDashboard';
import { ManagerDashboard } from './templates/ManagerDashboard';
import { SalesDashboard } from './templates/SalesDashboard';
import { InventoryDashboard } from './templates/InventoryDashboard'; // Add this
import { AccountantDashboard } from './templates/AccountantDashboard';
```

### Step 2: Add Role Mapping

```javascript
const ROLE_DASHBOARDS = {
  owner: OwnerDashboard,
  admin: OwnerDashboard,
  manager: ManagerDashboard,
  sales: SalesDashboard,
  inventory: InventoryDashboard, // Add this mapping
  accountant: AccountantDashboard
};
```

### Step 3: Handle Quick Actions

```javascript
function RoleBasedDashboardController({ user, business }) {
  const handleQuickAction = (action, data) => {
    switch (action) {
      // Inventory-specific actions
      case 'view-location-stock':
        router.push(`/inventory/locations/${data}`);
        break;
        
      case 'stock-adjustment':
        setModalContent(
          <StockAdjustmentManager
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;
        
      case 'stock-transfer':
        setModalContent(
          <StockTransferForm
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;
        
      case 'create-purchase-order':
        router.push(`/inventory/purchase-orders/new?product=${data}`);
        break;
        
      case 'start-cycle-count':
        router.push(`/inventory/cycle-count/${data}`);
        break;
        
      case 'receive-goods':
        setModalContent(
          <TransferReceiptConfirmation
            poId={data}
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;
        
      case 'quick-receive':
        setModalContent(
          <QuickReceiveDialog
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;
        
      // ... other actions
    }
  };

  const DashboardComponent = ROLE_DASHBOARDS[user.role] || OwnerDashboard;

  return (
    <DashboardComponent
      businessId={business.id}
      userId={user.id}
      category={business.category}
      currency={business.currency}
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Complete Example with Modal System

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDashboard } from '@/components/dashboard/templates/InventoryDashboard';
import { StockAdjustmentManager } from '@/components/inventory/StockAdjustmentManager';
import { StockTransferForm } from '@/components/inventory/StockTransferForm';
import { TransferReceiptConfirmation } from '@/components/inventory/TransferReceiptConfirmation';
import CycleCountTask from '@/components/inventory/CycleCountTask';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function InventoryDashboardPage({ user, business }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openModal = (content) => {
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleQuickAction = (action, data) => {
    switch (action) {
      case 'view-location-stock':
        router.push(`/inventory/locations/${data}`);
        break;

      case 'stock-adjustment':
        openModal(
          <StockAdjustmentManager
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;

      case 'stock-transfer':
        openModal(
          <StockTransferForm
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;

      case 'create-purchase-order':
        router.push(`/inventory/purchase-orders/new?product=${data}`);
        break;

      case 'view-all-reorder-alerts':
        router.push('/inventory/reorder-alerts');
        break;

      case 'start-cycle-count':
        // Option 1: Navigate to dedicated page
        router.push(`/inventory/cycle-count/${data}`);
        
        // Option 2: Open in modal (for quick access)
        // openModal(
        //   <CycleCountTask
        //     scheduleId={data}
        //     businessId={business.id}
        //     onComplete={() => {
        //       closeModal();
        //       refreshDashboard();
        //     }}
        //   />
        // );
        break;

      case 'view-all-cycle-counts':
        router.push('/inventory/cycle-counts');
        break;

      case 'receive-goods':
        openModal(
          <TransferReceiptConfirmation
            poId={data}
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;

      case 'view-all-receipts':
        router.push('/inventory/receiving');
        break;

      case 'quick-receive':
        openModal(
          <QuickReceiveDialog
            businessId={business.id}
            onComplete={() => {
              closeModal();
              refreshDashboard();
            }}
          />
        );
        break;

      default:
        console.log('Unknown action:', action, data);
    }
  };

  return (
    <>
      <InventoryDashboard
        key={refreshKey}
        businessId={business.id}
        userId={user.id}
        category={business.category}
        currency={business.currency || 'PKR'}
        onQuickAction={handleQuickAction}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {modalContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Route Setup (Next.js App Router)

```javascript
// app/dashboard/inventory/page.jsx
import { InventoryDashboardPage } from '@/components/dashboard/InventoryDashboardPage';
import { getCurrentUser } from '@/lib/auth';
import { getBusiness } from '@/lib/business';

export default async function InventoryDashboardRoute() {
  const user = await getCurrentUser();
  const business = await getBusiness(user.businessId);

  // Check if user has inventory role
  if (!['inventory', 'manager', 'owner', 'admin'].includes(user.role)) {
    redirect('/dashboard');
  }

  return (
    <InventoryDashboardPage
      user={user}
      business={business}
    />
  );
}
```

## Permission Checking

```javascript
// lib/permissions.js
export const INVENTORY_PERMISSIONS = {
  VIEW_STOCK: ['inventory', 'manager', 'owner', 'admin'],
  ADJUST_STOCK: ['inventory', 'manager', 'owner', 'admin'],
  TRANSFER_STOCK: ['inventory', 'manager', 'owner', 'admin'],
  CYCLE_COUNT: ['inventory', 'manager', 'owner', 'admin'],
  RECEIVE_GOODS: ['inventory', 'manager', 'owner', 'admin'],
  CREATE_PO: ['inventory', 'manager', 'owner', 'admin']
};

export function hasPermission(userRole, permission) {
  return INVENTORY_PERMISSIONS[permission]?.includes(userRole) || false;
}

// Usage in component
if (!hasPermission(user.role, 'ADJUST_STOCK')) {
  return <PermissionDenied />;
}
```

## Real-time Updates

```javascript
// Add real-time subscriptions for live data
import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useInventoryRealtime(businessId, onUpdate) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    const channel = supabase
      .channel('inventory-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('Stock update:', payload);
          onUpdate('stock', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cycle_count_tasks',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('Cycle count update:', payload);
          onUpdate('cycle-count', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_orders',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('PO update:', payload);
          onUpdate('receiving', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, onUpdate]);
}

// Usage in dashboard
function InventoryDashboardPage({ user, business }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRealtimeUpdate = (type, payload) => {
    // Refresh specific widget or entire dashboard
    setRefreshKey(prev => prev + 1);
  };

  useInventoryRealtime(business.id, handleRealtimeUpdate);

  return (
    <InventoryDashboard
      key={refreshKey}
      businessId={business.id}
      userId={user.id}
      category={business.category}
      currency={business.currency}
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Mobile Optimization

```javascript
// Add mobile-specific behavior
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export function InventoryDashboardPage({ user, business }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleQuickAction = (action, data) => {
    if (isMobile && action === 'start-cycle-count') {
      // On mobile, always navigate to full page
      router.push(`/inventory/cycle-count/${data}`);
    } else {
      // On desktop, can use modal
      openModal(<CycleCountTask scheduleId={data} />);
    }
  };

  return (
    <InventoryDashboard
      businessId={business.id}
      userId={user.id}
      category={business.category}
      currency={business.currency}
      onQuickAction={handleQuickAction}
    />
  );
}
```

## Testing Integration

```javascript
// __tests__/InventoryDashboard.integration.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventoryDashboardPage } from '@/components/dashboard/InventoryDashboardPage';

describe('InventoryDashboard Integration', () => {
  it('should open stock adjustment modal on quick action', async () => {
    const user = { id: 'user-1', role: 'inventory' };
    const business = { id: 'biz-1', category: 'pharmacy', currency: 'PKR' };

    render(<InventoryDashboardPage user={user} business={business} />);

    const adjustButton = screen.getByText('Adjust Stock');
    fireEvent.click(adjustButton);

    await waitFor(() => {
      expect(screen.getByText('Stock Adjustment')).toBeInTheDocument();
    });
  });

  it('should navigate to cycle count on task click', async () => {
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush })
    }));

    const user = { id: 'user-1', role: 'inventory' };
    const business = { id: 'biz-1', category: 'pharmacy', currency: 'PKR' };

    render(<InventoryDashboardPage user={user} business={business} />);

    const task = screen.getByText('Monthly Count - Zone A');
    fireEvent.click(task);

    expect(mockPush).toHaveBeenCalledWith('/inventory/cycle-count/cc-001');
  });
});
```

## Summary

The InventoryDashboard integrates seamlessly with:
1. **RoleBasedDashboardController** - Role-based routing
2. **Modal System** - Quick actions without navigation
3. **Phase 2 Components** - CycleCountTask, StockAdjustmentManager, etc.
4. **Real-time Updates** - WebSocket subscriptions
5. **Permission System** - Role-based access control
6. **Mobile Optimization** - Responsive behavior
7. **Testing Framework** - Integration tests

This provides inventory staff with an efficient, comprehensive dashboard for all stock management operations.

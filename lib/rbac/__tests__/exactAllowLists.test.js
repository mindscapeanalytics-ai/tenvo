import { describe, expect, it } from 'bun:test';
import {
  hasPermission,
  getSuggestedRoles,
  getNavItemAccess,
  NAV_PERMISSION_MAP,
} from '../permissions.js';

describe('RBAC exact allow-lists (Zoho/Busy least privilege)', () => {
  it('does not grant waiter/chef inventory.view when only viewer is listed', () => {
    expect(hasPermission('viewer', 'inventory.view')).toBe(true);
    expect(hasPermission('waiter', 'inventory.view')).toBe(false);
    expect(hasPermission('chef', 'inventory.view')).toBe(false);
  });

  it('keeps inventory writes on warehouse_manager+ only', () => {
    expect(hasPermission('cashier', 'inventory.create')).toBe(false);
    expect(hasPermission('salesperson', 'inventory.edit')).toBe(false);
    expect(hasPermission('warehouse_manager', 'inventory.create')).toBe(true);
    expect(hasPermission('manager', 'inventory.adjust_stock')).toBe(true);
    expect(hasPermission('admin', 'inventory.delete')).toBe(true);
    expect(hasPermission('manager', 'inventory.delete')).toBe(false);
  });

  it('owner always bypasses permission matrix', () => {
    expect(hasPermission('owner', 'inventory.delete')).toBe(true);
    expect(hasPermission('owner', 'hypothetical.future_gate')).toBe(true);
  });

  it('suggests warehouse_manager for textile-wholesale invites', () => {
    const roles = getSuggestedRoles('textile-wholesale');
    expect(roles).toContain('warehouse_manager');
    expect(roles).toContain('accountant');
  });

  it('fills hierarchy gaps for manager warehouse/tax and warehouse_manager orders/approvals', () => {
    expect(hasPermission('manager', 'warehouses.manage')).toBe(true);
    expect(hasPermission('manager', 'tax.view')).toBe(true);
    expect(hasPermission('manager', 'tax.configure')).toBe(false);
    expect(hasPermission('warehouse_manager', 'orders.view')).toBe(true);
    expect(hasPermission('warehouse_manager', 'approvals.request')).toBe(true);
    expect(hasPermission('warehouse_manager', 'sales.view')).toBe(false);
  });

  it('maps view-storefront and hides unknown nav keys', () => {
    expect(NAV_PERMISSION_MAP['view-storefront']).toBeTruthy();
    const storefront = getNavItemAccess('view-storefront', 'cashier', 'business');
    expect(storefront.visible).toBe(true);
    const unknown = getNavItemAccess('not-a-real-nav-key', 'owner', 'enterprise');
    expect(unknown.visible).toBe(false);
  });
});

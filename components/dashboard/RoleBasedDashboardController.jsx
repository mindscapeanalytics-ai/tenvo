'use client';

import { useMemo } from 'react';
import { DashboardTemplateSelector } from './DashboardTemplateSelector';

/**
 * RoleBasedDashboardController Component
 * 
 * Intelligently selects and loads the appropriate dashboard based on:
 * 1. User role (owner, manager, sales_staff, inventory_staff, accountant)
 * 2. Business category (pharmacy, textile, electronics, etc.)
 * 3. Merges role-specific features with domain-specific features
 * 
 * Features:
 * - Automatic role detection from user context
 * - Permission-based widget filtering
 * - Role template merging with domain template
 * - Fallback to domain template if role template not available
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category slug
 * @param {Object} props.user - User object with role information
 * @param {Function} [props.onQuickAction] - Quick action callback
 */
export function RoleBasedDashboardController({ 
  businessId, 
  category, 
  user,
  onQuickAction 
}) {
  // Detect user role (with fallback to 'owner')
  const userRole = useMemo(() => {
    return user?.role || 'owner';
  }, [user]);

  // Determine if role-specific template should be used
  const useRoleTemplate = useMemo(() => {
    // Role-specific templates are now ready and tested
    // Enable role-based dashboard selection
    // This can be controlled via feature flag in the parent component
    return true; // Enabled for Phase 0 rollout
  }, [userRole]);

  // Get role-specific widget permissions
  const widgetPermissions = useMemo(() => {
    const permissions = {
      owner: ['all'], // Owner can see everything
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

    return permissions[userRole] || permissions.owner;
  }, [userRole]);

  // Check if user has permission to view a widget
  const hasPermission = (widgetType) => {
    const perms = widgetPermissions;
    return perms.includes('all') || perms.includes(widgetType);
  };

  // For Phase 3 initial implementation, we'll use domain templates
  // and pass role information for future role-specific customization
  return (
    <DashboardTemplateSelector
      businessId={businessId}
      category={category}
      onQuickAction={onQuickAction}
      userRole={userRole}
      hasPermission={hasPermission}
    />
  );
}

/**
 * Get role display name
 * 
 * @param {string} role - User role
 * @returns {string} Display name
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    owner: 'Owner',
    manager: 'Manager',
    sales_staff: 'Sales Staff',
    inventory_staff: 'Inventory Staff',
    accountant: 'Accountant'
  };

  return roleNames[role] || 'User';
}

/**
 * Get role-specific dashboard features
 * 
 * @param {string} role - User role
 * @returns {Object} Role features
 */
export function getRoleFeatures(role) {
  const features = {
    owner: {
      name: 'Owner Dashboard',
      description: 'Complete business overview with all features',
      primaryWidgets: ['revenue', 'inventory', 'team_performance', 'system_health'],
      canApprove: true,
      canManageUsers: true,
      canViewFinancials: true,
      canManageSettings: true
    },
    manager: {
      name: 'Manager Dashboard',
      description: 'Approval queue and team management',
      primaryWidgets: ['approvals', 'team_productivity', 'inventory_alerts', 'sales_targets'],
      canApprove: true,
      canManageUsers: false,
      canViewFinancials: true,
      canManageSettings: false
    },
    sales_staff: {
      name: 'Sales Dashboard',
      description: 'Quick sales and customer management',
      primaryWidgets: ['todays_sales', 'quick_invoice', 'customers', 'commission'],
      canApprove: false,
      canManageUsers: false,
      canViewFinancials: false,
      canManageSettings: false
    },
    inventory_staff: {
      name: 'Inventory Dashboard',
      description: 'Stock management and cycle counting',
      primaryWidgets: ['stock_levels', 'reorder_alerts', 'cycle_count_tasks', 'receiving_queue'],
      canApprove: false,
      canManageUsers: false,
      canViewFinancials: false,
      canManageSettings: false
    },
    accountant: {
      name: 'Accountant Dashboard',
      description: 'Financial management and tax compliance',
      primaryWidgets: ['financial_summary', 'tax_calculations', 'expense_tracking', 'fbr_compliance'],
      canApprove: false,
      canManageUsers: false,
      canViewFinancials: true,
      canManageSettings: false
    }
  };

  return features[role] || features.owner;
}

/**
 * Check if user role has specific permission
 * 
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} Has permission
 */
export function hasRolePermission(role, permission) {
  const features = getRoleFeatures(role);
  
  const permissionMap = {
    approve: features.canApprove,
    manage_users: features.canManageUsers,
    view_financials: features.canViewFinancials,
    manage_settings: features.canManageSettings
  };

  return permissionMap[permission] || false;
}

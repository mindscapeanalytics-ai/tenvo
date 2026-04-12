/**
 * Centralized Permission Utilities
 * 
 * This module provides unified permission checking across the application.
 * Supports role-based and permission-based access control.
 * 
 * Usage:
 *   import { hasPermission, hasRole } from '@/lib/utils/permissions';
 *   hasPermission(user, 'view_inventory'); // Returns true/false
 */

/**
 * Role hierarchy (higher roles inherit permissions from lower roles)
 */
const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  manager: 3,
  sales_staff: 2,
  inventory_staff: 2,
  accountant: 2,
  staff: 1
};

/**
 * Permission mappings by role
 */
const ROLE_PERMISSIONS = {
  owner: ['*'], // All permissions
  admin: ['*'], // All permissions
  manager: [
    'view_dashboard',
    'view_inventory',
    'view_sales',
    'view_customers',
    'view_reports',
    'view_team_metrics',
    'view_financials',
    'approve_transfers',
    'approve_adjustments',
    'manage_team'
  ],
  sales_staff: [
    'view_dashboard',
    'view_sales',
    'view_customers',
    'create_invoice',
    'create_quotation',
    'view_own_commission'
  ],
  inventory_staff: [
    'view_dashboard',
    'view_inventory',
    'manage_stock',
    'create_adjustment',
    'create_transfer',
    'view_cycle_counts',
    'execute_cycle_counts'
  ],
  accountant: [
    'view_dashboard',
    'view_financials',
    'view_reports',
    'manage_accounting',
    'view_tax',
    'manage_expenses'
  ],
  staff: [
    'view_dashboard'
  ]
};

/**
 * Check if user has specific permission
 * @param {object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  
  const userRole = user.role || 'staff';
  
  // Check if role has wildcard permission
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  if (rolePermissions.includes('*')) return true;
  
  // Check if role has specific permission
  if (rolePermissions.includes(permission)) return true;
  
  // Check user-specific permissions (if provided)
  if (user.permissions && Array.isArray(user.permissions)) {
    if (user.permissions.includes('*')) return true;
    if (user.permissions.includes(permission)) return true;
  }
  
  return false;
}

/**
 * Check if user has specific role
 * @param {object} user - User object with role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
export function hasRole(user, role) {
  if (!user || !role) return false;
  
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 * @param {object} user - User object with role
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if user has any of the roles
 */
export function hasAnyRole(user, roles) {
  if (!user || !roles || !Array.isArray(roles)) return false;
  
  return roles.includes(user.role);
}

/**
 * Check if user has all of the specified permissions
 * @param {object} user - User object with role and permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
export function hasAllPermissions(user, permissions) {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has any of the specified permissions
 * @param {object} user - User object with role and permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has any of the permissions
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user role is higher than or equal to specified role
 * @param {object} user - User object with role
 * @param {string} role - Role to compare
 * @returns {boolean} True if user role is higher or equal
 */
export function hasRoleLevel(user, role) {
  if (!user || !role) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[role] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Get all permissions for a role
 * @param {string} role - Role to get permissions for
 * @returns {string[]} Array of permissions
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all permissions for a user (role + user-specific)
 * @param {object} user - User object with role and permissions
 * @returns {string[]} Array of all permissions
 */
export function getUserPermissions(user) {
  if (!user) return [];
  
  const rolePermissions = getRolePermissions(user.role);
  const userPermissions = user.permissions || [];
  
  // If wildcard, return all
  if (rolePermissions.includes('*') || userPermissions.includes('*')) {
    return ['*'];
  }
  
  // Combine and deduplicate
  return [...new Set([...rolePermissions, ...userPermissions])];
}

/**
 * Check if user can approve (manager or higher)
 * @param {object} user - User object with role
 * @returns {boolean} True if user can approve
 */
export function canApprove(user) {
  return hasPermission(user, 'approve_transfers') || hasPermission(user, 'approve_adjustments');
}

/**
 * Check if user can manage users (owner or admin)
 * @param {object} user - User object with role
 * @returns {boolean} True if user can manage users
 */
export function canManageUsers(user) {
  return hasAnyRole(user, ['owner', 'admin']);
}

/**
 * Check if user can view financials
 * @param {object} user - User object with role
 * @returns {boolean} True if user can view financials
 */
export function canViewFinancials(user) {
  return hasPermission(user, 'view_financials');
}

/**
 * Check if user can manage settings
 * @param {object} user - User object with role
 * @returns {boolean} True if user can manage settings
 */
export function canManageSettings(user) {
  return hasAnyRole(user, ['owner', 'admin']);
}

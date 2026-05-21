'use server';

/**
 * Custom Roles Management Server Actions
 * CRUD for custom RBAC roles
 */

import pool from '@/lib/db';
import { requirePlatformAccess } from './platform';
import { actionSuccess, actionFailure } from '@/lib/actions/_shared/result';
import { hasPermission } from '@/lib/rbac/permissions';

// ============================================
// CUSTOM ROLES
// ============================================

/**
 * Create custom role
 */
export async function createCustomRole({
    businessId,
    name,
    description,
    permissions = [],
    restrictions = []
}) {
    await requirePlatformAccess();
    const client = await pool.connect();
    
    try {
        // Get admin user
        const { user } = await requirePlatformAccess();
        
        // Validate permissions
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return actionFailure('INVALID_PERMISSIONS', 'At least one permission is required');
        }
        
        const result = await client.query(`
            INSERT INTO custom_roles 
            (business_id, name, description, permissions, restrictions, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [businessId, name, description, JSON.stringify(permissions), JSON.stringify(restrictions), user.id]);
        
        return actionSuccess({ role: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return actionFailure('DUPLICATE_NAME', 'Role with this name already exists in this business');
        }
        console.error('[Admin] createCustomRole error:', error);
        return actionFailure('CREATE_ROLE_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * List custom roles for a business
 */
export async function listCustomRoles(businessId, { includeInactive = false } = {}) {
    const client = await pool.connect();
    
    try {
        let whereClause = 'WHERE business_id = $1';
        const params = [businessId];
        
        if (!includeInactive) {
            whereClause += ' AND is_active = true';
        }
        
        const result = await client.query(`
            SELECT 
                cr.*,
                creator.name as created_by_name,
                (SELECT COUNT(*) FROM business_users bu WHERE bu.role = cr.name AND bu.business_id = cr.business_id) as user_count
            FROM custom_roles cr
            LEFT JOIN "user" creator ON cr.created_by = creator.id
            ${whereClause}
            ORDER BY cr.created_at DESC
        `, params);
        
        return actionSuccess({ roles: result.rows });
    } catch (error) {
        console.error('[Admin] listCustomRoles error:', error);
        return actionFailure('LIST_ROLES_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * Get single role details
 */
export async function getCustomRole(roleId) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(`
            SELECT 
                cr.*,
                creator.name as created_by_name,
                creator.email as created_by_email
            FROM custom_roles cr
            LEFT JOIN "user" creator ON cr.created_by = creator.id
            WHERE cr.id = $1
        `, [roleId]);
        
        if (result.rows.length === 0) {
            return actionFailure('NOT_FOUND', 'Role not found');
        }
        
        // Get users with this role
        const usersResult = await client.query(`
            SELECT bu.user_id, bu.status, u.name, u.email
            FROM business_users bu
            JOIN "user" u ON bu.user_id = u.id
            WHERE bu.business_id = $1 AND bu.role = $2
        `, [result.rows[0].business_id, result.rows[0].name]);
        
        return actionSuccess({
            role: result.rows[0],
            users: usersResult.rows
        });
    } catch (error) {
        console.error('[Admin] getCustomRole error:', error);
        return actionFailure('GET_ROLE_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * Update custom role
 */
export async function updateCustomRole(roleId, updates) {
    await requirePlatformAccess();
    const client = await pool.connect();
    
    try {
        const setClause = [];
        const values = [];
        let paramCount = 1;
        
        if (updates.name !== undefined) {
            setClause.push(`name = $${paramCount++}`);
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClause.push(`description = $${paramCount++}`);
            values.push(updates.description);
        }
        if (updates.permissions !== undefined) {
            setClause.push(`permissions = $${paramCount++}`);
            values.push(JSON.stringify(updates.permissions));
        }
        if (updates.restrictions !== undefined) {
            setClause.push(`restrictions = $${paramCount++}`);
            values.push(JSON.stringify(updates.restrictions));
        }
        if (updates.is_active !== undefined) {
            setClause.push(`is_active = $${paramCount++}`);
            values.push(updates.is_active);
        }
        
        if (setClause.length === 0) {
            return actionFailure('NO_UPDATES', 'No fields to update');
        }
        
        values.push(roleId);
        
        const result = await client.query(`
            UPDATE custom_roles
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `, values);
        
        if (result.rows.length === 0) {
            return actionFailure('NOT_FOUND', 'Role not found');
        }
        
        return actionSuccess({ role: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return actionFailure('DUPLICATE_NAME', 'Role with this name already exists');
        }
        console.error('[Admin] updateCustomRole error:', error);
        return actionFailure('UPDATE_ROLE_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * Delete custom role
 */
export async function deleteCustomRole(roleId) {
    await requirePlatformAccess();
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if role has users
        const usersResult = await client.query(`
            SELECT COUNT(*) as count
            FROM business_users bu
            JOIN custom_roles cr ON bu.role = cr.name AND bu.business_id = cr.business_id
            WHERE cr.id = $1
        `, [roleId]);
        
        if (parseInt(usersResult.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return actionFailure('ROLE_HAS_USERS', 'Cannot delete role that has assigned users. Reassign users first.');
        }
        
        const result = await client.query(
            'DELETE FROM custom_roles WHERE id = $1 RETURNING *',
            [roleId]
        );
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return actionFailure('NOT_FOUND', 'Role not found');
        }
        
        await client.query('COMMIT');
        
        return actionSuccess({ message: 'Role deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Admin] deleteCustomRole error:', error);
        return actionFailure('DELETE_ROLE_FAILED', error.message);
    } finally {
        client.release();
    }
}

// ============================================
// ROLE TEMPLATES
// ============================================

const ROLE_TEMPLATES = [
    {
        key: 'store_manager',
        name: 'Store Manager',
        description: 'Manages daily store operations, inventory, and staff',
        permissions: [
            'dashboard.view',
            'pos.access', 'pos.open_session', 'pos.close_session', 'pos.process_sale',
            'inventory.view', 'inventory.edit', 'inventory.adjust_stock',
            'customers.view', 'customers.create', 'customers.edit',
            'sales.view', 'sales.create_invoice',
            'reports.view'
        ],
        restrictions: ['finance.delete', 'settings.billing', 'inventory.delete']
    },
    {
        key: 'sales_associate',
        name: 'Sales Associate',
        description: 'Handles sales, customer service, and POS operations',
        permissions: [
            'dashboard.view',
            'pos.access', 'pos.process_sale',
            'customers.view', 'customers.create',
            'inventory.view',
            'sales.view', 'sales.create_invoice'
        ],
        restrictions: ['pos.void_transaction', 'pos.process_refund', 'pos.apply_discount', 'sales.delete_invoice']
    },
    {
        key: 'inventory_clerk',
        name: 'Inventory Clerk',
        description: 'Manages stock, receives shipments, handles transfers',
        permissions: [
            'dashboard.view',
            'inventory.view', 'inventory.edit', 'inventory.adjust_stock', 'inventory.transfer',
            'purchases.view', 'purchases.create',
            'vendors.view',
            'reports.view'
        ],
        restrictions: ['purchases.approve', 'purchases.delete', 'vendors.delete', 'finance.*']
    },
    {
        key: 'junior_accountant',
        name: 'Junior Accountant',
        description: 'Handles bookkeeping, expenses, and financial reports',
        permissions: [
            'dashboard.view', 'dashboard.financial_kpis',
            'finance.view_gl', 'finance.manage_expenses', 'finance.view_reports',
            'finance.create_journal', 'finance.manage_payments',
            'sales.view',
            'purchases.view',
            'payments.view', 'payments.create', 'payments.allocate',
            'reports.view'
        ],
        restrictions: ['finance.close_period', 'finance.delete', 'settings.billing']
    },
    {
        key: 'head_chef',
        name: 'Head Chef',
        description: 'Manages kitchen operations, recipes, and ingredient inventory',
        permissions: [
            'dashboard.view',
            'restaurant.view_kds', 'restaurant.manage_recipes',
            'inventory.view', 'inventory.edit',
            'purchases.view', 'purchases.create'
        ],
        restrictions: ['pos.*', 'finance.*', 'customers.delete']
    },
    {
        key: 'server',
        name: 'Server/Waiter',
        description: 'Takes orders, serves customers, handles table management',
        permissions: [
            'dashboard.view',
            'restaurant.view_tables', 'restaurant.take_orders',
            'pos.process_sale'
        ],
        restrictions: ['pos.void_transaction', 'pos.process_refund', 'inventory.delete']
    },
    {
        key: 'delivery_manager',
        name: 'Delivery Manager',
        description: 'Manages deliveries, drivers, and delivery operations',
        permissions: [
            'dashboard.view',
            'delivery.view', 'delivery.manage',
            'customers.view',
            'sales.view',
            'inventory.view'
        ],
        restrictions: ['finance.*', 'settings.billing']
    },
    {
        key: 'marketing_manager',
        name: 'Marketing Manager',
        description: 'Manages campaigns, promotions, and customer engagement',
        permissions: [
            'dashboard.view',
            'crm.manage_loyalty', 'crm.view_campaigns', 'crm.manage_promotions',
            'customers.view', 'customers.edit',
            'reports.view'
        ],
        restrictions: ['pos.*', 'inventory.delete', 'finance.*', 'settings.billing']
    }
];

/**
 * Get role templates
 */
export async function getRoleTemplates() {
    return actionSuccess({ templates: ROLE_TEMPLATES });
}

/**
 * Create role from template
 */
export async function createRoleFromTemplate(businessId, templateKey) {
    await requirePlatformAccess();
    
    const template = ROLE_TEMPLATES.find(t => t.key === templateKey);
    if (!template) {
        return actionFailure('INVALID_TEMPLATE', 'Template not found');
    }
    
    return createCustomRole({
        businessId,
        name: template.name,
        description: template.description,
        permissions: template.permissions,
        restrictions: template.restrictions
    });
}

// ============================================
// CUSTOM PACKAGES (Enterprise)
// ============================================

/**
 * Create custom package for enterprise deal
 */
export async function createCustomPackage({
    businessId,
    name,
    baseTier,
    customPricePkr,
    customPriceUsd,
    billingCycle = 'monthly',
    features = {},
    limits = {},
    modules = [],
    addons = [],
    contractStart,
    contractEnd,
    slaDetails = {}
}) {
    await requirePlatformAccess();
    const client = await pool.connect();
    
    try {
        const { user } = await requirePlatformAccess();
        
        const result = await client.query(`
            INSERT INTO custom_packages 
            (business_id, name, base_tier, custom_price_pkr, custom_price_usd, billing_cycle,
             features, limits, modules, addons, contract_start, contract_end, sla_details, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (business_id) 
            DO UPDATE SET
                name = EXCLUDED.name,
                base_tier = EXCLUDED.base_tier,
                custom_price_pkr = EXCLUDED.custom_price_pkr,
                custom_price_usd = EXCLUDED.custom_price_usd,
                billing_cycle = EXCLUDED.billing_cycle,
                features = EXCLUDED.features,
                limits = EXCLUDED.limits,
                modules = EXCLUDED.modules,
                addons = EXCLUDED.addons,
                contract_start = EXCLUDED.contract_start,
                contract_end = EXCLUDED.contract_end,
                sla_details = EXCLUDED.sla_details,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [businessId, name, baseTier, customPricePkr, customPriceUsd, billingCycle,
            JSON.stringify(features), JSON.stringify(limits), JSON.stringify(modules), 
            JSON.stringify(addons), contractStart, contractEnd, JSON.stringify(slaDetails), user.id]);
        
        // Update business to use custom package
        await client.query(`
            UPDATE businesses
            SET custom_package_id = $1, plan_tier = 'custom'
            WHERE id = $2
        `, [result.rows[0].id, businessId]);
        
        return actionSuccess({ package: result.rows[0] });
    } catch (error) {
        console.error('[Admin] createCustomPackage error:', error);
        return actionFailure('CREATE_PACKAGE_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * Get custom package for business
 */
export async function getCustomPackage(businessId) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(`
            SELECT 
                cp.*,
                creator.name as created_by_name,
                b.business_name
            FROM custom_packages cp
            LEFT JOIN "user" creator ON cp.created_by = creator.id
            JOIN businesses b ON cp.business_id = b.id
            WHERE cp.business_id = $1 AND cp.is_active = true
        `, [businessId]);
        
        if (result.rows.length === 0) {
            return actionFailure('NOT_FOUND', 'No active custom package for this business');
        }
        
        return actionSuccess({ package: result.rows[0] });
    } catch (error) {
        console.error('[Admin] getCustomPackage error:', error);
        return actionFailure('GET_PACKAGE_FAILED', error.message);
    } finally {
        client.release();
    }
}

/**
 * Deactivate custom package
 */
export async function deactivateCustomPackage(packageId) {
    await requirePlatformAccess();
    const client = await pool.connect();
    
    try {
        const result = await client.query(`
            UPDATE custom_packages
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [packageId]);
        
        if (result.rows.length === 0) {
            return actionFailure('NOT_FOUND', 'Package not found');
        }
        
        // Revert business to standard plan
        await client.query(`
            UPDATE businesses
            SET custom_package_id = NULL, plan_tier = $2
            WHERE id = $1
        `, [result.rows[0].business_id, result.rows[0].base_tier]);
        
        return actionSuccess({ message: 'Custom package deactivated' });
    } catch (error) {
        console.error('[Admin] deactivateCustomPackage error:', error);
        return actionFailure('DEACTIVATE_PACKAGE_FAILED', error.message);
    } finally {
        client.release();
    }
}

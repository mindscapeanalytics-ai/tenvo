import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * Role-Based Access Control (RBAC) System
 * 
 * Architecture:
 * - Decorator pattern: wrap any server action with `withAuth()` or `withRole()`
 * - Permission matrix: owner > admin > manager > salesperson > viewer
 * - Module-level permissions for granular control
 */


// ─── Role Hierarchy ─────────────────────────────────────────────────────────
const ROLE_HIERARCHY = {
    owner: 5,
    admin: 4,
    manager: 3,
    salesperson: 2,
    viewer: 1,
};

// ─── Module Permissions Matrix ──────────────────────────────────────────────
// Defines which roles can perform which operations on which modules
const PERMISSIONS = {
    inventory: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['salesperson', 'manager', 'admin', 'owner'],
        delete: ['manager', 'admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    invoices: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['salesperson', 'manager', 'admin', 'owner'],
        delete: ['manager', 'admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    customers: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['salesperson', 'manager', 'admin', 'owner'],
        delete: ['manager', 'admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    vendors: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['manager', 'admin', 'owner'],
        delete: ['admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    accounting: {
        read: ['manager', 'admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['owner'],
        admin: ['owner'],
    },
    manufacturing: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['manager', 'admin', 'owner'],
        delete: ['admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    purchases: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['manager', 'admin', 'owner'],
        delete: ['admin', 'owner'],
        admin: ['admin', 'owner'],
    },
    reports: {
        read: ['manager', 'admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['owner'],
        admin: ['owner'],
    },
    business: {
        read: ['viewer', 'salesperson', 'manager', 'admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['owner'],
        admin: ['owner'],
    },
    ai: {
        read: ['manager', 'admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['owner'],
        admin: ['owner'],
    },
};

// ─── Session Resolution ─────────────────────────────────────────────────────

/**
 * Get the current authenticated user's session from BetterAuth
 * Works in Server Components and Server Actions
 * 
 * @returns {Promise<{user: object, session: object} | null>}
 */
export async function getServerSession() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session;
    } catch {
        return null;
    }
}

/**
 * Get the user's role for a specific business
 * 
 * @param {string} userId
 * @param {string} businessId
 * @returns {Promise<string|null>} Role name or null if no access
 */
async function getUserBusinessRole(userId, businessId) {
    if (!userId || !businessId) return null;

    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT role FROM business_users 
       WHERE user_id = $1 AND business_id = $2 AND status = 'active'`,
            [userId, businessId]
        );
        return res.rows.length > 0 ? res.rows[0].role : null;
    } finally {
        client.release();
    }
}

// ─── Auth Context Builder ───────────────────────────────────────────────────

/**
 * Build an auth context object for use within server actions
 * Contains the authenticated user, their role, and helper methods
 * 
 * @param {string} businessId - The business ID to check access for
 * @returns {Promise<object>} Auth context
 */
async function buildAuthContext(businessId) {
    const session = await getServerSession();

    if (!session?.user) {
        return { authenticated: false, error: 'Not authenticated' };
    }

    const role = businessId ? await getUserBusinessRole(session.user.id, businessId) : null;

    if (businessId && !role) {
        return {
            authenticated: true,
            authorized: false,
            error: 'No access to this business',
            user: session.user,
        };
    }

    return {
        authenticated: true,
        authorized: true,
        user: session.user,
        userId: session.user.id,
        role: role || 'viewer',
        roleLevel: ROLE_HIERARCHY[role] || 0,
        businessId,

        // Helper: check if user has at least the given role level
        hasMinRole(minRole) {
            return (ROLE_HIERARCHY[this.role] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
        },

        // Helper: check if user can perform operation on module
        canPerform(module, operation) {
            const modulePerms = PERMISSIONS[module];
            if (!modulePerms || !modulePerms[operation]) return false;
            return modulePerms[operation].includes(this.role);
        },
    };
}

// ─── Decorator: withAuth ────────────────────────────────────────────────────

/**
 * Wrap a server action with basic authentication check.
 * The wrapped action receives an auth context as its first argument.
 * The businessId is extracted from the first argument of the original action.
 * 
 * @param {Function} action - Server action to wrap: (context, ...originalArgs) => result
 * @param {object} options - Configuration options
 * @param {string} options.businessIdArg - How to extract businessId: 'first' (default), 'second', or 'fromObject'
 * @param {string} options.businessIdKey - Key name when businessIdArg is 'fromObject'
 * @returns {Function} Wrapped server action
 */
export function withAuth(action, options = {}) {
    const { businessIdArg = 'first', businessIdKey = 'business_id' } = options;

    return async function (...args) {
        // Extract businessId from arguments
        let businessId;
        if (businessIdArg === 'first') {
            businessId = args[0];
        } else if (businessIdArg === 'second') {
            businessId = args[1];
        } else if (businessIdArg === 'fromObject') {
            businessId = args[0]?.[businessIdKey] || args[0]?.businessId;
        }

        const context = await buildAuthContext(businessId);

        if (!context.authenticated) {
            return { success: false, error: 'Authentication required. Please log in.' };
        }

        if (businessId && !context.authorized) {
            return { success: false, error: 'You do not have access to this business.' };
        }

        try {
            return await action(context, ...args);
        } catch (error) {
            console.error(`[RBAC] Action error for user ${context.userId}:`, error.message);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred',
            };
        }
    };
}

// ─── Decorator: withRole ────────────────────────────────────────────────────

/**
 * Wrap a server action with role-based access check.
 * Only users with one of the specified roles can execute the action.
 * 
 * @param {string[]} allowedRoles - Array of role names that can access this action
 * @param {Function} action - Server action to wrap
 * @param {object} options - Same options as withAuth
 * @returns {Function} Wrapped server action
 */
export function withRole(allowedRoles, action, options = {}) {
    return withAuth(async (context, ...args) => {
        if (!allowedRoles.includes(context.role)) {
            return {
                success: false,
                error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`,
            };
        }
        return await action(context, ...args);
    }, options);
}

// ─── Decorator: withPermission ──────────────────────────────────────────────

/**
 * Wrap a server action with module-level permission check.
 * 
 * @param {string} module - Module name (e.g., 'inventory', 'invoices')
 * @param {string} operation - Operation type ('read', 'write', 'delete', 'admin')
 * @param {Function} action - Server action to wrap
 * @param {object} options - Same options as withAuth
 * @returns {Function} Wrapped server action
 */
export function withPermission(module, operation, action, options = {}) {
    return withAuth(async (context, ...args) => {
        if (!context.canPerform(module, operation)) {
            return {
                success: false,
                error: `Permission denied: cannot ${operation} on ${module}`,
            };
        }
        return await action(context, ...args);
    }, options);
}

// ─── Utility Exports ────────────────────────────────────────────────────────

export { ROLE_HIERARCHY, PERMISSIONS };

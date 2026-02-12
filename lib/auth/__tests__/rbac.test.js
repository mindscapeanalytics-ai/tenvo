import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * RBAC System Tests
 * 
 * Tests the Role-Based Access Control decorator system:
 * - withAuth: basic authentication check
 * - withRole: role-restricted actions
 * - withPermission: module-level permission checks
 */

// Mock the auth module and DB pool
const { mockClient, mockGetSession } = vi.hoisted(() => ({
    mockClient: {
        query: vi.fn(),
        release: vi.fn(),
    },
    mockGetSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: (...args) => mockGetSession(...args),
        },
    },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/db', () => ({
    default: {
        connect: vi.fn().mockResolvedValue(mockClient),
    },
}));

import { withAuth, withRole, withPermission, ROLE_HIERARCHY, PERMISSIONS } from '../rbac';

describe('RBAC System', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClient.query.mockReset();
        mockClient.release.mockReset();
    });

    describe('ROLE_HIERARCHY', () => {
        it('should have correct role levels', () => {
            expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
            expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
            expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.salesperson);
            expect(ROLE_HIERARCHY.salesperson).toBeGreaterThan(ROLE_HIERARCHY.viewer);
        });
    });

    describe('PERMISSIONS', () => {
        it('should define permissions for core modules', () => {
            const requiredModules = ['inventory', 'invoices', 'customers', 'vendors', 'accounting', 'manufacturing'];
            for (const mod of requiredModules) {
                expect(PERMISSIONS[mod]).toBeDefined();
                expect(PERMISSIONS[mod].read).toBeDefined();
                expect(PERMISSIONS[mod].write).toBeDefined();
                expect(PERMISSIONS[mod].delete).toBeDefined();
            }
        });

        it('should restrict accounting to managers and above', () => {
            expect(PERMISSIONS.accounting.read).not.toContain('viewer');
            expect(PERMISSIONS.accounting.read).not.toContain('salesperson');
            expect(PERMISSIONS.accounting.read).toContain('manager');
        });
    });

    describe('withAuth', () => {
        it('should reject unauthenticated users', async () => {
            mockGetSession.mockResolvedValue(null);

            const action = withAuth(async (context, businessId) => {
                return { success: true, data: 'sensitive' };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Authentication required');
        });

        it('should reject users without business access', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            // Return empty result - no business_users entry
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            const action = withAuth(async (context, businessId) => {
                return { success: true };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('access');
        });

        it('should allow authenticated users with business access', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

            const action = withAuth(async (context, businessId) => {
                return { success: true, userId: context.userId, role: context.role };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(true);
            expect(result.userId).toBe('user-1');
            expect(result.role).toBe('admin');
        });

        it('should pass auth context with helper methods', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'manager' }] });

            const action = withAuth(async (context) => {
                return {
                    success: true,
                    hasMinAdmin: context.hasMinRole('admin'),
                    hasMinManager: context.hasMinRole('manager'),
                    canReadInventory: context.canPerform('inventory', 'read'),
                    canDeleteAccounting: context.canPerform('accounting', 'delete'),
                };
            });

            const result = await action('biz-1');
            expect(result.hasMinAdmin).toBe(false);   // manager < admin
            expect(result.hasMinManager).toBe(true);   // manager >= manager
            expect(result.canReadInventory).toBe(true);
            expect(result.canDeleteAccounting).toBe(false); // only owner can delete accounting
        });
    });

    describe('withRole', () => {
        it('should reject users without required role', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'salesperson' }] });

            const action = withRole(['owner', 'admin'], async (context) => {
                return { success: true };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Insufficient permissions');
        });

        it('should allow users with required role', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

            const action = withRole(['owner', 'admin'], async (context) => {
                return { success: true, role: context.role };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(true);
            expect(result.role).toBe('admin');
        });
    });

    describe('withPermission', () => {
        it('should reject users without module permission', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'viewer' }] });

            const action = withPermission('invoices', 'write', async (context) => {
                return { success: true };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Permission denied');
        });

        it('should allow users with correct module permission', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'salesperson' }] });

            const action = withPermission('invoices', 'write', async (context) => {
                return { success: true };
            });

            const result = await action('biz-1');
            expect(result.success).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should catch and return errors from wrapped actions', async () => {
            mockGetSession.mockResolvedValue({
                user: { id: 'user-1', email: 'test@test.com' },
            });
            mockClient.query.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

            const action = withAuth(async () => {
                throw new Error('Database connection failed');
            });

            const result = await action('biz-1');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Database connection failed');
        });
    });
});

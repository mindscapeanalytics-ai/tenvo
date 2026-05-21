/**
 * Integration Tests for Subscription System
 * Tests plan tiers, feature flags, RBAC, and admin functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  PLAN_TIERS,
  planHasFeature,
  planWithinLimit,
  getNextTier,
  getUpgradeBenefits,
  resolvePlanTier,
  planAtLeast,
  MODULE_PACKAGES,
  calculateCustomPackagePrice,
  TENVO_ADVANTAGES
} from '@/lib/config/plans';

import {
  hasPermission,
  canAccessTab,
  getRequiredPlan,
  NAV_PERMISSION_MAP,
  ROLE_HIERARCHY
} from '@/lib/rbac/permissions';

describe('Subscription System Integration', () => {
  
  describe('Plan Tiers', () => {
    it('should have 5 tier levels defined', () => {
      const tiers = Object.keys(PLAN_TIERS);
      expect(tiers).toHaveLength(5);
      expect(tiers).toContain('free');
      expect(tiers).toContain('starter');
      expect(tiers).toContain('professional');
      expect(tiers).toContain('business');
      expect(tiers).toContain('enterprise');
    });

    it('should have correct Pakistan pricing', () => {
      expect(PLAN_TIERS.free.price_pkr).toBe(0);
      expect(PLAN_TIERS.starter.price_pkr).toBe(999);
      expect(PLAN_TIERS.professional.price_pkr).toBe(4999);
      expect(PLAN_TIERS.business.price_pkr).toBe(9999);
    });

    it('should have correct feature flags for each tier', () => {
      // Free tier
      expect(PLAN_TIERS.free.features.invoicing).toBe(true);
      expect(PLAN_TIERS.free.features.pos_terminal).toBe(false);
      expect(PLAN_TIERS.free.features.ai_analytics).toBe(false);

      // Starter tier
      expect(PLAN_TIERS.starter.features.pos_terminal).toBe(true);
      expect(PLAN_TIERS.starter.features.api_access).toBe(true);
      expect(PLAN_TIERS.starter.features.ai_analytics).toBe(false);

      // Professional tier
      expect(PLAN_TIERS.professional.features.ai_analytics).toBe(true);
      expect(PLAN_TIERS.professional.features.multi_warehouse).toBe(true);
      expect(PLAN_TIERS.professional.features.payroll_processing).toBe(false);

      // Business tier
      expect(PLAN_TIERS.business.features.payroll_processing).toBe(true);
      expect(PLAN_TIERS.business.features.approval_workflows).toBe(true);
    });

    it('should have correct usage limits', () => {
      expect(PLAN_TIERS.free.limits.max_users).toBe(1);
      expect(PLAN_TIERS.starter.limits.max_users).toBe(3);
      expect(PLAN_TIERS.professional.limits.max_users).toBe(10);
      expect(PLAN_TIERS.business.limits.max_users).toBe(25);
      expect(PLAN_TIERS.enterprise.limits.max_users).toBe(-1); // Unlimited
    });
  });

  describe('planHasFeature()', () => {
    it('should return true for available features', () => {
      expect(planHasFeature('business', 'payroll')).toBe(true);
      expect(planHasFeature('professional', 'ai_analytics')).toBe(true);
      expect(planHasFeature('starter', 'pos_terminal')).toBe(true);
    });

    it('should return false for unavailable features', () => {
      expect(planHasFeature('free', 'payroll')).toBe(false);
      expect(planHasFeature('starter', 'ai_analytics')).toBe(false);
      expect(planHasFeature('professional', 'genai_chatbot')).toBe(false);
    });

    it('should handle legacy tier names', () => {
      expect(planHasFeature('standard', 'pos_terminal')).toBe(true); // standard -> starter
      expect(planHasFeature('premium', 'payroll')).toBe(true); // premium -> business
    });

    it('should handle invalid tiers gracefully', () => {
      expect(planHasFeature('invalid', 'invoicing')).toBe(true); // defaults to free
      expect(planHasFeature(undefined, 'invoicing')).toBe(true);
    });
  });

  describe('planWithinLimit()', () => {
    it('should return true when under limit', () => {
      expect(planWithinLimit('starter', 'max_users', 2)).toBe(true);
      expect(planWithinLimit('professional', 'max_products', 500)).toBe(true);
    });

    it('should return false when at limit', () => {
      expect(planWithinLimit('starter', 'max_users', 3)).toBe(false);
      expect(planWithinLimit('free', 'max_customers', 50)).toBe(false);
    });

    it('should return true for unlimited (-1)', () => {
      expect(planWithinLimit('enterprise', 'max_users', 999999)).toBe(true);
      expect(planWithinLimit('enterprise', 'max_products', 999999)).toBe(true);
    });
  });

  describe('Tier Progression', () => {
    it('should return correct next tier', () => {
      expect(getNextTier('free')).toBe('starter');
      expect(getNextTier('starter')).toBe('professional');
      expect(getNextTier('professional')).toBe('business');
      expect(getNextTier('business')).toBe('enterprise');
      expect(getNextTier('enterprise')).toBeNull();
    });

    it('should calculate upgrade benefits', () => {
      const benefits = getUpgradeBenefits('starter', 'professional');
      expect(benefits.length).toBeGreaterThan(0);
      expect(benefits).toContain('AI Analytics Dashboard');
      expect(benefits).toContain('Multi-Warehouse');
    });

    it('should compare tiers correctly', () => {
      expect(planAtLeast('business', 'professional')).toBe(true);
      expect(planAtLeast('starter', 'professional')).toBe(false);
      expect(planAtLeast('enterprise', 'free')).toBe(true);
    });
  });

  describe('Module Packages', () => {
    it('should have 8 module packages defined', () => {
      const modules = Object.keys(MODULE_PACKAGES);
      expect(modules).toHaveLength(8);
      expect(modules).toContain('essentials');
      expect(modules).toContain('accounts');
      expect(modules).toContain('pos');
      expect(modules).toContain('operations');
      expect(modules).toContain('hr');
      expect(modules).toContain('crm');
      expect(modules).toContain('intelligence');
      expect(modules).toContain('governance');
    });

    it('should calculate custom package prices correctly', () => {
      const result = calculateCustomPackagePrice(['accounts', 'pos'], 'pkr');
      expect(result.basePrice).toBe(999);
      expect(result.moduleTotal).toBe(499 + 799); // accounts + pos
      expect(result.finalPrice).toBeLessThan(result.basePrice + result.moduleTotal);
    });

    it('should apply bundle discounts', () => {
      const result = calculateCustomPackagePrice(
        ['accounts', 'pos', 'crm', 'operations', 'hr'], 
        'pkr'
      );
      expect(result.discount).toBeGreaterThan(0);
    });
  });

  describe('RBAC System', () => {
    it('should have correct role hierarchy', () => {
      expect(ROLE_HIERARCHY.owner).toBe(9);
      expect(ROLE_HIERARCHY.viewer).toBe(0);
      expect(ROLE_HIERARCHY.admin).toBe(8);
    });

    it('should grant owner all permissions', () => {
      const allPermissions = [
        'dashboard.view', 'inventory.create', 'sales.delete_invoice',
        'finance.close_period', 'settings.billing'
      ];
      
      allPermissions.forEach(permission => {
        expect(hasPermission('owner', permission)).toBe(true);
      });
    });

    it('should restrict viewer appropriately', () => {
      expect(hasPermission('viewer', 'dashboard.view')).toBe(true);
      expect(hasPermission('viewer', 'inventory.create')).toBe(false);
      expect(hasPermission('viewer', 'sales.create_invoice')).toBe(false);
    });

    it('should handle permission inheritance', () => {
      // Manager should have permissions of lower roles
      expect(hasPermission('manager', 'pos.process_sale')).toBe(true);
      expect(hasPermission('manager', 'inventory.view')).toBe(true);
      
      // But not admin-level permissions
      expect(hasPermission('manager', 'sales.delete_invoice')).toBe(false);
    });
  });

  describe('NAV_PERMISSION_MAP', () => {
    it('should have all critical tabs mapped', () => {
      expect(NAV_PERMISSION_MAP['payroll']).toBeDefined();
      expect(NAV_PERMISSION_MAP['analytics']).toBeDefined();
      expect(NAV_PERMISSION_MAP['warehouses']).toBeDefined();
      expect(NAV_PERMISSION_MAP['approvals']).toBeDefined();
    });

    it('should map to correct feature keys', () => {
      expect(NAV_PERMISSION_MAP['payroll'].feature).toBe('payroll');
      expect(NAV_PERMISSION_MAP['analytics'].feature).toBe('ai_analytics');
      expect(NAV_PERMISSION_MAP['warehouses'].feature).toBe('multi_warehouse');
    });

    it('should get required plan for tabs', () => {
      expect(getRequiredPlan('payroll')).toBe('business');
      expect(getRequiredPlan('analytics')).toBe('professional');
      expect(getRequiredPlan('warehouses')).toBe('professional');
    });
  });

  describe('Tenvo Advantages', () => {
    it('should have competitive advantages defined', () => {
      expect(TENVO_ADVANTAGES.ai_capabilities).toBeDefined();
      expect(TENVO_ADVANTAGES.marketing).toBeDefined();
      expect(TENVO_ADVANTAGES.local).toBeDefined();
      expect(TENVO_ADVANTAGES.pricing).toBeDefined();
    });

    it('should highlight unique features', () => {
      const aiPoints = TENVO_ADVANTAGES.ai_capabilities.points;
      expect(aiPoints).toContain(expect.stringContaining('Autonomous Procurement Agent'));
      expect(aiPoints).toContain(expect.stringContaining('AI Chatbot'));
    });

    it('should emphasize Pakistan advantages', () => {
      const localPoints = TENVO_ADVANTAGES.local.points;
      expect(localPoints).toContain(expect.stringContaining('Urdu'));
      expect(localPoints).toContain(expect.stringContaining('JazzCash'));
      expect(localPoints).toContain(expect.stringContaining('Offline POS'));
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user flow: free user tries to access AI', () => {
      const userTier = 'free';
      const tabKey = 'analytics';
      const userRole = 'owner';

      // Check permission
      const hasPerm = hasPermission(userRole, NAV_PERMISSION_MAP[tabKey].permission);
      expect(hasPerm).toBe(true); // Owner has permission

      // Check feature availability
      const hasFeature = planHasFeature(userTier, NAV_PERMISSION_MAP[tabKey].feature);
      expect(hasFeature).toBe(false); // But free tier doesn't have AI

      // Get upgrade path
      const nextTier = getNextTier(userTier);
      expect(nextTier).toBe('starter');

      // Starter still doesn't have AI
      expect(planHasFeature('starter', 'ai_analytics')).toBe(false);

      // Professional has AI
      expect(planHasFeature('professional', 'ai_analytics')).toBe(true);

      // Benefits of upgrading to professional
      const benefits = getUpgradeBenefits('free', 'professional');
      expect(benefits.length).toBeGreaterThan(10);
    });

    it('should handle staff member with limited role', () => {
      const cashierRole = 'cashier';
      
      // Can access POS
      expect(hasPermission(cashierRole, 'pos.process_sale')).toBe(true);
      
      // Cannot apply discounts (manager only)
      expect(hasPermission(cashierRole, 'pos.apply_discount')).toBe(false);
      
      // Cannot void transactions (manager only)
      expect(hasPermission(cashierRole, 'pos.void_transaction')).toBe(false);
      
      // Cannot access analytics
      expect(hasPermission(cashierRole, 'analytics.basic')).toBe(false);
    });

    it('should correctly evaluate tab access for all tiers', () => {
      const tabsToTest = ['payroll', 'analytics', 'warehouses', 'campaigns'];
      
      tabsToTest.forEach(tabKey => {
        const mapping = NAV_PERMISSION_MAP[tabKey];
        expect(mapping).toBeDefined();
        
        const requiredPlan = getRequiredPlan(tabKey);
        expect(requiredPlan).toBeDefined();
        
        // Verify the feature exists in plans
        expect(PLAN_TIERS[requiredPlan].features[mapping.feature]).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive tier resolution', () => {
      expect(resolvePlanTier('BUSINESS')).toBe('business');
      expect(resolvePlanTier('Professional')).toBe('professional');
    });

    it('should handle missing features gracefully', () => {
      expect(planHasFeature('business', 'nonexistent_feature')).toBe(false);
    });

    it('should handle undefined/null inputs', () => {
      expect(resolvePlanTier(undefined)).toBe('free');
      expect(resolvePlanTier(null)).toBe('free');
      expect(planHasFeature(null, 'invoicing')).toBe(true);
    });

    it('should handle empty arrays for benefits', () => {
      const benefits = getUpgradeBenefits('enterprise', 'enterprise');
      expect(benefits).toEqual([]);
    });
  });
});

// Mock data for tests
jest.mock('@/lib/config/plans', () => ({
  ...jest.requireActual('@/lib/config/plans'),
  // Ensure we use actual implementation
}));

jest.mock('@/lib/rbac/permissions', () => ({
  ...jest.requireActual('@/lib/rbac/permissions'),
  // Ensure we use actual implementation
}));

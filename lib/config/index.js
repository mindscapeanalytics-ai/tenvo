/**
 * Tenvo Configuration Exports
 * Centralized exports for all configuration modules
 * 
 * Usage:
 *   import { 
 *     PLAN_TIERS, 
 *     MODULE_PACKAGES, 
 *     planHasFeature,
 *     TENVO_ADVANTAGES 
 *   } from '@/lib/config';
 */

// ============================================
// Plan & Subscription Configuration
// ============================================

export {
  // Core plan configuration
  PLAN_TIERS,
  MODULE_PACKAGES,
  ADDONS,
  MODULE_PICKER_CONFIG,
  FEATURE_LABELS,
  MODULE_LABELS,
  TENVO_ADVANTAGES,
  
  // Utility functions
  planHasFeature,
  planWithinLimit,
  planAtLeast,
  planHasModule,
  resolvePlanTier,
  getNextTier,
  getUpgradeBenefits,
  getAllPlansOrdered,
  calculateCustomPackagePrice,
  getModuleFeatures,
  getTierModules,
  getAllAdvantages,
  getAdvantagesByCategory,
  
  // Constants
  PLAN_ORDER,
  PLAN_ALIASES,
  FEATURE_MIN_PLAN,
  LEGACY_FEATURE_MAP,
} from './plans';

// ============================================
// Tab & Navigation Configuration
// ============================================

export {
  VALID_DASHBOARD_TABS,
  normalizeDashboardTab,
  resolveDashboardTab,
  isValidDashboardTab,
} from './tabs';

// ============================================
// RBAC & Permissions
// ============================================

export {
  // Role hierarchy
  ROLE_HIERARCHY,
  ALL_ROLES,
  
  // Permission checking
  hasPermission,
  canAccessTab,
  getRequiredPlan,
  getRequiredPermission,
  checkAccess,
  
  // Navigation gating
  NAV_PERMISSION_MAP,
} from '../rbac/permissions';

// ============================================
// Platform & Admin Configuration
// ============================================

export {
  // Platform owner
  PLATFORM_OWNER_EMAIL,
  isPlatformOwner,
  isPlatformLevel,
  
  // Trial configuration
  TRIAL_CONFIG,
  getTrialExpiryDate,
  isTrialActive,
  getTrialDaysRemaining,
  
  // Role descriptions
  ROLE_DESCRIPTIONS,
} from './platform';

// ============================================
// Domain & Category Configuration
// ============================================

export {
  isPosRelevant,
  isHospitality,
  isCampaignRelevant,
  getDomainKnowledge,
} from './domains';

// ============================================
// Re-export for convenience
// ============================================

// Make plans.js exports available directly from config
export * from './plans';

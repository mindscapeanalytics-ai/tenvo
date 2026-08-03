# Phase 0: Enable Role-Based Dashboards - Implementation Plan

## Overview

Enable existing role-based dashboard functionality with minimal risk by:
1. Adding feature flag infrastructure ✅ COMPLETE
2. Integrating RoleBasedDashboardController into DomainDashboard
3. Enabling role-based template selection
4. Testing with all roles and domains

## Current Architecture

```
DashboardTabs.jsx
  └── DomainDashboard.tsx (renders DashboardTab or EnhancedDashboard based on domain)
      ├── DashboardTab.tsx (NetSuite-style for some domains)
      └── EnhancedDashboard.jsx (Card-based for most domains)
```

## Target Architecture (Phase 0)

```
DashboardTabs.jsx
  └── DomainDashboard.tsx
      └── [Feature Flag Check]
          ├── IF ENABLED: RoleBasedDashboardController
          │   └── DashboardTemplateSelector
          │       └── Domain/Role Template
          └── IF DISABLED: Current behavior (DashboardTab or EnhancedDashboard)
```

## Implementation Steps

### Step 1: Update DomainDashboard.tsx ✅ NEXT

**Changes**:
1. Import feature flag utilities
2. Import RoleBasedDashboardController
3. Add user prop to interface
4. Add feature flag check
5. Render RoleBasedDashboardController when enabled
6. Maintain backward compatibility

**Code Changes**:
```typescript
// Add imports
import { isFeatureEnabledForUser, FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { RoleBasedDashboardController } from '@/components/dashboard/RoleBasedDashboardController';

// Update interface
interface DomainDashboardProps {
  // ... existing props
  user?: {
    id: string;
    role: 'owner' | 'manager' | 'sales_staff' | 'inventory_staff' | 'accountant';
    permissions?: string[];
  };
}

// Add feature flag check in component
const unifiedDashboardEnabled = isFeatureEnabledForUser(
  FEATURE_FLAGS.UNIFIED_DASHBOARD,
  {
    userId: user?.id,
    userRole: user?.role,
    businessId: activeBusinessId
  }
);

// Conditional rendering
if (unifiedDashboardEnabled) {
  return (
    <RoleBasedDashboardController
      businessId={activeBusinessId}
      category={category}
      user={user}
      onQuickAction={onQuickAction}
    />
  );
}

// ... existing rendering logic
```

### Step 2: Enable Role Templates in RoleBasedDashboardController

**Changes**:
1. Change `useRoleTemplate` from `false` to `true`
2. Test role detection logic
3. Verify permission filtering

**Code Changes**:
```javascript
// In RoleBasedDashboardController.jsx
const useRoleTemplate = useMemo(() => {
  // Enable role-specific templates
  return true; // Changed from false
}, [userRole]);
```

### Step 3: Update DashboardTabs.jsx to Pass User Context

**Changes**:
1. Add user prop to DomainDashboard
2. Pass user from page.js context

**Code Changes**:
```javascript
// In DashboardTabs.jsx
<DomainDashboard
  // ... existing props
  user={user} // Add this
/>
```

### Step 4: Update page.js to Pass User to DashboardTabs

**Changes**:
1. Pass user from useAuth to DashboardTabs

**Code Changes**:
```javascript
// In page.js
<DashboardTabs
  // ... existing props
  user={user} // Add this
/>
```

## Testing Plan

### Test Matrix

| Role | Domain | Expected Template | Test Status |
|------|--------|------------------|-------------|
| Owner | Pharmacy | OwnerDashboard | ⏳ Pending |
| Owner | Textile | OwnerDashboard | ⏳ Pending |
| Manager | Pharmacy | ManagerDashboard | ⏳ Pending |
| Sales | Retail | SalesDashboard | ⏳ Pending |
| Inventory | Electronics | InventoryDashboard | ⏳ Pending |
| Accountant | Garments | AccountantDashboard | ⏳ Pending |

### Test Scenarios

1. **Feature Flag Disabled** (Default)
   - Should render current DashboardTab/EnhancedDashboard
   - No changes to user experience
   - ✅ Zero risk

2. **Feature Flag Enabled - Owner Role**
   - Should render OwnerDashboard
   - Should see all widgets
   - Should have full permissions

3. **Feature Flag Enabled - Manager Role**
   - Should render ManagerDashboard
   - Should see approval queue prominently
   - Should have manager permissions

4. **Feature Flag Enabled - Sales Role**
   - Should render SalesDashboard
   - Should see quick invoice creation
   - Should have limited permissions

5. **Feature Flag Enabled - Inventory Role**
   - Should render InventoryDashboard
   - Should see stock management focus
   - Should have inventory permissions

6. **Feature Flag Enabled - Accountant Role**
   - Should render AccountantDashboard
   - Should see financial metrics
   - Should have financial permissions

### Rollout Strategy

**Week 1: Internal Testing**
- Enable for dev team only
- Test all role/domain combinations
- Fix any issues

**Week 2: Beta Testing**
- Enable for 10% of users (owner role only)
- Monitor error rates
- Collect feedback

**Week 3: Gradual Rollout**
- Day 1: 25% of users
- Day 2: 50% of users
- Day 3: 75% of users
- Day 4: 100% of users

## Rollback Plan

### Immediate Rollback (<1 minute)
```bash
# Set environment variable
NEXT_PUBLIC_ENABLE_UNIFIED_DASHBOARD=false

# Or update ROLLOUT_CONFIG in featureFlags.js
ROLLOUT_CONFIG[FEATURE_FLAGS.UNIFIED_DASHBOARD].enabled = false
```

### Partial Rollback
```javascript
// Disable for specific roles
ROLLOUT_CONFIG[FEATURE_FLAGS.UNIFIED_DASHBOARD].allowedRoles = ['owner']

// Disable for specific businesses
ROLLOUT_CONFIG[FEATURE_FLAGS.UNIFIED_DASHBOARD].allowedBusinessIds = ['business-id-1']

// Reduce rollout percentage
ROLLOUT_CONFIG[FEATURE_FLAGS.UNIFIED_DASHBOARD].percentage = 10
```

## Success Criteria

### Technical Metrics
- ✅ Feature flag system working
- ✅ Role detection working for all 5 roles
- ✅ Template selection working for all 5 domains
- ✅ Permission filtering working
- ✅ Zero errors in production
- ✅ Load time <2 seconds

### Business Metrics
- ✅ User satisfaction maintained (>4.5/5)
- ✅ Support tickets <5 per week
- ✅ No data loss or corruption
- ✅ Smooth rollback if needed

## Risk Assessment

### Low Risk ✅
- Feature flag infrastructure (additive only)
- Conditional rendering (maintains existing code)
- User context passing (non-breaking)

### Medium Risk ⚠️
- Role template selection (new logic)
- Permission filtering (could hide widgets incorrectly)

### Mitigation
- Comprehensive testing before rollout
- Gradual rollout with monitoring
- Instant rollback capability
- Fallback to existing behavior

## Next Steps After Phase 0

Once Phase 0 is stable:
1. **Phase 1**: Extract shared components (DashboardStatsGrid, etc.)
2. **Phase 2**: Migrate templates to use shared components
3. **Phase 3**: Full integration and testing
4. **Phase 4**: Cleanup and optimization

## Estimated Timeline

- **Step 1-2**: 2 hours (implementation)
- **Step 3-4**: 1 hour (integration)
- **Testing**: 4 hours (comprehensive testing)
- **Total**: 1 day for Phase 0 completion

## Status

- [x] Feature flag infrastructure created
- [ ] DomainDashboard.tsx updated
- [ ] RoleBasedDashboardController enabled
- [ ] DashboardTabs.jsx updated
- [ ] page.js updated
- [ ] Testing completed
- [ ] Documentation updated

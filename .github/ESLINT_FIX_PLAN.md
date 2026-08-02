# ESLint Fix Plan - Comprehensive Issues Resolution

## Executive Summary
This document outlines all ESLint issues identified in the codebase and provides a systematic approach to fix them. Issues are categorized by severity and type for efficient resolution.

## Issue Categories & Statistics

### 🔴 Critical Errors (Must Fix)
- **react-hooks/set-state-in-effect**: ~15 instances - Calling setState synchronously in useEffect
- **Parsing errors**: ~15 instances - Syntax errors that break code
- **@typescript-eslint/no-explicit-any**: ~30 instances - Untyped 'any' in TypeScript
- **react-hooks/static-components**: 1 instance - Component created during render
- **react-hooks/rules-of-hooks**: 2 instances - Conditional hook calls
- **react-hooks/immutability**: 1 instance - Variable accessed before declaration

### ⚠️ Warnings (Should Fix)
- **@typescript-eslint/no-unused-vars**: ~150+ instances - Unused variables/imports
- **react-hooks/exhaustive-deps**: ~5 instances - Missing dependencies in useEffect
- **@next/next/no-html-link-for-pages**: 1 instance - Using <a> instead of <Link>
- **@next/next/no-img-element**: 1 instance - Using <img> instead of next/image
- **react/no-unescaped-entities**: 3 instances - Unescaped quotes in JSX
- **@next/next/no-assign-module-variable**: 1 instance - Assigning to 'module' variable
- **@typescript-eslint/no-require-imports**: 2 instances - CommonJS require() usage

---

## Priority 1: Critical React Hooks Errors

### 1.1 setState in useEffect (react-hooks/set-state-in-effect)

**Problem**: Calling setState synchronously within useEffect causes cascading renders and performance issues.

**Affected Files**:
1. `app/HomePage.jsx:82`
2. `app/accept-invitation/page.jsx:71`
3. `app/business/[category]/DashboardClient.jsx:195`
4. `app/business/[category]/page-enhanced.jsx:70`
5. `app/login/page.js:74`
6. `app/pending-approval/page.jsx:59`
7. `app/register/page.js:416, 425, 462`
8. `app/store/[businessDomain]/cart/page.jsx:64, 136`
9. `app/store/[businessDomain]/checkout/page.jsx:244, 249, 255`
10. `components/storefront/sections/furniture/FurnitureVideoBackdrop.jsx:25`
11. `components/storefront/sections/heroes/MarinePartsFinderHero.jsx:49`
12. `components/storefront/sections/tyre/TyreExploreSection.jsx:51`

**Fix Strategy**:
```javascript
// ❌ BAD - Synchronous setState in effect
useEffect(() => {
  if (condition) {
    setState(value);
  }
}, [dependency]);

// ✅ GOOD - Use ref or move logic outside effect
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current && condition) {
    isFirstRender.current = false;
    return;
  }
}, [dependency]);

// ✅ ALTERNATIVE - Initialize state properly
const [state, setState] = useState(() => {
  // Initialize with correct value
  return initialValue;
});
```

### 1.2 Conditional Hook Calls (react-hooks/rules-of-hooks)

**Affected Files**:
1. `components/storefront/sections/fashion/FashionHomeSections.jsx:28`
2. `components/storefront/sections/pharmacy/PharmacyHomeSections.jsx:32`

**Fix**: Move hooks outside conditional blocks, use conditional logic inside hooks instead.

```javascript
// ❌ BAD
if (condition) {
  const [state] = useState();
}

// ✅ GOOD
const [state] = useState();
if (condition) {
  // use state
}
```

### 1.3 Component Created During Render (react-hooks/static-components)

**Affected Files**:
1. `components/storefront/sections/fitness/FitnessTrainingServices.jsx:130`
2. `components/storefront/sections/restaurant/RestaurantCategoryMarquee.jsx:33`

**Fix**: Declare components outside render function.

```javascript
// ❌ BAD
function Parent() {
  const Icon = getIcon(); // Component created during render
  return <Icon />;
}

// ✅ GOOD
const iconMap = { /* ... */ };
function Parent() {
  const IconComponent = iconMap[type];
  return <IconComponent />;
}
```

### 1.4 Variable Accessed Before Declaration (react-hooks/immutability)

**Affected Files**:
1. `app/purchases/page.js:33-36`

**Fix**: Declare function before using it in useEffect or use useCallback.

---

## Priority 2: Parsing Errors

### Critical Syntax Errors Requiring Manual Inspection

**Affected Files**:
1. `app/affiliates/status/page.jsx:90` - Expression expected
2. `app/business/[category]/components/DashboardTabs.jsx:857` - Expression expected
3. `app/business/[category]/components/islands/AnalyticsDashboard.client.tsx:116` - Expression expected
4. `app/business/[category]/components/islands/InvoiceList.client.tsx:231` - Expression expected
5. `app/business/[category]/components/islands/portlets/PerformanceKPIs.client.tsx:44` - Expression expected
6. `app/business/[category]/components/islands/portlets/PredictivePlanningPortlet.client.tsx:84` - Expression expected
7. `app/business/[category]/components/islands/portlets/RecentActivityFeed.client.tsx:111` - Expression expected
8. `app/business/[category]/components/tabs/DomainDashboard.tsx:1071` - Expression expected
9. `app/business/[category]/store-settings/payments/page.jsx:240` - Expression expected
10. `app/integrations/page.js:55` - Expression expected
11. `app/multi-business/page.js:267` - Expression expected
12. `app/verify-email/page.jsx:80` - Expression expected
13. `components/AdvancedSearch.jsx:131, 69` - Expression expected
14. `components/storefront/sections/autoparts/AutoPartsHomeSections.jsx:233` - Expression expected
15. `components/storefront/sections/dealership/DealershipHomeSections.jsx:127` - Expression expected
16. `components/storefront/sections/fashion/FashionHomeEditSection.jsx:95` - Expression expected
17. `components/storefront/sections/fashion/NewArrivalsRail.jsx:115` - Expression expected
18. `components/storefront/sections/marketplace/MarketplaceHomeSections.jsx:221` - Expression expected
19. `components/storefront/sections/tiles/TilesHomeSections.jsx:63` - Expression expected

**Action Required**: Manual code review needed to identify actual syntax issues (likely incomplete JSX, missing brackets, or TypeScript syntax errors).

---

## Priority 3: TypeScript Type Safety (@typescript-eslint/no-explicit-any)

### Files with 'any' Types Needing Proper Typing

**High Impact Files**:
1. `app/business/[category]/components/islands/HealthScore.client.tsx` (1 instance)
2. `app/business/[category]/components/islands/RecentInvoices.client.tsx` (3 instances)
3. `app/business/[category]/components/islands/charts/IntegratedPerformanceChart.client.tsx` (6 instances)
4. `app/business/[category]/components/islands/portlets/AgenticAuditPortlet.client.tsx` (5 instances)
5. `app/business/[category]/components/islands/portlets/ExpenseBreakdownChart.client.tsx` (1 instance)
6. `app/business/[category]/components/tabs/InventoryTab.tsx` (15 instances)
7. `app/business/[category]/components/tabs/InvoiceTab.tsx` (9 instances)
8. `app/business/[category]/components/tabs/MultiLocationTab.tsx` (3 instances)

**Fix Strategy**: Replace `any` with proper types based on context:
- Use `unknown` for truly unknown types + type guards
- Define proper interfaces for data structures
- Use generics where appropriate

---

## Priority 4: Unused Variables & Imports

### Cleanup Categories

#### 4.1 API Routes - Unused NextResponse Imports
**Pattern**: Most v1 API routes import `NextResponse` but don't use it.

**Affected**: 15+ files in `app/api/v1/`

**Bulk Fix**: Remove unused `NextResponse` imports OR use for error responses.

#### 4.2 Unused Session Variables
**Pattern**: Many API routes destructure `session` parameter but don't use it.

**Files**: Multiple in `app/api/v1/` routes

**Fix**: Either remove parameter or prefix with underscore `_session` if required by signature.

#### 4.3 Component Unused Imports
**High-frequency unused imports**:
- Icon components (lucide-react)
- UI components (Button, Input, Label, etc.)
- Utility functions

**Approach**: 
1. Run automated cleanup: `npx eslint --fix` (removes unused imports)
2. Manual review for false positives

#### 4.4 Legacy/Development Code
**Files with multiple unused vars**:
- `app/register/page.js` - 30+ unused icon imports (likely removed features)
- `app/business/[category]/DashboardClient.jsx` - 10+ unused variables
- `app/business/[category]/components/ActionModals.jsx` - 8 unused imports

---

## Priority 5: React Best Practices

### 5.1 Missing Dependencies in useEffect (react-hooks/exhaustive-deps)

**Affected Files**:
1. `app/business/[category]/DashboardClient.jsx:678, 865`
2. `app/pending-approval/page.jsx:60`
3. `app/register/page.js:386`
4. `components/AdvancedAnalytics.jsx:91, 94`

**Fix Options**:
- Add missing dependencies to array
- Use useCallback/useMemo for stable references
- Add ESLint disable comment if intentional

### 5.2 Next.js Specific Issues

**No HTML Links**: `app/case-studies/[slug]/page.js:25`
- Replace `<a>` with `<Link>` from next/link

**No img Element**: `components/storefront/sections/jewellery/BeautyJewellerySplitBanner.jsx:96`
- Replace `<img>` with `<Image>` from next/image

**No Assign Module**: `components/subscription/ModuleFeatureDiscovery.jsx:135`
- Rename variable from `module` to something else

### 5.3 Unescaped Entities (react/no-unescaped-entities)

**Affected Files**:
1. `app/case-studies/[slug]/page.js:143` (quotes)
2. `app/pending-approval/page.jsx:303` (apostrophe)

**Fix**: Use HTML entities or template literals.

---

## Priority 6: Legacy Code Cleanup

### 6.1 CommonJS Requires
**Files**:
- `archive/update-theme.js` (2 requires)

**Action**: Convert to ES6 imports OR document as legacy script.

### 6.2 Archive Folder
**Files with issues**:
- `archive/ensure_bucket.mjs`
- `archive/upgrade_user_raw.mjs`

**Decision Needed**: Archive folder likely contains old code. Consider:
1. Delete if truly obsolete
2. Add `.eslintignore` entry if keeping for reference
3. Fix if still in use

---

## Execution Plan

### Phase 1: Stop the Bleeding (Critical Errors)
**Timeline**: 2-3 days
1. Fix all parsing errors (manual inspection required)
2. Fix react-hooks/set-state-in-effect issues
3. Fix conditional hooks violations
4. Fix component creation during render

### Phase 2: Type Safety
**Timeline**: 2-3 days
1. Create proper TypeScript interfaces
2. Replace `any` types systematically
3. Verify type safety doesn't break functionality

### Phase 3: Cleanup
**Timeline**: 1-2 days
1. Run `eslint --fix` for auto-fixable issues
2. Remove unused imports/variables manually
3. Fix React hooks dependencies

### Phase 4: Best Practices
**Timeline**: 1 day
1. Fix Next.js specific issues
2. Fix unescaped entities
3. Address legacy code

### Phase 5: Verification
**Timeline**: 1 day
1. Run full lint check
2. Run test suite
3. Smoke test major features
4. Update documentation

---

## Automated Fix Commands

```bash
# Auto-fix what's possible
bun run lint --fix

# Check remaining issues
bun run lint > eslint-remaining.txt

# Count issues by type
grep -c "error" eslint-remaining.txt
grep -c "warning" eslint-remaining.txt

# Find specific rule violations
grep "react-hooks/set-state-in-effect" eslint-remaining.txt
grep "@typescript-eslint/no-explicit-any" eslint-remaining.txt
```

---

## Risk Mitigation

### High-Risk Changes
1. **setState in useEffect fixes**: May change initialization behavior
   - **Mitigation**: Test each component thoroughly after changes
   
2. **TypeScript type changes**: Could expose runtime bugs
   - **Mitigation**: Add runtime validation, test edge cases
   
3. **Hook dependency fixes**: Could cause infinite loops or stale closures
   - **Mitigation**: Review carefully, test interaction patterns

### Low-Risk Changes
1. Removing unused imports/variables
2. Fixing unescaped entities
3. Replacing <a> with <Link>

---

## Success Criteria

- [ ] Zero parsing errors
- [ ] Zero critical React hooks errors
- [ ] < 10 `@typescript-eslint/no-explicit-any` violations
- [ ] < 20 unused variable warnings
- [ ] All tests passing
- [ ] No regression in user-facing features

---

## Notes for Future Prevention

1. **Enable pre-commit hooks**: Run ESLint on staged files
2. **CI/CD integration**: Fail builds on errors (warnings as info)
3. **Developer guidelines**: Document common patterns
4. **Code review checklist**: Include lint clean-up verification
5. **Regular cleanup sprints**: Monthly tech debt reduction

---

## File Manifest

Total files with issues: **90+**

Most critical files requiring attention:
1. `app/business/[category]/DashboardClient.jsx` - Core hub component
2. `app/register/page.js` - Registration flow
3. `app/business/[category]/components/tabs/*` - Multiple tab components
4. Storefront section components - 15+ files
5. API routes - 25+ files

---

_Last Updated: Based on lint run from archive/eslint-log.txt_
_Document maintained for: Tenvo Platform ESLint Cleanup Initiative_

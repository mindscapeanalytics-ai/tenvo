# Utility Migration Guide

This document tracks the systematic replacement of duplicate utility instances with centralized imports.

## Migration Status

### Phase 1: Centralized Utilities Created ✅
- ✅ `lib/utils/currency.js` - Centralized currency formatting
- ✅ `lib/utils/datetime.js` - Centralized date/time formatting
- ✅ `lib/utils/number.js` - Centralized number formatting
- ✅ `lib/utils/permissions.js` - Centralized permission checking
- ✅ `lib/hooks/useLanguage.js` - Centralized language hook

### Phase 2: Import Replacements

#### Currency Utilities
**Old Imports to Replace:**
```javascript
// OLD - Multiple sources
import { formatCurrency } from '@/lib/currency';
import { formatCurrency } from '@/lib/utils/formatting';
import { formatCurrency } from '@/lib/translations';
```

**New Import:**
```javascript
// NEW - Single source
import { formatCurrency } from '@/lib/utils/currency';
```

**Files to Update:**
- All dashboard templates (OwnerDashboard, ManagerDashboard, SalesDashboard, InventoryDashboard, AccountantDashboard)
- All dashboard widgets (20+ files)
- Invoice components
- Product components
- Any component using currency formatting

#### Date/Time Utilities
**Old Imports to Replace:**
```javascript
// OLD
import { formatDate } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/translations';
```

**New Import:**
```javascript
// NEW
import { formatDateTime } from '@/lib/utils/datetime';
```

**Files to Update:**
- Dashboard widgets with date displays
- Invoice components
- Report components
- Any component displaying dates

#### Number Utilities
**Old Imports to Replace:**
```javascript
// OLD
import { formatNumber, formatPercent } from '@/lib/utils/formatting';
import { formatNumber } from '@/lib/translations';
```

**New Import:**
```javascript
// NEW
import { formatNumber, formatPercentage } from '@/lib/utils/number';
```

**Files to Update:**
- Dashboard widgets with metrics
- Statistics components
- Report components

#### Language Hook
**Old Imports to Replace:**
```javascript
// OLD
import { useLanguage } from '@/lib/context/LanguageContext';
```

**New Import (Alternative):**
```javascript
// NEW - Can use either (both work)
import { useLanguage } from '@/lib/hooks/useLanguage';
// OR keep existing
import { useLanguage } from '@/lib/context/LanguageContext';
```

**Note:** Both imports work. The new one is just a convenience re-export.

## Migration Strategy

### Approach
1. **Non-Breaking**: Keep existing implementations working
2. **Gradual**: Replace imports file by file
3. **Tested**: Verify each replacement doesn't break functionality
4. **Documented**: Track progress in this file

### Priority Order
1. **High Priority**: Dashboard templates and widgets (most visible)
2. **Medium Priority**: Form components and utilities
3. **Low Priority**: Less frequently used components

### Verification Steps
For each file updated:
1. Replace import statement
2. Verify function signature matches
3. Test component renders correctly
4. Check for any TypeScript errors
5. Mark as complete in this document

## Completed Replacements

### Dashboard Templates
- [ ] `components/dashboard/templates/OwnerDashboard.jsx`
- [ ] `components/dashboard/templates/ManagerDashboard.jsx`
- [ ] `components/dashboard/templates/SalesDashboard.jsx`
- [ ] `components/dashboard/templates/InventoryDashboard.jsx`
- [ ] `components/dashboard/templates/AccountantDashboard.jsx`

### Dashboard Widgets
- [ ] `components/dashboard/widgets/BatchExpiryWidget.jsx`
- [ ] `components/dashboard/widgets/InventoryValuationWidget.jsx`
- [ ] `components/dashboard/widgets/FBRComplianceWidget.jsx`
- [ ] `components/dashboard/widgets/CycleCountTasksWidget.jsx`
- [ ] `components/dashboard/widgets/BrandPerformanceWidget.jsx`
- [ ] `components/dashboard/widgets/PendingApprovalsWidget.jsx`
- [ ] `components/dashboard/widgets/SerialWarrantyWidget.jsx`
- [ ] `components/dashboard/widgets/TaxCalculationsWidget.jsx`
- [ ] `components/dashboard/widgets/TodaysSalesWidget.jsx`
- [ ] `components/dashboard/widgets/SystemHealthWidget.jsx`

### Other Components
- [ ] `components/EnhancedDashboard.jsx`
- [ ] `components/ExpenseEntryForm.jsx`
- [ ] `components/BusyGrid.jsx`
- [ ] `app/register/page.js`

## Notes

- The centralized utilities wrap existing implementations, so they're compatible
- No breaking changes expected
- Can be done incrementally without breaking the app
- Task 1.2 completion: When all checkboxes above are checked

## Next Steps After Migration

Once all imports are replaced:
1. Verify no duplicate utility code remains
2. Run full test suite
3. Check for any console warnings
4. Mark Task 1.2 as complete
5. Proceed to Task 2 (Shared Component Library)

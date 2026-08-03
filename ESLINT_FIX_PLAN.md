# ESLint Fix Plan

## ✅ Completed

### 1. Automated Fixes - **DONE** ✓
- **91 files fixed**
- **206 issues resolved**
  - 192 unescaped apostrophes
  - 14 unescaped quotes
- Script: `scripts/fix-eslint-issues.mjs`
- Run via: `bun run lint:fix`

### 2. Manual Fixes - **PARTIAL** ✓
- ✅ `app/HomePage.jsx:77` - Fixed setState in effect
- ✅ `.kiro/specs/inventory-round-trip.test.js` - Removed unused imports

## 🚧 Remaining Work

### Critical Errors (Must Fix) - 12 Files

#### A. `react-hooks/set-state-in-effect` - 10 Files
1. ❌ `app/accept-invitation/page.jsx:71`
2. ❌ `app/business/[category]/DashboardClient.jsx:195`
3. ❌ `app/business/[category]/page-enhanced.jsx:70`
4. ❌ `app/login/page.js:74`
5. ❌ `app/pending-approval/page.jsx:59`
6. ❌ `app/store/[businessDomain]/cart/page.jsx:64, 136`
7. ❌ `app/store/[businessDomain]/checkout/page.jsx:244`
8. ❌ `components/ExpenseEntryForm.jsx:105, 120, 157`
9. ❌ `components/InvoiceForm.jsx:617`
10. ❌ `components/ExcelImportModal.jsx:112`

#### B. `react-hooks/immutability` - 2 Files
1. ❌ `app/purchases/page.js:33`
2. ❌ `components/InvoiceForm.jsx:818`

### High Priority - TypeScript
- ❌ 60+ `@typescript-eslint/no-explicit-any` instances across 4 files

### Medium Priority - Cleanup
- ❌ 100+ unused variables
- ❌ 15+ missing hook dependencies

## 📊 Progress

| Category | Total | Fixed | Remaining | % Done |
|----------|-------|-------|-----------|--------|
| **Unescaped Entities** | 206 | 206 | 0 | **100%** ✅ |
| **Critical Errors** | 14 | 2 | 12 | 14% |
| **TypeScript Any** | 60+ | 0 | 60+ | 0% |
| **Unused Variables** | 100+ | 4 | 100+ | ~4% |
| **Overall** | ~380 | ~212 | ~168 | **56%** |

## 🎯 Next Actions

### Immediate (This Session)
1. ✅ Create automated fix script
2. ✅ Run on codebase (91 files fixed)
3. ✅ Document remaining issues
4. ✅ Add `lint:fix` command to package.json

### Short Term (Next 1-2 Days)
1. Fix 12 critical error files
2. Test affected components
3. Run full test suite

### Medium Term (Next Sprint)
1. Replace TypeScript `any` with proper types
2. Remove unused variables
3. Fix hook dependencies

## 📖 Documentation Created

1. ✅ `ESLINT_FIX_PLAN.md` (this file)
2. ✅ `ESLINT_FIXES_SUMMARY.md` (detailed summary)
3. ✅ `scripts/fix-eslint-issues.mjs` (automated fixer)

## 🔧 Commands

```bash
# Check current lint status
bun run lint

# Auto-fix + ESLint built-in fixes
bun run lint:fix

# Manual check after fixes
bun run lint | tee archive/eslint-log-after-fix.txt
```

## ✨ Impact

### Before
- **Hundreds of errors and warnings**
- Build succeeds but with noise
- Hard to spot real issues

### After Automated Fix
- **91 files cleaned**
- **206 issues resolved**
- Easier to focus on critical 12 files

### After Full Fix (Target)
- ✅ 0 critical errors
- ⚠️ ~50 warnings (acceptable)
- Clean, maintainable codebase

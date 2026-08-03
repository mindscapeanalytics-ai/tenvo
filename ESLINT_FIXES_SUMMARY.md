# ESLint Fixes Summary

## Completed Fixes

### ✅ Automated Fixes (91 files, 206 issues)
**Script**: `scripts/fix-eslint-issues.mjs`
**Run**: `bun run lint:fix` or `node scripts/fix-eslint-issues.mjs`

**Fixed Issues**:
- **192 unescaped apostrophes** - Converted `'` to `&apos;` in JSX text content
- **14 unescaped quotes** - Converted `"` to `&quot;` in JSX text content

**Example files fixed**:
- `app/accept-invitation/page.jsx`
- `app/affiliates/*.jsx`
- `app/case-studies/**/*.jsx`
- `components/storefront/**/*.jsx`
- `components/marketing/**/*.jsx`
- And 86 more...

### ✅ Manual Fixes
1. **`app/HomePage.jsx`** - Fixed `react-hooks/set-state-in-effect` error by using initialization flag pattern
2. **`.kiro/specs/inventory-round-trip.test.js`** - Removed unused imports

## Remaining Issues to Fix

### Critical Errors (Must Fix Before Production)

#### 1. `react-hooks/set-state-in-effect` (10 files)
**Why Critical**: Causes performance issues and cascading renders

**Files**:
1. `app/accept-invitation/page.jsx:71` - setError in useEffect
2. `app/business/[category]/DashboardClient.jsx:195` - setEditingProduct in useEffect
3. `app/business/[category]/page-enhanced.jsx:70` - setInvoices in useEffect
4. `app/login/page.js:74` - handlePostLogin in useEffect
5. `app/pending-approval/page.jsx:59` - fetchBusiness in useEffect
6. `app/store/[businessDomain]/cart/page.jsx:64, 136` - shipping/promo state in useEffect
7. `app/store/[businessDomain]/checkout/page.jsx:244` - setFormData in useEffect
8. `components/ExpenseEntryForm.jsx:105, 120, 157` - multiple setState in useEffect
9. `components/InvoiceForm.jsx:617` - setApprovalHistory in useEffect
10. `components/ExcelImportModal.jsx:112` - setColumnMapping in useEffect

**Fix Pattern**:
```javascript
// ❌ Bad - causes cascading renders
useEffect(() => {
  setState(value);
}, []);

// ✅ Good - use initialization flag
const [initialized, setInitialized] = useState(false);
useEffect(() => {
  if (initialized) return;
  setState(value);
  setInitialized(true);
}, [initialized]);

// ✅ Good - lazy initialization
const [state] = useState(() => computeInitialValue());

// ✅ Good - use useMemo for derived state
const derivedValue = useMemo(() => computeValue(), [deps]);
```

#### 2. `react-hooks/immutability` (2 files)
**Why Critical**: Accessing variables before declaration breaks code

**Files**:
1. `app/purchases/page.js:33-36` - `loadPurchases` accessed before declaration
2. `components/InvoiceForm.jsx:818` - `handleSave` accessed before declaration

**Fix**: Use `useCallback` or move declaration before usage:
```javascript
// ❌ Bad
useEffect(() => {
  myFunction(); // Error: accessed before declaration
}, []);

const myFunction = () => { };

// ✅ Good
const myFunction = useCallback(() => {
  // logic
}, [deps]);

useEffect(() => {
  myFunction();
}, [myFunction]);
```

### High Priority Warnings

#### 3. TypeScript `@typescript-eslint/no-explicit-any` (60+ instances)
**Impact**: Reduces type safety, can hide bugs

**Worst offenders**:
- `app/business/[category]/components/islands/InvoiceList.client.tsx` - 30 instances
- `app/business/[category]/components/tabs/InventoryTab.tsx` - 15 instances
- `app/business/[category]/components/tabs/InvoiceTab.tsx` - 9 instances
- `app/business/[category]/components/islands/IntegratedPerformanceChart.client.tsx` - 6 instances

**Fix**: Replace `any` with proper types:
```typescript
// ❌ Bad
const handleClick = (item: any) => { };

// ✅ Good
interface Item {
  id: string;
  name: string;
}
const handleClick = (item: Item) => { };

// ✅ Acceptable for truly dynamic data
const handleClick = (item: unknown) => {
  // Use type guards
  if (typeof item === 'object' && item !== null) {
    // ...
  }
};
```

#### 4. Unused Variables (100+ instances)
**Impact**: Code clutter, confusion

**Common patterns**:
- Unused imports: `import { Unused } from '...'`
- Unused variables: `const unused = ...`
- Unused function parameters: `(unused, used) => { }`

**Fix Strategy**:
1. Remove if truly unused
2. Prefix with `_` if intentionally unused: `_unused`
3. Comment with explanation if kept for future use

#### 5. Missing Hook Dependencies (15+ instances)
**Pattern**: `react-hooks/exhaustive-deps`

**Example**: `app/business/[category]/DashboardClient.jsx:678, 865`

**Fix**: Add missing dependencies or use escape hatch:
```javascript
// Add missing dependencies
useEffect(() => {
  doSomething(value);
}, [value]); // Add value

// Or use escape hatch with justification
useEffect(() => {
  // Only run on mount
  initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Medium Priority

#### 6. `@next/next/no-html-link-for-pages`
**File**: `app/case-studies/[slug]/page.js:25`

**Fix**: Use Next.js `<Link>` component:
```jsx
// ❌ Bad
<a href="/case-studies/">Back</a>

// ✅ Good
<Link href="/case-studies/">Back</Link>
```

## How to Fix Remaining Issues

### Step 1: Run Automated Fixes
```bash
bun run lint:fix
```

This runs the custom fix script + ESLint's auto-fix.

### Step 2: Fix Critical Errors Manually
Focus on the 12 critical files listed above:
1. Fix all `react-hooks/set-state-in-effect` errors
2. Fix `react-hooks/immutability` errors
3. Test affected components

### Step 3: Address TypeScript `any` Types
Gradually replace `any` with proper types:
- Start with `InvoiceList.client.tsx` (30 instances)
- Then `InventoryTab.tsx` (15 instances)
- Continue with remaining files

### Step 4: Clean Up Warnings
- Remove unused variables
- Fix missing hook dependencies
- Add proper TypeScript types

### Step 5: Verify
```bash
bun run lint
```

Should show 0 errors (warnings acceptable for now).

## Scripts

### Check Lint Status
```bash
bun run lint
```

### Auto-Fix Common Issues
```bash
bun run lint:fix
```

### Fix Specific File
```bash
npx eslint path/to/file.jsx --fix
```

## Testing After Fixes

After fixing eslint issues, run:

1. **Type Check**: `npm run validate:schema`
2. **Build**: `npm run build`
3. **Tests**: `npm test`
4. **Manual Testing**: Test critical user flows

## Priority Order

1. ⚠️ **Critical** - Fix before any deployment
   - `react-hooks/set-state-in-effect` (10 files)
   - `react-hooks/immutability` (2 files)

2. 📋 **High** - Fix in next sprint
   - TypeScript `any` types (60+ instances)
   - Unused variables (100+ instances)

3. 📝 **Medium** - Fix gradually
   - Missing hook dependencies
   - Link component usage

4. ℹ️ **Low** - Optional cleanup
   - Formatting preferences
   - Comment improvements

## Notes

- ✅ **91 files** auto-fixed (unescaped entities)
- ⚠️ **12 files** need manual fixes (critical errors)
- 📋 **60+ files** need TypeScript improvements
- 💯 **Progress**: ~30% complete

## Next Steps

1. Review and merge automated fixes
2. Create tickets for critical errors (12 files)
3. Schedule TypeScript cleanup sprint
4. Set up pre-commit hook to prevent new issues

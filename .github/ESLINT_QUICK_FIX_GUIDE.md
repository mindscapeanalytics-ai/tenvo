# ESLint Quick Fix Guide

Quick reference for fixing common ESLint errors in this codebase.

## 🚨 Critical Errors

### `react-hooks/set-state-in-effect`

**Error**: Calling setState synchronously within an effect can trigger cascading renders

❌ **Bad**:
```javascript
useEffect(() => {
  setState(newValue);
}, []);
```

✅ **Fix Option 1** - Initialization Flag:
```javascript
const [initialized, setInitialized] = useState(false);

useEffect(() => {
  if (initialized) return;
  setState(newValue);
  setInitialized(true);
}, [initialized]);
```

✅ **Fix Option 2** - Lazy Initialization:
```javascript
const [state] = useState(() => {
  // Compute initial value once
  return computeInitialValue();
});
```

✅ **Fix Option 3** - useMemo for Derived State:
```javascript
const derivedValue = useMemo(() => {
  return computeValue();
}, [dependencies]);
```

### `react-hooks/immutability`

**Error**: Cannot access variable before it is declared

❌ **Bad**:
```javascript
useEffect(() => {
  myFunction(); // Error!
}, []);

const myFunction = () => {
  // logic
};
```

✅ **Fix - Use useCallback**:
```javascript
const myFunction = useCallback(() => {
  // logic
}, [dependencies]);

useEffect(() => {
  myFunction();
}, [myFunction]);
```

## ⚠️ TypeScript Errors

### `@typescript-eslint/no-explicit-any`

**Error**: Unexpected any. Specify a different type

❌ **Bad**:
```typescript
const handleClick = (item: any) => {
  console.log(item.name);
};
```

✅ **Fix Option 1** - Define Interface:
```typescript
interface Item {
  id: string;
  name: string;
  price?: number;
}

const handleClick = (item: Item) => {
  console.log(item.name);
};
```

✅ **Fix Option 2** - Use `unknown` with Type Guards:
```typescript
const handleClick = (item: unknown) => {
  if (typeof item === 'object' && item !== null && 'name' in item) {
    console.log((item as { name: string }).name);
  }
};
```

✅ **Fix Option 3** - Generic Types:
```typescript
const handleClick = <T extends { name: string }>(item: T) => {
  console.log(item.name);
};
```

## 📋 Common Warnings

### `@typescript-eslint/no-unused-vars`

**Error**: Variable is defined but never used

❌ **Bad**:
```javascript
import { Unused, Used } from './module';

const unused = 'value';
```

✅ **Fix Option 1** - Remove:
```javascript
import { Used } from './module';
```

✅ **Fix Option 2** - Prefix with `_` if Intentional:
```javascript
const _unused = 'value'; // Kept for future use
```

✅ **Fix Option 3** - Use in Function Parameters:
```javascript
const handler = (_unused: string, used: number) => {
  // _unused is required by API but not used
  return used * 2;
};
```

### `react/no-unescaped-entities`

**Error**: `'` can be escaped with `&apos;`

❌ **Bad**:
```jsx
<p>Don't use unescaped quotes</p>
```

✅ **Fix Option 1** - HTML Entity:
```jsx
<p>Don&apos;t use unescaped quotes</p>
```

✅ **Fix Option 2** - JavaScript String:
```jsx
<p>{"Don't use unescaped quotes"}</p>
```

### `react-hooks/exhaustive-deps`

**Error**: React Hook useEffect has missing dependencies

❌ **Bad**:
```javascript
useEffect(() => {
  doSomething(value);
}, []); // value is missing!
```

✅ **Fix Option 1** - Add Dependency:
```javascript
useEffect(() => {
  doSomething(value);
}, [value]);
```

✅ **Fix Option 2** - Escape Hatch (with justification):
```javascript
useEffect(() => {
  // Only run on mount - value is stable ref
  initialize(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### `@next/next/no-html-link-for-pages`

**Error**: Do not use an `<a>` element to navigate

❌ **Bad**:
```jsx
<a href="/about">About</a>
```

✅ **Fix - Use Next.js Link**:
```jsx
import Link from 'next/link';

<Link href="/about">About</Link>
```

## 🛠️ Commands

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

### Check Type Errors
```bash
npm run validate:schema
```

## 📚 Resources

- [React Hooks Rules](https://react.dev/reference/rules)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Next.js ESLint](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

## 🎯 Priority

1. **Always fix**: Critical errors (`react-hooks/*`)
2. **Fix soon**: TypeScript `any` types
3. **Clean up**: Unused variables, missing dependencies
4. **Nice to have**: Formatting, style preferences

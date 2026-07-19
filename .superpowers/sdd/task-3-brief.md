### Task 3: Brand prepend for all markets

**Files:**
- Modify: `lib/regionalMarket/index.js` (`getBrandsForMarketWithOverrides`)
- Modify: `scripts/verify-regional-market.mjs`

- [ ] **Step 1: Remove PK-only gate**

```js
export function getBrandsForMarketWithOverrides(countryIso, domainKey, domainOverrides = {}) {
  const marketBrands = getBrandsForMarket(countryIso, domainKey);
  const popular = domainOverrides?.popularBrands;
  if (Array.isArray(popular) && popular.length > 0) {
    return dedupeBrands([...popular, ...marketBrands]);
  }
  return marketBrands;
}
```

- [ ] **Step 2: Add regional verify case**

```js
import { getBrandsForMarketWithOverrides } from '../lib/regionalMarket/index.js';

const aeBrands = getBrandsForMarketWithOverrides('AE', 'grocery', {
  popularBrands: ['Tenant Super Brand'],
});
if (aeBrands[0] !== 'Tenant Super Brand') {
  errors.push('AE popularBrands prepend failed');
}
```

- [ ] **Step 3: Run** `bun run verify:regional-market`

---



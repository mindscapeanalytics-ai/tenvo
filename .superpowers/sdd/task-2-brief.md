### Task 2: Wire business resolver + country tax categories

**Files:**
- Modify: `lib/utils/businessRegionalContext.js`
- Modify: `lib/domainKnowledge.js` (taxCategories branch)

**Interfaces:**
- Consumes: `extractDomainKnowledgeOverride`, `applyDomainKnowledgeOverrides`
- Produces: `getDomainKnowledgeForBusiness` applies owner patch

- [ ] **Step 1: Update `getDomainKnowledgeForBusiness`**

```js
import {
  applyDomainKnowledgeOverrides,
  extractDomainKnowledgeOverride,
} from './domainKnowledgeOverrides.js';

export function getDomainKnowledgeForBusiness(category, businessOrCountryIso) {
  const isString = typeof businessOrCountryIso === 'string';
  const countryIso = isString
    ? businessOrCountryIso
    : resolveBusinessCountryIso(businessOrCountryIso);
  const base = getDomainKnowledge(category, { countryIso });
  if (isString || !businessOrCountryIso) return base;
  const settings =
    businessOrCountryIso.settings &&
    typeof businessOrCountryIso.settings === 'object' &&
    !Array.isArray(businessOrCountryIso.settings)
      ? businessOrCountryIso.settings
      : {};
  const patch = extractDomainKnowledgeOverride(settings);
  return applyDomainKnowledgeOverrides(base, patch);
}
```

- [ ] **Step 2: Fix tax categories in `getDomainKnowledge`**

Replace taxCategories assignment so non-PK markets use regional defaults:

```js
  const resolvedMarketIso = marketFeatures.countryCode || countryIso;
  const taxCategories =
    resolvedMarketIso === 'PK' &&
    Array.isArray(row.taxCategories) &&
    row.taxCategories.length > 0
      ? row.taxCategories
      : buildRegionalTaxCategoryDefaults(countryIso);
```

- [ ] **Step 3: Extend override verify with AE tax assertion**

In `scripts/verify-domain-knowledge-overrides.mjs` (or regional script):

```js
const ae = getDomainKnowledge('grocery', { countryIso: 'AE' });
const pk = getDomainKnowledge('grocery', { countryIso: 'PK' });
if (JSON.stringify(ae.taxCategories) === JSON.stringify(pk.taxCategories) &&
    (pk.taxCategories || []).some((t) => /FBR|WHT|Provincial/i.test(String(t)))) {
  // AE should not equal PK FBR-heavy lists when regional defaults differ
}
// Simpler hard assert:
if ((ae.taxCategories || []).some((t) => /Anarkali|JazzCash/i.test(String(t)))) {
  errors.push('AE taxCategories leaked PK labels');
}
```

- [ ] **Step 4: Run**

`bun run verify:domain-knowledge-overrides`  
`bun run verify:domains`

---



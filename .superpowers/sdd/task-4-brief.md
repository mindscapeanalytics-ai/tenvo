### Task 4: Critical call-site country awareness

**Files:**
- Modify: `lib/utils/domainHelpers.ts` â€” helpers that call `getDomainKnowledge(category)` without options should accept optional `options?: DomainKnowledgeOptions` and pass through (already partially typed)
- Modify: `lib/data/productTemplates.js` â€” accept `countryIso` / use options
- Modify: `lib/utils/inventoryRowDefaults.js` â€” already optional; ensure callers pass when business known
- Modify: `lib/utils/inventoryFieldSuggestions.js` â€” already optional; document in header comment that hub must pass `countryIso`

**Focus (do not boil the ocean):** any helper exported for inventory/forms that defaults to PK without documenting it gets `options?: { countryIso?: string }` threaded. Components that have `useBusiness()` should prefer `getDomainKnowledgeForBusiness` via existing hooks (`useFormRegionalContext`).

- [ ] **Step 1: Audit and fix the highest-traffic helpers**

In `domainHelpers.ts`, for each function that calls `getDomainKnowledge(category)` with no options, add optional third/second arg `options?: DomainKnowledgeOptions` and pass `{ countryIso: options?.countryIso }` when set. Keep PK default only when options omitted (registration/demo).

Example pattern:

```ts
export function getDomainUnits(category: string, options?: DomainKnowledgeOptions) {
  const knowledge: any = options?.countryIso
    ? getDomainKnowledge(category, { countryIso: options.countryIso })
    : getDomainKnowledge(category);
  return knowledge?.units || ['pcs'];
}
```

Apply the same pattern to the inventory-facing helpers in that file (units, productFields, fieldConfig, paymentTerms, intelligence getters).

- [ ] **Step 2: `productTemplates.js`**

```js
export function getProductTemplatesForCategory(category, options = {}) {
  const knowledge = getDomainKnowledge(category, {
    countryIso: options.countryIso || 'PK',
  }) || {};
  // ...
}
```

- [ ] **Step 3: Run** `bun run verify:domains` and `bun run verify:domain-knowledge-overrides`

---



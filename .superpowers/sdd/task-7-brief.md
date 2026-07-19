### Task 7: Completeness contract + sparse rows + docs

**Files:**
- Modify: `lib/domainData/edu_livestock.js` and/or services file containing `mobile-repairing` / `school-education`
- Modify: `scripts/verify-domain-wiring.mjs`
- Modify: `docs/DOMAIN_VERTICALS.md`
- Modify: `docs/superpowers/specs/2026-07-18-domain-knowledge-enterprise-design.md` status â†’ Implemented when done

**Known gaps (raw rows, 2026-07-18 scan):**
- `mobile-repairing` â€” missing intelligence: peakMonths, perishability, shelfLife, minOrderQuantity
- `school-education` â€” missing intelligence: perishability, shelfLife

- [ ] **Step 1: Fill intelligence on those two rows** with sensible values (services: low perishability, long shelfLife, empty or school-calendar peakMonths).

- [ ] **Step 2: Extend `verify-domain-wiring.mjs`**

After icon/tier checks, for each key call `getDomainKnowledge(key, { countryIso: 'PK' })` and assert:

```js
import { getDomainKnowledge, DOMAIN_KNOWLEDGE_KEYS } from '../lib/domainKnowledge.js';

const INTEL_KEYS = [
  'seasonality', 'peakMonths', 'perishability', 'shelfLife',
  'demandVolatility', 'minOrderQuantity', 'leadTime',
];

for (const key of DOMAIN_KNOWLEDGE_KEYS) {
  const dk = getDomainKnowledge(key, { countryIso: 'PK' });
  if (!Array.isArray(dk.units) || !dk.units.length) {
    console.error(`FAIL: ${key} missing units`);
    failed = true;
  }
  const hasFields =
    (Array.isArray(dk.productFields) && dk.productFields.length > 0) ||
    (dk.fieldConfig && Object.keys(dk.fieldConfig).length > 0);
  if (!hasFields) {
    console.error(`FAIL: ${key} missing productFields/fieldConfig`);
    failed = true;
  }
  for (const ik of INTEL_KEYS) {
    if (dk.intelligence?.[ik] === undefined) {
      console.error(`FAIL: ${key} intelligence.${ik}`);
      failed = true;
    }
  }
  if (!Array.isArray(dk.setupTemplate?.categories) || !dk.setupTemplate.categories.length) {
    console.error(`FAIL: ${key} setupTemplate.categories`);
    failed = true;
  }
}
```

- [ ] **Step 3: Update `docs/DOMAIN_VERTICALS.md`** with owner override section + verify commands including `verify:domain-knowledge-overrides`.

- [ ] **Step 4: Run full suite**

```bash
bun run verify:domains
bun run verify:regional-market
bun run verify:domain-knowledge-overrides
```

Expected: all OK.

---



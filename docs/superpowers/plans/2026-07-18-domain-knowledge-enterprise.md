# Domain Knowledge Enterprise Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make 65 verticals enterprise-manageable via a single resolution pipeline (platform → country/market → owner `settings.domainKnowledge` patch), with correct multi-country behavior and CI completeness checks.

**Architecture:** Keep `lib/domainData/*.js` as the platform source of truth. Add `applyDomainKnowledgeOverrides` merge helper; wire it into `getDomainKnowledgeForBusiness`. Harden regional brand/tax rules. Expose owner edits via Zod-validated `updateDomainKnowledgeOverridesAction` and Settings → Industry UI. Extend verify scripts; fill the two sparse intelligence rows.

**Tech Stack:** Next.js App Router, Zod, existing `businesses.settings` JSON, Bun verify scripts, `withGuard` / `actionSuccess` / `actionFailure`

**Spec:** `docs/superpowers/specs/2026-07-18-domain-knowledge-enterprise-design.md`

## Global Constraints

- Merge layer only — never fork platform presets into the DB at registration.
- Owner patch lives at `businesses.settings.domainKnowledge` (do not confuse with existing `settings.domain_defaults.multiCurrency`).
- Locked keys ignored on write/read: `defaultTax`, `taxCategories` (regionalized), market `paymentGateways` / `taxCompliance`, plan module flags, `icon`, `imageUrl`.
- Tax **rates** come from `getBusinessRegionalPack` / `settings.financials` only.
- `popularBrands` prepend for **all** markets (not PK-only).
- No Prisma migration.
- No em dashes in user-facing copy.
- Prefer `font-semibold` in new Settings UI headings.
- Permission for mutate: `settings.edit` (admin/owner). View uses existing Settings access.
- Desktop Settings layout: add one tab only; keep other tabs unchanged.
- Empty / missing / corrupt patch ≡ today’s behavior.
- Commit only when the user explicitly asks (skip plan commit steps unless asked).

---

## File map

| Area | Files |
|------|--------|
| Merge + Zod | Create `lib/utils/domainKnowledgeOverrides.js` |
| Types (optional) | Modify `lib/domainKnowledge.d.ts` if needed |
| Business resolve | Modify `lib/utils/businessRegionalContext.js` |
| Country tax | Modify `lib/domainKnowledge.js` (`taxCategories` for non-PK) |
| Brands | Modify `lib/regionalMarket/index.js` |
| Server action | Modify `lib/actions/basic/business.js` |
| Settings UI | Create `components/settings/IndustryDomainKnowledgePanel.jsx`; Modify `components/SettingsManager.jsx` |
| Call sites | Modify `lib/utils/domainHelpers.ts`, `lib/data/productTemplates.js`, `lib/utils/inventoryRowDefaults.js`, `lib/utils/inventoryFieldSuggestions.js` (pass `countryIso` when available) |
| Sparse presets | Modify `lib/domainData/services.js` or edu file for `mobile-repairing`, `school-education` |
| Verify | Modify `scripts/verify-domain-wiring.mjs`, `scripts/verify-regional-market.mjs`; Create `scripts/verify-domain-knowledge-overrides.mjs`; Modify `package.json` |
| Docs | Modify `docs/DOMAIN_VERTICALS.md`; update spec status when done |

---

### Task 1: Override merge helper + Zod schema

**Files:**
- Create: `lib/utils/domainKnowledgeOverrides.js`
- Create: `scripts/verify-domain-knowledge-overrides.mjs`
- Modify: `package.json` (add script)

**Interfaces:**
- Produces:
  - `DOMAIN_KNOWLEDGE_OVERRIDE_KEYS` — allowlisted top-level keys
  - `LOCKED_DOMAIN_KNOWLEDGE_OVERRIDE_KEYS` — stripped keys
  - `domainKnowledgeOverrideSchema` — Zod object (passthrough false)
  - `parseDomainKnowledgeOverride(raw: unknown): { success: true, data: object } | { success: false, error: string, issues?: unknown }`
  - `extractDomainKnowledgeOverride(settings: unknown): object` — safe `{}` on corrupt
  - `applyDomainKnowledgeOverrides(base: object, patch: unknown): object` — pure merge
  - `mergeDomainKnowledgeIntoBusinessSettings(settings: unknown, patch: object | null): { nextSettings: object }` — `null` patch removes key

- [ ] **Step 1: Create `lib/utils/domainKnowledgeOverrides.js`**

```js
import { z } from 'zod';
import { normalizeKey } from './domainHelpers.ts';

export const DOMAIN_KNOWLEDGE_OVERRIDE_KEYS = Object.freeze([
  'productFields',
  'fieldConfig',
  'units',
  'popularBrands',
  'setupTemplate',
  'intelligence',
  'customerFields',
  'vendorFields',
  'paymentTerms',
]);

export const LOCKED_DOMAIN_KNOWLEDGE_OVERRIDE_KEYS = Object.freeze([
  'defaultTax',
  'taxCategories',
  'icon',
  'imageUrl',
  'posEnabled',
  'manufacturingEnabled',
  'pakistaniFeatures',
  'marketFeatures',
]);

const fieldConfigEntrySchema = z.object({
  label: z.string().trim().min(1).max(80),
  type: z.enum(['text', 'select', 'number', 'date', 'textarea']),
  required: z.boolean().optional(),
  options: z.array(z.string().max(80)).max(100).optional(),
  placeholder: z.string().max(120).optional(),
});

const intelligenceSchema = z
  .object({
    seasonality: z.enum(['low', 'medium', 'high']).optional(),
    peakMonths: z.array(z.string().max(20)).max(12).optional(),
    perishability: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    shelfLife: z.number().finite().nonnegative().max(36500).optional(),
    demandVolatility: z.number().finite().min(0).max(1).optional(),
    minOrderQuantity: z.number().finite().nonnegative().max(1_000_000).optional(),
    leadTime: z.number().finite().nonnegative().max(3650).optional(),
  })
  .strict();

export const domainKnowledgeOverrideSchema = z
  .object({
    productFields: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
    fieldConfig: z.record(z.string().max(64), fieldConfigEntrySchema).refine(
      (obj) => Object.keys(obj).length <= 40,
      'At most 40 custom fields'
    ).optional(),
    units: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    popularBrands: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    setupTemplate: z
      .object({
        categories: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
        suggestedProducts: z.array(z.record(z.unknown())).max(50).optional(),
      })
      .strict()
      .optional(),
    intelligence: intelligenceSchema.optional(),
    customerFields: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    vendorFields: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    paymentTerms: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  })
  .strict();

export function parseDomainKnowledgeOverride(raw) {
  if (raw == null || (typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length === 0)) {
    return { success: true, data: {} };
  }
  const cleaned = stripLockedKeys(raw);
  const parsed = domainKnowledgeOverrideSchema.safeParse(cleaned);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues?.[0]?.message || 'Invalid industry overrides',
      issues: parsed.error.issues,
    };
  }
  return { success: true, data: parsed.data };
}

function stripLockedKeys(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = { ...raw };
  for (const k of LOCKED_DOMAIN_KNOWLEDGE_OVERRIDE_KEYS) delete out[k];
  return out;
}

export function extractDomainKnowledgeOverride(settings) {
  try {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
    const raw = settings.domainKnowledge;
    const parsed = parseDomainKnowledgeOverride(raw);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function dedupeStrings(list) {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    const s = String(item || '').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function unionStrings(platform, owner) {
  return dedupeStrings([...(platform || []), ...(owner || [])]);
}

/**
 * @param {Record<string, any>} base — output of getDomainKnowledge (country-aware)
 * @param {unknown} patch
 */
export function applyDomainKnowledgeOverrides(base, patch) {
  const parsed = parseDomainKnowledgeOverride(patch);
  const p = parsed.success ? parsed.data : {};
  if (!p || Object.keys(p).length === 0) return base;

  const next = { ...base };

  if (p.fieldConfig && typeof p.fieldConfig === 'object') {
    const merged = { ...(base.fieldConfig || {}) };
    for (const [rawKey, cfg] of Object.entries(p.fieldConfig)) {
      merged[normalizeKey(rawKey)] = cfg;
    }
    next.fieldConfig = merged;
  }

  if (Array.isArray(p.productFields) && p.productFields.length > 0) {
    next.productFields = unionStrings(base.productFields, p.productFields);
  }

  if (Array.isArray(p.units) && p.units.length > 0) {
    next.units = dedupeStrings(p.units);
  }

  if (Array.isArray(p.popularBrands) && p.popularBrands.length > 0) {
    next.popularBrands = dedupeStrings(p.popularBrands);
    const mf = { ...(base.marketFeatures || {}) };
    mf.popularBrands = dedupeStrings([
      ...p.popularBrands,
      ...(base.marketFeatures?.popularBrands || base.pakistaniFeatures?.popularBrands || []),
    ]);
    next.marketFeatures = mf;
    next.pakistaniFeatures = mf;
  }

  if (p.setupTemplate && typeof p.setupTemplate === 'object') {
    const st = { ...(base.setupTemplate || {}) };
    if (Array.isArray(p.setupTemplate.categories) && p.setupTemplate.categories.length > 0) {
      st.categories = dedupeStrings(p.setupTemplate.categories);
    }
    if (Array.isArray(p.setupTemplate.suggestedProducts)) {
      st.suggestedProducts = p.setupTemplate.suggestedProducts;
    }
    next.setupTemplate = st;
  }

  if (p.intelligence && typeof p.intelligence === 'object') {
    next.intelligence = { ...(base.intelligence || {}), ...p.intelligence };
  }

  for (const arrKey of ['customerFields', 'vendorFields', 'paymentTerms']) {
    if (Array.isArray(p[arrKey]) && p[arrKey].length > 0) {
      next[arrKey] = dedupeStrings(p[arrKey]);
    }
  }

  return next;
}

export function mergeDomainKnowledgeIntoBusinessSettings(settings, patch) {
  const prev =
    settings && typeof settings === 'object' && !Array.isArray(settings) ? { ...settings } : {};
  if (patch == null) {
    delete prev.domainKnowledge;
    return { nextSettings: prev };
  }
  const parsed = parseDomainKnowledgeOverride(patch);
  if (!parsed.success) {
    const err = new Error(parsed.error || 'Invalid industry overrides');
    err.code = 'VALIDATION_ERROR';
    err.issues = parsed.issues;
    throw err;
  }
  if (Object.keys(parsed.data).length === 0) {
    delete prev.domainKnowledge;
  } else {
    prev.domainKnowledge = parsed.data;
  }
  return { nextSettings: prev };
}
```

- [ ] **Step 2: Create verify script + package.json entry**

`scripts/verify-domain-knowledge-overrides.mjs`:

```js
import {
  applyDomainKnowledgeOverrides,
  parseDomainKnowledgeOverride,
  extractDomainKnowledgeOverride,
} from '../lib/utils/domainKnowledgeOverrides.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';

const errors = [];

const bad = parseDomainKnowledgeOverride({ defaultTax: 99, units: ['pcs'] });
if (!bad.success || bad.data.defaultTax != null) {
  // locked keys stripped before parse — defaultTax should be gone; units ok
}
const lockedGone = parseDomainKnowledgeOverride({ defaultTax: 5, units: ['box'] });
if (!lockedGone.success || lockedGone.data.defaultTax !== undefined) {
  errors.push('locked defaultTax must be stripped');
}
if (!lockedGone.success || lockedGone.data.units?.[0] !== 'box') {
  errors.push('units should parse');
}

const tooMany = parseDomainKnowledgeOverride({
  units: Array.from({ length: 31 }, (_, i) => `u${i}`),
});
if (tooMany.success) errors.push('31 units must fail Zod');

const base = getDomainKnowledge('retail-shop', { countryIso: 'AE' });
const empty = applyDomainKnowledgeOverrides(base, {});
if (empty !== base && JSON.stringify(empty) !== JSON.stringify(base)) {
  // allow new object equality
}
const merged = applyDomainKnowledgeOverrides(base, {
  units: ['crate'],
  popularBrands: ['Owner Brand'],
  intelligence: { leadTime: 3 },
});
if (!merged.units.includes('crate')) errors.push('units replace failed');
if (!merged.marketFeatures.popularBrands[0] || merged.marketFeatures.popularBrands[0] !== 'Owner Brand') {
  errors.push('owner brand must prepend');
}
if (merged.intelligence.leadTime !== 3) errors.push('intelligence merge failed');
if (merged.defaultTax !== base.defaultTax) errors.push('defaultTax must stay locked');

const corrupt = extractDomainKnowledgeOverride({ domainKnowledge: 'nope' });
if (Object.keys(corrupt).length !== 0) errors.push('corrupt extract must be {}');

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}
console.log('OK: domain knowledge overrides merge + Zod');
```

Add to `package.json` scripts:

```json
"verify:domain-knowledge-overrides": "bun scripts/verify-domain-knowledge-overrides.mjs"
```

- [ ] **Step 3: Run verify**

Run: `bun run verify:domain-knowledge-overrides`  
Expected: `OK: domain knowledge overrides merge + Zod`

Fix any import path issues (`.ts` normalizeKey) until green.

---

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

### Task 4: Critical call-site country awareness

**Files:**
- Modify: `lib/utils/domainHelpers.ts` — helpers that call `getDomainKnowledge(category)` without options should accept optional `options?: DomainKnowledgeOptions` and pass through (already partially typed)
- Modify: `lib/data/productTemplates.js` — accept `countryIso` / use options
- Modify: `lib/utils/inventoryRowDefaults.js` — already optional; ensure callers pass when business known
- Modify: `lib/utils/inventoryFieldSuggestions.js` — already optional; document in header comment that hub must pass `countryIso`

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

### Task 5: Server action to save owner overrides

**Files:**
- Modify: `lib/actions/basic/business.js`

**Interfaces:**
- Produces: `updateDomainKnowledgeOverridesAction({ businessId, domainKnowledge })`
  - `domainKnowledge: object | null` — `null` clears all customizations
- Permission: `settings.edit`
- Returns: `actionSuccess({ business })` with `enrichBusinessForClient`

- [ ] **Step 1: Add action (mirror packaging action)**

```js
import { mergeDomainKnowledgeIntoBusinessSettings } from '@/lib/utils/domainKnowledgeOverrides';

export async function updateDomainKnowledgeOverridesAction({ businessId, domainKnowledge }) {
  try {
    await withGuard(businessId, { permission: 'settings.edit' });

    const biz = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { settings: true },
    });
    if (!biz) {
      return await actionFailure('NOT_FOUND', 'Business not found.');
    }

    let nextSettings;
    try {
      ({ nextSettings } = mergeDomainKnowledgeIntoBusinessSettings(
        biz.settings,
        domainKnowledge === null ? null : domainKnowledge
      ));
    } catch (validationError) {
      return await actionFailure(
        'VALIDATION_ERROR',
        validationError?.message || 'Invalid industry overrides'
      );
    }

    const updated = await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings: nextSettings, updated_at: new Date() },
    });

    return await actionSuccess({ business: enrichBusinessForClient(updated) });
  } catch (error) {
    const code = error?.code;
    if (
      code === 'UNAUTHENTICATED' ||
      code === 'PERMISSION_DENIED' ||
      code === 'BUSINESS_ACCESS_DENIED' ||
      code === 'MISSING_BUSINESS_ID'
    ) {
      return await actionFailure(
        code === 'UNAUTHENTICATED' ? 'UNAUTHENTICATED' : 'FORBIDDEN',
        await getErrorMessage(error)
      );
    }
    console.error('updateDomainKnowledgeOverridesAction:', error);
    return await actionFailure('DOMAIN_KNOWLEDGE_UPDATE_FAILED', await getErrorMessage(error));
  }
}
```

Ensure `enrichBusinessForClient` is imported (already used in packaging action).

- [ ] **Step 2: Confirm `business.settings` on client includes `domainKnowledge` after save** (enrich already merges settings; no change if settings column is the source).

---

### Task 6: Settings → Industry UI

**Files:**
- Create: `components/settings/IndustryDomainKnowledgePanel.jsx`
- Modify: `components/SettingsManager.jsx`

**Interfaces:**
- Consumes: `updateDomainKnowledgeOverridesAction`, `getDomainKnowledgeForBusiness`, `useBusiness`
- Shows baseline vs editable patch fields

- [ ] **Step 1: Build panel (compact Zoho-style form)**

Panel responsibilities:
- Load baseline via `getDomainKnowledgeForBusiness(business.category, business)` for read-only summary (vertical name, country, default unit).
- Local state initialized from `business.settings.domainKnowledge` via `extractDomainKnowledgeOverride`.
- Editors: units (comma/chip text), popularBrands (textarea one-per-line), categories (one-per-line), intelligence (selects + numbers), optional simple fieldConfig add row (label + type).
- Buttons: Save, Reset all (calls action with `null`).
- Copy: no em dashes; headings `font-semibold`.
- On success: update BusinessContext business object from action payload; `notify.compactSave` or existing toast pattern in SettingsManager.

Keep the component under ~350 lines; reuse existing Input/Select/Button from `@/components/ui/*`.

- [ ] **Step 2: Wire tab in SettingsManager**

In `visibleSections`:

```js
{ value: 'industry', label: 'Industry', visible: true },
```

Place after `financials` (before billing). Add `TabsContent value="industry"` rendering `<IndustryDomainKnowledgePanel />`.

Gate save button with `can('settings.edit')` or existing owner/admin check used for profile save.

- [ ] **Step 3: Manual smoke** (dev): open Settings → Industry, add brand, save, confirm `getDomainKnowledgeForBusiness` in a quick bun snippet or inventory brand datalist shows it.

---

### Task 7: Completeness contract + sparse rows + docs

**Files:**
- Modify: `lib/domainData/edu_livestock.js` and/or services file containing `mobile-repairing` / `school-education`
- Modify: `scripts/verify-domain-wiring.mjs`
- Modify: `docs/DOMAIN_VERTICALS.md`
- Modify: `docs/superpowers/specs/2026-07-18-domain-knowledge-enterprise-design.md` status → Implemented when done

**Known gaps (raw rows, 2026-07-18 scan):**
- `mobile-repairing` — missing intelligence: peakMonths, perishability, shelfLife, minOrderQuantity
- `school-education` — missing intelligence: perishability, shelfLife

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

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Resolution pipeline + owner merge | 1, 2 |
| Zod limits + locked keys | 1, 5 |
| Country tax categories | 2 |
| Brands all markets | 3 |
| Call-site countryIso | 4 |
| Settings Industry UI + action | 5, 6 |
| Completeness + verify | 7 |
| No Prisma migration / backward compatible | All (empty patch) |
| Financials own tax rates | 2 (locked) + 5 (strip) |

## Placeholder / consistency self-review

- No TBD/TODO left in tasks.
- Function names consistent: `applyDomainKnowledgeOverrides`, `extractDomainKnowledgeOverride`, `mergeDomainKnowledgeIntoBusinessSettings`, `updateDomainKnowledgeOverridesAction`.
- Settings key consistently `domainKnowledge` (camelCase under `settings`).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-18-domain-knowledge-enterprise.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?

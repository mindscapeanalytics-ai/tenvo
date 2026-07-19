# Task 1 Report: Override merge helper + Zod schema

**Status:** DONE  
**Date:** 2026-07-18  
**Phase:** Domain Knowledge Enterprise Layer — Phase 1 (pure merge/Zod foundation)

---

## Summary

Implemented the pure merge and validation layer for owner `settings.domainKnowledge` overrides. No wiring into `getDomainKnowledgeForBusiness`, Settings UI, or server actions in this task (deferred to later tasks per plan).

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/utils/domainKnowledgeOverrides.js` | Zod schema, parse/extract/merge helpers |
| `scripts/verify-domain-knowledge-overrides.mjs` | CI verify script |

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Added `"verify:domain-knowledge-overrides": "bun scripts/verify-domain-knowledge-overrides.mjs"` |

---

## Exported API

### Constants

- **`DOMAIN_KNOWLEDGE_OVERRIDE_KEYS`** — 9 allowlisted top-level keys: `productFields`, `fieldConfig`, `units`, `popularBrands`, `setupTemplate`, `intelligence`, `customerFields`, `vendorFields`, `paymentTerms`
- **`LOCKED_DOMAIN_KNOWLEDGE_OVERRIDE_KEYS`** — 9 stripped keys: `defaultTax`, `taxCategories`, `icon`, `imageUrl`, `posEnabled`, `manufacturingEnabled`, `pakistaniFeatures`, `marketFeatures`

### Schema

- **`domainKnowledgeOverrideSchema`** — strict Zod object (`.strict()`, no passthrough)
  - `fieldConfig`: max 40 entries, per-field label/type/options validation
  - `intelligence`: strict sub-object with bounded numeric enums
  - Array caps: productFields 40, units 30, popularBrands 50, customer/vendor/paymentTerms 30

### Functions

| Function | Behavior |
|----------|----------|
| `parseDomainKnowledgeOverride(raw)` | Strips locked keys, validates via Zod; empty/null → `{ success: true, data: {} }` |
| `extractDomainKnowledgeOverride(settings)` | Reads `settings.domainKnowledge`; corrupt/invalid → `{}` |
| `applyDomainKnowledgeOverrides(base, patch)` | Pure merge onto platform knowledge; invalid patch treated as `{}` |
| `mergeDomainKnowledgeIntoBusinessSettings(settings, patch)` | Writes validated patch to settings; `null` patch removes key; throws `VALIDATION_ERROR` on invalid |

---

## Merge Semantics (applyDomainKnowledgeOverrides)

| Key | Merge rule |
|-----|------------|
| `fieldConfig` | Shallow merge; keys normalized via `normalizeKey()` |
| `productFields` | Union with platform list (deduped, case-insensitive) |
| `units` | Owner list replaces (deduped) |
| `popularBrands` | Owner list replaces; prepends into `marketFeatures.popularBrands` and mirrors to `pakistaniFeatures` |
| `setupTemplate` | Shallow merge; categories deduped; suggestedProducts replaced when provided |
| `intelligence` | Shallow merge with platform intelligence |
| `customerFields`, `vendorFields`, `paymentTerms` | Owner list replaces (deduped) |

Locked platform keys (`defaultTax`, etc.) are never modified by the merge layer.

---

## Verification

```bash
bun run verify:domain-knowledge-overrides
```

**Result:** `OK: domain knowledge overrides merge + Zod` (exit 0)

### Cases covered

1. Locked `defaultTax` stripped before Zod parse; valid `units` preserved
2. 31 units fails Zod max(30)
3. Empty patch returns base unchanged (reference or deep-equal)
4. `units: ['crate']` applied to `retail-shop` AE base
5. `popularBrands: ['Owner Brand']` prepended to `marketFeatures.popularBrands`
6. `intelligence.leadTime: 3` shallow-merged
7. `defaultTax` unchanged after merge
8. Corrupt `domainKnowledge: 'nope'` → `{}` via extract

---

## Self-Review

### Correctness

- Implementation matches task brief verbatim (schema bounds, locked keys, merge rules).
- `normalizeKey` import from `./domainHelpers.ts` works under Bun (same pattern as `verify-inventory-domains.mjs`).
- `mergeDomainKnowledgeIntoBusinessSettings` throws structured error with `code: 'VALIDATION_ERROR'` and `issues` for downstream action wiring.

### Scope adherence

- No Prisma migration
- No Settings UI
- No edits to `businessRegionalContext.js` or `getDomainKnowledgeForBusiness`
- No git commit (per user rule + plan)

### Minor notes (non-blocking)

- Verify script does not yet exercise `mergeDomainKnowledgeIntoBusinessSettings` (brief did not require it); Task 2+ should add action-level tests when wired.
- `applyDomainKnowledgeOverrides` silently ignores invalid patches (returns base with no merge); intentional for read-path safety; write-path uses throwing merge helper.

---

## Next Steps (per plan)

- **Task 2:** Wire `applyDomainKnowledgeOverrides` into `getDomainKnowledgeForBusiness` in `lib/utils/businessRegionalContext.js`
- **Task 3+:** Server action, Settings UI, extended verify in domain-wiring/regional-market scripts

---

## Commits

None (not requested).

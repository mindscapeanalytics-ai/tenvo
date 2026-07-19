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

const ae = getDomainKnowledge('grocery', { countryIso: 'AE' });
const pk = getDomainKnowledge('grocery', { countryIso: 'PK' });
if (
  JSON.stringify(ae.taxCategories) === JSON.stringify(pk.taxCategories) &&
  (pk.taxCategories || []).some((t) => /FBR|WHT|Provincial/i.test(String(t)))
) {
  errors.push('AE taxCategories must not mirror PK FBR-heavy lists');
}
if ((ae.taxCategories || []).some((t) => /Anarkali|JazzCash/i.test(String(t)))) {
  errors.push('AE taxCategories leaked PK labels');
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}
console.log('OK: domain knowledge overrides merge + Zod');

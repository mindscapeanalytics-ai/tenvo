/**
 * Sanity-check: every domainKnowledge key has a getDomainConfig row and icon,
 * plus enterprise completeness via getDomainKnowledge merge.
 * Run: bun scripts/verify-domain-wiring.mjs  (or: bun run verify:domains)
 * Expect count to match DOMAIN_KNOWLEDGE_KEYS (60+ verticals).
 */
import { domainKnowledge, DOMAIN_KNOWLEDGE_KEYS, getDomainKnowledge } from '../lib/domainKnowledge.js';
import { getDomainConfig, suggestPlanTier, isMembershipRelevant } from '../lib/config/domains.js';
import { resolveDomainKey, DOMAIN_KEY_ALIASES } from '../lib/config/domainKeyAliases.js';
import {
  resolveMembershipVerticalKey,
  MEMBERSHIP_VERTICAL_KEYS,
} from '../lib/memberships/membershipVertical.js';

const INTEL_KEYS = [
  'seasonality',
  'peakMonths',
  'perishability',
  'shelfLife',
  'demandVolatility',
  'minOrderQuantity',
  'leadTime',
];

let failed = false;
for (const key of DOMAIN_KNOWLEDGE_KEYS) {
  const cfg = getDomainConfig(key);
  if (!cfg || !cfg.required_modules?.length) {
    console.error(`FAIL: getDomainConfig("${key}")`);
    failed = true;
    continue;
  }
  const raw = domainKnowledge[key];
  if (!raw?.icon) {
    console.error(`FAIL: missing icon on domainKnowledge["${key}"]`);
    failed = true;
  }
  const tier = suggestPlanTier(key);
  if (!['free', 'starter', 'business'].includes(tier)) {
    console.error(`FAIL: suggestPlanTier("${key}") -> ${tier}`);
    failed = true;
  }

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

for (const [alias, canonical] of Object.entries(DOMAIN_KEY_ALIASES)) {
  if (resolveDomainKey(alias) !== canonical) {
    console.error(`FAIL: resolveDomainKey("${alias}") !== "${canonical}"`);
    failed = true;
    continue;
  }
  if (alias === canonical) continue;
  const dkAlias = getDomainKnowledge(alias, { countryIso: 'PK' });
  const dkCanon = getDomainKnowledge(canonical, { countryIso: 'PK' });
  if (JSON.stringify(dkAlias?.intelligence) !== JSON.stringify(dkCanon?.intelligence)) {
    console.error(`FAIL: getDomainKnowledge("${alias}") intelligence !== "${canonical}"`);
    failed = true;
  }
  const cfgAlias = getDomainConfig(alias);
  const cfgCanon = getDomainConfig(canonical);
  if (cfgAlias?.key && cfgCanon?.key && cfgAlias.key !== cfgCanon.key) {
    console.error(`FAIL: getDomainConfig("${alias}").key !== getDomainConfig("${canonical}").key`);
    failed = true;
  }
}

if (resolveDomainKey('grocery') !== 'supermarket') {
  console.error('FAIL: grocery must alias to supermarket');
  failed = true;
}

for (const sample of ['salon', 'spa', 'beauty-salon', 'spa-wellness', 'salon-spa']) {
  if (!isMembershipRelevant(sample)) {
    console.error(`FAIL: isMembershipRelevant("${sample}") should be true`);
    failed = true;
  }
  if (resolveMembershipVerticalKey(sample) !== 'salon-spa') {
    console.error(`FAIL: resolveMembershipVerticalKey("${sample}") should be salon-spa`);
    failed = true;
  }
}

if (!MEMBERSHIP_VERTICAL_KEYS.includes('salon-spa')) {
  console.error('FAIL: MEMBERSHIP_VERTICAL_KEYS must include salon-spa');
  failed = true;
}

if (failed) process.exit(1);
console.log(
  `OK: ${DOMAIN_KNOWLEDGE_KEYS.length} domains wired (config + plan tier + icons + completeness + aliases + membership).`
);

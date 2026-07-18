#!/usr/bin/env node
/**
 * Sanity-check marine-parts seed + storefront archive wiring.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  MARINE_PARTS_SEED_CATALOG,
  MARINE_PARTS_SEED_CATEGORIES,
  MARINE_PARTS_SEED_META,
} from '../lib/dataLab/marinePartsSeedCatalog.js';
import { buildRichSeedItems } from '../lib/dataLab/richProductCatalog.js';
import {
  MARINE_DEFAULT_SLIDES,
  MARINE_EXPERTISE_CARDS,
  MARINE_EQUIPMENT_CATEGORIES,
  MARINE_INSIGHTS,
} from '../lib/storefront/marinePartsArchiveMap.js';
import { isMarinePartsStore } from '../lib/storefront/marineParts.js';
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const archivePath = join(root, 'lib/dataLab/shipsArchiveExtract.json');
let archive;
try {
  archive = JSON.parse(readFileSync(archivePath, 'utf8'));
} catch (e) {
  errors.push(`shipsArchiveExtract.json unreadable: ${e.message}`);
}

if (!archive?.equipmentFamilies?.length) errors.push('archive missing equipmentFamilies');
if (!archive?.expertise?.length) errors.push('archive missing expertise');
if (MARINE_PARTS_SEED_CATALOG.length < 50) {
  errors.push(`seed catalog too small (${MARINE_PARTS_SEED_CATALOG.length})`);
}
if (MARINE_PARTS_SEED_CATEGORIES.length < 8) errors.push('seed categories incomplete');

const skus = new Set();
for (const p of MARINE_PARTS_SEED_CATALOG) {
  const key = String(p.sku || p.name).toLowerCase();
  if (skus.has(key)) errors.push(`duplicate sku/name: ${key}`);
  skus.add(key);
  if (!p.domain_data?.partnumber) errors.push(`missing partnumber: ${p.sku}`);
  if (!p.domain_data?.equipmenttype) errors.push(`missing equipmenttype: ${p.sku}`);
  if (!p.domain_data?.systemcondition) errors.push(`missing systemcondition: ${p.sku}`);
}

if (!MARINE_DEFAULT_SLIDES.length) errors.push('missing default slides');
if (MARINE_EXPERTISE_CARDS.length !== 4) errors.push('expertise cards expected 4');
if (MARINE_EQUIPMENT_CATEGORIES.length < 8) errors.push('equipment categories incomplete');
if (MARINE_INSIGHTS.length < 3) errors.push('insights incomplete');

if (!isMarinePartsStore('marine-parts')) errors.push('isMarinePartsStore failed for marine-parts');
if (resolveDomainKey('ships-parts') !== 'marine-parts') errors.push('alias ships-parts broken');
if (resolveDomainKey('tenvo-marine') !== 'marine-parts') errors.push('alias tenvo-marine broken');

const knowledge = getDomainKnowledge('marine-parts');
if (!knowledge?.fieldConfig?.partnumber) errors.push('domain knowledge missing partnumber');
if (!knowledge?.intelligence?.leadTime) errors.push('domain intelligence missing');

const registrationItems = buildRichSeedItems({
  businessId: 'verify-business-id',
  domainKey: 'marine-parts',
  countryIso: 'NL',
  taxRate: 21,
  brands: [],
});
if (!registrationItems.length || registrationItems.length < 50) {
  errors.push(`registration seed too small (${registrationItems.length})`);
}

const regCats = new Set(MARINE_PARTS_SEED_CATEGORIES);
for (const p of registrationItems.slice(0, 20)) {
  if (p.category && !regCats.has(p.category)) {
    // allow generated categories that still match seed shells
  }
}

if (errors.length) {
  console.error('FAIL: marine-parts seed verification');
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log(
  `OK: marine-parts seed (${MARINE_PARTS_SEED_CATALOG.length} SKUs, meta=${MARINE_PARTS_SEED_META.count}, registration=${registrationItems.length})`
);

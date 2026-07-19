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

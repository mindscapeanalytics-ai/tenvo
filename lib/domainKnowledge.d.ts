/**
 * Ambient types for `domainKnowledge.js` — merged row returned by `getDomainKnowledge`.
 * Keeps TSX callers (e.g. DomainDashboard) from seeing a bare `Object` without `name`.
 */

export interface DomainKnowledgePakistaniFeatures {
  paymentGateways?: string[];
  taxCompliance?: string[];
  languages?: string[];
  [key: string]: unknown;
}

export interface DomainKnowledgeIntelligence {
  seasonality?: string;
  peakMonths?: unknown[];
  perishability?: string;
  shelfLife?: number;
  demandVolatility?: number;
  minOrderQuantity?: number;
  leadTime?: number;
  [key: string]: unknown;
}

/** Shape after defaults merge + derived `name` (see `getDomainKnowledge`). */
export interface DomainKnowledgeMerged {
  name: string;
  countryIso?: string;
  taxCategories: string[];
  pakistaniFeatures: DomainKnowledgePakistaniFeatures;
  marketFeatures?: DomainKnowledgePakistaniFeatures;
  intelligence: DomainKnowledgeIntelligence;
  [key: string]: unknown;
}

export const domainKnowledge: Record<string, Record<string, unknown>>;
export const DOMAIN_KNOWLEDGE_KEYS: readonly string[];

export function getDomainKnowledge(
  category?: string | null,
  options?: { countryIso?: string }
): DomainKnowledgeMerged;

export function getDomainDefaults(category?: string | null): Record<string, unknown>;

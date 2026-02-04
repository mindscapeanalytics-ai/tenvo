/**
 * Domain-specific knowledge and configurations
 * Provides intelligent defaults and options for each business category
 * Refactored into modular components for better maintainability
 */

import { retailDomains } from './domainData/retail.js';
import { industrialDomains } from './domainData/industrial.js';
import { serviceDomains } from './domainData/services.js';
import { specializedDomains } from './domainData/specialized.js';
import { textileDomains } from './domainData/textile.js';

/**
 * Consolidated domain knowledge object
 * Merges all specialized domain configurations
 */
export const domainKnowledge = {
  ...retailDomains,
  ...industrialDomains,
  ...serviceDomains,
  ...specializedDomains,
  ...textileDomains,
};

/**
 * Get domain knowledge for a specific category
 * Falls back to retail-shop if category is not found
 * 
 * @param {string} category - The domain category slug
 * @returns {Object} Domain configuration
 */
export function getDomainKnowledge(category) {
  return domainKnowledge[category] || domainKnowledge['retail-shop'];
}

/**
 * Get intelligent defaults for a domain
 * 
 * @param {string} category - The domain category slug
 * @returns {Object} Default values for new products
 */
export function getDomainDefaults(category) {
  const knowledge = getDomainKnowledge(category);
  return {
    defaultTax: knowledge.defaultTax || 0,
    defaultUnit: knowledge.units?.[0] || 'pcs',
    productFields: knowledge.productFields || [],
    paymentTerms: knowledge.paymentTerms || ['Cash'],
    inventoryFeatures: knowledge.inventoryFeatures || [],
    reports: knowledge.reports || [],
    setupTemplate: knowledge.setupTemplate || { categories: [], suggestedProducts: [] },
  };
}

/**
 * Resolve registration country ISO and merge business_settings into client payloads.
 */
import { getRegionalStandards } from './regionalHelpers';
import { getDomainKnowledge } from '../domainKnowledge.js';
import {
  applyDomainKnowledgeOverrides,
  extractDomainKnowledgeOverride,
} from './domainKnowledgeOverrides.js';

/**
 * @param {Record<string, unknown> | null | undefined} business
 * @returns {string}
 */
export function resolveBusinessCountryIso(business) {
  if (!business) return 'PK';
  const settings = business.settings;
  const fromSettings =
    settings &&
    typeof settings === 'object' &&
    !Array.isArray(settings) &&
    settings.registration &&
    typeof settings.registration === 'object'
      ? settings.registration.country_iso
      : null;

  const raw =
    business.registration_country_iso ||
    fromSettings ||
    business.country ||
    business.city ||
    'PK';

  return getRegionalStandards(raw).countryCode;
}

/**
 * @param {Record<string, unknown> | null | undefined} business
 */
export function getRegionalStandardsForBusiness(business) {
  return getRegionalStandards(resolveBusinessCountryIso(business));
}

/**
 * Full regional pack for a business — merges registration + financials + registry defaults.
 * Use for currency, tax labels, locale, and default tax rate across hub, POS, and print.
 *
 * @param {Record<string, unknown> | null | undefined} business
 */
export function getBusinessRegionalPack(business) {
  const registry = getRegionalStandardsForBusiness(business);
  const settings =
    business?.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
      ? business.settings
      : {};
  const registration =
    settings.registration && typeof settings.registration === 'object'
      ? settings.registration
      : {};
  const financials =
    settings.financials && typeof settings.financials === 'object' ? settings.financials : {};

  const countryIso = registration.country_iso || registry.countryCode;
  const finRate = financials.defaultTaxRate;
  const regRate = registration.default_tax_rate;
  const taxEnabled = financials.taxEnabled !== false;

  let defaultTaxRate = registry.defaultTaxRate;
  if (Number.isFinite(Number(regRate))) defaultTaxRate = Number(regRate);
  if (Number.isFinite(Number(finRate))) defaultTaxRate = Number(finRate);
  if (!taxEnabled) defaultTaxRate = 0;

  return {
    countryIso,
    countryName: registration.country_name || business?.country || registry.countryName,
    currency: financials.currency || registry.currency,
    currencySymbol: financials.currencySymbol || registry.currencySymbol,
    taxLabel: financials.taxLabel || registration.tax_label || registry.taxLabel,
    taxIdLabel: financials.taxIdLabel || registration.tax_id_label || registry.taxIdLabel,
    taxEnabled,
    defaultTaxRate,
    locale: registration.locale || financials.locale || registry.locale,
    timeZone: registration.time_zone || financials.timeZone || registry.timeZone,
    taxStrategy: registration.tax_strategy || financials.taxStrategy || registry.taxStrategy,
    phoneCode: registry.phoneCode,
  };
}

/**
 * Resolve display currency code for hub/finance UI (never invents a random code).
 * Prefer live business currency, then regional pack / registry.
 * @param {Record<string, unknown> | null | undefined} [business]
 * @param {{ currency?: string } | null | undefined} [regionalPack]
 * @returns {string}
 */
export function resolveDisplayCurrency(business, regionalPack) {
  const fromBusiness = business?.currency;
  if (fromBusiness && String(fromBusiness).trim()) return String(fromBusiness).trim().toUpperCase();
  if (regionalPack?.currency && String(regionalPack.currency).trim()) {
    return String(regionalPack.currency).trim().toUpperCase();
  }
  try {
    return getBusinessRegionalPack(business || {}).currency || 'PKR';
  } catch {
    return 'PKR';
  }
}

/**
 * Domain knowledge merged with the business registration market.
 * @param {string} category
 * @param {Record<string, unknown> | string | null | undefined} businessOrCountryIso
 */
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

/**
 * Default line-item tax % for forms: domain override when set, else registration country rate.
 * @param {Record<string, unknown> | null | undefined} business
 * @param {string} category
 */
export function resolveFormDefaultTaxRate(business, category) {
  const pack = getBusinessRegionalPack(business);
  if (pack?.taxEnabled === false) return 0;
  const knowledge = getDomainKnowledgeForBusiness(category, business);
  const domainTax = Number(knowledge?.defaultTax);
  if (Number.isFinite(domainTax) && domainTax > 0) return domainTax;
  const regionalRate = Number(pack?.defaultTaxRate);
  return Number.isFinite(regionalRate) && regionalRate >= 0 ? regionalRate : 0;
}

/**
 * Merge `business_settings.settings.registration` into the business row for hub clients.
 * @param {Record<string, unknown> | null | undefined} business
 */
export function enrichBusinessForClient(business) {
  if (!business) return business;

  const settingsRow = business.business_settings;
  const rowSettings =
    settingsRow?.settings && typeof settingsRow.settings === 'object'
      ? settingsRow.settings
      : null;
  const registration =
    rowSettings?.registration ||
    (business.settings &&
    typeof business.settings === 'object' &&
    !Array.isArray(business.settings)
      ? business.settings.registration
      : null);
  const financials =
    rowSettings?.financials ||
    (business.settings &&
    typeof business.settings === 'object' &&
    !Array.isArray(business.settings)
      ? business.settings.financials
      : null);

  const prevSettings =
    business.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
      ? business.settings
      : {};

  const mergedSettings = {
    ...prevSettings,
    ...(registration ? { registration } : {}),
    ...(financials ? { financials } : {}),
  };

  const { business_settings: _drop, ...rest } = business;

  return {
    ...rest,
    settings: Object.keys(mergedSettings).length ? mergedSettings : prevSettings,
    registration_country_iso: registration?.country_iso || null,
  };
}

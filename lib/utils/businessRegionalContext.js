/**
 * Resolve registration country ISO and merge business_settings into client payloads.
 */
import { getRegionalStandards } from './regionalHelpers.ts';
import { getDomainKnowledge } from '../domainKnowledge.js';

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
 * Domain knowledge merged with the business registration market.
 * @param {string} category
 * @param {Record<string, unknown> | string | null | undefined} businessOrCountryIso
 */
export function getDomainKnowledgeForBusiness(category, businessOrCountryIso) {
  const countryIso =
    typeof businessOrCountryIso === 'string'
      ? businessOrCountryIso
      : resolveBusinessCountryIso(businessOrCountryIso);
  return getDomainKnowledge(category, { countryIso });
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

/**
 * Safe merge for owner/settings.edit updates to businesses.settings.
 * Preserves privileged keys (packaging, limit_overrides) from the DB so clients
 * cannot escalate plan features via updateBusinessAction.
 */

/** Keys that must only change via dedicated packaging / platform admin actions. */
export const BUSINESS_SETTINGS_PRIVILEGED_KEYS = Object.freeze([
  'packaging',
  'limit_overrides',
]);

/**
 * @param {unknown} prevSettings
 * @param {unknown} clientSettings
 * @returns {Record<string, unknown>}
 */
export function mergeBusinessSettingsAllowingClientPatch(prevSettings, clientSettings) {
  const prev =
    prevSettings && typeof prevSettings === 'object' && !Array.isArray(prevSettings)
      ? { ...prevSettings }
      : {};

  if (clientSettings == null) {
    return prev;
  }

  if (typeof clientSettings !== 'object' || Array.isArray(clientSettings)) {
    return prev;
  }

  const next = { ...prev, ...clientSettings };

  for (const key of BUSINESS_SETTINGS_PRIVILEGED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(prev, key)) {
      next[key] = prev[key];
    } else {
      delete next[key];
    }
  }

  return next;
}

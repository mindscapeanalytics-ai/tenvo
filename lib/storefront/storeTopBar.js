/**
 * Owner-controlled homepage header top bar (announcement strip).
 * Persisted on `business_settings.settings.storefront`.
 */

/**
 * @param {unknown} settings
 * @returns {{
 *   enabled: boolean,
 *   showPhone: boolean,
 *   showCity: boolean,
 * }}
 */
export function resolveStoreTopBarConfig(settings = {}) {
  const root = settings && typeof settings === 'object' ? settings : {};
  const sf =
    root.storefront && typeof root.storefront === 'object' && !Array.isArray(root.storefront)
      ? root.storefront
      : {};

  const enabled = sf.showTopBar !== false && root.showTopBar !== false;
  // Opt-in: owners enable phone on the top bar from Store Settings.
  const showPhone = sf.showTopBarPhone === true || root.showTopBarPhone === true;
  const showCity = sf.showTopBarCity !== false && root.showTopBarCity !== false;

  return { enabled, showPhone, showCity };
}

/**
 * Normalize top-bar flags for admin form + persist under `settings.storefront`.
 * @param {unknown} raw
 */
export function normalizeStoreTopBarForForm(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    showTopBar: src.showTopBar !== false,
    showTopBarPhone: src.showTopBarPhone === true,
    showTopBarCity: src.showTopBarCity !== false,
  };
}

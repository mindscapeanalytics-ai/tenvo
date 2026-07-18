/**
 * Public storefront brand mark: text / icon / logo modes for header, footer, nav.
 * Canonical config: settings.storefront.branding
 * Logo asset: businesses.logo_url (form field logoUrl)
 */

import { resolveStorefrontLogo } from '@/lib/storefront/resolveStorefrontLogo';

/** @typedef {'text' | 'icon' | 'icon-text' | 'logo' | 'logo-text'} StorefrontBrandMode */
/** @typedef {'classic' | 'bold' | 'editorial' | 'light'} StorefrontBrandTextStyle */
/** @typedef {'initial' | 'anchor' | 'sparkles' | 'dumbbell' | 'gem' | 'leaf' | 'bag' | 'hexagon'} StorefrontBrandIconKey */

export const STOREFRONT_BRAND_MODES = Object.freeze([
  { value: 'text', label: 'Text only', hint: 'Store name as your brand mark' },
  { value: 'icon', label: 'Icon only', hint: 'Small mark without store name' },
  { value: 'icon-text', label: 'Icon + text', hint: 'Mark beside the store name' },
  { value: 'logo', label: 'Logo image', hint: 'Your uploaded logo only' },
  { value: 'logo-text', label: 'Logo + text', hint: 'Uploaded logo beside the store name' },
]);

export const STOREFRONT_BRAND_TEXT_STYLES = Object.freeze([
  {
    value: 'classic',
    label: 'Classic',
    className: 'font-semibold tracking-normal normal-case',
  },
  {
    value: 'bold',
    label: 'Bold',
    className: 'font-bold tracking-tight normal-case',
  },
  {
    value: 'editorial',
    label: 'Editorial',
    className: 'font-bold uppercase tracking-[0.18em]',
  },
  {
    value: 'light',
    label: 'Light',
    className: 'font-medium tracking-wide normal-case',
  },
]);

export const STOREFRONT_BRAND_ICON_KEYS = Object.freeze([
  { value: 'initial', label: 'Initial letter' },
  { value: 'anchor', label: 'Anchor' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'gem', label: 'Gem' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'bag', label: 'Bag' },
  { value: 'hexagon', label: 'Hexagon' },
]);

const MODE_SET = new Set(STOREFRONT_BRAND_MODES.map((m) => m.value));
const TEXT_STYLE_SET = new Set(STOREFRONT_BRAND_TEXT_STYLES.map((s) => s.value));
const ICON_KEY_SET = new Set(STOREFRONT_BRAND_ICON_KEYS.map((i) => i.value));

/**
 * @param {unknown} raw
 * @param {{ defaultMode?: StorefrontBrandMode | null }} [opts]
 * @returns {{
 *   mode: StorefrontBrandMode | null,
 *   textStyle: StorefrontBrandTextStyle,
 *   iconKey: StorefrontBrandIconKey,
 *   iconUrl: string,
 * }}
 */
export function normalizeStorefrontBranding(raw, opts = {}) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const defaultMode = opts.defaultMode === undefined ? null : opts.defaultMode;
  const mode = MODE_SET.has(src.mode) ? src.mode : defaultMode;
  const textStyle = TEXT_STYLE_SET.has(src.textStyle) ? src.textStyle : 'classic';
  const iconKey = ICON_KEY_SET.has(src.iconKey) ? src.iconKey : 'initial';
  const iconUrl =
    typeof src.iconUrl === 'string' && src.iconUrl.trim() ? src.iconUrl.trim() : '';
  return { mode, textStyle, iconKey, iconUrl };
}

/**
 * Form / persist shape always includes an explicit mode.
 * @param {unknown} raw
 */
export function normalizeStorefrontBrandingForForm(raw) {
  const n = normalizeStorefrontBranding(raw, { defaultMode: 'text' });
  return { ...n, mode: n.mode || 'text' };
}

/**
 * @param {object} [settings]
 */
export function getStorefrontBrandingConfig(settings) {
  const nested =
    settings?.storefront?.branding ||
    settings?.branding ||
    null;
  return normalizeStorefrontBranding(nested);
}

/**
 * Infer mode for tenants that have not saved branding yet.
 * @param {string | null} logoUrl
 * @param {{ mode?: string | null } | null} configured
 * @returns {StorefrontBrandMode}
 */
export function inferStorefrontBrandMode(logoUrl, configured) {
  if (configured && MODE_SET.has(configured.mode)) {
    return /** @type {StorefrontBrandMode} */ (configured.mode);
  }
  if (logoUrl) return 'logo-text';
  return 'text';
}

/**
 * @param {StorefrontBrandTextStyle} textStyle
 */
export function resolveBrandTextClassName(textStyle) {
  const row = STOREFRONT_BRAND_TEXT_STYLES.find((s) => s.value === textStyle);
  return row?.className || STOREFRONT_BRAND_TEXT_STYLES[0].className;
}

/**
 * Resolve what header/footer/nav should render for the brand mark.
 *
 * @param {{
 *   business?: object | null,
 *   settings?: object | null,
 *   displayName?: string | null,
 * }} opts
 */
export function resolveStorefrontBrandMark({ business, settings, displayName } = {}) {
  const branding = getStorefrontBrandingConfig(settings);
  const logoUrl = resolveStorefrontLogo(business, settings);
  const name =
    (typeof displayName === 'string' && displayName.trim()) ||
    (typeof business?.business_name === 'string' && business.business_name.trim()) ||
    'Store';

  let mode = inferStorefrontBrandMode(logoUrl, branding);

  // Soft fallbacks when assets missing for the chosen mode.
  if ((mode === 'logo' || mode === 'logo-text') && !logoUrl) {
    mode = mode === 'logo-text' ? 'icon-text' : 'text';
  }
  if ((mode === 'icon' || mode === 'icon-text') && !branding.iconUrl && !branding.iconKey) {
    mode = mode === 'icon-text' ? 'text' : 'icon';
  }

  const showLogo = mode === 'logo' || mode === 'logo-text';
  const showIcon = mode === 'icon' || mode === 'icon-text';
  const showText = mode === 'text' || mode === 'icon-text' || mode === 'logo-text';

  return {
    mode,
    showLogo: Boolean(showLogo && logoUrl),
    showIcon: Boolean(showIcon),
    showText: Boolean(showText),
    logoUrl: showLogo ? logoUrl : null,
    iconKey: branding.iconKey || 'initial',
    iconUrl: branding.iconUrl || '',
    displayName: name,
    textStyle: branding.textStyle,
    textClassName: resolveBrandTextClassName(branding.textStyle),
    initial: name.charAt(0)?.toUpperCase() || 'S',
  };
}

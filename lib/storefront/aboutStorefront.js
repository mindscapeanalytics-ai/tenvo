/**
 * Public storefront About page config.
 * Canonical: settings.storefront.about
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';

/** Domains that surface About in footer/nav by default when enabled. */
export const ABOUT_PAGE_DEFAULT_FOOTER_CANONICALS = new Set([
  'marine-parts',
  'industrial-parts',
  'hardware-sanitary',
  'hardware-store',
  'hardware',
  'construction-material',
  'supermarket',
  'grocery',
  'vehicle-dealership',
  'auto-marketplace',
  'furniture',
  'gems-jewellery',
  'salon-spa',
  'gym-fitness',
]);

/**
 * @param {string | null | undefined} category
 */
export function prefersAboutPageByDefault(category) {
  return ABOUT_PAGE_DEFAULT_FOOTER_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {unknown} raw
 * @returns {Array<{ id: string; name: string; role: string; photoUrl: string; bio: string }>}
 */
export function normalizeAboutTeam(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map((row, index) => {
      if (!row || typeof row !== 'object') return null;
      const name = String(row.name || '').trim();
      if (!name) return null;
      return {
        id: String(row.id || `member-${index + 1}`),
        name,
        role: String(row.role || '').trim(),
        photoUrl: String(row.photoUrl || row.image || '').trim(),
        bio: String(row.bio || '').trim().slice(0, 280),
      };
    })
    .filter(Boolean);
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeAboutValues(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Form / persist shape.
 * @param {unknown} raw
 * @param {{ category?: string | null }} [opts]
 */
export function normalizeAboutStorefrontConfig(raw, opts = {}) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const prefer = prefersAboutPageByDefault(opts.category);
  const enabled = src.enabled === undefined ? prefer : src.enabled !== false;
  return {
    enabled,
    showInNav: src.showInNav === true,
    showInFooter: src.showInFooter === undefined ? prefer && enabled : src.showInFooter !== false,
    headline: String(src.headline || '').trim(),
    story: String(src.story || '').trim(),
    mission: String(src.mission || '').trim(),
    values: normalizeAboutValues(src.values),
    foundedYear: String(src.foundedYear || '').trim(),
    headquarters: String(src.headquarters || '').trim(),
    registrationId: String(src.registrationId || '').trim(),
    ownerName: String(src.ownerName || '').trim(),
    ownerTitle: String(src.ownerTitle || '').trim() || 'Founder',
    ownerPhotoUrl: String(src.ownerPhotoUrl || '').trim(),
    ownerBio: String(src.ownerBio || '').trim().slice(0, 400),
    team: normalizeAboutTeam(src.team),
    heroImageUrl: String(src.heroImageUrl || '').trim(),
    ctaLabel: String(src.ctaLabel || '').trim() || 'Contact us',
  };
}

/**
 * @param {object} [settings]
 * @param {{ category?: string | null }} [opts]
 */
export function getAboutStorefrontConfig(settings = {}, opts = {}) {
  const nested = settings?.storefront?.about || settings?.about || null;
  return normalizeAboutStorefrontConfig(nested, opts);
}

/**
 * @param {object} [settings]
 * @param {object} [business]
 */
export function isAboutPageEnabled(settings, business) {
  return getAboutStorefrontConfig(settings, { category: business?.category }).enabled;
}

/**
 * Resolve display content with business fallbacks.
 * @param {{
 *   business?: object | null,
 *   settings?: object | null,
 * }} args
 */
export function resolveAboutPageContent({ business, settings } = {}) {
  const cfg = getAboutStorefrontConfig(settings, { category: business?.category });
  const storeName = business?.business_name || 'Our store';
  const description = String(business?.description || '').trim();
  const story = cfg.story || description;
  const headline = cfg.headline || `About ${storeName}`;
  const contact = settings?.contact && typeof settings.contact === 'object' ? settings.contact : {};
  const headquarters =
    cfg.headquarters ||
    [contact.city, contact.country].filter(Boolean).join(', ') ||
    [business?.city, business?.country].filter(Boolean).join(', ');

  return {
    ...cfg,
    storeName,
    headline,
    story,
    headquarters,
    hasOwner: Boolean(cfg.ownerName || cfg.ownerPhotoUrl || cfg.ownerBio),
    hasTeam: cfg.team.length > 0,
    hasCompanyDetails: Boolean(cfg.foundedYear || headquarters || cfg.registrationId || cfg.mission || cfg.values.length),
    hasContent: Boolean(
      story ||
        cfg.mission ||
        cfg.values.length ||
        cfg.ownerName ||
        cfg.ownerPhotoUrl ||
        cfg.team.length ||
        cfg.heroImageUrl ||
        cfg.foundedYear ||
        headquarters
    ),
  };
}

/**
 * Default storefront + business media for new marine-parts registrations.
 */
import {
  MARINE_DEFAULT_SLIDES,
  MARINE_ACCENT,
  MARINE_HERO_POSTER,
} from './marinePartsArchiveMap.js';

export const MARINE_PARTS_REGISTRATION_METADATA = {
  description:
    'Marine spare parts and propulsion systems. Thrusters, rudder propellers, seals, and lifecycle support for commercial vessels.',
  keywords:
    'marine spare parts, thrusters, rudder propellers, sterntube seals, azimuth drive, tunnel thruster, maritime parts',
  announcement: 'RFQ welcome. Send your part list for availability and lead times.',
  accentColor: MARINE_ACCENT,
  freeShippingThreshold: 0,
  returnPolicyDays: 14,
  businessHours: 'Mon - Fri, 08:00 - 17:00 CET',
};

/**
 * @param {string} businessName
 */
export function buildDefaultMarinePartsStorefrontSettings(businessName = '') {
  const meta = MARINE_PARTS_REGISTRATION_METADATA;
  return {
    storefront: {
      marine: {
        showFinder: true,
        showKpis: true,
        showExpertise: true,
        showEquipmentGrid: true,
        showStayAhead: true,
        showInsights: true,
        showFeaturedRails: true,
        showSpareRail: true,
        showBottomCta: true,
        showMarketingBanners: true,
        heroVideoUrl: '',
        heroPosterUrl: MARINE_HERO_POSTER,
        slides: MARINE_DEFAULT_SLIDES,
      },
      heroTitle: businessName || 'Tenvo Marine',
      heroSubtitle: meta.description,
    },
    announcement: meta.announcement,
    brand: { primaryColor: meta.accentColor },
    freeShippingThreshold: meta.freeShippingThreshold,
    returnPolicyDays: meta.returnPolicyDays,
    businessHours: meta.businessHours,
  };
}

export function getDefaultMarinePartsBusinessMedia() {
  return {
    cover_image_url: MARINE_HERO_POSTER,
    keywords: MARINE_PARTS_REGISTRATION_METADATA.keywords,
  };
}

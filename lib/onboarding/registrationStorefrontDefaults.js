/**
 * Per-vertical storefront + business media defaults applied on registration.
 * Covers 60+ domains via demo profile families; dedicated templates override where needed.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';
import { getDemoStorefrontProfile } from '../dataLab/demoStoreProfiles.js';
import { getSupermarketFamilyProfileExtras } from '../dataLab/supermarketArchiveSeed.js';
import {
  buildDefaultAutoPartsStorefrontSettings,
  getDefaultAutoPartsBusinessMedia,
  AUTO_PARTS_REGISTRATION_METADATA,
} from '../storefront/autoPartsOnboarding.js';
import {
  buildDefaultMarinePartsStorefrontSettings,
  getDefaultMarinePartsBusinessMedia,
  MARINE_PARTS_REGISTRATION_METADATA,
} from '../storefront/marinePartsOnboarding.js';
import {
  buildDefaultDealershipStorefrontSettings,
  getDefaultDealershipBusinessMedia,
} from '../storefront/tenvoVehiclesTemplate.js';
import { TENVO_VEHICLES_METADATA } from '../storefront/tenvoVehiclesAssets.js';
import { getDefaultStorefrontBookingSeed, STOREFRONT_BOOKING_VERTICALS } from '../storefront/storefrontBooking.js';
import { PK_CLOTHING_REGISTRATION_VERTICALS, isSupermarketRegistrationVertical, shouldSeedRichCatalogOnRegistration } from './registrationRichVerticals.js';
import { supportsFashionGulSections } from '../storefront/fashionGulSections.js';
import { buildFullFashionStorefrontSeed } from '../storefront/fashionStorefrontSeed.js';
import { isJewelleryStore, buildDefaultJewelleryStorefrontSeed } from '../storefront/jewelleryStorefront.js';
import { isTilesElevatedStore, buildDefaultTilesStorefrontSeed } from '../storefront/tilesStorefront.js';
import { isTyreElevatedStore, buildDefaultTyreStorefrontSeed } from '../storefront/tyreStorefront.js';

const PK_CLOTHING_COD_INSTRUCTIONS =
  'Pay when your order arrives. Cash on delivery available across Pakistan.';

/** Prisma `businesses` columns allowed on create (not SEO / profile metadata). */
const BUSINESS_MEDIA_COLUMNS = new Set(['logo_url', 'cover_image_url']);

/**
 * Split demo/profile media into Prisma business columns vs SEO keywords.
 * `keywords` must never land on `businesses.create()` — there is no such column.
 * @param {Record<string, unknown> | null | undefined} media
 * @returns {{ businessMedia: Record<string, string>, seoKeywords: string | null }}
 */
function pickBusinessMediaAndSeo(media) {
  if (!media || typeof media !== 'object') {
    return { businessMedia: {}, seoKeywords: null };
  }
  const businessMedia = Object.fromEntries(
    Object.entries({
      logo_url: media.logo_url,
      cover_image_url: media.cover_image_url,
    }).filter(
      ([key, value]) =>
        BUSINESS_MEDIA_COLUMNS.has(key) && value != null && String(value).trim() !== ''
    )
  );
  const rawKeywords = media.keywords;
  const seoKeywords =
    typeof rawKeywords === 'string' && rawKeywords.trim() ? rawKeywords.trim() : null;
  return { businessMedia, seoKeywords };
}

/**
 * @param {{ businessMedia: Record<string, string>, seoKeywords: string | null }} mediaAndSeo
 * @param {Record<string, unknown>} rest
 */
function withMediaAndSeo(mediaAndSeo, rest) {
  return {
    ...rest,
    businessMedia: mediaAndSeo.businessMedia,
    seoKeywords: mediaAndSeo.seoKeywords,
  };
}

/**
 * @param {{
 *   domainKey: string,
 *   businessName: string,
 *   regional: { countryName: string; countryCode: string; currency: string; locale: string },
 *   trimmedDescription?: string | null,
 *   domainPackageKey?: string | null,
 * }} params
 */
export function resolveRegistrationStorefrontDefaults({
  domainKey,
  businessName,
  regional,
  trimmedDescription = null,
  domainPackageKey = null,
}) {
  const canonical = resolveDomainKey(domainKey);
  const regionalCtx = {
    countryName: regional.countryName,
    currency: regional.currency,
  };

  if (canonical === 'vehicle-dealership') {
    const vertical = buildDefaultDealershipStorefrontSettings(businessName);
    const description = trimmedDescription || TENVO_VEHICLES_METADATA.description;
    return withMediaAndSeo(pickBusinessMediaAndSeo(getDefaultDealershipBusinessMedia()), {
      businessDescription: description,
      heroSubtitle: description,
      paymentCodInstructions: null,
      storefrontExtras: {
        announcement: vertical.announcement,
        brand: vertical.brand,
        storefront: {
          ...vertical.storefront,
          ...getDefaultStorefrontBookingSeed(),
        },
      },
    });
  }

  if (canonical === 'auto-parts') {
    const vertical = buildDefaultAutoPartsStorefrontSettings(businessName);
    const description = trimmedDescription || AUTO_PARTS_REGISTRATION_METADATA.description;
    return withMediaAndSeo(pickBusinessMediaAndSeo(getDefaultAutoPartsBusinessMedia()), {
      businessDescription: description,
      heroSubtitle: description,
      paymentCodInstructions:
        'Pay when your order arrives. Cash on delivery available nationwide.',
      storefrontExtras: {
        announcement: vertical.announcement,
        brand: vertical.brand,
        freeShippingThreshold: vertical.freeShippingThreshold,
        returnPolicyDays: vertical.returnPolicyDays,
        businessHours: vertical.businessHours,
        storefront: vertical.storefront,
      },
    });
  }

  if (canonical === 'marine-parts') {
    const vertical = buildDefaultMarinePartsStorefrontSettings(businessName);
    const description = trimmedDescription || MARINE_PARTS_REGISTRATION_METADATA.description;
    return withMediaAndSeo(pickBusinessMediaAndSeo(getDefaultMarinePartsBusinessMedia()), {
      businessDescription: description,
      heroSubtitle: description,
      paymentCodInstructions: null,
      storefrontExtras: {
        announcement: vertical.announcement,
        brand: vertical.brand,
        freeShippingThreshold: vertical.freeShippingThreshold,
        returnPolicyDays: vertical.returnPolicyDays,
        businessHours: vertical.businessHours,
        storefront: vertical.storefront,
      },
    });
  }

  if (isSupermarketRegistrationVertical(canonical)) {
    const profile = getDemoStorefrontProfile(domainKey, regionalCtx, businessName);
    const family = getSupermarketFamilyProfileExtras();
    const description = trimmedDescription || profile.description;
    return withMediaAndSeo(
      pickBusinessMediaAndSeo({
        cover_image_url: profile.cover_image_url || family.cover_image_url,
        keywords: profile.keywords,
      }),
      {
        businessDescription: description,
        heroSubtitle: description,
        paymentCodInstructions: 'Pay when your order arrives. Cash on delivery available.',
        storefrontExtras: {
          announcement: profile.announcement,
          brand: { primaryColor: profile.accentColor || family.accentColor },
          freeShippingThreshold: profile.freeShippingThreshold ?? 3000,
          returnPolicyDays: profile.returnPolicyDays ?? 3,
          businessHours: profile.businessHours,
          storefront: {
            ...(family.storefront || {}),
            ...(profile.storefront || {}),
          },
        },
      }
    );
  }

  const profile = getDemoStorefrontProfile(domainKey, regionalCtx, businessName);
  const description = trimmedDescription || profile.description;
  const bookingSeed = STOREFRONT_BOOKING_VERTICALS.includes(canonical)
    ? getDefaultStorefrontBookingSeed()
    : {};
  const pkClothingCod =
    regional.countryCode === 'PK' && PK_CLOTHING_REGISTRATION_VERTICALS.has(canonical)
      ? PK_CLOTHING_COD_INSTRUCTIONS
      : null;
  const fashionStorefrontSeed = supportsFashionGulSections(canonical)
    && !isJewelleryStore(canonical)
    && shouldSeedRichCatalogOnRegistration(canonical, regional.countryCode, { domainPackageKey })
    ? buildFullFashionStorefrontSeed(canonical)
    : {};
  const jewelleryStorefrontSeed = isJewelleryStore(canonical)
    ? buildDefaultJewelleryStorefrontSeed(canonical)
    : {};
  const tilesStorefrontSeed = isTilesElevatedStore(canonical)
    ? buildDefaultTilesStorefrontSeed(canonical)
    : {};
  const tyreStorefrontSeed = isTyreElevatedStore(canonical)
    ? buildDefaultTyreStorefrontSeed(canonical)
    : {};

  return withMediaAndSeo(pickBusinessMediaAndSeo(profile), {
    businessDescription: description,
    heroSubtitle: description,
    paymentCodInstructions: pkClothingCod,
    storefrontExtras: {
      announcement: profile.announcement,
      brand: { primaryColor: profile.accentColor },
      freeShippingThreshold: profile.freeShippingThreshold,
      returnPolicyDays: profile.returnPolicyDays,
      businessHours: profile.businessHours,
      storefront: {
        ...(profile.storefront || {}),
        ...bookingSeed,
        ...fashionStorefrontSeed,
        ...jewelleryStorefrontSeed,
        ...tilesStorefrontSeed,
        ...tyreStorefrontSeed,
      },
    },
  });
}

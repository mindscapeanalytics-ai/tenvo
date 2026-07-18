/**
 * Resolve public storefront contact details from registration + store settings.
 */
import { getRegionalStandards } from '@/lib/utils/regionalHelpers';
import {
  isDemoStoreDomain,
  sanitizePublicEmail,
  sanitizePublicPhone,
} from './storeContactSanitize.js';

function pickString(...values) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Build a wa.me URL using the store country dial code when the number is national.
 * @param {string | null | undefined} phone
 * @param {string | null | undefined} [country] Country name or ISO from business / contact
 * @returns {string | null}
 */
export function formatWhatsAppUrl(phone, country) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  const dial = String(getRegionalStandards(country).phoneCode || '').replace(/\D/g, '');
  if (!dial) {
    return `https://wa.me/${digits}`;
  }

  if (digits.startsWith(dial)) {
    return `https://wa.me/${digits}`;
  }

  if (digits.startsWith('0')) {
    digits = `${dial}${digits.slice(1)}`;
  } else if (digits.length <= 10) {
    // Local number without leading 0 or country code
    digits = `${dial}${digits}`;
  }

  return `https://wa.me/${digits}`;
}

/**
 * @param {string | null | undefined} address
 * @param {string | null | undefined} city
 * @param {string | null | undefined} country
 * @param {string | null | undefined} postalCode
 */
export function formatStoreAddress(address, city, country, postalCode) {
  return [address, city, postalCode, country].filter(Boolean).join(', ');
}

/**
 * @param {{
 *   business?: Record<string, unknown> | null,
 *   settings?: Record<string, unknown> | null,
 * }} args
 */
export function resolveStoreContact({ business, settings }) {
  const contactSettings =
    settings?.contact && typeof settings.contact === 'object' && !Array.isArray(settings.contact)
      ? settings.contact
      : {};

  const isDemo = isDemoStoreDomain(business?.domain);
  const hasContactBlock = Object.keys(contactSettings).length > 0;
  const published = Boolean(contactSettings.published);

  // Never expose owner login email on the public store, only explicit public support email.
  const rawEmail = pickString(contactSettings.email, contactSettings.supportEmail);
  const rawPhone = pickString(
    contactSettings.phone,
    !hasContactBlock || !published ? business?.phone : null
  );
  const email = sanitizePublicEmail(rawEmail, { isDemo, domain: business?.domain });
  const phone = sanitizePublicPhone(rawPhone, { isDemo });
  const rawWhatsapp = pickString(contactSettings.whatsapp, contactSettings.whatsApp);
  const dedicatedWhatsapp = sanitizePublicPhone(rawWhatsapp, { isDemo });
  const whatsapp = dedicatedWhatsapp || phone;
  const country = pickString(contactSettings.country, business?.country);
  const address = pickString(contactSettings.address, business?.address);
  const city = pickString(contactSettings.city, business?.city);
  const postalCode = pickString(
    contactSettings.postalCode,
    contactSettings.postal_code,
    business?.postal_code
  );
  const website = pickString(business?.website, contactSettings.website);
  const businessHours = pickString(
    settings?.businessHours,
    contactSettings.businessHours,
    contactSettings.hours
  );

  const social =
    settings?.socialLinks && typeof settings.socialLinks === 'object'
      ? settings.socialLinks
      : settings?.social && typeof settings.social === 'object'
        ? settings.social
        : {};

  const fullAddress = formatStoreAddress(address, city, country, postalCode);
  const storeName = business?.business_name || 'Store';
  const whatsappUrl = formatWhatsAppUrl(whatsapp, country);

  return {
    storeName,
    email,
    phone,
    whatsapp,
    dedicatedWhatsapp: Boolean(dedicatedWhatsapp),
    whatsappUrl,
    address,
    city,
    country,
    postalCode,
    fullAddress,
    website,
    businessHours,
    description: pickString(business?.description),
    social: {
      facebook: pickString(social.facebook),
      instagram: pickString(social.instagram),
      twitter: pickString(social.twitter),
      youtube: pickString(social.youtube),
    },
    hasAnyContact: Boolean(
      email || phone || fullAddress || website || businessHours || whatsappUrl
    ),
    isDemo,
    showContactPageCta: !email && !phone && !whatsappUrl,
  };
}

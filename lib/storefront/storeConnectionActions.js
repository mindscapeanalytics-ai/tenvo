/**
 * B2B parts connection CTAs (quote / call / mail / WhatsApp) from store contact settings.
 * Used by marine-parts, industrial-parts, and related hardware verticals.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { resolveStoreContact } from '@/lib/storefront/businessContact';

/** Domains that show industrial-style connection buttons by default. */
export const STORE_CONNECTION_CANONICALS = new Set([
  'marine-parts',
  'industrial-parts',
  'hardware-sanitary',
  'hardware-store',
  'hardware',
  'construction-material',
]);

/**
 * @param {string | null | undefined} category
 */
export function supportsStoreConnectionButtons(category) {
  return STORE_CONNECTION_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {object} [settings]
 */
export function getStoreConnectionConfig(settings = {}) {
  const raw =
    settings?.storefront?.connection && typeof settings.storefront.connection === 'object'
      ? settings.storefront.connection
      : settings?.connection && typeof settings.connection === 'object'
        ? settings.connection
        : {};

  return {
    enabled: raw.enabled !== false,
    showQuote: raw.showQuote !== false,
    showCall: raw.showCall !== false,
    showMail: raw.showMail !== false,
    preferWhatsApp: raw.preferWhatsApp === true,
    quoteLabel: String(raw.quoteLabel || '').trim() || 'Receive Quotation',
    callLabel: String(raw.callLabel || '').trim() || 'Call us',
    mailLabel: String(raw.mailLabel || '').trim() || 'Mail us',
    whatsappLabel: String(raw.whatsappLabel || '').trim() || 'WhatsApp',
  };
}

/**
 * Normalize a phone for tel: links (keep + and digits).
 * @param {string} phone
 */
export function formatTelHref(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned || cleaned === '+') return null;
  return `tel:${cleaned}`;
}

/**
 * @param {{
 *   business?: object | null,
 *   settings?: object | null,
 *   businessDomain?: string,
 *   storeBase?: string,
 *   force?: boolean,
 * }} opts
 * @returns {Array<{
 *   id: 'quote' | 'call' | 'mail' | 'whatsapp',
 *   label: string,
 *   href: string,
 *   external?: boolean,
 *   variant: 'primary' | 'secondary',
 *   icon: 'arrow' | 'phone' | 'mail' | 'whatsapp',
 * }>}
 */
export function resolveStoreConnectionActions({
  business,
  settings,
  businessDomain,
  storeBase,
  force = false,
} = {}) {
  const category = business?.category;
  if (!force && !supportsStoreConnectionButtons(category)) return [];

  const cfg = getStoreConnectionConfig(settings);
  if (!cfg.enabled) return [];

  const contact = resolveStoreContact({ business, settings });
  const base =
    storeBase ||
    (businessDomain ? `/store/${businessDomain}` : '') ||
    '';

  /** @type {ReturnType<typeof resolveStoreConnectionActions>} */
  const actions = [];

  if (cfg.showQuote && base) {
    actions.push({
      id: 'quote',
      label: cfg.quoteLabel,
      href: `${base}/contact?subject=${encodeURIComponent('quotation')}`,
      variant: 'primary',
      icon: 'arrow',
    });
  }

  if (cfg.showCall) {
    const preferWa = cfg.preferWhatsApp && contact.whatsappUrl;
    if (preferWa) {
      actions.push({
        id: 'whatsapp',
        label: cfg.preferWhatsApp ? cfg.callLabel : cfg.whatsappLabel,
        href: contact.whatsappUrl,
        external: true,
        variant: 'secondary',
        icon: 'whatsapp',
      });
    } else if (contact.phone) {
      const tel = formatTelHref(contact.phone);
      if (tel) {
        actions.push({
          id: 'call',
          label: cfg.callLabel,
          href: tel,
          external: true,
          variant: 'secondary',
          icon: 'phone',
        });
      }
    } else if (contact.whatsappUrl) {
      actions.push({
        id: 'whatsapp',
        label: cfg.whatsappLabel,
        href: contact.whatsappUrl,
        external: true,
        variant: 'secondary',
        icon: 'whatsapp',
      });
    }
  }

  if (cfg.showMail && contact.email) {
    actions.push({
      id: 'mail',
      label: cfg.mailLabel,
      href: `mailto:${contact.email}`,
      external: true,
      variant: 'secondary',
      icon: 'mail',
    });
  }

  // When preferWhatsApp is off but a dedicated WhatsApp exists and call used tel,
  // do not auto-add a fourth button unless nothing else for voice/chat was added.
  // Owners can still use contact page for WhatsApp.

  return actions;
}

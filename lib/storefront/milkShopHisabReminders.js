/**
 * Milk Route Hisab collection reminders — copy + channel helpers.
 * WhatsApp Business API automation is roadmap; wa.me click-to-chat is available.
 */
import { formatWhatsAppUrl } from '@/lib/storefront/businessContact';
import { formatCurrency } from '@/lib/currency';
import {
  getCampaignIntegrationsFromSettings,
  resolveCampaignEmailConfig,
} from '@/lib/marketing/campaignIntegrations';

/**
 * @param {{
 *   businessName?: string,
 *   customerName?: string,
 *   houseNo?: string,
 *   amount?: number,
 *   periodLabel?: string,
 *   invoiceNumber?: string | null,
 *   currency?: string,
 * }} args
 */
export function buildMilkHisabReminderMessage(args = {}) {
  const businessName = String(args.businessName || 'your milk shop').trim();
  const customerName = String(args.customerName || 'Customer').trim();
  const houseNo = String(args.houseNo || '').trim();
  const periodLabel = String(args.periodLabel || 'this period').trim();
  const invoiceNumber = args.invoiceNumber ? String(args.invoiceNumber).trim() : '';
  const currency = args.currency || 'PKR';
  const amount = Number(args.amount) || 0;
  const amountText = formatCurrency(amount, currency);

  const housePart = houseNo ? ` (House ${houseNo})` : '';
  const invoicePart = invoiceNumber ? ` Invoice ${invoiceNumber}.` : '';

  return (
    `Assalamualaikum ${customerName}${housePart}. ` +
    `Your milk delivery bill for ${periodLabel} is ${amountText}.${invoicePart} ` +
    `Please arrange payment with ${businessName}. Thank you.`
  );
}

/**
 * @param {string | null | undefined} phone
 * @param {string | null | undefined} country
 * @param {string} message
 */
export function buildMilkHisabWhatsAppUrl(phone, country, message) {
  const base = formatWhatsAppUrl(phone, country);
  if (!base) return null;
  const text = String(message || '').trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Resolve which reminder channels are available for this tenant + customer.
 * @param {{
 *   settings?: object,
 *   customer?: { email?: string | null, phone?: string | null },
 *   country?: string | null,
 *   hasInvoice?: boolean,
 * }} args
 */
export function resolveMilkHisabReminderChannels(args = {}) {
  const settings = args.settings || {};
  const customer = args.customer || {};
  const email = String(customer.email || '').trim();
  const phone = String(customer.phone || '').trim();
  const emailConfig = resolveCampaignEmailConfig(settings);
  const integrations = getCampaignIntegrationsFromSettings(settings);
  const wa = integrations.whatsapp && typeof integrations.whatsapp === 'object'
    ? integrations.whatsapp
    : {};
  const webhookUrl = String(wa.webhook_url || '').trim();
  const webhookMode = wa.mode === 'webhook' && Boolean(webhookUrl);

  return {
    hub: { available: true, label: 'Hub alert' },
    email: {
      available: Boolean(email) && emailConfig.configured,
      configured: emailConfig.configured,
      hasAddress: Boolean(email),
      label: 'Email',
      hint: !email
        ? 'Customer has no email'
        : !emailConfig.configured
          ? 'Configure Resend under Campaigns → Integrations'
          : null,
    },
    whatsapp: {
      available: Boolean(phone),
      hasPhone: Boolean(phone),
      webhookReady: webhookMode,
      label: 'WhatsApp',
      hint: !phone
        ? 'Customer has no phone'
        : webhookMode
          ? 'Opens wa.me; optional webhook also configured'
          : 'Opens WhatsApp chat (wa.me)',
    },
  };
}

/**
 * Post to owner-configured WhatsApp webhook (Zapier / Make / custom bridge).
 * @param {{ webhookUrl: string, apiToken?: string, payload: object }} args
 */
export async function postMilkHisabWhatsAppWebhook({ webhookUrl, apiToken, payload }) {
  const url = String(webhookUrl || '').trim();
  if (!url) return { ok: false, skipped: true, reason: 'no_webhook' };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, status: res.status, error: text.slice(0, 200) || res.statusText };
  }
  return { ok: true, status: res.status };
}

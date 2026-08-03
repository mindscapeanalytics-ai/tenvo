/**
 * Milk Route Hisab collection reminders — copy + channel helpers.
 * Smart open prefers WhatsApp app deep link (skips wa.me landing when installed);
 * Business API auto-send remains roadmap. Optional owner webhook supported.
 *
 * PDF attach: wa.me cannot attach files. When reminding we download the 58mm bill
 * PDF and, on supporting mobile browsers, use Web Share Level 2 so WhatsApp can
 * receive the file. Otherwise the customer still gets full bill text in the message.
 */
import { formatWhatsAppUrl } from '@/lib/storefront/businessContact';
import { formatCurrency } from '@/lib/currency';
import {
  getCampaignIntegrationsFromSettings,
  resolveCampaignEmailConfig,
} from '@/lib/marketing/campaignIntegrations';
import { openWhatsAppSmart } from '@/lib/utils/whatsappOpen';

export { openWhatsAppSmart };
/**
 * @param {{
 *   businessName?: string,
 *   customerName?: string,
 *   houseNo?: string,
 *   amount?: number,
 *   periodLabel?: string,
 *   invoiceNumber?: string | null,
 *   currency?: string,
 *   billLines?: Array<{ name?: string, qty?: number, unit?: string }>,
 *   activeDays?: number,
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
  const activeDays = Number(args.activeDays) || 0;

  const housePart = houseNo ? ` (House ${houseNo})` : '';
  const invoicePart = invoiceNumber ? ` Invoice ${invoiceNumber}.` : '';
  const daysPart = activeDays > 0 ? ` Delivery days: ${activeDays}.` : '';

  const billLines = Array.isArray(args.billLines) ? args.billLines : [];
  const details =
    billLines.length > 0
      ? `\nBill:\n${billLines
          .map((l) => {
            const qty = Number(l.qty) || 0;
            const unit = l.unit ? String(l.unit) : '';
            const name = String(l.name || 'Item').trim();
            return `• ${qty}${unit ? ` ${unit}` : ''} ${name}`.trim();
          })
          .join('\n')}`
      : '';

  return (
    `Assalamualaikum ${customerName}${housePart}.\n` +
    `Your milk delivery bill for ${periodLabel} is ${amountText}.${invoicePart}${daysPart}` +
    `${details}\n` +
    `Please arrange payment with ${businessName}. Thank you.`
  );
}

/**
 * Try to share a bill PDF into WhatsApp (or any share target) via Web Share API.
 * Falls back to downloading the PDF so the user can attach it manually.
 * @param {{ blob: Blob, filename: string, text?: string, title?: string }} args
 * @returns {Promise<{ shared: boolean, downloaded: boolean }>}
 */
export async function shareOrDownloadMilkHisabBillPdf(args = {}) {
  const blob = args.blob;
  const filename = String(args.filename || 'hisab-bill.pdf').replace(/[^\w.-]+/g, '-');
  const text = String(args.text || '').trim();
  const title = String(args.title || 'Milk bill').trim();

  if (!blob) return { shared: false, downloaded: false };

  const file =
    typeof File !== 'undefined'
      ? new File([blob], filename, { type: 'application/pdf' })
      : null;

  if (
    file &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const payload = { files: [file], title, text: text || undefined };
      if (navigator.canShare(payload)) {
        await navigator.share(payload);
        return { shared: true, downloaded: false };
      }
    } catch (err) {
      // User cancel should not force a download.
      if (err?.name === 'AbortError') {
        return { shared: false, downloaded: false };
      }
    }
  }

  // Desktop / unsupported: save PDF for manual WhatsApp attach.
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return { shared: false, downloaded: true };
  } catch {
    return { shared: false, downloaded: false };
  }
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
          ? 'Opens WhatsApp app (wa.me fallback); optional webhook also configured'
          : 'Opens WhatsApp app when installed (wa.me fallback)',
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

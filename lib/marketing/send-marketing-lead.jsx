import { sendTransactionalEmail } from '@/lib/email/resend';
import MarketingLeadEmail from '@/lib/email/templates/MarketingLead';

/** Default TENVO marketing inbox (Mindscape); typically received by Zeeshan via mailbox / forwarding rules. */
export const DEFAULT_MARKETING_INBOUND_EMAIL = 'tenvo@mindscapeanalytics.com';

/** Inbound address for marketing leads (contact, demo, newsletter). */
export function getMarketingInboundEmail() {
  const a = process.env.MARKETING_INBOUND_EMAIL?.trim();
  const b = process.env.CONTACT_INBOUND_EMAIL?.trim();
  return a || b || DEFAULT_MARKETING_INBOUND_EMAIL;
}

function clip(s, max) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

/**
 * Notify team of a marketing lead.
 * To: MARKETING_INBOUND_EMAIL → CONTACT_INBOUND_EMAIL → tenvo@mindscapeanalytics.com (delivered to Zeeshan per Mindscape mailbox / forwarding).
 * Delivery requires RESEND_API_KEY; without it, returns resend_skipped and logs.
 */
export async function sendMarketingLeadNotification({ type, subject, rows, replyTo }) {
  const to = getMarketingInboundEmail();
  const safeRows = Object.fromEntries(
    Object.entries(rows).map(([k, v]) => [k, clip(String(v ?? ''), 4000)])
  );

  const result = await sendTransactionalEmail({
    to,
    subject: clip(subject, 200),
    react: <MarketingLeadEmail title={`TENVO: ${type}`} rows={safeRows} />,
    replyTo: replyTo && replyTo.includes('@') ? clip(replyTo, 320) : undefined,
  });

  if (result.skipped) {
    console.info(`[marketing/${type}] Resend skipped; lead logged`, safeRows);
    return { ok: true, delivered: false, mode: 'resend_skipped' };
  }

  if (!result.success) {
    console.error(`[marketing/${type}] email failed`, result.error);
    return { ok: false, error: result.error || 'Email delivery failed' };
  }

  return { ok: true, delivered: true, id: result.id };
}

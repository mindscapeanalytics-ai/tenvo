/**
 * Monochrome integration / channel marks for homepage trust strip.
 * Honest subset aligned with INTEGRATIONS_CATALOG + HOME_INTEGRATION_PARTNERS.
 */

/** @typedef {{ id: string; label: string; wordmark: string; className?: string }} MarketingBrandMark */

/** @type {MarketingBrandMark[]} */
export const MARKETING_TRUST_BRAND_MARKS = [
  { id: 'stripe', label: 'Stripe', wordmark: 'stripe', className: 'text-[1.2rem] font-semibold lowercase tracking-tight' },
  { id: 'shopify', label: 'Shopify', wordmark: 'shopify', className: 'text-[1.05rem] font-semibold lowercase tracking-tight' },
  { id: 'woocommerce', label: 'WooCommerce', wordmark: 'WooCommerce', className: 'text-[0.85rem] font-semibold tracking-tight' },
  { id: 'whatsapp', label: 'WhatsApp', wordmark: 'WhatsApp', className: 'text-[0.95rem] font-semibold tracking-tight' },
  { id: 'daraz', label: 'Daraz', wordmark: 'Daraz', className: 'text-[1.05rem] font-semibold tracking-tight' },
  { id: 'jazzcash', label: 'JazzCash', wordmark: 'JazzCash', className: 'text-[0.9rem] font-semibold tracking-tight' },
  { id: 'easypaisa', label: 'EasyPaisa', wordmark: 'EasyPaisa', className: 'text-[0.9rem] font-semibold tracking-tight' },
  { id: 'resend', label: 'Resend', wordmark: 'Resend', className: 'text-[1rem] font-semibold tracking-tight' },
  { id: 'nowpayments', label: 'NOWPayments', wordmark: 'NOWPayments', className: 'text-[0.8rem] font-semibold tracking-tight' },
];

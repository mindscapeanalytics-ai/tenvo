/** Canonical values stored in `payments.payment_type`. */
export const PAYMENT_TYPES = {
  RECEIPT: 'receipt',
  PAYMENT: 'payment',
};

const TYPE_ALIASES = {
  received: PAYMENT_TYPES.RECEIPT,
  paid: PAYMENT_TYPES.PAYMENT,
  /** Legacy storefront/restaurant writers used cashbook 'in'/'out' vocabulary. */
  in: PAYMENT_TYPES.RECEIPT,
  out: PAYMENT_TYPES.PAYMENT,
};

/**
 * Normalize legacy payment type strings to canonical receipt/payment.
 * @param {unknown} type
 * @returns {'receipt'|'payment'|undefined}
 */
export function normalizePaymentType(type) {
  if (!type || typeof type !== 'string') return undefined;
  const value = type.toLowerCase().trim();
  if (value === PAYMENT_TYPES.RECEIPT || value === PAYMENT_TYPES.PAYMENT) return value;
  return TYPE_ALIASES[value];
}

/** @param {unknown} type */
export function isReceiptType(type) {
  return normalizePaymentType(type) === PAYMENT_TYPES.RECEIPT;
}

/** @param {unknown} type */
export function getPaymentTypeLabel(type) {
  return isReceiptType(type) ? 'Receipt' : 'Payment';
}

/** Prisma/db filter values including legacy aliases. */
export function paymentTypeFilterValues(type) {
  const normalized = normalizePaymentType(type);
  if (normalized === PAYMENT_TYPES.RECEIPT) return ['receipt', 'received', 'in'];
  if (normalized === PAYMENT_TYPES.PAYMENT) return ['payment', 'paid', 'out'];
  return type ? [String(type)] : [];
}

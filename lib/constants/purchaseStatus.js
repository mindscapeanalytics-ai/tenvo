/** Canonical purchase order statuses (stored in `purchases.status`). */
export const PURCHASE_STATUSES = {
  DRAFT: 'draft',
  ORDERED: 'ordered',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
};

export const PURCHASE_STATUS_VALUES = ['draft', 'ordered', 'received', 'cancelled'];

const STATUS_ALIASES = {
  sent: PURCHASE_STATUSES.ORDERED,
  pending: PURCHASE_STATUSES.ORDERED,
};

/**
 * Normalize legacy/alias status strings to canonical values.
 * @param {unknown} status
 * @returns {string|undefined}
 */
export function normalizePurchaseStatus(status) {
  if (!status || typeof status !== 'string') return undefined;
  const value = status.toLowerCase().trim();
  if (PURCHASE_STATUS_VALUES.includes(value)) return value;
  return STATUS_ALIASES[value];
}

/** @param {unknown} status */
export function getPurchaseStatusLabel(status) {
  const normalized = normalizePurchaseStatus(status);
  switch (normalized) {
    case PURCHASE_STATUSES.DRAFT:
      return 'Draft';
    case PURCHASE_STATUSES.ORDERED:
      return 'Sent';
    case PURCHASE_STATUSES.RECEIVED:
      return 'Received';
    case PURCHASE_STATUSES.CANCELLED:
      return 'Cancelled';
    default:
      return typeof status === 'string' && status ? status : 'Unknown';
  }
}

/** @param {unknown} status */
export function isOpenPurchaseStatus(status) {
  const normalized = normalizePurchaseStatus(status);
  return normalized === PURCHASE_STATUSES.DRAFT || normalized === PURCHASE_STATUSES.ORDERED;
}

/** @param {unknown} status */
export function isReceivablePurchaseStatus(status) {
  const normalized = normalizePurchaseStatus(status);
  return normalized === PURCHASE_STATUSES.DRAFT || normalized === PURCHASE_STATUSES.ORDERED;
}

/**
 * @param {unknown} from
 * @param {unknown} to
 */
export function canTransitionPurchaseStatus(from, to) {
  const fromStatus = normalizePurchaseStatus(from);
  const toStatus = normalizePurchaseStatus(to);
  if (!fromStatus || !toStatus || fromStatus === toStatus) return false;
  if (fromStatus === PURCHASE_STATUSES.CANCELLED || fromStatus === PURCHASE_STATUSES.RECEIVED) {
    return false;
  }
  if (fromStatus === PURCHASE_STATUSES.DRAFT) {
    return (
      toStatus === PURCHASE_STATUSES.ORDERED
      || toStatus === PURCHASE_STATUSES.RECEIVED
      || toStatus === PURCHASE_STATUSES.CANCELLED
    );
  }
  if (fromStatus === PURCHASE_STATUSES.ORDERED) {
    return toStatus === PURCHASE_STATUSES.RECEIVED || toStatus === PURCHASE_STATUSES.CANCELLED;
  }
  return false;
}

/** Tailwind badge classes keyed by canonical status. */
export function getPurchaseStatusBadgeClass(status) {
  const normalized = normalizePurchaseStatus(status) || PURCHASE_STATUSES.DRAFT;
  const styles = {
    [PURCHASE_STATUSES.DRAFT]: 'bg-gray-100 text-gray-700 border-gray-200',
    [PURCHASE_STATUSES.ORDERED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [PURCHASE_STATUSES.RECEIVED]: 'bg-green-100 text-green-700 border-green-200',
    [PURCHASE_STATUSES.CANCELLED]: 'bg-red-100 text-red-700 border-red-200',
  };
  return styles[normalized] || styles[PURCHASE_STATUSES.DRAFT];
}

/**
 * Stable client ref for offline POS sale idempotency.
 */

export function newPosClientRef() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 64);
}

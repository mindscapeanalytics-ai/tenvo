/**
 * Dashboard / analytics date bounds (pure helpers).
 * Lives outside `'use server'` modules so Next.js does not treat exports as Server Actions.
 */

/**
 * Local-calendar YYYY-MM-DD (matches date-fns startOfDay presets / Zoho-style filters).
 * Do not use UTC toISOString().slice — that skews dates for UTC+ tenants (e.g. PK).
 * @param {unknown} v
 * @returns {string|null}
 */
export function toAnalyticsIsoDate(v) {
    if (v == null || v === '') return null;
    try {
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    } catch {
        return null;
    }
}

/**
 * Dashboard filter → inclusive SQL date bounds. Default: last 30 days ending today.
 * @param {{ from?: unknown; to?: unknown }} [filter]
 */
export function resolveAnalyticsRange(filter = {}) {
    const to = toAnalyticsIsoDate(filter.to) ?? toAnalyticsIsoDate(new Date());
    let from = toAnalyticsIsoDate(filter.from);
    if (!from) {
        // Anchor default window on local calendar days, not UTC midnight.
        const anchor = new Date();
        const [yy, mm, dd] = String(to).split('-').map(Number);
        if (Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)) {
            anchor.setFullYear(yy, mm - 1, dd);
        }
        anchor.setHours(12, 0, 0, 0);
        anchor.setDate(anchor.getDate() - 29);
        from = toAnalyticsIsoDate(anchor);
    }
    if (from > to) return { from: to, to: from, trendAnchor: to };
    return { from, to, trendAnchor: to };
}

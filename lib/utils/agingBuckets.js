/**
 * Shared A/R & A/P aging bucket helpers.
 * Buckets are mutually exclusive and always use outstanding balance (not document total).
 */

/**
 * @param {Array<object>} rows
 * @param {{ balanceKey?: string, daysKey?: string }} [options]
 * @returns {{ items: object[], summary: object, count: number }}
 */
export function bucketAgingRows(rows, { balanceKey = 'balance', daysKey = 'days_overdue' } = {}) {
    const summary = {
        total_balance: 0,
        total_current: 0,
        total_1_30: 0,
        total_31_60: 0,
        total_61_90: 0,
        total_over_90: 0,
    };

    const items = (rows || []).map((row) => {
        const balance = Math.max(0, Number(row[balanceKey] || 0));
        const days = Math.max(0, Number(row[daysKey] || 0));
        let current_amount = 0;
        let days_1_30 = 0;
        let days_31_60 = 0;
        let days_61_90 = 0;
        let days_over_90 = 0;

        if (days === 0) current_amount = balance;
        else if (days <= 30) days_1_30 = balance;
        else if (days <= 60) days_31_60 = balance;
        else if (days <= 90) days_61_90 = balance;
        else days_over_90 = balance;

        summary.total_balance += balance;
        summary.total_current += current_amount;
        summary.total_1_30 += days_1_30;
        summary.total_31_60 += days_31_60;
        summary.total_61_90 += days_61_90;
        summary.total_over_90 += days_over_90;

        return {
            ...row,
            balance,
            days_overdue: days,
            current_amount,
            days_1_30,
            days_31_60,
            days_61_90,
            days_over_90,
        };
    });

    return { items, summary, count: items.length };
}

/**
 * Normalize an as-of date to YYYY-MM-DD for SQL.
 * @param {Date|string|null|undefined} value
 * @returns {string}
 */
export function toAgingAsOfDate(value = new Date()) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    const raw = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
}

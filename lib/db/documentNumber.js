/**
 * Concurrency-safe document number generation.
 *
 * Uses pg_advisory_xact_lock scoped by business + table + column + prefix,
 * then computes MAX(numeric_part)+1 inside the same transaction.
 *
 * Numeric part is cast to BIGINT (not INTEGER) so long digit strings
 * (date-stamped or legacy numbers) do not throw "out of range for type integer".
 */

/**
 * @param {string} identifier
 */
function assertSafeIdentifier(identifier) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
        throw new Error(`Unsafe SQL identifier: ${identifier}`);
    }
}

/**
 * @param {import('pg').PoolClient} client
 * @param {{
 *   businessId: string,
 *   table: string,
 *   column: string,
 *   prefix: string,
 *   padLength?: number
 * }} options
 * @returns {Promise<string>}
 */
export async function generateScopedDocumentNumber(client, options) {
    const { businessId, table, column, prefix, padLength = 6 } = options;

    if (!client) throw new Error('Database client is required');
    if (!businessId) throw new Error('businessId is required');
    if (!prefix) throw new Error('prefix is required');

    assertSafeIdentifier(table);
    assertSafeIdentifier(column);

    const lockKey = `${businessId}:${table}:${column}:${prefix}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);

    // Prefer normal short sequences (pad-length style) so a single long
    // digit-stamped invoice number does not jump the series into the billions.
    // Always use BIGINT — INTEGER overflows on values like 75620260200.
    const query = `
        SELECT COALESCE(
            MAX(CASE WHEN length(digits) <= 9 AND digits ~ '^[0-9]+$' THEN digits::bigint END),
            MAX(CASE WHEN digits ~ '^[0-9]{1,18}$' THEN digits::bigint END),
            0
        ) + 1 AS next_num
        FROM (
            SELECT NULLIF(REGEXP_REPLACE(${column}, '[^0-9]', '', 'g'), '') AS digits
            FROM ${table}
            WHERE business_id = $1
              AND ${column} LIKE $2
        ) extracted
    `;

    const result = await client.query(query, [businessId, `${prefix}%`]);
    const nextNum = Number(result.rows[0]?.next_num || 1);
    if (!Number.isFinite(nextNum) || nextNum < 1) {
        throw new Error('Failed to allocate next document number');
    }

    const width = Math.max(padLength, String(Math.trunc(nextNum)).length);
    return `${prefix}${String(Math.trunc(nextNum)).padStart(width, '0')}`;
}

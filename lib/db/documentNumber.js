/**
 * Concurrency-safe document number generation.
 *
 * Uses pg_advisory_xact_lock scoped by business + table + column + prefix,
 * then computes MAX(numeric_part)+1 inside the same transaction.
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

    const query = `
        SELECT COALESCE(
            MAX(CAST(NULLIF(REGEXP_REPLACE(${column}, '[^0-9]', '', 'g'), '') AS INTEGER)),
            0
        ) + 1 AS next_num
        FROM ${table}
        WHERE business_id = $1
    `;

    const result = await client.query(query, [businessId]);
    const nextNum = Number(result.rows[0]?.next_num || 1);

    return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
}

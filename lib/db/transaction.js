import { pool } from '@/lib/db';

/**
 * Transaction Helper
 * Provides atomic database operations with automatic rollback on errors
 * 
 * @example
 * const result = await withTransaction(async (client) => {
 *   const product = await client.query('INSERT INTO products ...');
 *   const batch = await client.query('INSERT INTO batches ...');
 *   return { product, batch };
 * });
 */
export async function withTransaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return { success: true, data: result };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error);
        return {
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    } finally {
        client.release();
    }
}

/**
 * Execute multiple queries in a transaction
 * Useful for batch operations
 * 
 * @param {Array<{query: string, params: any[]}>} queries
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function executeInTransaction(queries) {
    return withTransaction(async (client) => {
        const results = [];
        for (const { query, params } of queries) {
            const result = await client.query(query, params);
            results.push(result.rows);
        }
        return results;
    });
}

/**
 * Safe query execution with error handling
 * Automatically releases connection on error
 */
export async function safeQuery(query, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        return { success: true, data: result.rows };
    } catch (error) {
        console.error('Query error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

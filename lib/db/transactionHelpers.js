/**
 * PostgreSQL Transaction Safety Helpers
 * 
 * Prevents "current transaction is aborted" errors when using try-catch
 * with SQL queries by properly managing SAVEPOINTs.
 */

/**
 * Execute an operation within a savepoint that can be rolled back without aborting the transaction.
 * 
 * @param {import('pg').PoolClient} client - PostgreSQL client with active transaction
 * @param {string} savepointName - Name for the savepoint (must be valid SQL identifier)
 * @param {() => Promise<T>} operation - Async operation to execute within savepoint
 * @returns {Promise<T>} Result from the operation
 * 
 * @example
 * await client.query('BEGIN');
 * try {
 *   const result = await withSavepoint(client, 'before_insert', async () => {
 *     return await client.query('INSERT INTO table ...');
 *   });
 *   await client.query('COMMIT');
 *   return result;
 * } catch (error) {
 *   await client.query('ROLLBACK');
 *   throw error;
 * }
 */
export async function withSavepoint(client, savepointName, operation) {
  await client.query(`SAVEPOINT ${savepointName}`);
  try {
    const result = await operation();
    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    throw error;
  }
}

/**
 * Execute an operation that may fail with specific error codes, with fallback handler.
 * Automatically manages savepoint creation, rollback, and release.
 * 
 * @param {import('pg').PoolClient} client - PostgreSQL client with active transaction
 * @param {string} savepointName - Name for the savepoint
 * @param {() => Promise<T>} primaryOperation - Primary operation to attempt
 * @param {Object} options - Fallback configuration
 * @param {string[]} options.fallbackOn - Array of PostgreSQL error codes to trigger fallback
 * @param {(error: Error) => Promise<T>} options.fallback - Fallback operation to execute on specific errors
 * @returns {Promise<T>} Result from primary or fallback operation
 * 
 * @example
 * await withSavepointFallback(
 *   client,
 *   'insert_attempt',
 *   async () => client.query('INSERT INTO table (col1, col2) VALUES ($1, $2)', [a, b]),
 *   {
 *     fallbackOn: ['42703'], // undefined_column
 *     fallback: async () => client.query('INSERT INTO table (col1) VALUES ($1)', [a])
 *   }
 * );
 */
export async function withSavepointFallback(client, savepointName, primaryOperation, options) {
  const { fallbackOn = [], fallback } = options;
  
  await client.query(`SAVEPOINT ${savepointName}`);
  
  try {
    const result = await primaryOperation();
    await client.query(`RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (error) {
    // Check if this error code should trigger fallback
    if (fallbackOn.includes(error.code)) {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      
      try {
        const fallbackResult = await fallback(error);
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        return fallbackResult;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    
    // For other errors, just rollback to savepoint and rethrow
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    throw error;
  }
}

/**
 * Common PostgreSQL error codes for reference.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODES = {
  // Class 23 — Integrity Constraint Violation
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  
  // Class 42 — Syntax Error or Access Rule Violation
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',
  UNDEFINED_FUNCTION: '42883',
  DUPLICATE_TABLE: '42P07',
  DUPLICATE_COLUMN: '42701',
  
  // Class 40 — Transaction Rollback
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',
};

/**
 * Retry a transaction operation with exponential backoff on specific errors.
 * Useful for handling deadlocks and serialization failures.
 * 
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {(client: import('pg').PoolClient) => Promise<T>} operation - Transaction operation
 * @param {Object} options - Retry configuration
 * @param {number} options.maxAttempts - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Base delay in milliseconds (default: 100)
 * @param {number} options.jitterPercent - Random jitter percentage (default: 30)
 * @param {string[]} options.retryOn - Error codes to retry on (default: serialization, deadlock)
 * @returns {Promise<T>} Result from successful operation
 * 
 * @example
 * const result = await retryTransaction(pool, async (client) => {
 *   await client.query('BEGIN');
 *   try {
 *     const result = await client.query('UPDATE ... WHERE id = $1 FOR UPDATE', [id]);
 *     await client.query('COMMIT');
 *     return result;
 *   } catch (error) {
 *     await client.query('ROLLBACK');
 *     throw error;
 *   }
 * });
 */
export async function retryTransaction(pool, operation, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    jitterPercent = 30,
    retryOn = [PG_ERROR_CODES.SERIALIZATION_FAILURE, PG_ERROR_CODES.DEADLOCK_DETECTED]
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = await pool.connect();
    
    try {
      return await operation(client);
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (retryOn.includes(error.code) && attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * (jitterPercent / 100) * delayMs;
        await new Promise(resolve => setTimeout(resolve, delayMs + jitter));
        continue;
      }
      
      throw error;
    } finally {
      client.release();
    }
  }
  
  throw lastError;
}

/**
 * Safely handle table/column creation with retry.
 * Creates savepoint, attempts operation, and if table/column doesn't exist,
 * creates it and retries the operation.
 * 
 * @param {import('pg').PoolClient} client - PostgreSQL client
 * @param {string} savepointName - Savepoint name
 * @param {() => Promise<T>} operation - Operation that may fail due to missing table/column
 * @param {string} createDDL - DDL statement to create missing schema (CREATE TABLE IF NOT EXISTS ...)
 * @returns {Promise<T>} Result from operation
 * 
 * @example
 * await ensureSchemaAndRun(
 *   client,
 *   'before_insert',
 *   () => client.query('INSERT INTO my_table ...'),
 *   'CREATE TABLE IF NOT EXISTS my_table (id SERIAL PRIMARY KEY, ...)'
 * );
 */
export async function ensureSchemaAndRun(client, savepointName, operation, createDDL) {
  return await withSavepointFallback(
    client,
    savepointName,
    operation,
    {
      fallbackOn: [PG_ERROR_CODES.UNDEFINED_TABLE, PG_ERROR_CODES.UNDEFINED_COLUMN],
      fallback: async () => {
        await client.query(createDDL);
        return await operation();
      }
    }
  );
}

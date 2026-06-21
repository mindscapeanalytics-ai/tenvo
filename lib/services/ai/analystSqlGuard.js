const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FORBIDDEN_KEYWORDS = [
  'insert',
  'update',
  'delete',
  'drop',
  'truncate',
  'alter',
  'grant',
  'revoke',
  'exec',
  'copy',
  'create',
  'merge',
  'call',
  'into',
];

/**
 * @param {string} businessId
 */
export function assertValidBusinessUuid(businessId) {
  if (!businessId || typeof businessId !== 'string' || !UUID_RE.test(businessId.trim())) {
    throw new Error('Invalid business scope.');
  }
}

/**
 * Strip SQL comments before safety checks.
 * @param {string} sql
 */
export function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

/**
 * Validate generated analyst SQL is read-only and scoped to one tenant.
 * @param {string} sql
 * @param {string} businessId
 */
export function assertAnalystSqlSafe(sql, businessId) {
  assertValidBusinessUuid(businessId);

  const cleaned = stripSqlComments(String(sql || '').trim());
  if (!cleaned) {
    throw new Error('Empty query blocked.');
  }

  if (cleaned.includes(';')) {
    const parts = cleaned.split(';').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      throw new Error('Multiple SQL statements blocked.');
    }
  }

  const lower = cleaned.toLowerCase();
  if (!lower.startsWith('select') && !lower.startsWith('with')) {
    throw new Error('Only SELECT queries are allowed.');
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lower)) {
      throw new Error('Unsafe SQL keyword blocked.');
    }
  }

  const tenantId = businessId.toLowerCase();
  if (!lower.includes(tenantId)) {
    throw new Error('Query must filter by the active business_id.');
  }

  const foreignTenant = /business_id\s*=\s*'([0-9a-f-]{36})'/gi;
  let match;
  while ((match = foreignTenant.exec(cleaned)) !== null) {
    if (match[1].toLowerCase() !== tenantId) {
      throw new Error('Query references a different tenant.');
    }
  }
}

/**
 * Append a row cap when the model omitted LIMIT.
 * @param {string} sql
 * @param {number} maxRows
 */
export function capAnalystSqlRows(sql, maxRows = 500) {
  const cleaned = String(sql || '').trim().replace(/;\s*$/, '');
  if (/\blimit\s+\d+/i.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned} LIMIT ${maxRows}`;
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} sql
 */
export async function executeAnalystReadQuery(client, sql) {
  await client.query('BEGIN TRANSACTION READ ONLY');
  try {
    await client.query('SET LOCAL statement_timeout = 5000');
    const res = await client.query(sql);
    await client.query('COMMIT');
    return res.rows;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

/**
 * Load registered business metadata for analyst prompts (server-side only).
 * @param {import('pg').Pool} pool
 * @param {string} businessId
 */
export async function loadAnalystBusinessContext(pool, businessId) {
  assertValidBusinessUuid(businessId);
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT business_name, category, city, country
       FROM businesses
       WHERE id = $1::uuid AND COALESCE(is_active, true) = true`,
      [businessId]
    );
    if (!res.rows.length) {
      throw new Error('Business not found.');
    }
    return res.rows[0];
  } finally {
    client.release();
  }
}

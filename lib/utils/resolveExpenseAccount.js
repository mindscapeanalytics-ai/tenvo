/**
 * Resolve GL expense account id for createExpense (Easy mode may omit accountId).
 * Prefer explicit accountId; else category account_code; else miscellaneous; else any expense row.
 */

import pool from '@/lib/db';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { findExpenseCategory, normalizeExpenseCategory } from '@/lib/utils/expenseCategories';

/**
 * @param {import('pg').PoolClient | null} client
 * @param {string} businessId
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function findAccountIdByCode(client, businessId, code) {
  if (!code) return null;
  const sql = `
    SELECT id FROM gl_accounts
    WHERE business_id = $1 AND code = $2 AND COALESCE(is_active, true) = true
    LIMIT 1
  `;
  const res = client
    ? await client.query(sql, [businessId, String(code)])
    : await pool.query(sql, [businessId, String(code)]);
  return res.rows[0]?.id ? String(res.rows[0].id) : null;
}

/**
 * @param {import('pg').PoolClient | null} client
 * @param {string} businessId
 * @returns {Promise<string | null>}
 */
async function findAnyExpenseAccountId(client, businessId) {
  const sql = `
    SELECT id FROM gl_accounts
    WHERE business_id = $1
      AND COALESCE(is_active, true) = true
      AND (LOWER(type) = 'expense' OR code LIKE '5%')
    ORDER BY code ASC
    LIMIT 1
  `;
  const res = client
    ? await client.query(sql, [businessId])
    : await pool.query(sql, [businessId]);
  return res.rows[0]?.id ? String(res.rows[0].id) : null;
}

/**
 * @param {{
 *   businessId: string,
 *   accountId?: string | null,
 *   category?: string | null,
 *   domainKey?: string | null,
 * }} input
 * @param {import('pg').PoolClient | null} [txClient]
 * @returns {Promise<string>}
 */
export async function resolveExpenseAccountId(input, txClient = null) {
  const businessId = String(input?.businessId || '').trim();
  if (!businessId) {
    throw new Error('Business is required to resolve expense account');
  }

  const explicit = String(input?.accountId || '').trim();
  if (explicit) return explicit;

  const category = normalizeExpenseCategory(input?.category);
  const cat = findExpenseCategory(category, input?.domainKey || undefined);
  const preferredCode = cat?.account_code || ACCOUNT_CODES.MISCELLANEOUS;

  const byCode = await findAccountIdByCode(txClient, businessId, preferredCode);
  if (byCode) return byCode;

  if (preferredCode !== ACCOUNT_CODES.MISCELLANEOUS) {
    const misc = await findAccountIdByCode(txClient, businessId, ACCOUNT_CODES.MISCELLANEOUS);
    if (misc) return misc;
  }

  const anyExpense = await findAnyExpenseAccountId(txClient, businessId);
  if (anyExpense) return anyExpense;

  throw new Error(
    'No expense account found in Chart of Accounts. Open Finance and seed accounts, then try again.'
  );
}

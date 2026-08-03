/**
 * Soft Delete Query Helpers
 * 
 * Provides utilities for consistent soft-delete filtering across the codebase.
 * Prevents accidentally querying deleted records.
 */

/**
 * Tables that use soft-delete pattern (is_deleted, deleted_at columns).
 * Queries on these tables should include is_deleted filter by default.
 */
export const SOFT_DELETE_TABLES = [
  'products',
  'product_variants',
  'product_serials',
  'product_batches',
  'customers',
  'vendors',
  'invoices',
  'invoice_payments',
  'purchases',
  'purchase_items',
  'quotations',
  'sales_orders',
  'delivery_challans',
  'credit_notes',
  'warehouse_locations',
  'business_users',
  'inventory_adjustments',
  'cycle_count_items',
];

/**
 * Generate SQL fragment for soft-delete filter.
 * 
 * @param {string} table - Table name to check
 * @param {string|null} alias - Optional table alias (e.g., 'p' for 'products p')
 * @param {boolean} includeAND - Whether to prefix with 'AND' (default: true)
 * @returns {string} SQL fragment like 'AND COALESCE(p.is_deleted, false) = false'
 * 
 * @example
 * const query = `
 *   SELECT * FROM products p
 *   WHERE p.business_id = $1
 *   ${addSoftDeleteFilter('products', 'p')}
 * `;
 */
export function addSoftDeleteFilter(table, alias = null, includeAND = true) {
  if (!SOFT_DELETE_TABLES.includes(table)) {
    return '';
  }
  
  const prefix = alias ? `${alias}.` : '';
  const andClause = includeAND ? 'AND' : '';
  
  return `${andClause} COALESCE(${prefix}is_deleted, false) = false`;
}

/**
 * Generate WHERE clause for soft-delete filter (no AND prefix).
 * Useful when this is the first/only WHERE condition.
 * 
 * @param {string} table - Table name
 * @param {string|null} alias - Optional table alias
 * @returns {string} SQL fragment like 'COALESCE(p.is_deleted, false) = false'
 * 
 * @example
 * const query = `
 *   SELECT * FROM products p
 *   WHERE ${softDeleteFilter('products', 'p')}
 * `;
 */
export function softDeleteFilter(table, alias = null) {
  return addSoftDeleteFilter(table, alias, false);
}

/**
 * Check if a table uses soft-delete pattern.
 * 
 * @param {string} table - Table name to check
 * @returns {boolean} True if table uses soft-delete
 * 
 * @example
 * if (hasSoftDelete('products')) {
 *   query += ' AND is_deleted = false';
 * }
 */
export function hasSoftDelete(table) {
  return SOFT_DELETE_TABLES.includes(table);
}

/**
 * Build complete WHERE clause combining business_id and soft-delete filters.
 * 
 * @param {string} table - Table name
 * @param {string|null} alias - Optional table alias
 * @param {Object} options - Additional options
 * @param {boolean} options.includeBusinessId - Include business_id filter (default: true)
 * @param {boolean} options.includeWhere - Include WHERE keyword (default: true)
 * @returns {string} Complete WHERE clause
 * 
 * @example
 * const query = `
 *   SELECT * FROM products p
 *   ${buildWhereClause('products', 'p')}
 *   AND p.category = $2
 * `;
 * // Result: WHERE p.business_id = $1 AND COALESCE(p.is_deleted, false) = false AND p.category = $2
 */
export function buildWhereClause(table, alias = null, options = {}) {
  const {
    includeBusinessId = true,
    includeWhere = true
  } = options;
  
  const prefix = alias ? `${alias}.` : '';
  const whereKeyword = includeWhere ? 'WHERE' : '';
  
  const conditions = [];
  
  if (includeBusinessId) {
    conditions.push(`${prefix}business_id = $1::uuid`);
  }
  
  if (hasSoftDelete(table)) {
    conditions.push(`COALESCE(${prefix}is_deleted, false) = false`);
  }
  
  if (conditions.length === 0) {
    return '';
  }
  
  return `${whereKeyword} ${conditions.join(' AND ')}`;
}

/**
 * Generate soft-delete UPDATE statement (instead of DELETE).
 * 
 * @param {string} table - Table name
 * @param {string|null} deletedBy - User ID performing deletion
 * @returns {string} UPDATE statement fragment
 * 
 * @example
 * const query = softDeleteUpdate('products', userId);
 * await client.query(query + ' WHERE id = $1 AND business_id = $2', [productId, businessId]);
 * // Result: UPDATE products SET is_deleted = true, deleted_at = NOW(), deleted_by = '...' WHERE ...
 */
export function softDeleteUpdate(table, deletedBy = null) {
  if (!hasSoftDelete(table)) {
    throw new Error(`Table ${table} does not support soft delete`);
  }
  
  const deletedByClause = deletedBy
    ? `, deleted_by = '${deletedBy.replace(/'/g, "''")}'`
    : '';
  
  return `UPDATE ${table} SET is_deleted = true, deleted_at = NOW()${deletedByClause}`;
}

/**
 * Generate soft-delete restore UPDATE statement.
 * 
 * @param {string} table - Table name
 * @returns {string} UPDATE statement fragment
 * 
 * @example
 * const query = softDeleteRestore('products');
 * await client.query(query + ' WHERE id = $1 AND business_id = $2', [productId, businessId]);
 * // Result: UPDATE products SET is_deleted = false, deleted_at = NULL, deleted_by = NULL WHERE ...
 */
export function softDeleteRestore(table) {
  if (!hasSoftDelete(table)) {
    throw new Error(`Table ${table} does not support soft delete`);
  }
  
  return `UPDATE ${table} SET is_deleted = false, deleted_at = NULL, deleted_by = NULL`;
}

/**
 * Audit existing query string and warn if missing soft-delete filter.
 * Useful during development to catch missing filters.
 * 
 * @param {string} query - SQL query string
 * @param {boolean} throwError - Whether to throw error (default: false, just console.warn)
 * @returns {boolean} True if query is safe, false if missing filter
 * 
 * @example
 * const query = 'SELECT * FROM products WHERE business_id = $1';
 * auditQueryForSoftDelete(query); // Warns: Missing soft-delete filter for products
 */
export function auditQueryForSoftDelete(query, throwError = false) {
  const queryLower = query.toLowerCase();
  
  // Extract table names from FROM and JOIN clauses
  const fromMatches = queryLower.matchAll(/from\s+(\w+)/gi);
  const joinMatches = queryLower.matchAll(/join\s+(\w+)/gi);
  
  const tables = [
    ...Array.from(fromMatches).map(m => m[1]),
    ...Array.from(joinMatches).map(m => m[1])
  ];
  
  const missingFilters = [];
  
  for (const table of tables) {
    if (hasSoftDelete(table)) {
      // Check if query includes is_deleted filter for this table
      const hasFilter = queryLower.includes('is_deleted');
      
      if (!hasFilter) {
        missingFilters.push(table);
      }
    }
  }
  
  if (missingFilters.length > 0) {
    const message = `Missing soft-delete filter for tables: ${missingFilters.join(', ')}`;
    
    if (throwError) {
      throw new Error(message);
    } else {
      console.warn('[Soft Delete Audit]', message);
    }
    
    return false;
  }
  
  return true;
}

/**
 * Query builder helper that automatically adds soft-delete filters.
 * 
 * @example
 * const qb = new SoftDeleteQueryBuilder('products', 'p');
 * qb.addCondition('p.category = $2');
 * qb.addCondition('p.price > $3');
 * const query = qb.build();
 * // Result: SELECT * FROM products p WHERE p.business_id = $1 
 * //         AND COALESCE(p.is_deleted, false) = false 
 * //         AND p.category = $2 AND p.price > $3
 */
export class SoftDeleteQueryBuilder {
  constructor(table, alias = null) {
    this.table = table;
    this.alias = alias;
    this.conditions = [];
    this.selectClause = '*';
  }
  
  select(columns) {
    this.selectClause = columns;
    return this;
  }
  
  addCondition(condition) {
    this.conditions.push(condition);
    return this;
  }
  
  build(options = {}) {
    const {
      includeBusinessId = true,
      businessIdParam = '$1::uuid'
    } = options;
    
    const prefix = this.alias ? `${this.alias}.` : '';
    const tableRef = this.alias ? `${this.table} ${this.alias}` : this.table;
    
    const whereClauses = [];
    
    if (includeBusinessId) {
      whereClauses.push(`${prefix}business_id = ${businessIdParam}`);
    }
    
    if (hasSoftDelete(this.table)) {
      whereClauses.push(`COALESCE(${prefix}is_deleted, false) = false`);
    }
    
    whereClauses.push(...this.conditions);
    
    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';
    
    return `SELECT ${this.selectClause} FROM ${tableRef} ${whereClause}`.trim();
  }
}

/**
 * Prisma-style where clause object with soft-delete filter.
 * 
 * @param {Object} where - Additional where conditions
 * @returns {Object} Where object with is_deleted filter
 * 
 * @example
 * const products = await prisma.products.findMany({
 *   where: withSoftDeleteWhere({ category: 'electronics', business_id: businessId })
 * });
 * // Equivalent to: { category: 'electronics', business_id: '...', is_deleted: false }
 */
export function withSoftDeleteWhere(where = {}) {
  return {
    ...where,
    is_deleted: false
  };
}

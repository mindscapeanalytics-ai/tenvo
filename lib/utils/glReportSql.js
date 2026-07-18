/**
 * Shared GL report SQL fragments.
 *
 * Draft journals must not hit Statements or the General Ledger. Reversed journals
 * KEEP their original gl_entries and get a separate posted reversing JE — so
 * reversed must stay included or historical balances go wrong.
 */

/**
 * @param {string} [entryAlias='e'] gl_entries table alias
 * @returns {string} SQL AND-fragment (single-line)
 */
export function glExcludeDraftJournalSql(entryAlias = 'e') {
  const e = String(entryAlias || 'e').replace(/[^a-zA-Z0-9_]/g, '') || 'e';
  return `
  AND (
    ${e}.journal_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM journal_entries je
      WHERE je.id = ${e}.journal_id
        AND je.business_id = ${e}.business_id
        AND COALESCE(LOWER(je.status), 'posted') <> 'draft'
    )
  )
`.replace(/\s+/g, ' ').trim();
}

/** Append to gl_entries join/where (alias `e`). */
export const GL_EXCLUDE_DRAFT_JOURNAL_SQL = glExcludeDraftJournalSql('e');

/** Append to gl_entries join/where (alias `ge`) — ledger / account-balance actions. */
export const GL_EXCLUDE_DRAFT_JOURNAL_SQL_GE = glExcludeDraftJournalSql('ge');

-- =============================================================================
-- Migration: Add reference_number to journal_entries (2026-06-13)
-- Adds a free-text reference field so users can enter cheque numbers, document
-- numbers, or other human-readable references without requiring a UUID format.
-- The existing reference_id (UUID) column is preserved for programmatic links.
-- =============================================================================

ALTER TABLE journal_entries
    ADD COLUMN IF NOT EXISTS reference_number TEXT;

# Tenant Hardening Rollout Checklist (Child Tables `business_id`)

## Scope

- **Canonical Prisma migration (preferred):** `prisma/migrations/20260718_child_tables_business_id_complete/`
- **Manual mirror:** `lib/db/migrations/047_child_tables_business_id_complete.sql`
- Legacy manual SQL (still listed in `scripts/apply-all-migrations.js`):
  - `prisma/migrations/20260303_child_tables_business_id_hardening.sql`
  - `prisma/migrations/20260303_child_tables_business_id_enforce_not_null.sql`

### Tables covered by `20260718` (21)

**New columns (were missing entirely):**
`product_specifications`, `cycle_count_items`, `inventory_adjustments`, `bank_statement_lines`

**Enforce / backfill (were optional `String?`):**
`purchase_items`, `challan_items`, `pos_transaction_items`, `pos_payments`, `pos_refund_items`, `restaurant_order_items`, `price_list_items`, `credit_note_items`, `campaign_messages`, `segment_customers`, `payroll_items`, `promotion_products`, `quotation_items`, `sales_order_items`, `storefront_order_items`, `product_reviews`, `tax_configurations`

**Intentionally still optional:** `registration_requests.business_id`, `stripe_webhook_events.business_id`

## Apply

```bash
bun run db:migrate
# or manual:
# psql $DATABASE_URL -f lib/db/migrations/047_child_tables_business_id_complete.sql
```

Then:

```bash
bun run verify:child-tables-business-id
```

## Precheck / postcheck

```sql
SELECT 'product_specifications' AS table_name, COUNT(*) AS null_count FROM product_specifications WHERE business_id IS NULL
UNION ALL SELECT 'cycle_count_items', COUNT(*) FROM cycle_count_items WHERE business_id IS NULL
UNION ALL SELECT 'inventory_adjustments', COUNT(*) FROM inventory_adjustments WHERE business_id IS NULL
UNION ALL SELECT 'bank_statement_lines', COUNT(*) FROM bank_statement_lines WHERE business_id IS NULL
UNION ALL SELECT 'purchase_items', COUNT(*) FROM purchase_items WHERE business_id IS NULL
UNION ALL SELECT 'quotation_items', COUNT(*) FROM quotation_items WHERE business_id IS NULL
UNION ALL SELECT 'sales_order_items', COUNT(*) FROM sales_order_items WHERE business_id IS NULL
UNION ALL SELECT 'storefront_order_items', COUNT(*) FROM storefront_order_items WHERE business_id IS NULL
UNION ALL SELECT 'product_reviews', COUNT(*) FROM product_reviews WHERE business_id IS NULL;
```

Expect `0` after a clean apply. Soft `NOT NULL` in the migration skips with `NOTICE` if residual nulls remain (does not abort deploy).

## App write paths (must include `business_id`)

| Table | Writer |
|-------|--------|
| `cycle_count_items` | `app/api/v1/inventory/cycle-counts/route.js` |
| `bank_statement_lines` | `app/api/v1/finance/bank-reconciliation/route.js` |
| `promotion_products` | `lib/services/PromotionService.js`, `lib/actions/standard/promotions.js` |
| Line items (POS/purchases/sales/storefront/…) | Existing services already write `business_id`; insert triggers backfill if omitted |

## Rollback (relax only)

```sql
-- Example: relax one table if needed
ALTER TABLE cycle_count_items ALTER COLUMN business_id DROP NOT NULL;
```

Keep columns, FKs, indexes, and triggers — only drop `NOT NULL` if emergency writes fail.

/**
 * Unified sales analytics SQL — invoices, POS, and storefront orders.
 * Single source for hub Sales tab and premium analytics bundles.
 *
 * Channel param (text): 'all' | 'invoice' | 'pos' | 'storefront'
 * Category param: NULL / '' = all categories; else exact products.category match
 */

/** Non-cancelled storefront orders count toward gross sales (stock already committed). */
export const STOREFRONT_GROSS_SALE_FILTER = `
  LOWER(COALESCE(o.status, '')) NOT IN ('cancelled', 'refunded', 'voided')
`;

/** Paid storefront orders only — for cash-collected KPIs. */
export const STOREFRONT_PAID_FILTER = `
  ${STOREFRONT_GROSS_SALE_FILTER.trim()}
  AND LOWER(COALESCE(o.payment_status, '')) = 'paid'
`;

export const INVOICE_SALE_FILTER = `
  (i.is_deleted = false OR i.is_deleted IS NULL)
  AND LOWER(COALESCE(i.status, '')) NOT IN ('draft', 'voided', 'cancelled')
`;

export const POS_SALE_FILTER = `
  pt.is_voided = false
  AND LOWER(COALESCE(pt.payment_status, '')) = 'completed'
`;

const CH_INV = `($4::text = 'all' OR $4::text = 'invoice')`;
const CH_POS = `($4::text = 'all' OR $4::text = 'pos')`;
const CH_SF = `($4::text = 'all' OR $4::text = 'storefront')`;

/** Category match when $5 is null/empty → all; else products.category */
const CAT_P = `($5::text IS NULL OR TRIM($5::text) = '' OR COALESCE(p.category, 'Uncategorized') = $5::text)`;
const CAT_P6 = `($6::text IS NULL OR TRIM($6::text) = '' OR COALESCE(p.category, 'Uncategorized') = $6::text)`;

/**
 * Monthly trend between from/to with cost-based profit (not GL).
 * Params: $1 business_id, $2 from::date, $3 to::date, $4 channel, $5 category
 */
export const SALES_TREND_UNIFIED_SQL = `
  WITH bounds AS (
    SELECT $2::date AS dfrom, $3::date AS dto
  ),
  months AS (
    SELECT generate_series(
      date_trunc('month', (SELECT dfrom FROM bounds)),
      date_trunc('month', (SELECT dto FROM bounds)),
      '1 month'::interval
    ) AS month
  ),
  invoice_sales AS (
    SELECT
      date_trunc('month', i.date) AS month,
      COALESCE(SUM(i.grand_total), 0) AS sales,
      COALESCE(COUNT(i.id), 0) AS count
    FROM invoices i
    CROSS JOIN bounds b
    WHERE i.business_id = $1
      AND ${INVOICE_SALE_FILTER}
      AND ${CH_INV}
      AND ($5::text IS NULL OR TRIM($5::text) = '')
      AND i.date::date >= b.dfrom
      AND i.date::date <= b.dto
    GROUP BY 1
  ),
  invoice_line_sales AS (
    SELECT
      date_trunc('month', i.date) AS month,
      COALESCE(SUM(
        COALESCE(
          ii.total_amount,
          COALESCE(ii.unit_price, 0) * COALESCE(ii.quantity, 0)
            + COALESCE(ii.tax_amount, 0)
            - COALESCE(ii.discount_amount, 0)
        )
      ), 0) AS sales,
      COUNT(DISTINCT i.id) AS count
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
    CROSS JOIN bounds b
    WHERE i.business_id = $1
      AND ${INVOICE_SALE_FILTER}
      AND ${CH_INV}
      AND ($5::text IS NOT NULL AND TRIM($5::text) <> '')
      AND ${CAT_P}
      AND i.date::date >= b.dfrom
      AND i.date::date <= b.dto
    GROUP BY 1
  ),
  pos_sales AS (
    SELECT
      date_trunc('month', pt.created_at) AS month,
      COALESCE(SUM(pt.total_amount), 0) AS sales,
      COALESCE(COUNT(pt.id), 0) AS count
    FROM pos_transactions pt
    CROSS JOIN bounds b
    WHERE pt.business_id = $1
      AND ${POS_SALE_FILTER}
      AND ${CH_POS}
      AND ($5::text IS NULL OR TRIM($5::text) = '')
      AND pt.created_at::date >= b.dfrom
      AND pt.created_at::date <= b.dto
    GROUP BY 1
  ),
  pos_line_sales AS (
    SELECT
      date_trunc('month', pt.created_at) AS month,
      COALESCE(SUM(COALESCE(pti.total_amount, pti.unit_price * pti.quantity)), 0) AS sales,
      COUNT(DISTINCT pt.id) AS count
    FROM pos_transaction_items pti
    JOIN pos_transactions pt ON pt.id = pti.transaction_id
    JOIN products p ON p.id = pti.product_id AND p.business_id = pt.business_id
    CROSS JOIN bounds b
    WHERE pt.business_id = $1
      AND ${POS_SALE_FILTER}
      AND ${CH_POS}
      AND ($5::text IS NOT NULL AND TRIM($5::text) <> '')
      AND ${CAT_P}
      AND pt.created_at::date >= b.dfrom
      AND pt.created_at::date <= b.dto
      AND pti.product_id IS NOT NULL
    GROUP BY 1
  ),
  storefront_sales AS (
    SELECT
      date_trunc('month', o.created_at) AS month,
      COALESCE(SUM(o.total_amount), 0) AS sales,
      COALESCE(COUNT(o.id), 0) AS count
    FROM storefront_orders o
    CROSS JOIN bounds b
    WHERE o.business_id = $1
      AND ${STOREFRONT_GROSS_SALE_FILTER}
      AND ${CH_SF}
      AND ($5::text IS NULL OR TRIM($5::text) = '')
      AND o.created_at::date >= b.dfrom
      AND o.created_at::date <= b.dto
    GROUP BY 1
  ),
  storefront_line_sales AS (
    SELECT
      date_trunc('month', o.created_at) AS month,
      COALESCE(SUM(COALESCE(soi.total_price, soi.unit_price * soi.quantity)), 0) AS sales,
      COUNT(DISTINCT o.id) AS count
    FROM storefront_order_items soi
    JOIN storefront_orders o ON o.id = soi.order_id
    LEFT JOIN products p ON p.id = soi.product_id AND p.business_id = o.business_id
    CROSS JOIN bounds b
    WHERE o.business_id = $1
      AND ${STOREFRONT_GROSS_SALE_FILTER}
      AND ${CH_SF}
      AND ($5::text IS NOT NULL AND TRIM($5::text) <> '')
      AND ${CAT_P}
      AND o.created_at::date >= b.dfrom
      AND o.created_at::date <= b.dto
      AND soi.product_id IS NOT NULL
    GROUP BY 1
  ),
  monthly_cogs AS (
    SELECT month, SUM(cogs) AS cogs FROM (
      SELECT
        date_trunc('month', i.date) AS month,
        COALESCE(SUM(COALESCE(ii.quantity, 0) * COALESCE(p.cost_price, 0)), 0) AS cogs
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
      CROSS JOIN bounds b
      WHERE i.business_id = $1
        AND ${INVOICE_SALE_FILTER}
        AND ${CH_INV}
        AND ${CAT_P}
        AND i.date::date >= b.dfrom
        AND i.date::date <= b.dto
      GROUP BY 1
      UNION ALL
      SELECT
        date_trunc('month', pt.created_at),
        COALESCE(SUM(COALESCE(pti.quantity, 0) * COALESCE(p.cost_price, 0)), 0)
      FROM pos_transaction_items pti
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
      LEFT JOIN products p ON pti.product_id = p.id AND p.business_id = pt.business_id
      CROSS JOIN bounds b
      WHERE pt.business_id = $1
        AND ${POS_SALE_FILTER}
        AND ${CH_POS}
        AND ${CAT_P}
        AND pt.created_at::date >= b.dfrom
        AND pt.created_at::date <= b.dto
      GROUP BY 1
      UNION ALL
      SELECT
        date_trunc('month', o.created_at),
        COALESCE(SUM(COALESCE(soi.quantity, 0) * COALESCE(p.cost_price, 0)), 0)
      FROM storefront_order_items soi
      JOIN storefront_orders o ON soi.order_id = o.id
      LEFT JOIN products p ON soi.product_id = p.id AND p.business_id = o.business_id
      CROSS JOIN bounds b
      WHERE o.business_id = $1
        AND ${STOREFRONT_GROSS_SALE_FILTER}
        AND ${CH_SF}
        AND ${CAT_P}
        AND o.created_at::date >= b.dfrom
        AND o.created_at::date <= b.dto
      GROUP BY 1
    ) x
    GROUP BY month
  )
  SELECT
    to_char(m.month, 'Mon') AS date,
    COALESCE(inv.sales, 0) + COALESCE(ils.sales, 0)
      + COALESCE(pos.sales, 0) + COALESCE(pls.sales, 0)
      + COALESCE(sf.sales, 0) + COALESCE(sls.sales, 0) AS sales,
    COALESCE(inv.count, 0) + COALESCE(ils.count, 0)
      + COALESCE(pos.count, 0) + COALESCE(pls.count, 0)
      + COALESCE(sf.count, 0) + COALESCE(sls.count, 0) AS count,
    (
      COALESCE(inv.sales, 0) + COALESCE(ils.sales, 0)
      + COALESCE(pos.sales, 0) + COALESCE(pls.sales, 0)
      + COALESCE(sf.sales, 0) + COALESCE(sls.sales, 0)
    ) - COALESCE(c.cogs, 0) AS profit
  FROM months m
  LEFT JOIN invoice_sales inv ON inv.month = m.month
  LEFT JOIN invoice_line_sales ils ON ils.month = m.month
  LEFT JOIN pos_sales pos ON pos.month = m.month
  LEFT JOIN pos_line_sales pls ON pls.month = m.month
  LEFT JOIN storefront_sales sf ON sf.month = m.month
  LEFT JOIN storefront_line_sales sls ON sls.month = m.month
  LEFT JOIN monthly_cogs c ON c.month = m.month
  ORDER BY m.month ASC
`;

/**
 * Params: $1 business_id, $2 limit, $3 from, $4 to, $5 channel, $6 category
 */
export const TOP_MOVING_PRODUCTS_UNIFIED_SQL = `
  WITH line AS (
    SELECT
      COALESCE(ii.product_id::text, 'nolink:' || ii.id::text) AS product_key,
      COALESCE(p.name, NULLIF(TRIM(ii.name), ''), 'Unknown') AS name,
      COALESCE(p.category, 'Uncategorized') AS category,
      SUM(COALESCE(ii.quantity, 0)) AS volume,
      SUM(
        COALESCE(
          ii.total_amount,
          COALESCE(ii.unit_price, 0) * COALESCE(ii.quantity, 0)
            + COALESCE(ii.tax_amount, 0)
            - COALESCE(ii.discount_amount, 0)
        )
      ) AS revenue
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    LEFT JOIN products p ON ii.product_id = p.id
    WHERE i.business_id = $1
      AND ${INVOICE_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'invoice')
      AND ${CAT_P6}
      AND i.date::date >= $3::date
      AND i.date::date <= $4::date
    GROUP BY product_key, COALESCE(p.name, NULLIF(TRIM(ii.name), ''), 'Unknown'), COALESCE(p.category, 'Uncategorized')

    UNION ALL

    SELECT
      p.id::text AS product_key,
      COALESCE(p.name, 'Unknown') AS name,
      COALESCE(p.category, 'Uncategorized') AS category,
      SUM(pti.quantity) AS volume,
      SUM(COALESCE(pti.total_amount, pti.unit_price * pti.quantity)) AS revenue
    FROM pos_transaction_items pti
    JOIN pos_transactions pt ON pt.id = pti.transaction_id
    JOIN products p ON p.id = pti.product_id
    WHERE pt.business_id = $1
      AND ${POS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'pos')
      AND ${CAT_P6}
      AND pt.created_at::date >= $3::date
      AND pt.created_at::date <= $4::date
      AND pti.product_id IS NOT NULL
    GROUP BY p.id, p.name, p.category

    UNION ALL

    SELECT
      p.id::text AS product_key,
      COALESCE(p.name, soi.product_name, 'Unknown') AS name,
      COALESCE(p.category, 'Uncategorized') AS category,
      SUM(soi.quantity) AS volume,
      SUM(COALESCE(soi.total_price, soi.unit_price * soi.quantity)) AS revenue
    FROM storefront_order_items soi
    JOIN storefront_orders o ON o.id = soi.order_id
    LEFT JOIN products p ON p.id = soi.product_id
    WHERE o.business_id = $1
      AND ${STOREFRONT_GROSS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'storefront')
      AND ${CAT_P6}
      AND o.created_at::date >= $3::date
      AND o.created_at::date <= $4::date
      AND soi.product_id IS NOT NULL
    GROUP BY p.id, p.name, p.category, soi.product_name
  )
  SELECT product_key, name, category, SUM(volume) AS volume, SUM(revenue) AS revenue
  FROM line
  GROUP BY product_key, name, category
  ORDER BY revenue DESC
  LIMIT $2
`;

/** Params: $1 business_id, $2 dfrom, $3 dto, $4 channel */
export const REVENUE_GROWTH_UNIFIED_SQL = `
  WITH b AS (
    SELECT $2::date AS dfrom, $3::date AS dto, ($3::date - $2::date + 1) AS span_days
  )
  SELECT
    (
      (SELECT COALESCE(SUM(i.grand_total), 0)
       FROM invoices i, b
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ($4::text = 'all' OR $4::text = 'invoice')
         AND i.date::date BETWEEN b.dfrom AND b.dto)
      + (SELECT COALESCE(SUM(pt.total_amount), 0)
         FROM pos_transactions pt, b
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'pos')
           AND pt.created_at::date BETWEEN b.dfrom AND b.dto)
      + (SELECT COALESCE(SUM(o.total_amount), 0)
         FROM storefront_orders o, b
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'storefront')
           AND o.created_at::date BETWEEN b.dfrom AND b.dto)
    ) AS cur_total,
    (
      (SELECT COALESCE(SUM(i.grand_total), 0)
       FROM invoices i, b
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ($4::text = 'all' OR $4::text = 'invoice')
         AND i.date::date BETWEEN (b.dfrom - b.span_days) AND (b.dfrom - 1))
      + (SELECT COALESCE(SUM(pt.total_amount), 0)
         FROM pos_transactions pt, b
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'pos')
           AND pt.created_at::date BETWEEN (b.dfrom - b.span_days) AND (b.dfrom - 1))
      + (SELECT COALESCE(SUM(o.total_amount), 0)
         FROM storefront_orders o, b
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'storefront')
           AND o.created_at::date BETWEEN (b.dfrom - b.span_days) AND (b.dfrom - 1))
    ) AS prev_total,
    (
      (SELECT COALESCE(COUNT(i.id), 0)
       FROM invoices i, b
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ($4::text = 'all' OR $4::text = 'invoice')
         AND i.date::date BETWEEN b.dfrom AND b.dto)
      + (SELECT COALESCE(COUNT(pt.id), 0)
         FROM pos_transactions pt, b
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'pos')
           AND pt.created_at::date BETWEEN b.dfrom AND b.dto)
      + (SELECT COALESCE(COUNT(o.id), 0)
         FROM storefront_orders o, b
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ($4::text = 'all' OR $4::text = 'storefront')
           AND o.created_at::date BETWEEN b.dfrom AND b.dto)
    ) AS cur_orders
  FROM b
`;

/**
 * Period COGS from line qty × product cost_price.
 * Params: $1 business_id, $2 start, $3 end, $4 channel, $5 category
 */
export const SALES_COGS_PERIOD_SQL = `
  SELECT (
    (
      SELECT COALESCE(SUM(COALESCE(ii.quantity, 0) * COALESCE(p.cost_price, 0)), 0)
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
      WHERE i.business_id = $1
        AND ${INVOICE_SALE_FILTER}
        AND ${CH_INV}
        AND ${CAT_P}
        AND i.date::date BETWEEN $2::date AND $3::date
    )
    + (
      SELECT COALESCE(SUM(COALESCE(pti.quantity, 0) * COALESCE(p.cost_price, 0)), 0)
      FROM pos_transaction_items pti
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
      LEFT JOIN products p ON pti.product_id = p.id AND p.business_id = pt.business_id
      WHERE pt.business_id = $1
        AND ${POS_SALE_FILTER}
        AND ${CH_POS}
        AND ${CAT_P}
        AND pt.created_at::date BETWEEN $2::date AND $3::date
    )
    + (
      SELECT COALESCE(SUM(COALESCE(soi.quantity, 0) * COALESCE(p.cost_price, 0)), 0)
      FROM storefront_order_items soi
      JOIN storefront_orders o ON soi.order_id = o.id
      LEFT JOIN products p ON soi.product_id = p.id AND p.business_id = o.business_id
      WHERE o.business_id = $1
        AND ${STOREFRONT_GROSS_SALE_FILTER}
        AND ${CH_SF}
        AND ${CAT_P}
        AND o.created_at::date BETWEEN $2::date AND $3::date
    )
  ) AS cogs_total
`;

/**
 * Header-level KPIs (no category). Params: $1 business_id, $2 cur_start, $3 cur_end, $4 channel
 */
export const SALES_KPI_PERIOD_SQL = `
  SELECT
    (
      (SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ${CH_INV}
         AND i.date::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(SUM(pt.total_amount), 0) FROM pos_transactions pt
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ${CH_POS}
           AND pt.created_at::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(SUM(o.total_amount), 0) FROM storefront_orders o
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ${CH_SF}
           AND o.created_at::date BETWEEN $2::date AND $3::date)
    ) AS gross_total,
    (
      (SELECT COALESCE(COUNT(i.id), 0) FROM invoices i
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ${CH_INV}
         AND i.date::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(COUNT(pt.id), 0) FROM pos_transactions pt
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ${CH_POS}
           AND pt.created_at::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(COUNT(o.id), 0) FROM storefront_orders o
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ${CH_SF}
           AND o.created_at::date BETWEEN $2::date AND $3::date)
    ) AS order_count,
    (
      (SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ${CH_INV}
         AND LOWER(COALESCE(i.payment_status, i.status, '')) IN ('paid', 'partial')
         AND i.date::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(SUM(pt.total_amount), 0) FROM pos_transactions pt
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ${CH_POS}
           AND pt.created_at::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(SUM(o.total_amount), 0) FROM storefront_orders o
         WHERE o.business_id = $1 AND ${STOREFRONT_PAID_FILTER}
           AND ${CH_SF}
           AND o.created_at::date BETWEEN $2::date AND $3::date)
    ) AS collected_total,
    (
      SELECT COUNT(DISTINCT x.customer_key) FROM (
        SELECT COALESCE(i.customer_id::text, 'anon:' || i.id::text) AS customer_key
        FROM invoices i
        WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
          AND ${CH_INV}
          AND i.date::date BETWEEN $2::date AND $3::date
        UNION
        SELECT COALESCE(pt.customer_id::text, 'walkin:' || pt.id::text)
        FROM pos_transactions pt
        WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
          AND ${CH_POS}
          AND pt.created_at::date BETWEEN $2::date AND $3::date
        UNION
        SELECT COALESCE(NULLIF(TRIM(o.customer_email), ''), 'guest:' || o.id::text)
        FROM storefront_orders o
        WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
          AND ${CH_SF}
          AND o.created_at::date BETWEEN $2::date AND $3::date
      ) x
    ) AS active_customers
`;

/**
 * Line-level KPIs when category is set.
 * Params: $1 business_id, $2 start, $3 end, $4 channel, $5 category
 * collected_total is NULL (not meaningful for category slice).
 */
export const SALES_KPI_CATEGORY_PERIOD_SQL = `
  SELECT
    (
      (SELECT COALESCE(SUM(
          COALESCE(
            ii.total_amount,
            COALESCE(ii.unit_price, 0) * COALESCE(ii.quantity, 0)
              + COALESCE(ii.tax_amount, 0)
              - COALESCE(ii.discount_amount, 0)
          )
        ), 0)
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
       WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
         AND ${CH_INV} AND ${CAT_P}
         AND i.date::date BETWEEN $2::date AND $3::date)
      + (SELECT COALESCE(SUM(COALESCE(pti.total_amount, pti.unit_price * pti.quantity)), 0)
         FROM pos_transaction_items pti
         JOIN pos_transactions pt ON pti.transaction_id = pt.id
         JOIN products p ON p.id = pti.product_id AND p.business_id = pt.business_id
         WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
           AND ${CH_POS} AND ${CAT_P}
           AND pt.created_at::date BETWEEN $2::date AND $3::date
           AND pti.product_id IS NOT NULL)
      + (SELECT COALESCE(SUM(COALESCE(soi.total_price, soi.unit_price * soi.quantity)), 0)
         FROM storefront_order_items soi
         JOIN storefront_orders o ON soi.order_id = o.id
         LEFT JOIN products p ON soi.product_id = p.id AND p.business_id = o.business_id
         WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
           AND ${CH_SF} AND ${CAT_P}
           AND o.created_at::date BETWEEN $2::date AND $3::date
           AND soi.product_id IS NOT NULL)
    ) AS gross_total,
    (
      SELECT COUNT(*) FROM (
        SELECT i.id
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
        WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
          AND ${CH_INV} AND ${CAT_P}
          AND i.date::date BETWEEN $2::date AND $3::date
        GROUP BY i.id
        UNION
        SELECT pt.id
        FROM pos_transaction_items pti
        JOIN pos_transactions pt ON pti.transaction_id = pt.id
        JOIN products p ON p.id = pti.product_id AND p.business_id = pt.business_id
        WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
          AND ${CH_POS} AND ${CAT_P}
          AND pt.created_at::date BETWEEN $2::date AND $3::date
          AND pti.product_id IS NOT NULL
        GROUP BY pt.id
        UNION
        SELECT o.id
        FROM storefront_order_items soi
        JOIN storefront_orders o ON soi.order_id = o.id
        LEFT JOIN products p ON soi.product_id = p.id AND p.business_id = o.business_id
        WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
          AND ${CH_SF} AND ${CAT_P}
          AND o.created_at::date BETWEEN $2::date AND $3::date
          AND soi.product_id IS NOT NULL
        GROUP BY o.id
      ) docs
    ) AS order_count,
    NULL::numeric AS collected_total,
    (
      SELECT COUNT(DISTINCT x.customer_key) FROM (
        SELECT COALESCE(i.customer_id::text, 'anon:' || i.id::text) AS customer_key
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
        WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
          AND ${CH_INV} AND ${CAT_P}
          AND i.date::date BETWEEN $2::date AND $3::date
        UNION
        SELECT COALESCE(pt.customer_id::text, 'walkin:' || pt.id::text)
        FROM pos_transaction_items pti
        JOIN pos_transactions pt ON pti.transaction_id = pt.id
        JOIN products p ON p.id = pti.product_id AND p.business_id = pt.business_id
        WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
          AND ${CH_POS} AND ${CAT_P}
          AND pt.created_at::date BETWEEN $2::date AND $3::date
        UNION
        SELECT COALESCE(NULLIF(TRIM(o.customer_email), ''), 'guest:' || o.id::text)
        FROM storefront_order_items soi
        JOIN storefront_orders o ON soi.order_id = o.id
        LEFT JOIN products p ON soi.product_id = p.id AND p.business_id = o.business_id
        WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
          AND ${CH_SF} AND ${CAT_P}
          AND o.created_at::date BETWEEN $2::date AND $3::date
      ) x
    ) AS active_customers
`;

/**
 * Params: $1 business_id, $2 limit, $3 from, $4 to, $5 channel
 */
export const RECENT_SALES_ACTIVITY_SQL = `
  (
    SELECT
      'invoice' AS source,
      i.id::text AS id,
      i.invoice_number AS ref,
      COALESCE(c.name, 'Walk-in') AS party,
      i.grand_total AS amount,
      COALESCE(i.payment_status, i.status) AS payment_status,
      i.status,
      i.date AS occurred_at
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE i.business_id = $1 AND ${INVOICE_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'invoice')
      AND i.date::date >= $3::date
      AND i.date::date <= $4::date
  )
  UNION ALL
  (
    SELECT
      'pos',
      pt.id::text,
      pt.transaction_number,
      COALESCE(c.name, 'Walk-in'),
      pt.total_amount,
      pt.payment_status,
      'completed',
      pt.created_at
    FROM pos_transactions pt
    LEFT JOIN customers c ON c.id = pt.customer_id
    WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'pos')
      AND pt.created_at::date >= $3::date
      AND pt.created_at::date <= $4::date
  )
  UNION ALL
  (
    SELECT
      'storefront',
      o.id::text,
      o.order_number,
      COALESCE(NULLIF(TRIM(o.customer_name), ''), o.customer_email, 'Online guest'),
      o.total_amount,
      o.payment_status,
      o.status,
      o.created_at
    FROM storefront_orders o
    WHERE o.business_id = $1 AND ${STOREFRONT_GROSS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'storefront')
      AND o.created_at::date >= $3::date
      AND o.created_at::date <= $4::date
  )
  ORDER BY occurred_at DESC
  LIMIT $2
`;

/**
 * Top customers by revenue. Params: $1 business_id, $2 limit, $3 from, $4 to, $5 channel
 */
export const TOP_CUSTOMERS_UNIFIED_SQL = `
  WITH parties AS (
    SELECT
      COALESCE(i.customer_id::text, 'anon:' || i.id::text) AS customer_key,
      COALESCE(c.name, 'Walk-in') AS name,
      COALESCE(i.grand_total, 0) AS amount,
      1 AS order_cnt
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE i.business_id = $1
      AND ${INVOICE_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'invoice')
      AND i.date::date >= $3::date
      AND i.date::date <= $4::date

    UNION ALL

    SELECT
      COALESCE(pt.customer_id::text, 'walkin:' || pt.id::text),
      COALESCE(c.name, 'Walk-in'),
      COALESCE(pt.total_amount, 0),
      1
    FROM pos_transactions pt
    LEFT JOIN customers c ON c.id = pt.customer_id
    WHERE pt.business_id = $1
      AND ${POS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'pos')
      AND pt.created_at::date >= $3::date
      AND pt.created_at::date <= $4::date

    UNION ALL

    SELECT
      COALESCE(NULLIF(TRIM(o.customer_email), ''), 'guest:' || o.id::text),
      COALESCE(NULLIF(TRIM(o.customer_name), ''), o.customer_email, 'Online guest'),
      COALESCE(o.total_amount, 0),
      1
    FROM storefront_orders o
    WHERE o.business_id = $1
      AND ${STOREFRONT_GROSS_SALE_FILTER}
      AND ($5::text = 'all' OR $5::text = 'storefront')
      AND o.created_at::date >= $3::date
      AND o.created_at::date <= $4::date
  )
  SELECT
    customer_key AS id,
    MAX(name) AS name,
    SUM(order_cnt)::int AS count,
    SUM(amount) AS total
  FROM parties
  GROUP BY customer_key
  ORDER BY total DESC
  LIMIT $2
`;

/**
 * Retention in period + channel. Params: $1 business_id, $2 from, $3 to, $4 channel
 */
export const SALES_RETENTION_PERIOD_SQL = `
  WITH customer_counts AS (
    SELECT customer_key, SUM(cnt) AS order_count FROM (
      SELECT COALESCE(i.customer_id::text, 'anon:' || i.id::text) AS customer_key, 1 AS cnt
      FROM invoices i
      WHERE i.business_id = $1
        AND ${INVOICE_SALE_FILTER}
        AND ($4::text = 'all' OR $4::text = 'invoice')
        AND i.date::date BETWEEN $2::date AND $3::date
      UNION ALL
      SELECT COALESCE(pt.customer_id::text, 'walkin:' || pt.id::text), 1
      FROM pos_transactions pt
      WHERE pt.business_id = $1 AND ${POS_SALE_FILTER}
        AND ($4::text = 'all' OR $4::text = 'pos')
        AND pt.created_at::date BETWEEN $2::date AND $3::date
      UNION ALL
      SELECT COALESCE(NULLIF(TRIM(o.customer_email), ''), 'guest:' || o.id::text), 1
      FROM storefront_orders o
      WHERE o.business_id = $1
        AND ${STOREFRONT_GROSS_SALE_FILTER}
        AND ($4::text = 'all' OR $4::text = 'storefront')
        AND o.created_at::date BETWEEN $2::date AND $3::date
    ) x
    GROUP BY customer_key
  )
  SELECT
    COUNT(*) FILTER (WHERE order_count > 1) AS repeat_customers,
    COUNT(*) AS total_customers
  FROM customer_counts
`;

/** Distinct product categories for filter dropdown. Params: $1 business_id */
export const SALES_PRODUCT_CATEGORIES_SQL = `
  SELECT DISTINCT COALESCE(NULLIF(TRIM(p.category), ''), 'Uncategorized') AS category
  FROM products p
  WHERE p.business_id = $1
    AND COALESCE(p.is_deleted, false) = false
    AND p.is_active = true
  ORDER BY 1 ASC
  LIMIT 200
`;

/**
 * @param {import('pg').QueryResultRow} row
 */
export function mapSalesTrendRow(row) {
  return {
    date: row.date,
    revenue: parseFloat(row.sales) || 0,
    profit: parseFloat(row.profit) || 0,
    orderCount: parseInt(row.count, 10) || 0,
    sales: parseInt(row.count, 10) || 0,
    expenses: 0,
  };
}

/**
 * @param {import('pg').QueryResultRow} row
 */
export function mapTopProductRow(row) {
  return {
    name: row.name,
    revenue: parseFloat(row.revenue) || 0,
    value: parseFloat(row.revenue) || 0,
    volume: Math.round(parseFloat(row.volume) || 0),
    sales: Math.round(parseFloat(row.volume) || 0),
    category: row.category,
  };
}

/**
 * @param {import('pg').QueryResultRow} row
 */
export function mapTopCustomerRow(row) {
  return {
    id: row.id,
    name: row.name || 'Unknown',
    count: parseInt(row.count, 10) || 0,
    total: parseFloat(row.total) || 0,
  };
}

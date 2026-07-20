#!/usr/bin/env node
/**
 * Live DB audit: KPI unification, invoice balance, COGS, stock display parity.
 * Run: node scripts/audit-live-dataflow.mjs
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const fmt = (n) => Number(n || 0).toFixed(2);

async function unifiedOrderTotals(client, businessId) {
  const r = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM invoices i
        WHERE i.business_id = $1
          AND (i.is_deleted = false OR i.is_deleted IS NULL)
          AND LOWER(COALESCE(i.status,'')) NOT IN ('draft','voided','cancelled')) AS inv_count,
      (SELECT COALESCE(SUM(i.grand_total),0) FROM invoices i
        WHERE i.business_id = $1
          AND (i.is_deleted = false OR i.is_deleted IS NULL)
          AND LOWER(COALESCE(i.status,'')) NOT IN ('draft','voided','cancelled')) AS inv_rev,
      (SELECT COUNT(*)::int FROM pos_transactions pt
        WHERE pt.business_id = $1 AND pt.is_voided = false
          AND LOWER(COALESCE(pt.payment_status,'')) = 'completed') AS pos_count,
      (SELECT COALESCE(SUM(pt.total_amount),0) FROM pos_transactions pt
        WHERE pt.business_id = $1 AND pt.is_voided = false
          AND LOWER(COALESCE(pt.payment_status,'')) = 'completed') AS pos_rev,
      (SELECT COUNT(*)::int FROM storefront_orders o
        WHERE o.business_id = $1
          AND LOWER(COALESCE(o.status,'')) NOT IN ('cancelled','refunded','voided')) AS sf_count,
      (SELECT COALESCE(SUM(o.total_amount),0) FROM storefront_orders o
        WHERE o.business_id = $1
          AND LOWER(COALESCE(o.status,'')) NOT IN ('cancelled','refunded','voided')) AS sf_rev,
      (SELECT COUNT(*)::int FROM restaurant_orders ro
        WHERE ro.business_id = $1
          AND LOWER(COALESCE(ro.status,'')) IN ('completed','served')) AS rest_count,
      (SELECT COALESCE(SUM(ro.total_amount),0) FROM restaurant_orders ro
        WHERE ro.business_id = $1
          AND LOWER(COALESCE(ro.status,'')) IN ('completed','served')) AS rest_rev
    `,
    [businessId]
  );
  return r.rows[0];
}

async function dashboardKpiTotals(client, businessId) {
  const from = '1970-01-01';
  const to = '2099-12-31';
  const r = await client.query(
    `
    WITH inv AS (
      SELECT COALESCE(SUM(i.grand_total),0) AS rev, COUNT(*)::int AS cnt
      FROM invoices i
      WHERE i.business_id = $1
        AND (i.is_deleted = false OR i.is_deleted IS NULL)
        AND LOWER(COALESCE(i.status,'')) NOT IN ('draft','voided','cancelled')
        AND i.date::date BETWEEN $2::date AND $3::date
    ),
    pos AS (
      SELECT COALESCE(SUM(pt.total_amount),0) AS rev, COUNT(*)::int AS cnt
      FROM pos_transactions pt
      WHERE pt.business_id = $1 AND pt.is_voided = false
        AND LOWER(COALESCE(pt.payment_status,'')) = 'completed'
        AND pt.created_at::date BETWEEN $2::date AND $3::date
    ),
    sf AS (
      SELECT COALESCE(SUM(o.total_amount),0) AS rev, COUNT(*)::int AS cnt
      FROM storefront_orders o
      WHERE o.business_id = $1
        AND LOWER(COALESCE(o.status,'')) NOT IN ('cancelled','refunded','voided')
        AND o.created_at::date BETWEEN $2::date AND $3::date
    ),
    rest AS (
      SELECT COALESCE(SUM(ro.total_amount),0) AS rev, COUNT(*)::int AS cnt
      FROM restaurant_orders ro
      WHERE ro.business_id = $1
        AND LOWER(COALESCE(ro.status,'')) IN ('completed','served')
        AND ro.created_at::date BETWEEN $2::date AND $3::date
    )
    SELECT
      (SELECT rev FROM inv) + (SELECT rev FROM pos) + (SELECT rev FROM sf) + (SELECT rev FROM rest) AS total_rev,
      (SELECT cnt FROM inv) + (SELECT cnt FROM pos) + (SELECT cnt FROM sf) + (SELECT cnt FROM rest) AS total_cnt
    `,
    [businessId, from, to]
  );
  return r.rows[0];
}

async function invoiceBalanceSample(client, businessId, limit = 5) {
  const r = await client.query(
    `
    SELECT i.id, i.invoice_number, i.grand_total,
      COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip
        WHERE ip.invoice_id = i.id AND (ip.is_deleted = false OR ip.is_deleted IS NULL)), 0) AS paid_sum,
      calculate_invoice_balance(i.id) AS fn_balance
    FROM invoices i
    WHERE i.business_id = $1
      AND (i.is_deleted = false OR i.is_deleted IS NULL)
      AND LOWER(COALESCE(i.status,'')) NOT IN ('draft','voided','cancelled')
    ORDER BY i.date DESC NULLS LAST
    LIMIT $2
    `,
    [businessId, limit]
  );
  return r.rows.map((row) => {
    const expected = Number(row.grand_total) - Number(row.paid_sum);
    const fnBal = Number(row.fn_balance);
    const delta = Math.abs(expected - fnBal);
    return { ...row, expected_balance: expected, delta_ok: delta < 0.02 };
  });
}

async function cogsSample(client, businessId) {
  const r = await client.query(
    `
    SELECT
      COALESCE(SUM(
        COALESCE(ii.quantity,0) * COALESCE(p.cost_price, 0)
      ), 0) AS invoice_cogs
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    LEFT JOIN products p ON ii.product_id = p.id AND p.business_id = i.business_id
    WHERE i.business_id = $1
      AND (i.is_deleted = false OR i.is_deleted IS NULL)
      AND LOWER(COALESCE(i.status,'')) NOT IN ('draft','voided','cancelled')
    `,
    [businessId]
  );
  return r.rows[0]?.invoice_cogs ?? 0;
}

async function stockParitySample(client, businessId, limit = 5) {
  const r = await client.query(
    `
    SELECT p.id, p.sku, p.stock AS headline,
      COALESCE((SELECT SUM(psl.quantity) FROM product_stock_locations psl
        WHERE psl.product_id = p.id AND psl.business_id = p.business_id), 0) AS loc_sum,
      COALESCE((SELECT SUM(pv.stock) FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.business_id = p.business_id), 0) AS var_sum
    FROM products p
    WHERE p.business_id = $1 AND COALESCE(p.is_active, true) = true
    ORDER BY p.updated_at DESC NULLS LAST
    LIMIT $2
    `,
    [businessId, limit]
  );
  return r.rows;
}

async function main() {
  const client = await pool.connect();
  const issues = [];

  try {
    const bizRes = await client.query(
      `SELECT id, business_name, category FROM businesses
       WHERE id IN (
         SELECT DISTINCT business_id FROM pos_transactions
         UNION SELECT DISTINCT business_id FROM storefront_orders
         UNION SELECT DISTINCT business_id FROM restaurant_orders
       )
       ORDER BY business_name LIMIT 5`
    );

    console.log('\n=== LIVE DATAFLOW AUDIT ===\n');

    for (const biz of bizRes.rows) {
      console.log(`\n--- ${biz.business_name} (${biz.category}) ---`);
      const u = await unifiedOrderTotals(client, biz.id);
      const k = await dashboardKpiTotals(client, biz.id);

      const uCnt =
        Number(u.inv_count) +
        Number(u.pos_count) +
        Number(u.sf_count) +
        Number(u.rest_count);
      const uRev =
        Number(u.inv_rev) +
        Number(u.pos_rev) +
        Number(u.sf_rev) +
        Number(u.rest_rev);

      const kCnt = Number(k.total_cnt);
      const kRev = Number(k.total_rev);

      console.log(`Unified ledger: ${uCnt} orders, rev ${fmt(uRev)}`);
      console.log(`  inv=${u.inv_count} pos=${u.pos_count} sf=${u.sf_count} rest=${u.rest_count}`);
      console.log(`Dashboard-style SQL: ${kCnt} orders, rev ${fmt(kRev)}`);

      if (uCnt !== kCnt || Math.abs(uRev - kRev) > 0.05) {
        issues.push(`${biz.business_name}: KPI count/rev mismatch unified=${uCnt}/${fmt(uRev)} vs dash=${kCnt}/${fmt(kRev)}`);
        console.log('  ⚠ KPI MISMATCH');
      } else {
        console.log('  ✓ KPI totals align');
      }

      const balances = await invoiceBalanceSample(client, biz.id, 3);
      for (const b of balances) {
        if (!b.delta_ok) {
          issues.push(`${biz.business_name} invoice ${b.invoice_number}: balance fn=${b.fn_balance} vs paid diff=${b.expected_balance}`);
          console.log(`  ⚠ Invoice ${b.invoice_number} balance delta`);
        }
      }
      if (balances.length && balances.every((b) => b.delta_ok)) {
        console.log(`  ✓ Invoice balance fn OK (${balances.length} sampled)`);
      }

      const cogs = await cogsSample(client, biz.id);
      console.log(`  COGS (invoice lines): ${fmt(cogs)}`);

      const stocks = await stockParitySample(client, biz.id, 3);
      for (const s of stocks) {
        const headline = Number(s.headline);
        const loc = Number(s.loc_sum);
        const variants = Number(s.var_sum);
        if (loc > 0 && Math.abs(headline - loc) > 0.01 && variants === 0) {
          console.log(`  ℹ Stock drift SKU ${s.sku}: headline=${headline} loc=${loc}`);
        }
      }
    }

    // Schema function existence
    const fnCheck = await client.query(
      `SELECT proname FROM pg_proc WHERE proname = 'calculate_invoice_balance'`
    );
    if (fnCheck.rows.length === 0) {
      issues.push('Missing calculate_invoice_balance() Postgres function');
    } else {
      console.log('\n✓ calculate_invoice_balance() exists');
    }

    console.log('\n=== SUMMARY ===');
    if (issues.length === 0) {
      console.log('No critical live dataflow issues in sample.\n');
    } else {
      console.log(`${issues.length} issue(s):`);
      issues.forEach((i) => console.log(`  - ${i}`));
      console.log('');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

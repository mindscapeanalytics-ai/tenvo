#!/usr/bin/env node
/**
 * Deep Dive: Order Data Flow & KPI Discrepancies
 * Identifies which tables contribute to which KPIs and where gaps exist
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function analyzeDataFlow() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Deep Dive: Order Data Flow Analysis\n');
    console.log('═══════════════════════════════════════\n');

    // Get a business ID from the screenshots (Tenvo Boutique Demo)
    const businessQuery = await client.query(`
      SELECT id, business_name, domain, category
      FROM businesses
      WHERE domain = 'demo-boutique'
      LIMIT 1
    `);

    if (businessQuery.rows.length === 0) {
      console.log('⚠️  Demo boutique not found. Analyzing first boutique business...');
      const anyBiz = await client.query(`
        SELECT id, business_name, domain, category
        FROM businesses 
        WHERE business_name LIKE '%Boutique%' OR domain LIKE '%boutique%'
        LIMIT 1
      `);
      if (anyBiz.rows.length === 0) {
        console.log('❌ No boutique businesses in database');
        return;
      }
      businessQuery.rows = anyBiz.rows;
    }

    const business = businessQuery.rows[0];
    const businessId = business.id;

    console.log('📊 Analyzing Business:');
    console.log(`   Name: ${business.business_name}`);
    console.log(`   Domain: ${business.domain}`);
    console.log(`   Category: ${business.category}`);
    console.log(`   ID: ${businessId}\n`);

    console.log('═══════════════════════════════════════\n');

    // 1. STOREFRONT ORDERS (Online Sales)
    console.log('🛒 STOREFRONT_ORDERS (Public Store Orders)');
    const storefrontOrders = await client.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
      FROM storefront_orders
      WHERE business_id = $1
    `, [businessId]);

    const sfOrders = storefrontOrders.rows[0];
    console.log(`   Total Orders: ${sfOrders.total_count}`);
    console.log(`   Pending: ${sfOrders.pending_count}`);
    console.log(`   Processing: ${sfOrders.processing_count}`);
    console.log(`   Completed: ${sfOrders.completed_count}`);
    console.log(`   Paid: ${sfOrders.paid_count}`);
    console.log(`   Total Revenue: ${sfOrders.total_revenue}`);
    console.log(`   Date Range: ${sfOrders.first_order ? sfOrders.first_order.toISOString().split('T')[0] : 'N/A'} → ${sfOrders.last_order ? sfOrders.last_order.toISOString().split('T')[0] : 'N/A'}`);

    if (sfOrders.total_count > 0) {
      const sfItems = await client.query(`
        SELECT COUNT(*) as item_count, COUNT(DISTINCT product_id) as unique_products
        FROM storefront_order_items
        WHERE business_id = $1
      `, [businessId]);
      console.log(`   Line Items: ${sfItems.rows[0].item_count}`);
      console.log(`   Unique Products: ${sfItems.rows[0].unique_products}`);
    }
    console.log('');

    // 2. INVOICES (Sales Invoices)
    console.log('📄 INVOICES (Manual Sales/AR Invoices)');
    const invoices = await client.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as payment_paid_count,
        COUNT(*) FILTER (WHERE is_deleted = false) as active_count,
        COALESCE(SUM(CASE WHEN is_deleted = false THEN total_amount ELSE 0 END), 0) as total_revenue,
        MIN(date) as first_invoice,
        MAX(date) as last_invoice
      FROM invoices
      WHERE business_id = $1
    `, [businessId]);

    const inv = invoices.rows[0];
    console.log(`   Total Invoices: ${inv.total_count} (Active: ${inv.active_count})`);
    console.log(`   Draft: ${inv.draft_count}`);
    console.log(`   Sent: ${inv.sent_count}`);
    console.log(`   Status=Paid: ${inv.paid_count}`);
    console.log(`   Payment Status=Paid: ${inv.payment_paid_count}`);
    console.log(`   Total Revenue: ${inv.total_revenue}`);
    console.log(`   Date Range: ${inv.first_invoice ? inv.first_invoice.toISOString().split('T')[0] : 'N/A'} → ${inv.last_invoice ? inv.last_invoice.toISOString().split('T')[0] : 'N/A'}`);

    if (inv.total_count > 0) {
      const invItems = await client.query(`
        SELECT COUNT(*) as item_count, COUNT(DISTINCT product_id) as unique_products
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoice_id
        WHERE i.business_id = $1 AND i.is_deleted = false
      `, [businessId]);
      console.log(`   Line Items: ${invItems.rows[0].item_count}`);
      console.log(`   Unique Products: ${invItems.rows[0].unique_products}`);
    }
    console.log('');

    // 3. POS TRANSACTIONS (POS Sales)
    console.log('🏪 POS_TRANSACTIONS (Point of Sale)');
    const posTransactions = await client.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE is_voided = false) as active_count,
        COALESCE(SUM(CASE WHEN is_voided = false THEN total_amount ELSE 0 END), 0) as total_revenue,
        MIN(created_at) as first_transaction,
        MAX(created_at) as last_transaction
      FROM pos_transactions
      WHERE business_id = $1
    `, [businessId]);

    const pos = posTransactions.rows[0];
    console.log(`   Total Transactions: ${pos.total_count} (Active: ${pos.active_count})`);
    console.log(`   Completed: ${pos.completed_count}`);
    console.log(`   Total Revenue: ${pos.total_revenue}`);
    console.log(`   Date Range: ${pos.first_transaction ? pos.first_transaction.toISOString().split('T')[0] : 'N/A'} → ${pos.last_transaction ? pos.last_transaction.toISOString().split('T')[0] : 'N/A'}`);

    if (pos.total_count > 0) {
      const posItems = await client.query(`
        SELECT COUNT(*) as item_count, COUNT(DISTINCT product_id) as unique_products
        FROM pos_transaction_items
        WHERE business_id = $1
      `, [businessId]);
      console.log(`   Line Items: ${posItems.rows[0].item_count}`);
      console.log(`   Unique Products: ${posItems.rows[0].unique_products}`);
    }
    console.log('');

    // 4. RESTAURANT ORDERS (if applicable)
    console.log('🍽️  RESTAURANT_ORDERS (Restaurant/Cafe)');
    const restaurantOrders = await client.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
      FROM restaurant_orders
      WHERE business_id = $1
    `, [businessId]);

    const rest = restaurantOrders.rows[0];
    console.log(`   Total Orders: ${rest.total_count}`);
    console.log(`   Pending: ${rest.pending_count}`);
    console.log(`   Completed: ${rest.completed_count}`);
    console.log(`   Total Revenue: ${rest.total_revenue}`);
    if (rest.total_count > 0) {
      console.log(`   Date Range: ${rest.first_order ? rest.first_order.toISOString().split('T')[0] : 'N/A'} → ${rest.last_order ? rest.last_order.toISOString().split('T')[0] : 'N/A'}`);
    }
    console.log('');

    // SUMMARY
    console.log('═══════════════════════════════════════');
    console.log('📊 ORDER LEDGER SUMMARY\n');

    const totalOrders = parseInt(sfOrders.total_count) + parseInt(inv.active_count) + 
                       parseInt(pos.active_count) + parseInt(rest.total_count);
    const totalRevenue = parseFloat(sfOrders.total_revenue) + parseFloat(inv.total_revenue) + 
                        parseFloat(pos.total_revenue) + parseFloat(rest.total_revenue);

    console.log('ORDERS BY LEDGER:');
    console.log(`  Storefront Orders:  ${sfOrders.total_count.toString().padStart(4)} orders  Rs${parseFloat(sfOrders.total_revenue).toFixed(2)}`);
    console.log(`  Invoices (Active):  ${inv.active_count.toString().padStart(4)} invoices Rs${parseFloat(inv.total_revenue).toFixed(2)}`);
    console.log(`  POS Transactions:   ${pos.active_count.toString().padStart(4)} sales    Rs${parseFloat(pos.total_revenue).toFixed(2)}`);
    console.log(`  Restaurant Orders:  ${rest.total_count.toString().padStart(4)} orders  Rs${parseFloat(rest.total_revenue).toFixed(2)}`);
    console.log(`  ─────────────────────────────────────`);
    console.log(`  TOTAL:              ${totalOrders.toString().padStart(4)} orders  Rs${totalRevenue.toFixed(2)}`);
    console.log('');

    // IDENTIFY DISCREPANCIES
    console.log('═══════════════════════════════════════');
    console.log('🔍 KPI SOURCE ANALYSIS\n');

    console.log('SCREENSHOT 1: Sales Performance Dashboard');
    console.log('  Showing: 14 orders, Rs205,474.23 revenue');
    console.log('  Likely Source: Multiple ledgers aggregated');
    console.log('  Check: Are invoices + storefront orders being counted?\n');

    console.log('SCREENSHOT 2: Command Overview Dashboard');
    console.log('  Showing: 2 orders (Last 30 Days)');
    console.log('  Likely Source: invoices table only?');
    console.log('  Issue: May be missing storefront_orders\n');

    console.log('SCREENSHOT 3: Orders Manager (Storefront Tab)');
    console.log('  Showing: 2 storefront orders');
    console.log(`  Actual DB: ${sfOrders.total_count} storefront orders`);
    if (parseInt(sfOrders.total_count) !== 2) {
      console.log('  ⚠️  MISMATCH: UI showing 2 but DB has ' + sfOrders.total_count);
    }
    console.log('');

    // Check date filtering
    console.log('═══════════════════════════════════════');
    console.log('📅 DATE RANGE ANALYSIS\n');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStorefront = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM storefront_orders
      WHERE business_id = $1 AND created_at >= $2
    `, [businessId, thirtyDaysAgo]);

    const recentInvoices = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM invoices
      WHERE business_id = $1 AND date >= $2 AND is_deleted = false
    `, [businessId, thirtyDaysAgo]);

    const recentPOS = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM pos_transactions
      WHERE business_id = $1 AND created_at >= $2 AND is_voided = false
    `, [businessId, thirtyDaysAgo]);

    console.log('LAST 30 DAYS:');
    console.log(`  Storefront: ${recentStorefront.rows[0].count} orders, Rs${parseFloat(recentStorefront.rows[0].revenue).toFixed(2)}`);
    console.log(`  Invoices:   ${recentInvoices.rows[0].count} invoices, Rs${parseFloat(recentInvoices.rows[0].revenue).toFixed(2)}`);
    console.log(`  POS:        ${recentPOS.rows[0].count} sales, Rs${parseFloat(recentPOS.rows[0].revenue).toFixed(2)}`);
    console.log('');

    // Check which queries the dashboard might be using
    console.log('═══════════════════════════════════════');
    console.log('🎯 ROOT CAUSE IDENTIFICATION\n');

    const issues = [];

    if (parseInt(sfOrders.total_count) > 2 && recentStorefront.rows[0].count === '2') {
      issues.push({
        issue: 'Date filtering applied to storefront orders',
        detail: `Total: ${sfOrders.total_count}, Last 30 days: ${recentStorefront.rows[0].count}`,
        fix: 'Verify dashboard date range filter is not inadvertently filtering'
      });
    }

    if (parseInt(inv.active_count) > 0 && parseInt(sfOrders.total_count) > 0) {
      issues.push({
        issue: 'Multiple order ledgers not being aggregated',
        detail: `Invoices: ${inv.active_count}, Storefront: ${sfOrders.total_count}`,
        fix: 'Dashboard queries should aggregate: storefront_orders + invoices (+ POS if enabled)'
      });
    }

    const allOrders = parseInt(sfOrders.total_count) + parseInt(inv.active_count) + parseInt(pos.active_count);
    if (allOrders === 14) {
      issues.push({
        issue: 'Sales Performance (14 orders) = Combined ledgers',
        detail: 'Correctly aggregating all order sources',
        fix: 'Command Overview should use the same aggregation logic'
      });
    }

    if (issues.length === 0) {
      console.log('✅ No obvious data flow issues detected');
    } else {
      console.log('⚠️  IDENTIFIED ISSUES:\n');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.issue}`);
        console.log(`   Details: ${issue.detail}`);
        console.log(`   Fix: ${issue.fix}\n`);
      });
    }

    // Find the actual dashboard query files
    console.log('═══════════════════════════════════════');
    console.log('📂 DASHBOARD QUERY LOCATIONS\n');
    console.log('To fix discrepancies, check these files:');
    console.log('  • Sales Performance: app/api/sales/performance/route.js');
    console.log('  • Command Overview: app/business/page.jsx (dashboard)');
    console.log('  • Orders Manager: app/business/orders/page.jsx');
    console.log('  • Storefront Orders Action: lib/actions/storefront/orders.js');
    console.log('');

  } finally {
    client.release();
    await pool.end();
  }
}

analyzeDataFlow().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

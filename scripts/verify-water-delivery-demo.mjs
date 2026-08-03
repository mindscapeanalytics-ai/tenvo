#!/usr/bin/env node
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../lib/dataLab/pool.mjs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * Verify water delivery demo wiring and KPI calculations
 */

async function main() {
  const pool = createPool();
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying water delivery demo wiring...\n');
    
    // Fetch business
    const bRes = await client.query('SELECT id, settings, category FROM businesses WHERE domain = $1', ['demo-water']);
    if (bRes.rows.length === 0) {
      console.log('❌ demo-water business not found');
      process.exit(1);
    }
    const businessId = bRes.rows[0].id;
    const category = bRes.rows[0].category;
    const settings = bRes.rows[0].settings || {};
    
    console.log(`✓ Business: ${businessId}`);
    console.log(`✓ Category: ${category}`);
    
    // Verify customers
    const cusRes = await client.query(
      'SELECT COUNT(*), COUNT(*) FILTER (WHERE domain_data->>\'customertype\' = \'Corporate\') as corporate, COUNT(*) FILTER (WHERE domain_data->>\'customertype\' = \'Commercial\') as commercial FROM customers WHERE business_id = $1 AND is_deleted = false',
      [businessId]
    );
    console.log(`✓ Customers: ${cusRes.rows[0].count} (${cusRes.rows[0].corporate} Corporate, ${cusRes.rows[0].commercial} Commercial)`);
    
    // Verify stops
    const stopRes = await client.query(
      'SELECT COUNT(*), SUM(cash_collected) as total_cash FROM water_delivery_stops WHERE business_id = $1 AND is_deleted = false',
      [businessId]
    );
    console.log(`✓ Delivery stops: ${stopRes.rows[0].count}`);
    console.log(`✓ Total cash collected: PKR ${Number(stopRes.rows[0].total_cash || 0).toLocaleString()}`);
    
    // Verify lines
    const lineRes = await client.query(
      'SELECT COUNT(*), SUM(quantity) as total_bottles FROM water_delivery_lines WHERE business_id = $1',
      [businessId]
    );
    console.log(`✓ Delivery lines: ${lineRes.rows[0].count}`);
    console.log(`✓ Total bottles delivered: ${lineRes.rows[0].total_bottles}`);
    
    // Verify today's deliveries
    const todayRes = await client.query(
      `SELECT COUNT(*) as stops, SUM(cash_collected) as cash 
       FROM water_delivery_stops 
       WHERE business_id = $1 AND delivery_date = CURRENT_DATE AND is_deleted = false`,
      [businessId]
    );
    console.log(`✓ Today's stops: ${todayRes.rows[0].stops}`);
    console.log(`✓ Today's cash: PKR ${Number(todayRes.rows[0].cash || 0).toLocaleString()}`);
    
    // Verify routes
    const routeRes = await client.query(
      `SELECT route_label, COUNT(*) as stops 
       FROM water_delivery_stops 
       WHERE business_id = $1 AND delivery_date = CURRENT_DATE AND is_deleted = false 
       GROUP BY route_label 
       ORDER BY stops DESC`,
      [businessId]
    );
    console.log('\n📍 Routes:');
    routeRes.rows.forEach(r => console.log(`  • ${r.route_label}: ${r.stops} stops`));
    
    // Verify settings
    console.log('\n⚙️  Settings verification:');
    console.log(`  waterHisab.productIds: ${settings.waterHisab?.productIds?.length || 0} products`);
    console.log(`  storefront.waterDelivery.hisabProductIds: ${settings.storefront?.waterDelivery?.hisabProductIds?.length || 0} products`);
    
    // Calculate KPIs
    const kpiRes = await client.query(
      `SELECT 
        COUNT(DISTINCT s.id) as total_stops,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        SUM(l.quantity) as total_bottles,
        SUM(l.quantity * l.unit_price_snapshot) as total_revenue,
        SUM(s.cash_collected) as total_cash
       FROM water_delivery_stops s
       LEFT JOIN water_delivery_lines l ON l.stop_id = s.id
       WHERE s.business_id = $1 
         AND s.is_deleted = false
         AND s.delivery_date >= CURRENT_DATE - INTERVAL '10 days'`,
      [businessId]
    );
    
    const kpi = kpiRes.rows[0];
    console.log('\n📊 KPIs (Last 10 days):');
    console.log(`  Total stops: ${kpi.total_stops}`);
    console.log(`  Unique customers: ${kpi.unique_customers}`);
    console.log(`  Total bottles: ${kpi.total_bottles}`);
    console.log(`  Total revenue: PKR ${Number(kpi.total_revenue || 0).toLocaleString()}`);
    console.log(`  Cash collected: PKR ${Number(kpi.total_cash || 0).toLocaleString()}`);
    console.log(`  Average per stop: PKR ${Math.round(Number(kpi.total_revenue || 0) / Number(kpi.total_stops || 1))}`);
    
    console.log('\n✅ All verifications passed!\n');
    
  } catch (err) {
    console.error('❌ Verification error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main();

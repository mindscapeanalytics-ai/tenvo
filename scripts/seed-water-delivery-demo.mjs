#!/usr/bin/env node
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createPool } from '../lib/dataLab/pool.mjs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

async function main() {
  const pool = createPool();
  const client = await pool.connect();
  
  try {
    console.log('Fetching demo-water business...');
    const bRes = await client.query('SELECT id FROM businesses WHERE domain = $1', ['demo-water']);
    if (bRes.rows.length === 0) {
      console.log('demo-water business not found. Please run: bun run scripts/data-lab/seed-master-demo.mjs --only demo-water');
      process.exit(1);
    }
    const businessId = bRes.rows[0].id;
    
    const pRes = await client.query('SELECT id, name, price, unit FROM products WHERE business_id = $1 AND name ILIKE $2 LIMIT 1', [businessId, '%19L%refill%']);
    const product = pRes.rows[0];
    if (!product) {
      console.log('19L Refill product not found. Ensure catalog is seeded.');
      process.exit(1);
    }
    
    // Create customers if not enough exist
    const cRes = await client.query('SELECT id FROM customers WHERE business_id = $1', [businessId]);
    
    console.log(`Found ${cRes.rows.length} customers, product: ${product.name}`);
    
    const routes = ['DHA Phase 6', 'Clifton', 'Bahria Town Karachi'];
    const townCodes = ['101', '102', '220'];
    const accountNos = ['55', '1-101-356', 'CORP-88'];
    const customerTypes = ['Home & Flat', 'Home & Flat', 'Corporate'];
    const names = ['Villa 303 Customer', 'Flat 5F-11A Customer', 'BTK Bahria Office'];
    const postalCodes = ['75500', '75600', '75340'];
    
    let customers = cRes.rows;
    if (customers.length < 3) {
      console.log('Seeding demo route customers...');
      for (let i = 0; i < 3; i++) {
        const dd = {
          customertype: customerTypes[i],
          accountno: accountNos[i],
          towncode: townCodes[i],
          city: 'Karachi',
          deliveryarea: routes[i],
          postalcode: postalCodes[i],
          houseno: names[i].split(' ')[0],
          deliverydays: 'Daily',
          dailybottles: i + 1,
          productrate: 150,
          bottlebalance: 2,
          deliveryactive: 'Yes',
          preferredpayment: 'Monthly Credit',
        };
        const ins = await client.query(
          `INSERT INTO customers (business_id, name, domain_data, "createdAt", "updatedAt", is_active, is_deleted) 
           VALUES ($1, $2, $3, NOW(), NOW(), true, false) RETURNING id`,
           [businessId, names[i], JSON.stringify(dd)]
        );
        customers.push(ins.rows[0]);
      }
    }
    
    // Seed route hisab (stops and lines) for today
    console.log('Seeding daily route stops and lines...');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    for (let i = 0; i < Math.min(3, customers.length); i++) {
      const cid = customers[i].id;
      
      // Upsert stop
      const stopRes = await client.query(
        `INSERT INTO water_delivery_stops 
        (business_id, delivery_date, customer_id, house_no_snapshot, customer_name_snapshot, route_label, status, "created_at", "updated_at", is_deleted)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), false)
        ON CONFLICT (business_id, delivery_date, customer_id) DO UPDATE SET is_deleted = false
        RETURNING id`,
        [businessId, today, cid, names[i].split(' ')[0], names[i], routes[i], 'confirmed']
      );
      
      const stopId = stopRes.rows[0].id;
      
      // Delete existing lines
      await client.query(`DELETE FROM water_delivery_lines WHERE stop_id = $1`, [stopId]);
      
      // Insert lines (DEL / REC)
      const delQty = i + 1;
      const recQty = i + 1;
      
      await client.query(
        `INSERT INTO water_delivery_lines 
        (business_id, stop_id, product_id, product_name_snapshot, unit_snapshot, quantity, received_quantity, unit_price_snapshot, "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [businessId, stopId, product.id, product.name, product.unit, delQty, recQty, 150]
      );
    }
    
    console.log('Successfully seeded water delivery routes!');
    
  } catch (err) {
    console.error('Error seeding water routes:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

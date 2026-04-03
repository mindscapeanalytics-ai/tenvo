import { pool } from './lib/db';
import { InvoiceService } from './lib/services/InvoiceService';
import { AccountingService } from './lib/services/AccountingService';

async function verifyActiveCols() {
  const client = await pool.connect();
  try {
    console.log("Checking tables for 'is_active' column...");
    
    for (const table of ['gl_accounts', 'invoices', 'invoice_items', 'customers', 'products', 'vendors', 'stock_movements', 'inventory_ledger', 'gl_entries']) {
      try {
        await client.query(`SELECT is_active FROM ${table} LIMIT 1`);
        console.log(`[OK] ${table}.is_active EXISTS`);
      } catch (e) {
        if (e.message.includes('column "is_active" does not exist')) {
            console.log(`[MISSING] ${table}.is_active DOES NOT EXIST in database!`);
        } else {
            console.log(`[ERR] ${table}: ${e.message}`);
        }
      }
    }
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyActiveCols();

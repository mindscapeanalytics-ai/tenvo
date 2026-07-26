/**
 * One-shot runtime probe for critical API audit findings (session cd7567).
 * Does not mutate product data.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'debug-cd7567.log');

function log(hypothesisId, location, message, data) {
  const line = JSON.stringify({
    sessionId: 'cd7567',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId: 'pre-fix',
  });
  fs.appendFileSync(logPath, `${line}\n`);
  console.log(line);
}

async function proveBodyDoubleRead() {
  const req = new Request('http://localhost/api/v1/invoices/x/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: 'biz-1',
      amount: 10,
      payment_method: 'cash',
    }),
  });
  let first = null;
  let second = null;
  let secondErr = null;
  try {
    first = await req.json();
  } catch (e) {
    first = { error: e.message };
  }
  try {
    second = await req.json();
  } catch (e) {
    secondErr = e.message || String(e);
  }
  log('B', 'prove:body-double-read', 'Request.json double-read result', {
    first,
    second,
    secondErr,
    secondReadFailed: Boolean(secondErr),
  });
}

async function proveWarehouseTable() {
  try {
    const { default: pool } = await import('../lib/db.js');
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT to_regclass('public.warehouses') AS warehouses,
                to_regclass('public.warehouse_locations') AS warehouse_locations`
      );
      let warehousesErr = null;
      try {
        await client.query('SELECT COUNT(*) FROM warehouses LIMIT 1');
      } catch (e) {
        warehousesErr = { code: e.code, message: e.message };
      }
      let locCount = null;
      try {
        const c = await client.query(
          'SELECT COUNT(*)::int AS c FROM warehouse_locations'
        );
        locCount = c.rows[0].c;
      } catch (e) {
        locCount = { error: e.message, code: e.code };
      }
      log('C', 'prove:warehouse-tables', 'DB table existence', {
        warehouses: r.rows[0].warehouses,
        warehouse_locations: r.rows[0].warehouse_locations,
        warehousesErr,
        locCount,
      });
    } finally {
      client.release();
      if (typeof pool.end === 'function') await pool.end();
    }
  } catch (e) {
    log('C', 'prove:warehouse-tables', 'DB probe failed', { error: e.message });
  }
}

function proveAffiliatesSource() {
  const affiliatesSrc = fs.readFileSync(
    path.join(root, 'app/api/debug/affiliates/route.js'),
    'utf8'
  );
  log('A', 'prove:affiliates-source', 'Auth surface on debug affiliates', {
    hasWithApiAuth: /withApiAuth/.test(affiliatesSrc),
    hasWithGuard: /withGuard/.test(affiliatesSrc),
    hasSessionCheck: /getServerSession|auth\(/.test(affiliatesSrc),
    exportsGet: /export async function GET/.test(affiliatesSrc),
    removeComment: /REMOVE IN PRODUCTION/.test(affiliatesSrc),
  });
}

proveAffiliatesSource();
await proveBodyDoubleRead();
await proveWarehouseTable();
console.log('probe-complete');

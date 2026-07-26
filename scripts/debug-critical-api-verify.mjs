/**
 * Post-fix static + Request-body checks for critical API fixes (session cd7567).
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
    runId: 'post-fix',
  });
  fs.appendFileSync(logPath, `${line}\n`);
  console.log(line);
}

const affiliates = fs.readFileSync(
  path.join(root, 'app/api/debug/affiliates/route.js'),
  'utf8'
);
log('A', 'verify:affiliates-source', 'Affiliates route after restore', {
  emailLookupRestored: /WHERE LOWER\(email\)/.test(affiliates),
  listRequiresAdmin: /isPlatformLevel/.test(affiliates),
  openListAllWithoutAuth: /if \(!email\)[\s\S]*\$queryRaw`[\s\S]*FROM affiliates[\s\S]*ORDER BY/.test(affiliates) && !/isPlatformLevel/.test(affiliates),
  returns404Only: /status:\s*404/.test(affiliates) && !/WHERE LOWER\(email\)/.test(affiliates),
});

const payments = fs.readFileSync(
  path.join(root, 'app/api/v1/invoices/[id]/payments/route.js'),
  'utf8'
);
log('B', 'verify:invoice-payments-source', 'Invoice payments POST after fix', {
  usesParsedBody: /parsedBody/.test(payments),
  reReadsJson:
    /await request\.json\(\)/.test(payments) &&
    /withApiAuth\(async[\s\S]*await request\.json\(\)/.test(payments),
});

const warehouses = fs.readFileSync(
  path.join(root, 'app/api/v1/warehouses/route.js'),
  'utf8'
);
log('C', 'verify:warehouses-source', 'Warehouses POST after fix', {
  countsWarehouseLocations: /FROM warehouse_locations/.test(warehouses),
  stillCountsWarehousesTable: /FROM warehouses\b/.test(warehouses),
  usesDeletedAt: /deleted_at/.test(warehouses),
});

// Schema / migration evidence for C (no live DB)
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
log('C', 'verify:schema', 'Prisma warehouse models', {
  hasWarehouseLocationsModel: /model warehouse_locations/.test(schema),
  hasWarehousesModel: /model warehouses\b/.test(schema),
});

// Body double-read still fails on raw Request (middleware must use parsedBody)
const req = new Request('http://localhost/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 5, payment_method: 'cash', business_id: 'x' }),
});
const first = await req.json();
let secondErr = null;
try {
  await req.json();
} catch (e) {
  secondErr = e.message;
}
log('B', 'verify:body-still-single-use', 'Request body still single-use', {
  firstKeys: Object.keys(first),
  secondErr,
  parsedBodyRequired: Boolean(secondErr),
});

console.log('post-fix-verify-complete');

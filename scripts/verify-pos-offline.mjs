/**
 * Static wiring checks for POS offline Phase 1.
 * Run: bun run verify:pos-offline
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function includes(rel, needle, msg) {
  assert(read(rel).includes(needle), msg || `${rel} includes ${JSON.stringify(needle)}`);
}

function excludes(rel, needle, msg) {
  assert(!read(rel).includes(needle), msg || `${rel} excludes ${JSON.stringify(needle)}`);
}

includes(
  'prisma/migrations/20260718_pos_transactions_client_ref/migration.sql',
  'client_ref',
  'migration adds client_ref'
);
includes(
  'prisma/migrations/20260718_pos_transactions_client_ref/migration.sql',
  'pos_transactions_business_client_ref_uidx',
  'migration adds partial unique index'
);
includes('prisma/schema.prisma', 'client_ref', 'schema maps client_ref');
includes('lib/services/POSService.js', 'client_ref', 'POSService writes client_ref');
includes('lib/services/POSService.js', 'clientRef', 'POSService reads clientRef');
includes('lib/utils/posOfflineIds.js', 'newPosClientRef', 'client ref helper');
includes('lib/utils/posOfflineCatalog.js', 'writePosOfflineCatalog', 'catalog write');
includes('lib/utils/posOfflineCatalog.js', 'isPosOfflineCatalogFresh', 'catalog TTL');
includes('lib/utils/posOfflineDb.js', 'POS_OFFLINE_DB_VERSION', 'shared offline DB');
includes(
  'lib/utils/posOfflineQueue.js',
  'clientRef required for offline POS sale',
  'queue requires clientRef'
);
includes('lib/utils/posOfflineQueue.js', 'markPosSaleFailed', 'queue failed status');
includes('lib/hooks/usePosOffline.js', 'newPosClientRef', 'hook stamps clientRef');
includes('lib/hooks/usePosOfflineCatalog.js', 'catalogReady', 'catalog hook');
includes('lib/hooks/usePosCheckout.js', 'catalog_not_ready', 'checkout gates on catalog');
includes('components/pos/PosTerminal.jsx', 'usePosOfflineCatalog', 'PosTerminal wires catalog');
includes('components/pos/SuperStorePOS.jsx', 'usePosOfflineCatalog', 'SuperStore wires catalog');
excludes(
  'components/restaurant/RestaurantPOS.jsx',
  'usePosOfflineCatalog',
  'RestaurantPOS left untouched'
);
includes('lib/config/plans.js', 'offline_pos_mode', 'canonical plans include offline_pos_mode');
includes(
  'components/pos/PosSettingsPanel.jsx',
  'offline_pos_mode',
  'settings panel gates offline toggle'
);
includes(
  'components/pos/shared/PosOfflineBanner.jsx',
  'catalogReady',
  'banner knows catalog state'
);

const test = spawnSync('bun', ['test', 'lib/utils/__tests__/posOfflineCatalog.test.js'], {
  cwd: root,
  encoding: 'utf8',
});
if (test.status !== 0) {
  console.error(test.stdout || '');
  console.error(test.stderr || '');
  assert(false, 'posOfflineCatalog unit tests pass');
} else {
  assert(true, 'posOfflineCatalog unit tests pass');
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll POS offline wiring checks passed');

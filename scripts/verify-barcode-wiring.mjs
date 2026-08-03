/**
 * Barcode wiring sanity checks.
 * Run: bun run verify:barcode-wiring
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  expandScanCandidates,
  isValidGtinChecksum,
  normalizeScanCode,
  suggestInternalBarcodeFromSku,
} from '../lib/utils/barcodeUtils.js';
import {
  findProductByScanCode,
  findProductScanMatch,
} from '../lib/utils/productScanLookup.js';

const root = join(import.meta.dirname, '..');
let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// GTIN normalization
const upc = '012345678905';
const candidates = expandScanCandidates(upc);
if (!candidates.includes('012345678905') && !candidates.some((c) => c.includes('12345678905'))) {
  fail('expandScanCandidates should handle UPC/EAN variants');
}

// Alphanumeric article codes must not expand to bare digit tails
const articleCandidates = expandScanCandidates('ART-101');
if (articleCandidates.some((c) => c === '101')) {
  fail('expandScanCandidates must not strip alphanumeric article codes to digit tails');
}
if (!articleCandidates.includes('ART-101') && !articleCandidates.includes('art-101')) {
  fail('expandScanCandidates should keep raw alphanumeric codes');
}

if (!isValidGtinChecksum('96385074')) {
  fail('EAN-8 checksum validation');
}

const gs1 = normalizeScanCode('(01)00012345678905');
if (!gs1 || gs1.length < 8) {
  fail('GS1 (01) AI parsing');
}

const generated = suggestInternalBarcodeFromSku('SKU-100', 'biz-1');
if (!/^\d{13}$/.test(generated) || !isValidGtinChecksum(generated)) {
  fail('suggestInternalBarcodeFromSku should return valid EAN-13');
}

// Client lookup + variants
const products = [
  { id: '1', name: 'A', sku: 'SKU-A', barcode: '111' },
  { id: '2', name: 'B', sku: 'SKU-B', variants: [{ variant_sku: 'VAR-RED' }] },
];
if (!findProductByScanCode(products, '111')) fail('barcode match');
if (!findProductByScanCode(products, 'sku-a')) fail('case-insensitive SKU');
if (!findProductByScanCode(products, 'VAR-RED')) fail('variant SKU match');

const variantHit = findProductScanMatch(products, 'VAR-RED');
if (!variantHit?.matchedVariantSku) fail('findProductScanMatch should return matchedVariantSku');

// Shared modules exist
for (const file of [
  'lib/utils/barcodeUtils.js',
  'lib/utils/productScanLookup.js',
  'lib/hooks/useProductScan.js',
  'lib/actions/standard/inventory/lookup.js',
  'components/inventory/BarcodeScanTrigger.jsx',
  'components/inventory/BarcodeFieldInput.jsx',
  'components/pos/shared/PosCameraScanner.jsx',
]) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

// Invoice uses shared lookup
const invoice = read('components/EnhancedInvoiceBuilder.jsx');
if (!invoice.includes('findProductByScanCode')) {
  fail('EnhancedInvoiceBuilder must use findProductByScanCode');
}
if (invoice.includes('p.barcode === code || p.sku === code')) {
  fail('EnhancedInvoiceBuilder still has case-sensitive inline lookup');
}

// ProductForm uses real scanner + uniqueness gate
const productForm = read('components/ProductForm.jsx');
if (productForm.includes('Scanning ready') && productForm.includes('animate-pulse')) {
  fail('ProductForm still has fake scanning pulse');
}
if (!productForm.includes('BarcodeFieldInput')) {
  fail('ProductForm must use BarcodeFieldInput');
}
if (!productForm.includes('checkBarcodeExistsAction')) {
  fail('ProductForm must enforce barcode uniqueness on save');
}

const wizardSrc = read('components/inventory/ProductWizard.jsx');
if (!wizardSrc.includes('checkBarcodeExistsAction')) {
  fail('ProductWizard must enforce barcode uniqueness on save');
}
if (!wizardSrc.includes('BarcodeFieldInput')) {
  fail('ProductWizard must use BarcodeFieldInput');
}

// Lookup + uniqueness must ignore soft-deleted and expand GTIN pairs
const lookupSrc = read('lib/actions/standard/inventory/lookup.js');
if (!lookupSrc.includes('is_deleted')) {
  fail('lookupProductByScanCodeAction must filter soft-deleted products');
}
const validationSrc = read('lib/actions/standard/inventory/validation.js');
if (!validationSrc.includes('expandScanCandidates') || !validationSrc.includes('is_deleted')) {
  fail('checkBarcodeExistsAction must use expandScanCandidates and skip deleted rows');
}

const posAdd = read('lib/hooks/usePosProductAdd.js');
if (!posAdd.includes('findProductScanMatch') || !posAdd.includes('matchedVariantId')) {
  fail('usePosProductAdd must honor matchedVariantId from scan lookup');
}

// GTIN regex fix
const domainValidation = read('lib/utils/domainValidation.js');
if (domainValidation.includes('/^\\d{8}|\\d{12,14}$/')) {
  fail('domainValidation GTIN regex still broken');
}

if (failed) process.exit(1);
console.log('OK: barcode wiring checks passed.');

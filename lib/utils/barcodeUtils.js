/**
 * Barcode normalization, GS1 parsing, and GTIN validation.
 * Shared by POS, inventory, and product forms.
 */

/** Strip control chars and common scanner suffixes (Enter/Tab). */
export function normalizeScanCode(raw) {
  let s = String(raw ?? '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim();
  if (!s) return '';

  // GS1 QR / DataMatrix: (01)GTIN14 or AI prefix 01
  const gs1 = s.match(/(?:\(01\)|01)(\d{14})/);
  if (gs1) {
    const gtin14 = gs1[1];
    // GTIN-14 → EAN-13 (drop packaging indicator digit when standard retail)
    if (gtin14.startsWith('0')) return gtin14.slice(1);
    return gtin14;
  }

  // Parenthesized GS1 element strings: (01)06901234567842
  const paren = s.match(/\(01\)(\d{8,14})/);
  if (paren) return paren[1];

  return s;
}

/** Candidate codes to try when matching (UPC-A ↔ EAN-13, leading zeros). */
export function expandScanCandidates(code) {
  const base = normalizeScanCode(code);
  if (!base) return [];

  const candidates = new Set([base, base.toLowerCase()]);

  const digitsOnly = base.replace(/\D/g, '');
  if (digitsOnly && digitsOnly !== base) {
    candidates.add(digitsOnly);
    candidates.add(digitsOnly.toLowerCase());
  }

  const stripped = digitsOnly.replace(/^0+/, '') || digitsOnly;
  if (stripped) {
    candidates.add(stripped);
    candidates.add(stripped.toLowerCase());
  }

  // UPC-A (12) ↔ EAN-13 (leading 0)
  if (/^\d{12}$/.test(stripped)) {
    candidates.add(`0${stripped}`);
  }
  if (/^\d{13}$/.test(stripped) && stripped.startsWith('0')) {
    candidates.add(stripped.slice(1));
  }

  return [...candidates].filter(Boolean);
}

/** Mod-10 GTIN check digit (EAN-8, UPC-A, EAN-13, GTIN-14). */
export function isValidGtinChecksum(digits) {
  const s = String(digits).replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(s.length)) return false;

  const body = s.slice(0, -1);
  const check = Number(s.slice(-1));
  let sum = 0;
  const len = body.length;
  for (let i = 0; i < len; i += 1) {
    const d = Number(body[len - 1 - i]);
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  const expected = (10 - (sum % 10)) % 10;
  return check === expected;
}

/** Format check for retail barcodes (non-blocking warning). */
export function isValidGtinFormat(code) {
  const digits = String(code).replace(/\D/g, '');
  if (!digits) return true;
  if (!/^\d{8}$|^\d{12,14}$/.test(digits)) return false;
  return isValidGtinChecksum(digits);
}

/**
 * Suggest an internal barcode from SKU when tenant has no GTIN yet.
 * Prefix 29 = in-store / internal use (GS1 company prefix range for internal).
 */
export function suggestInternalBarcodeFromSku(sku, businessId = '') {
  const seed = String(sku || businessId || '')
    .replace(/\W/g, '')
    .toUpperCase()
    .slice(0, 10);
  if (!seed) return '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const suffix = String(hash % 10000000000).padStart(10, '0');
  const body = `29${suffix}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(body[11 - i]);
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

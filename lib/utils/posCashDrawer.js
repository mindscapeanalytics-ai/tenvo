/**
 * ESC/POS cash drawer kick + session cash movement helpers.
 * Drawer open prints a labeled 58mm slip (never a blank white page).
 */

const ESC = '\x1B';

/** Standard drawer pulse (pin 2, ~100ms) — Epson-compatible. */
export const CASH_DRAWER_KICK_SEQUENCE = `${ESC}p\x00\x19\xFA`;

const DRAWER_FRAME_ID = 'tenvo-cash-drawer-print-frame';

function escHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build a short labeled thermal slip for drawer open / paid in / paid out.
 * Includes ESC/POS kick for compatible USB receipt printers.
 *
 * @param {{
 *   businessName?: string,
 *   label?: string,
 *   amount?: number | null,
 *   currencyCode?: string,
 *   reason?: string,
 *   paperSize?: '58mm' | '80mm',
 * }} opts
 */
export function buildCashDrawerSlipHtml(opts = {}) {
  const paperSize = opts.paperSize === '80mm' ? '80mm' : '58mm';
  const width = paperSize === '80mm' ? '76mm' : '54mm';
  const pageH = paperSize === '80mm' ? 48 : 42;
  const businessName = opts.businessName || 'Store';
  const label = opts.label || 'Cash drawer';
  const reason = opts.reason ? String(opts.reason).trim() : '';
  const amount =
    opts.amount != null && Number.isFinite(Number(opts.amount))
      ? Number(opts.amount)
      : null;
  const currencyCode = opts.currencyCode || '';
  const when = new Date().toLocaleString();

  let amountLine = '';
  if (amount != null) {
    try {
      amountLine = new Intl.NumberFormat(undefined, {
        style: currencyCode ? 'currency' : 'decimal',
        currency: currencyCode || undefined,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      amountLine = `${currencyCode} ${amount.toFixed(2)}`.trim();
    }
  }

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>${escHtml(label)}</title>
<style>
  @page { size: ${paperSize} ${pageH}mm; margin: 0; }
  html, body {
    width: ${width};
    max-width: ${width};
    height: ${pageH}mm;
    margin: 0 auto;
    padding: 3mm 2.5mm 4mm;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    line-height: 1.35;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .title { font-size: 12px; margin-bottom: 1.5mm; }
  .small { font-size: 8px; color: #555; }
  .amt { font-size: 14px; font-weight: 800; margin: 2mm 0; }
  hr { border: none; border-top: 1px dashed #999; margin: 2.5mm 0; }
  .kick { font-size: 1px; line-height: 0; color: #fff; height: 0; overflow: hidden; }
</style>
</head><body>
  <div class="kick" aria-hidden="true">${CASH_DRAWER_KICK_SEQUENCE}</div>
  <div class="center bold title">${escHtml(businessName)}</div>
  <hr/>
  <div class="center bold">${escHtml(String(label).toUpperCase())}</div>
  ${amountLine ? `<div class="center amt">${escHtml(amountLine)}</div>` : ''}
  ${reason ? `<div class="center small">${escHtml(reason)}</div>` : ''}
  <div class="center small">${escHtml(when)}</div>
  <hr/>
  <div class="center small">58mm receipt · Actual size · Save paper</div>
</body></html>`;
}

/**
 * Open cash drawer via a labeled thermal print job (kick embedded).
 * Prefer embedding kick in the sale receipt when auto-printing a sale.
 *
 * @param {{
 *   label?: string,
 *   businessName?: string,
 *   amount?: number | null,
 *   currencyCode?: string,
 *   reason?: string,
 *   paperSize?: '58mm' | '80mm',
 *   delayMs?: number,
 * }} [opts]
 * @returns {boolean}
 */
export function openCashDrawer(opts = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const html = buildCashDrawerSlipHtml(opts);
    // Reuse shared print path with a dedicated frame id so we never remove the wrong iframe.
    let iframe = document.getElementById(DRAWER_FRAME_ID);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = DRAWER_FRAME_ID;
      iframe.setAttribute('title', 'Cash drawer print');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText =
        'position:absolute;width:1px;height:1px;top:-9999px;left:-9999px;border:0;opacity:0;pointer-events:none;z-index:-9999;';
      document.body.appendChild(iframe);
    }
    const win = iframe.contentWindow;
    if (!win) return false;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    const delayMs = Math.max(200, Number(opts.delayMs) || 280);
    const trigger = () => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    };
    if (win.document.readyState === 'complete') {
      setTimeout(trigger, delayMs);
    } else {
      iframe.onload = () => setTimeout(trigger, delayMs);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse session notes for cash movements.
 * @param {string | null | undefined} notes
 * @returns {{ text: string, cashMovements: Array<{ type: string, amount: number, reason: string, at: string }> }}
 */
export function parsePosSessionNotes(notes) {
  const raw = String(notes || '').trim();
  if (!raw) return { text: '', cashMovements: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cashMovements)) {
      return {
        text: String(parsed.text || ''),
        cashMovements: parsed.cashMovements,
      };
    }
  } catch {
    /* plain text notes */
  }
  return { text: raw, cashMovements: [] };
}

/**
 * @param {{ text?: string, cashMovements?: object[] }} data
 */
export function serializePosSessionNotes(data) {
  return JSON.stringify({
    text: data.text || '',
    cashMovements: Array.isArray(data.cashMovements) ? data.cashMovements : [],
  });
}

/**
 * Net cash adjustment from paid_in (+) and paid_out (-).
 * @param {Array<{ type: string, amount: number }>} movements
 */
export function sumPosCashMovements(movements) {
  return (movements || []).reduce((sum, m) => {
    const amt = Number(m.amount) || 0;
    if (m.type === 'paid_in') return sum + amt;
    if (m.type === 'paid_out') return sum - amt;
    return sum;
  }, 0);
}

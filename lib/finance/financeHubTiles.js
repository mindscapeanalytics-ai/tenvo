/**
 * Finance hub mobile tile tones — aligned with Retail Simple action colors.
 * Solid tiles + translucent icon wraps for clear section scanning on mobile.
 */

/** @typedef {{ tile: string, iconWrap: string }} FinanceTileTone */

/** @type {Readonly<Record<string, FinanceTileTone>>} */
export const FINANCE_TILE_TONES = Object.freeze({
  sky: { tile: 'bg-sky-600 text-white', iconWrap: 'bg-white/20 text-white' },
  indigo: { tile: 'bg-indigo-600 text-white', iconWrap: 'bg-white/20 text-white' },
  violet: { tile: 'bg-violet-600 text-white', iconWrap: 'bg-white/20 text-white' },
  amber: { tile: 'bg-amber-500 text-white', iconWrap: 'bg-white/20 text-white' },
  teal: { tile: 'bg-teal-600 text-white', iconWrap: 'bg-white/20 text-white' },
  emerald: { tile: 'bg-emerald-600 text-white', iconWrap: 'bg-white/20 text-white' },
  rose: { tile: 'bg-rose-600 text-white', iconWrap: 'bg-white/20 text-white' },
  orange: { tile: 'bg-orange-500 text-white', iconWrap: 'bg-white/20 text-white' },
  slate: { tile: 'bg-slate-700 text-white', iconWrap: 'bg-white/20 text-white' },
  cyan: { tile: 'bg-cyan-600 text-white', iconWrap: 'bg-white/20 text-white' },
  brand: { tile: 'bg-brand-primary text-white', iconWrap: 'bg-white/20 text-white' },
});

/**
 * Per-tab color + short hint for mobile finance hub tiles.
 * @type {Readonly<Record<string, { tone: keyof typeof FINANCE_TILE_TONES, hint: string }>>}
 */
export const FINANCE_TAB_TILE_META = Object.freeze({
  overview: { tone: 'sky', hint: 'KPIs & shortcuts' },
  statements: { tone: 'indigo', hint: 'P&L, BS, TB' },
  accounts: { tone: 'violet', hint: 'Chart of accounts' },
  journal: { tone: 'amber', hint: 'Manual journals' },
  'general-ledger': { tone: 'teal', hint: 'Account activity' },
  reconciliation: { tone: 'emerald', hint: 'Bank match' },
  expenses: { tone: 'rose', hint: 'Log spend' },
  'credit-notes': { tone: 'orange', hint: 'Returns & credits' },
  fiscal: { tone: 'slate', hint: 'Close periods' },
  exchange: { tone: 'cyan', hint: 'FX rates' },
  payments: { tone: 'brand', hint: 'Receipts & vouchers' },
  gst: { tone: 'amber', hint: 'Tax & GST' },
});

/**
 * @param {string} key
 * @returns {{ tile: string, iconWrap: string, hint: string }}
 */
export function resolveFinanceTileStyle(key) {
  const meta = FINANCE_TAB_TILE_META[key] || { tone: 'slate', hint: '' };
  const tone = FINANCE_TILE_TONES[meta.tone] || FINANCE_TILE_TONES.slate;
  return { ...tone, hint: meta.hint };
}

/**
 * ESC/POS cash drawer kick for thermal printers attached via browser print.
 * Many USB POS printers open the drawer on these sequences when printing.
 */

const ESC = '\x1B';
const GS = '\x1D';

/** Standard drawer pulse (pin 2, ~100ms) — Epson-compatible. */
export const CASH_DRAWER_KICK_SEQUENCE = `${ESC}p\x00\x19\xFA`;

/**
 * Open cash drawer by printing a minimal kick document.
 * No-ops gracefully when window.print is unavailable.
 * @param {{ label?: string }} [opts]
 * @returns {boolean} true if a print attempt was made
 */
export function openCashDrawer(opts = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    try {
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
        document.body.appendChild(frame);
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (!doc) {
            frame.remove();
            return false;
        }
        const label = opts.label || 'Drawer';
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><title>${label}</title>
<style>@page{size:58mm auto;margin:0}body{margin:0;font-size:1px;color:#fff}</style>
</head><body>${CASH_DRAWER_KICK_SEQUENCE}<span>.</span>
<script>
window.onload=function(){try{window.focus();window.print();}catch(e){}
setTimeout(function(){parent.document.body.removeChild(parent.document.querySelector('iframe[aria-hidden="true"]'));},800);}
</script></body></html>`);
        doc.close();
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

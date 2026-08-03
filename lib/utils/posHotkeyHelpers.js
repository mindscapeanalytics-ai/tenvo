import { POS_HOTKEY_MAP } from '@/lib/config/posHotkeys';

/**
 * Resolve F1–F12 from a keyboard event (key or code).
 * @param {{ key?: string, code?: string } | null | undefined} e
 * @returns {string | null}
 */
export function resolvePosFunctionKey(e) {
    if (!e) return null;
    const key = String(e.key || '');
    if (/^F([1-9]|1[0-2])$/i.test(key)) return key.toUpperCase();
    const code = String(e.code || '');
    if (/^F([1-9]|1[0-2])$/i.test(code)) return code.toUpperCase();
    return null;
}

/**
 * Block only fields where F-keys would corrupt free-form text (notes / passwords).
 * Number, scan, and discount inputs stay open to power-till F-keys.
 * @param {EventTarget | null} target
 */
export function shouldBlockPosHotkey(target) {
    if (!target || typeof target !== 'object') return false;
    const el = /** @type {{ tagName?: string, isContentEditable?: boolean, getAttribute?: (name: string) => string | null }} */ (target);
    if (el.isContentEditable) return true;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return true;
    if (tag !== 'INPUT') return false;
    const type = String(
        (typeof el.getAttribute === 'function' ? el.getAttribute('type') : null) || 'text'
    ).toLowerCase();
    return type === 'password';
}

/**
 * Focus the visible scan/search field (dual desktop/mobile layouts keep hidden clones in DOM).
 * @param {ParentNode | null} [root]
 * @returns {boolean}
 */
export function focusPosScanInput(root) {
    if (typeof document === 'undefined') return false;
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    const nodes = scope.querySelectorAll('[data-pos-role="scan"]');
    for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue;
        const visible = typeof el.checkVisibility === 'function'
            ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
            : el.getClientRects().length > 0;
        if (!visible) continue;
        el.focus();
        if (typeof el.select === 'function') el.select();
        return true;
    }
    const fallback = nodes[0];
    if (fallback instanceof HTMLElement) {
        fallback.focus();
        if (typeof fallback.select === 'function') fallback.select();
        return true;
    }
    return false;
}

/**
 * @param {{ key?: string, code?: string }} e
 * @returns {import('@/lib/config/posHotkeys').PosHotkeyAction | null}
 */
export function resolvePosHotkeyAction(e) {
    const fnKey = resolvePosFunctionKey(e);
    if (!fnKey) return null;
    return POS_HOTKEY_MAP[fnKey] || null;
}

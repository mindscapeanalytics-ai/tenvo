'use client';

import { useEffect } from 'react';
import { POS_HOTKEY_MAP } from '@/lib/config/posHotkeys';

/**
 * @param {EventTarget | null} target
 */
function isTypingTarget(target) {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    if (tag !== 'INPUT') return false;
    const type = String(target.getAttribute('type') || 'text').toLowerCase();
    // Allow F-keys while focused on search/scan fields; block on number/discount fields
    // so F3 can still move focus to discount from elsewhere.
    if (type === 'number' || type === 'password') return true;
    const role = target.getAttribute('data-pos-role');
    if (role === 'discount' || role === 'qty') return true;
    return false;
}

/**
 * Shared POS F-key listener. Pass handlers for each action; omit unused ones.
 *
 * @param {{
 *   enabled?: boolean,
 *   handlers: Partial<Record<import('@/lib/config/posHotkeys').PosHotkeyAction, () => void>>,
 * }} opts
 */
export function usePosHotkeys({ enabled = true, handlers }) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined;

        const onKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const action = POS_HOTKEY_MAP[e.key];
            if (!action) return;
            const handler = handlers?.[action];
            if (!handler) return;

            // Always allow F-keys to steal focus from the page (POS power-user mode),
            // except when typing in number/discount fields for non-navigation actions.
            if (isTypingTarget(e.target) && action !== 'search' && action !== 'pay') {
                return;
            }

            e.preventDefault();
            handler();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enabled, handlers]);
}

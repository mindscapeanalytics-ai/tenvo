'use client';

import { useEffect } from 'react';
import { POS_HOTKEY_MAP } from '@/lib/config/posHotkeys';
import {
    focusPosScanInput,
    resolvePosFunctionKey,
    shouldBlockPosHotkey,
} from '@/lib/utils/posHotkeyHelpers';

export {
    focusPosScanInput,
    resolvePosFunctionKey,
    shouldBlockPosHotkey,
} from '@/lib/utils/posHotkeyHelpers';

/**
 * Shared POS F-key listener. Pass handlers for each action; omit unused ones.
 * Uses capture so F1/F3/F5/F6 beat browser chrome (help / find / reload / address bar).
 *
 * @param {{
 *   enabled?: boolean,
 *   handlers: Partial<Record<import('@/lib/config/posHotkeys').PosHotkeyAction, () => void>>,
 *   onFullscreen?: () => void,
 * }} opts
 */
export function usePosHotkeys({ enabled = true, handlers, onFullscreen }) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined;

        const onKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const fnKey = resolvePosFunctionKey(e);
            if (!fnKey) return;

            if (fnKey === 'F11' && typeof onFullscreen === 'function') {
                e.preventDefault();
                e.stopPropagation();
                onFullscreen();
                return;
            }

            const action = POS_HOTKEY_MAP[fnKey];
            if (!action) return;
            const handler = handlers?.[action];
            if (!handler) return;

            if (shouldBlockPosHotkey(e.target)) return;

            e.preventDefault();
            e.stopPropagation();
            handler();
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [enabled, handlers, onFullscreen]);
}

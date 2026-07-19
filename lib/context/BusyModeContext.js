'use client';

import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';

// --- App Mode: 'easy' for beginners, 'advanced' for power users ---
// Easy (Simple) is the default; users who explicitly switch to Advanced keep it.
const APP_MODE_KEY = 'tenvo_app_mode';

function readStoredAppMode() {
    if (typeof window === 'undefined') return 'easy';
    try {
        return localStorage.getItem(APP_MODE_KEY) === 'advanced' ? 'advanced' : 'easy';
    } catch {
        return 'easy';
    }
}

function readStoredBusyMode() {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem('tenvo_busy_mode') === 'true';
    } catch {
        return false;
    }
}

const BusyModeContext = createContext({
    isBusyMode: false,
    toggleBusyMode: () => { },
    appMode: 'easy',     // 'easy' | 'advanced'
    setAppMode: (_mode) => { },
    isEasyMode: true,
    isAdvancedMode: false,
    modeReady: true,
});

export const useBusyMode = () => useContext(BusyModeContext);
export const useAppMode = () => {
    const ctx = useContext(BusyModeContext);
    return {
        appMode: ctx.appMode,
        setAppMode: ctx.setAppMode,
        isEasyMode: ctx.isEasyMode,
        isAdvancedMode: ctx.isAdvancedMode,
        modeReady: ctx.modeReady,
    };
};

export function BusyModeProvider({ children }) {
    // Client hub: sync-read localStorage so Easy/Advanced Overview paints without a mode skeleton gap.
    const [isBusyMode, setIsBusyMode] = useState(readStoredBusyMode);
    const [appMode, setAppModeState] = useState(readStoredAppMode);
    const [modeReady, setModeReady] = useState(() => typeof window !== 'undefined');

    // Re-sync after mount (covers rare storage timing) without blocking first paint on client.
    useLayoutEffect(() => {
        setIsBusyMode(readStoredBusyMode());
        setAppModeState(readStoredAppMode());
        setModeReady(true);
    }, []);

    const toggleBusyMode = () => {
        setIsBusyMode(prev => {
            const next = !prev;
            localStorage.setItem('tenvo_busy_mode', String(next));
            return next;
        });
    };

    const setAppMode = useCallback((mode) => {
        const validMode = mode === 'easy' ? 'easy' : 'advanced';
        setAppModeState(validMode);
        if (typeof window !== 'undefined') {
            localStorage.setItem(APP_MODE_KEY, validMode);
        }
    }, []);

    return (
        <BusyModeContext.Provider value={{
            isBusyMode,
            toggleBusyMode,
            appMode,
            setAppMode,
            isEasyMode: appMode === 'easy',
            isAdvancedMode: appMode === 'advanced',
            modeReady,
        }}>
            <div className={isBusyMode ? 'busy-mode-active' : 'standard-mode-active'}>
                {children}
            </div>
        </BusyModeContext.Provider>
    );
}

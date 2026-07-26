'use client';

import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';

// --- App Mode: 'easy' for beginners, 'advanced' for power users ---
// Easy (Simple) is the default; users who explicitly switch to Advanced keep it.
const APP_MODE_KEY = 'tenvo_app_mode';
// Easy home layout: single-page retail tiles vs guided multi-tab easy dashboard.
const DASHBOARD_STYLE_KEY = 'tenvo_dashboard_style';

function readStoredAppMode() {
    if (typeof window === 'undefined') return 'easy';
    try {
        return localStorage.getItem(APP_MODE_KEY) === 'advanced' ? 'advanced' : 'easy';
    } catch {
        return 'easy';
    }
}

/** @returns {'retail_simple' | 'guided'} */
function readStoredDashboardStyle() {
    if (typeof window === 'undefined') return 'retail_simple';
    try {
        return localStorage.getItem(DASHBOARD_STYLE_KEY) === 'guided' ? 'guided' : 'retail_simple';
    } catch {
        return 'retail_simple';
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
    dashboardStyle: 'retail_simple', // 'retail_simple' | 'guided'
    setDashboardStyle: (_style) => { },
    isRetailSimpleDashboard: true,
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
        dashboardStyle: ctx.dashboardStyle,
        setDashboardStyle: ctx.setDashboardStyle,
        isRetailSimpleDashboard: ctx.isRetailSimpleDashboard,
        modeReady: ctx.modeReady,
    };
};

export function BusyModeProvider({ children }) {
    // Client hub: sync-read localStorage so Easy/Advanced Overview paints without a mode skeleton gap.
    const [isBusyMode, setIsBusyMode] = useState(readStoredBusyMode);
    const [appMode, setAppModeState] = useState(readStoredAppMode);
    const [dashboardStyle, setDashboardStyleState] = useState(readStoredDashboardStyle);
    const [modeReady, setModeReady] = useState(() => typeof window !== 'undefined');

    // Re-sync after mount (covers rare storage timing) without blocking first paint on client.
    useLayoutEffect(() => {
        setIsBusyMode(readStoredBusyMode());
        setAppModeState(readStoredAppMode());
        setDashboardStyleState(readStoredDashboardStyle());
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

    const setDashboardStyle = useCallback((style) => {
        const validStyle = style === 'guided' ? 'guided' : 'retail_simple';
        setDashboardStyleState(validStyle);
        if (typeof window !== 'undefined') {
            localStorage.setItem(DASHBOARD_STYLE_KEY, validStyle);
        }
        // Retail Simple is an Easy-mode home — flip to Simple when enabling it.
        if (validStyle === 'retail_simple') {
            setAppModeState('easy');
            if (typeof window !== 'undefined') {
                localStorage.setItem(APP_MODE_KEY, 'easy');
            }
        }
    }, []);

    const isEasyMode = appMode === 'easy';

    return (
        <BusyModeContext.Provider value={{
            isBusyMode,
            toggleBusyMode,
            appMode,
            setAppMode,
            isEasyMode,
            isAdvancedMode: appMode === 'advanced',
            dashboardStyle,
            setDashboardStyle,
            isRetailSimpleDashboard: isEasyMode && dashboardStyle === 'retail_simple',
            modeReady,
        }}>
            <div className={isBusyMode ? 'busy-mode-active' : 'standard-mode-active'}>
                {children}
            </div>
        </BusyModeContext.Provider>
    );
}

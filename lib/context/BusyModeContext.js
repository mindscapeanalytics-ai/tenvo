'use client';

import React, { createContext, useContext, useState } from 'react';

const BusyModeContext = createContext({
    isBusyMode: false,
    toggleBusyMode: () => { },
});

export const useBusyMode = () => useContext(BusyModeContext);

export function BusyModeProvider({ children }) {
    const [isBusyMode, setIsBusyMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('tenvo_busy_mode') === 'true';
    });

    const toggleBusyMode = () => {
        setIsBusyMode(prev => {
            const next = !prev;
            localStorage.setItem('tenvo_busy_mode', String(next));
            return next;
        });
    };

    return (
        <BusyModeContext.Provider value={{ isBusyMode, toggleBusyMode }}>
            <div className={isBusyMode ? 'busy-mode-active' : 'standard-mode-active'}>
                {children}
            </div>
        </BusyModeContext.Provider>
    );
}

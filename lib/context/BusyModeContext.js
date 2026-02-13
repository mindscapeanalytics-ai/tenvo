'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const BusyModeContext = createContext({
    isBusyMode: false,
    toggleBusyMode: () => { },
});

export const useBusyMode = () => useContext(BusyModeContext);

export function BusyModeProvider({ children }) {
    const [isBusyMode, setIsBusyMode] = useState(false);

    // Persistence
    useEffect(() => {
        const stored = localStorage.getItem('tenvo_busy_mode');
        if (stored === 'true') setIsBusyMode(true);
    }, []);

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

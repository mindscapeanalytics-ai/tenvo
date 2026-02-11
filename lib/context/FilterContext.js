'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const FilterContext = createContext(undefined);

/**
 * Filter Provider
 * Manages global dashboard filters like Date Range
 */
export function FilterProvider({ children }) {
    const [dateRange, setDateRange] = useState({
        from: startOfDay(subDays(new Date(), 30)),
        to: endOfDay(new Date()),
    });

    const [searchQuery, setSearchQuery] = useState('');

    const value = {
        dateRange,
        setDateRange,
        searchQuery,
        setSearchQuery,
        resetFilters: () => {
            setDateRange({
                from: startOfDay(subDays(new Date(), 30)),
                to: endOfDay(new Date()),
            });
            setSearchQuery('');
        }
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}

'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  getDateRangeFromPreset,
  getDefaultDateRange,
  inferDatePresetKey,
} from '@/lib/utils/datePresets';

const FilterContext = createContext(undefined);

/**
 * Filter Provider
 * Manages global dashboard filters like Date Range + active preset key
 * (so overlapping windows e.g. early-month 7d vs MTD keep the user's choice).
 */
export function FilterProvider({ children }) {
  const [dateRange, setDateRangeState] = useState(() => getDefaultDateRange());
  const [datePresetKey, setDatePresetKey] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');

  const setDateRange = useCallback((range, meta = {}) => {
    if (!range?.from || !range?.to) return;
    setDateRangeState(range);
    if (meta.presetKey) {
      setDatePresetKey(meta.presetKey);
      return;
    }
    setDatePresetKey((prev) => inferDatePresetKey(range, new Date(), prev));
  }, []);

  const applyDatePreset = useCallback((presetKey) => {
    const range = getDateRangeFromPreset(presetKey);
    if (!range) return;
    setDateRangeState(range);
    setDatePresetKey(presetKey);
  }, []);

  const resetFilters = useCallback(() => {
    setDateRangeState(getDefaultDateRange());
    setDatePresetKey('30d');
    setSearchQuery('');
  }, []);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      datePresetKey,
      applyDatePreset,
      searchQuery,
      setSearchQuery,
      resetFilters,
    }),
    [dateRange, setDateRange, datePresetKey, applyDatePreset, searchQuery, resetFilters]
  );

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

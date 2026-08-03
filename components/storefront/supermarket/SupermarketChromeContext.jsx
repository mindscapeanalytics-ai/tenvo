'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SupermarketChromeContext = createContext(null);

export function SupermarketChromeProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const value = useMemo(
    () => ({
      isSidebarOpen,
      isSearchOpen,
      openSidebar,
      closeSidebar,
      openSearch,
      closeSearch,
      setIsSidebarOpen,
      setIsSearchOpen,
    }),
    [isSidebarOpen, isSearchOpen, openSidebar, closeSidebar, openSearch, closeSearch]
  );

  return (
    <SupermarketChromeContext.Provider value={value}>
      {children}
    </SupermarketChromeContext.Provider>
  );
}

export function useSupermarketChrome() {
  const ctx = useContext(SupermarketChromeContext);
  if (!ctx) {
    throw new Error('useSupermarketChrome must be used within SupermarketChromeProvider');
  }
  return ctx;
}

export function useSupermarketChromeOptional() {
  return useContext(SupermarketChromeContext);
}

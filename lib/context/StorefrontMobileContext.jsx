'use client';

import { createContext, useContext } from 'react';

/** @type {import('react').Context<{ embedded: boolean, activeTab: string | null }>} */
export const StorefrontMobileContext = createContext({
  embedded: false,
  activeTab: null,
});

/** True when rendered inside {@link StorefrontTabShell} on mobile storefront tabs. */
export function useStorefrontEmbedded() {
  const ctx = useContext(StorefrontMobileContext);
  return Boolean(ctx?.embedded);
}

export function useStorefrontActiveTab() {
  return useContext(StorefrontMobileContext)?.activeTab ?? null;
}

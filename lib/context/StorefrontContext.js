'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const StorefrontContext = createContext(undefined);

export function StorefrontProvider({ children, business, settings, categories }) {
  const [currency, setCurrency] = useState(settings?.currency || 'PKR');
  const [locale, setLocale] = useState(settings?.locale || 'en-PK');
  
  const value = {
    // Business info
    business,
    businessId: business?.id,
    businessDomain: business?.domain,
    businessName: business?.business_name,
    
    // Settings
    settings,
    currency,
    setCurrency,
    locale,
    setLocale,
    
    // Categories
    categories: categories || [],
    
    // Helper functions
    formatPrice: useCallback((amount) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    }, [currency, locale]),
    
    // Feature flags
    features: {
      wishlist: settings?.features?.wishlist !== false,
      reviews: settings?.features?.reviews !== false,
      liveChat: settings?.features?.liveChat !== false,
      quickView: settings?.features?.quickView !== false,
      backInStock: settings?.features?.backInStock !== false,
    },
  };
  
  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (context === undefined) {
    throw new Error('useStorefront must be used within a StorefrontProvider');
  }
  return context;
}

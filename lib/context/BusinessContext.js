'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { getBusinessByUserId, getBusinessByDomainAndUser } from '@/lib/actions/business';

const BusinessContext = createContext(undefined);

/**
 * Business Context Provider
 * Syncs Better Auth User with their Business record using Server Actions
 */
export function BusinessProvider({ children }) {
    const { data: sessionData, isPending } = authClient.useSession();
    const [business, setBusiness] = useState(null);
    const [role, setRole] = useState('owner'); // Default to owner for dev/testing
    const [isLoading, setIsLoading] = useState(true);

    // Sync business record with logged in user
    useEffect(() => {
        const syncBusiness = async () => {
            // Wait for session to load
            if (isPending) return;

            setIsLoading(true);
            try {
                const user = sessionData?.user;

                if (user) {
                    // 1. Check if URL specifies a business domain: /business/[domain]
                    const pathParts = window.location.pathname.split('/');
                    const domainFromUrl = pathParts[1] === 'business' ? pathParts[2] : null;

                    let result;

                    if (domainFromUrl) {
                        // Use the specific business from URL if authorized
                        result = await getBusinessByDomainAndUser(domainFromUrl, user.id);
                    }

                    // 2. Fallback to latest business if URL doesn't specify or fetch failed
                    if (!result || !result.success) {
                        result = await getBusinessByUserId(user.id);
                    }

                    if (result.success && result.business) {
                        const biz = result.business;
                        setBusiness(biz);
                        // Role is injected by the server action
                        const userRole = biz.user_role || 'salesperson';
                        setRole(userRole);

                        localStorage.setItem('businessData', JSON.stringify(biz));
                        localStorage.setItem('userRole', userRole);
                    } else {
                        // Fallback to localStorage (mostly for offline or weird states)
                        const stored = localStorage.getItem('businessData');
                        const storedRole = localStorage.getItem('userRole');
                        if (stored) setBusiness(JSON.parse(stored));
                        if (storedRole) setRole(storedRole);
                    }
                } else {
                    // Not logged in - clear it
                    setBusiness(null);
                    setRole('salesperson');
                    localStorage.removeItem('businessData');
                    localStorage.removeItem('userRole');
                }
            } catch (error) {
                console.error('Business sync error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        syncBusiness();

        // Listen for route changes to re-sync if domain changes 
        // (Next.js client navigation won't trigger root useEffect usually, 
        // but we can handle it in the dashboard as well for safety, 
        // or add a secondary listener).
    }, [sessionData, isPending]);

    // Helper to get settings safely
    const getSetting = (path, defaultValue) => {
        if (!business?.settings) return defaultValue;

        const keys = path.split('.');
        let current = business.settings;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    };

    // Helper to get currency from settings
    const getCurrency = () => {
        if (!business) return 'PKR';
        return getSetting('financials.currency', 'PKR');
    };

    const currency = getCurrency();
    const currencySymbol = getSetting('financials.currencySymbol', '₨');

    const updateBusiness = (data) => {
        setBusiness(prev => {
            const updated = { ...prev, ...data };
            localStorage.setItem('businessData', JSON.stringify(updated));
            return updated;
        });
    };

    const clearBusiness = () => {
        setBusiness(null);
        setRole('salesperson');
        localStorage.removeItem('businessData');
        localStorage.removeItem('userRole');
    };

    const switchBusinessByDomain = async (domain) => {
        const user = sessionData?.user;
        if (!user || !domain) return;

        setIsLoading(true);
        try {
            const result = await getBusinessByDomainAndUser(domain, user.id);
            if (result.success && result.business) {
                const biz = result.business;
                setBusiness(biz);
                const userRole = biz.user_role || 'salesperson';
                setRole(userRole);

                localStorage.setItem('businessData', JSON.stringify(biz));
                localStorage.setItem('userRole', userRole);
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error) {
            console.error('Switch business error:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        business,
        role,
        updateBusiness,
        clearBusiness,
        getSetting,
        isLoading,
        currency,
        currencySymbol,
        switchBusinessByDomain
    };

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
}

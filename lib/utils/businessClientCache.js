/**
 * Client-side business shell cache (localStorage).
 * UI-only — never used for security; server actions always re-validate role/plan.
 */

import { ALL_ROLES } from '@/lib/rbac/permissions';

const BUSINESS_DATA_KEY = 'businessData';
const USER_ROLE_KEY = 'userRole';
const LAST_DOMAIN_KEY = 'lastBusinessDomain';
export const JOINED_BUSINESSES_KEY = 'joinedBusinesses';

const VALID_ROLES = new Set(ALL_ROLES);

/** Read /business/[domain] from the current browser path (client only). */
export function getBusinessDomainFromWindowPath() {
    if (typeof window === 'undefined') return null;
    const parts = window.location.pathname.split('/');
    return parts[1] === 'business' ? parts[2] || null : null;
}

/** True when cached business matches the URL domain (or URL has no domain segment). */
export function shellMatchesDomain(business, domainFromPath) {
    if (!business?.id) return false;
    if (!domainFromPath) return true;
    const cachedDomain = String(business.domain || '').toLowerCase();
    return cachedDomain === String(domainFromPath).toLowerCase();
}

function normalizeCachedRole(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const role = raw.trim().toLowerCase();
    return VALID_ROLES.has(role) ? role : null;
}

/**
 * @returns {Array<Record<string, unknown>>}
 */
export function readJoinedBusinessesList() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(JOINED_BUSINESSES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        localStorage.removeItem(JOINED_BUSINESSES_KEY);
        return [];
    }
}

/**
 * Persist joined businesses for instant domain switch paint (UI-only).
 * @param {Array<Record<string, unknown>>} businesses
 */
export function persistJoinedBusinessesList(businesses) {
    if (typeof window === 'undefined' || !Array.isArray(businesses) || businesses.length === 0) {
        return;
    }
    try {
        localStorage.setItem(JOINED_BUSINESSES_KEY, JSON.stringify(businesses));
    } catch {
        // quota / private mode
    }
}

/**
 * @param {string | null | undefined} domainFromPath
 * @returns {Record<string, unknown> | null}
 */
export function findJoinedBusinessByDomain(domainFromPath) {
    if (!domainFromPath) return null;
    const target = String(domainFromPath).toLowerCase();
    return (
        readJoinedBusinessesList().find(
            (biz) => String(biz?.domain || '').toLowerCase() === target
        ) || null
    );
}

function readPrimaryBusinessShell(pathDomain) {
    const storedBiz = localStorage.getItem(BUSINESS_DATA_KEY);
    if (!storedBiz) {
        return { business: null, role: null };
    }

    try {
        const parsedBiz = JSON.parse(storedBiz);
        const { user_role: _ur, ...safeBiz } = parsedBiz;
        const business = safeBiz;

        if (!business?.id || !shellMatchesDomain(business, pathDomain)) {
            return { business: null, role: null };
        }

        const lastDomain = localStorage.getItem(LAST_DOMAIN_KEY);
        const cachedRole = normalizeCachedRole(localStorage.getItem(USER_ROLE_KEY));
        const role =
            cachedRole &&
            lastDomain &&
            String(lastDomain).toLowerCase() === String(business.domain || '').toLowerCase()
                ? cachedRole
                : null;

        return { business, role };
    } catch {
        localStorage.removeItem(BUSINESS_DATA_KEY);
        return { business: null, role: null };
    }
}

/**
 * Hydrate optimistic business + role from localStorage.
 * Role is only restored when it matches lastBusinessDomain (prevents cross-tenant bleed).
 * Falls back to the joined-businesses list for multi-tenant domain navigation.
 */
export function readOptimisticBusinessShell(domainFromPath = null) {
    if (typeof window === 'undefined') {
        return { business: null, role: null };
    }

    const pathDomain = domainFromPath ?? getBusinessDomainFromWindowPath();
    const primary = readPrimaryBusinessShell(pathDomain);
    if (primary.business?.id) {
        return primary;
    }

    const joined = findJoinedBusinessByDomain(pathDomain);
    if (!joined?.id) {
        return { business: null, role: null };
    }

    const role = normalizeCachedRole(joined.user_role);
    return { business: joined, role };
}

/** Whether the shell has enough context to render the hub without blocking on network. */
export function hasValidOptimisticShell(business, role, domainFromPath) {
    return Boolean(business?.id && role && shellMatchesDomain(business, domainFromPath));
}

export function persistBusinessShell(business, userRole) {
    if (typeof window === 'undefined' || !business) return;
    try {
        // Ensure approval status is persisted in cache for proper guards
        const shellData = {
            ...business,
            // Explicitly include approval fields for client-side guards
            approval_status: business.approval_status || null,
            approval_requested_at: business.approval_requested_at || null,
            approval_decided_at: business.approval_decided_at || null,
        };
        localStorage.setItem(BUSINESS_DATA_KEY, JSON.stringify(shellData));
    } catch {
        // quota / private mode
    }
    if (userRole) {
        try {
            localStorage.setItem(USER_ROLE_KEY, userRole);
        } catch {
            // ignore
        }
    }
    if (business.domain) {
        try {
            localStorage.setItem(LAST_DOMAIN_KEY, business.domain);
        } catch {
            // ignore
        }
    }
}

export function clearBusinessShell() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(BUSINESS_DATA_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(LAST_DOMAIN_KEY);
}

export function restoreCachedRoleForBusiness(business) {
    if (typeof window === 'undefined' || !business?.domain) return null;
    const lastDomain = localStorage.getItem(LAST_DOMAIN_KEY);
    if (!lastDomain || String(lastDomain).toLowerCase() !== String(business.domain).toLowerCase()) {
        return null;
    }
    return normalizeCachedRole(localStorage.getItem(USER_ROLE_KEY));
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    shellMatchesDomain,
    hasValidOptimisticShell,
    readOptimisticBusinessShell,
    clearBusinessShell,
} from '../businessClientCache';

function createLocalStorageMock() {
    const store = new Map();
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
    };
}

describe('businessClientCache', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createLocalStorageMock());
        vi.stubGlobal('window', {
            location: { pathname: '/business/demo-shop' },
        });
        clearBusinessShell();
    });

    afterEach(() => {
        clearBusinessShell();
        vi.unstubAllGlobals();
    });

    it('shellMatchesDomain accepts matching domains case-insensitively', () => {
        expect(shellMatchesDomain({ id: '1', domain: 'car-dealership' }, 'CAR-DEALERSHIP')).toBe(true);
        expect(shellMatchesDomain({ id: '1', domain: 'car-dealership' }, 'other-shop')).toBe(false);
    });

    it('shellMatchesDomain passes when URL has no domain segment', () => {
        expect(shellMatchesDomain({ id: '1', domain: 'any' }, null)).toBe(true);
    });

    it('hasValidOptimisticShell requires id, role, and domain match', () => {
        expect(
            hasValidOptimisticShell(
                { id: 'biz-1', domain: 'demo-shop' },
                'viewer',
                'demo-shop'
            )
        ).toBe(true);
        expect(
            hasValidOptimisticShell({ id: 'biz-1', domain: 'demo-shop' }, null, 'demo-shop')
        ).toBe(false);
    });

    it('readOptimisticBusinessShell restores role only when lastBusinessDomain matches', () => {
        localStorage.setItem(
            'businessData',
            JSON.stringify({ id: 'biz-1', domain: 'demo-shop', name: 'Demo' })
        );
        localStorage.setItem('userRole', 'manager');
        localStorage.setItem('lastBusinessDomain', 'demo-shop');

        const shell = readOptimisticBusinessShell('demo-shop');
        expect(shell.business?.id).toBe('biz-1');
        expect(shell.role).toBe('manager');
    });

    it('readOptimisticBusinessShell rejects role when domain mismatches cache', () => {
        localStorage.setItem(
            'businessData',
            JSON.stringify({ id: 'biz-1', domain: 'demo-shop', name: 'Demo' })
        );
        localStorage.setItem('userRole', 'owner');
        localStorage.setItem('lastBusinessDomain', 'other-shop');

        const shell = readOptimisticBusinessShell('demo-shop');
        expect(shell.business?.id).toBe('biz-1');
        expect(shell.role).toBeNull();
    });
});

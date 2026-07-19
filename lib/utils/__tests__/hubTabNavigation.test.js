import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import {
  buildHubTabHref,
  syncHubTabUrl,
  navigateHubTab,
  parseHubTabActionUrl,
  resolveHubDomainHandle,
  tryNavigateHubActionUrl,
} from '../hubTabNavigation.js';

describe('hubTabNavigation', () => {
  it('builds dashboard href without tab query', () => {
    expect(buildHubTabHref('demo-boutique', 'dashboard')).toEqual({
      href: '/business/demo-boutique',
      tab: 'dashboard',
      financeView: null,
    });
  });

  it('builds inventory href and resolves finance aliases', () => {
    expect(buildHubTabHref('demo-boutique', 'inventory').href).toBe(
      '/business/demo-boutique?tab=inventory'
    );
    expect(buildHubTabHref('demo-boutique', 'trial-balance')).toEqual({
      href: '/business/demo-boutique?tab=finance&financeView=trial-balance',
      tab: 'finance',
      financeView: 'trial-balance',
    });
  });

  describe('browser shallow sync', () => {
    /** @type {string} */
    let href;
    /** @type {Array<[string, CustomEvent]>} */
    let events;

    beforeEach(() => {
      href = '/business/demo-boutique';
      events = [];
      globalThis.window = {
        location: {
          get pathname() {
            return href.split('?')[0];
          },
          get search() {
            const i = href.indexOf('?');
            return i >= 0 ? href.slice(i) : '';
          },
          origin: 'http://localhost:3000',
        },
        history: {
          state: {},
          pushState(_s, _t, next) {
            href = String(next);
          },
          replaceState(_s, _t, next) {
            href = String(next);
          },
        },
        dispatchEvent(ev) {
          events.push([ev.type, ev]);
          return true;
        },
      };
    });

    afterEach(() => {
      // @ts-expect-error test cleanup
      delete globalThis.window;
    });

    it('syncHubTabUrl uses pushState without no-op when unchanged', () => {
      syncHubTabUrl('/business/demo-boutique?tab=inventory');
      expect(href).toBe('/business/demo-boutique?tab=inventory');
      syncHubTabUrl('/business/demo-boutique?tab=inventory');
      expect(href).toBe('/business/demo-boutique?tab=inventory');
    });

    it('navigateHubTab dispatches switch-tab with shallow flag then updates URL', () => {
      const result = navigateHubTab({ domain: 'demo-boutique', tab: 'finance' });
      expect(result.type).toBe('tab');
      expect(result.tab).toBe('finance');
      expect(events[0]?.[0]).toBe('switch-tab');
      expect(events[0]?.[1]?.detail?.shallow).toBe(true);
      expect(href).toBe('/business/demo-boutique?tab=finance');
    });

    it('navigateHubTab returns route for platform-admin', () => {
      const result = navigateHubTab({ domain: 'demo-boutique', tab: 'platform-admin' });
      expect(result).toEqual({ type: 'route', href: '/admin' });
      expect(events).toHaveLength(0);
    });

    it('parseHubTabActionUrl accepts same-tenant hub links', () => {
      href = '/business/demo-boutique?tab=dashboard';
      expect(parseHubTabActionUrl('/business/demo-boutique?tab=inventory')).toEqual({
        tab: 'inventory',
        financeView: null,
        domain: 'demo-boutique',
      });
      expect(parseHubTabActionUrl('/business/other?tab=inventory')).toBeNull();
      expect(parseHubTabActionUrl('/business/demo-boutique/manufacturing')).toBeNull();
    });

    it('resolveHubDomainHandle reads path', () => {
      href = '/business/demo-marine?tab=pos';
      expect(resolveHubDomainHandle()).toBe('demo-marine');
    });

    it('tryNavigateHubActionUrl shallow-navigates same-tenant links', () => {
      href = '/business/demo-boutique';
      expect(tryNavigateHubActionUrl('/business/demo-boutique?tab=orders')).toBe(true);
      expect(href).toBe('/business/demo-boutique?tab=orders');
      expect(tryNavigateHubActionUrl('https://example.com/x')).toBe(false);
    });
  });
});

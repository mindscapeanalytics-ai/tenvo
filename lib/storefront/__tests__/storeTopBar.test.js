import { describe, expect, it } from 'vitest';
import {
  normalizeStoreTopBarForForm,
  resolveStoreTopBarConfig,
} from '../storeTopBar.js';

describe('storeTopBar', () => {
  it('defaults phone off and top bar on', () => {
    expect(resolveStoreTopBarConfig({})).toEqual({
      enabled: true,
      showPhone: false,
      showCity: true,
    });
  });

  it('reads nested storefront flags', () => {
    expect(
      resolveStoreTopBarConfig({
        storefront: { showTopBarPhone: true, showTopBarCity: false },
      }),
    ).toEqual({
      enabled: true,
      showPhone: true,
      showCity: false,
    });
  });

  it('reads flat form flags', () => {
    expect(resolveStoreTopBarConfig({ showTopBarPhone: true, showTopBar: false })).toEqual({
      enabled: false,
      showPhone: true,
      showCity: true,
    });
  });

  it('normalizes form payload', () => {
    expect(normalizeStoreTopBarForForm({ showTopBarPhone: true })).toEqual({
      showTopBar: true,
      showTopBarPhone: true,
      showTopBarCity: true,
    });
  });
});

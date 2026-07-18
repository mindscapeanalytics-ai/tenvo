import { describe, it, expect } from 'vitest';
import {
  resolveFormDefaultTaxRate,
  getBusinessRegionalPack,
} from '@/lib/utils/businessRegionalContext';
import { buildRegionalTaxCategoryDefaults } from '@/lib/utils/regionalHelpers';

describe('businessRegionalContext', () => {
  it('uses UAE VAT rate for AE-registered business without domain override', () => {
    const business = {
      country: 'United Arab Emirates',
      settings: {
        registration: { country_iso: 'AE', country_name: 'United Arab Emirates' },
      },
    };
    expect(getBusinessRegionalPack(business).currency).toBe('AED');
    expect(getBusinessRegionalPack(business).defaultTaxRate).toBe(5);
    expect(resolveFormDefaultTaxRate(business, 'retail-shop')).toBe(5);
  });

  it('defaults taxEnabled true and zeros rates when financials.taxEnabled is false', () => {
    const enabled = {
      country: 'Pakistan',
      settings: {
        registration: { country_iso: 'PK' },
        financials: {},
      },
    };
    expect(getBusinessRegionalPack(enabled).taxEnabled).toBe(true);
    expect(getBusinessRegionalPack(enabled).defaultTaxRate).toBeGreaterThan(0);

    const disabled = {
      country: 'Pakistan',
      settings: {
        registration: { country_iso: 'PK' },
        financials: { taxEnabled: false, defaultTaxRate: 18 },
      },
    };
    const pack = getBusinessRegionalPack(disabled);
    expect(pack.taxEnabled).toBe(false);
    expect(pack.defaultTaxRate).toBe(0);
    expect(resolveFormDefaultTaxRate(disabled, 'retail-shop')).toBe(0);
  });

  it('builds tax categories from country registry only', () => {
    const ae = buildRegionalTaxCategoryDefaults('AE');
    expect(ae[0]).toContain('VAT');
    expect(ae[0]).toContain('5%');
    const us = buildRegionalTaxCategoryDefaults('US');
    expect(us).toContain('Standard');
  });
});

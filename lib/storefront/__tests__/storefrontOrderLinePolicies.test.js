import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/storefront/pharmacyStorefront', () => ({
  isPharmacyElevatedStore: (category) => category === 'pharmacy',
}));

vi.mock('@/lib/storefront/pharmacyProducts', () => ({
  isPrescriptionRequiredProduct: (p) => Boolean(p?.domain_data?.requires_prescription),
}));

vi.mock('@/lib/storefront/fitnessStorefront', () => ({
  isFitnessElevatedStore: (category) => category === 'gym-fitness',
  isFitnessBookableProduct: (p) => Boolean(p?.domain_data?.bookable),
}));

import { collectStorefrontOrderLinePolicyIssues } from '@/lib/storefront/storefrontOrderLinePolicies';

describe('storefrontOrderLinePolicies', () => {
  const client = { query: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks pharmacy Rx products', async () => {
    client.query.mockResolvedValue({
      rows: [
        {
          id: 'p1',
          name: 'Amoxicillin',
          domain_data: { requires_prescription: true },
        },
      ],
    });

    const issues = await collectStorefrontOrderLinePolicyIssues(
      client,
      'biz',
      'pharmacy',
      [{ productId: 'p1' }]
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/prescription/i);
  });

  it('blocks fitness bookables', async () => {
    client.query.mockResolvedValue({
      rows: [
        {
          id: 'p2',
          name: 'Annual Membership',
          domain_data: { bookable: true },
        },
      ],
    });

    const issues = await collectStorefrontOrderLinePolicyIssues(
      client,
      'biz',
      'gym-fitness',
      [{ productId: 'p2' }]
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/booking/i);
  });

  it('allows normal retail lines', async () => {
    client.query.mockResolvedValue({
      rows: [{ id: 'p3', name: 'Protein', domain_data: {} }],
    });

    const issues = await collectStorefrontOrderLinePolicyIssues(
      client,
      'biz',
      'gym-fitness',
      [{ productId: 'p3' }]
    );

    expect(issues).toHaveLength(0);
  });
});

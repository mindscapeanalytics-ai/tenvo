/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaxCalculationsWidget } from '../TaxCalculationsWidget';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/lib/actions/dashboard/widgets', () => ({
  getTaxCalculations: vi.fn(),
}));

vi.mock('@/lib/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount, currency) => `${currency} ${amount.toLocaleString()}`,
}));

vi.mock('@/lib/translations', () => ({
  translations: {
    en: {
      tax_calculations: 'Tax Calculations',
      pst_fst_calculations: 'PST/FST calculations',
      taxable_sales: 'Taxable Sales',
      pst: 'PST',
      fst: 'FST',
      total_tax_liability: 'Total Tax Liability',
      paid: 'Paid',
      pending: 'Pending',
      view_detailed_calculations: 'View Detailed Calculations',
      last_updated: 'Last updated',
      no_tax_data: 'No tax data available',
    },
  },
}));

import { getTaxCalculations } from '@/lib/actions/dashboard/widgets';

const mockTaxData = {
  totalSales: 2450000,
  taxableAmount: 2450000,
  pst: { rate: 17, amount: 416500 },
  fst: { rate: 1, amount: 24500 },
  totalTax: 441000,
  taxPaid: 400000,
  taxPending: 41000,
  nextFilingDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
};

describe('TaxCalculationsWidget', () => {
  beforeEach(() => {
    vi.mocked(getTaxCalculations).mockResolvedValue({ success: true, data: null });
  });

  it('should render loading skeleton before fetch settles', () => {
    vi.mocked(getTaxCalculations).mockImplementationOnce(() => new Promise(() => {}));
    render(<TaxCalculationsWidget businessId="test-business" />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should render tax calculations with provided data', () => {
    render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="PKR" />,
    );
    expect(screen.getAllByText('Tax Calculations').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PST/FST calculations').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Taxable Sales').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 2,450,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/PST/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 416,500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/FST/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 24,500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Total Tax Liability').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 441,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paid').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 400,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PKR 41,000').length).toBeGreaterThanOrEqual(1);
  });

  it('should display correct PST and FST rates', () => {
    render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="PKR" />,
    );
    expect(screen.getAllByText(/PST.*17%/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/FST.*1%/).length).toBeGreaterThanOrEqual(1);
  });

  it('should call onViewDetails when quick action is clicked', () => {
    const mockOnViewDetails = vi.fn();
    render(
      <TaxCalculationsWidget
        businessId="test-business"
        data={mockTaxData}
        currency="PKR"
        onViewDetails={mockOnViewDetails}
      />,
    );
    const viewDetailsButton = screen.getAllByRole('button', { name: /View Detailed Calculations/i })[0];
    fireEvent.click(viewDetailsButton);
    expect(mockOnViewDetails).toHaveBeenCalledWith('view-tax-details');
  });

  it('should render empty state when no data is provided', async () => {
    render(<TaxCalculationsWidget businessId="test-business" data={null} />);
    await waitFor(() => {
      expect(screen.getByText('No tax data available')).toBeInTheDocument();
    });
  });

  it('should display last updated timestamp', () => {
    render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="PKR" />,
    );
    expect(screen.getAllByText(/Last updated:/).length).toBeGreaterThanOrEqual(1);
  });

  it('should use correct currency formatting', () => {
    render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="USD" />,
    );
    expect(screen.getByText('USD 2,450,000')).toBeInTheDocument();
  });

  it('should render with glass-card styling', () => {
    const { container } = render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="PKR" />,
    );
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
  });

  it('should display calculator icon', () => {
    const { container } = render(
      <TaxCalculationsWidget businessId="test-business" data={mockTaxData} currency="PKR" />,
    );
    const iconContainer = container.querySelector('.bg-wine-50');
    expect(iconContainer).toBeInTheDocument();
  });
});

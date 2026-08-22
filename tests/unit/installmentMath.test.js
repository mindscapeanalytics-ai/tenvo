import { describe, it, expect } from 'vitest';
import { calculateInstallmentSummary, generateInstallmentSchedule } from '@/lib/utils/installmentMath';

describe('Installment Math & Financial Calculations Engine', () => {
  it('calculates 20% down payment and 24 monthly installments correctly', () => {
    const summary = calculateInstallmentSummary({
      totalPrice: 500000,
      downPaymentPct: 20,
      markupRatePct: 18,
      tenureMonths: 24,
      frequency: 'monthly',
    });

    expect(summary.totalPrice).toBe(500000);
    expect(summary.downPaymentAmount).toBe(100000); // 20% of 500k
    expect(summary.financedAmount).toBe(400000); // 500k - 100k
    expect(summary.markupAmount).toBe(72000); // 18% of 400k
    expect(summary.totalFinancedPayable).toBe(472000); // 400k + 72k
    expect(summary.totalContractPayable).toBe(572000); // 100k + 472k
    expect(summary.numberOfInstallments).toBe(24);
    expect(summary.installmentAmount).toBe(19667); // round(472000 / 24)
  });

  it('calculates 3-monthly (quarterly) installments correctly', () => {
    const summary = calculateInstallmentSummary({
      totalPrice: 600000,
      downPaymentPct: 25,
      markupRatePct: 20,
      tenureMonths: 24,
      frequency: 'quarterly',
    });

    expect(summary.downPaymentAmount).toBe(150000); // 25% of 600k
    expect(summary.financedAmount).toBe(450000);
    expect(summary.markupAmount).toBe(90000); // 20% of 450k
    expect(summary.numberOfInstallments).toBe(8); // 24 months / 3 months = 8 quarterly payments
    expect(summary.installmentAmount).toBe(67500); // (450k + 90k) / 8
  });

  it('calculates yearly installments correctly', () => {
    const summary = calculateInstallmentSummary({
      totalPrice: 1000000,
      downPaymentAmount: 300000,
      markupRatePct: 15,
      tenureMonths: 36,
      frequency: 'yearly',
    });

    expect(summary.downPaymentAmount).toBe(300000);
    expect(summary.financedAmount).toBe(700000);
    expect(summary.markupAmount).toBe(105000); // 15% of 700k
    expect(summary.numberOfInstallments).toBe(3); // 36 months / 12 = 3 yearly payments
    expect(summary.installmentAmount).toBe(268333); // (700k + 105k) / 3 rounded
  });

  it('generates schedule with exact due dates and amounts', () => {
    const startDate = '2026-09-01';
    const schedule = generateInstallmentSchedule({
      startDate,
      numberOfInstallments: 3,
      installmentAmount: 50000,
      totalFinancedPayable: 150000,
      frequency: 'monthly',
      includeDownPaymentEntry: false,
    });

    expect(schedule).toHaveLength(3);
    expect(schedule[0].installment_no).toBe(1);
    expect(schedule[0].due_date).toBe('2026-09-01');
    expect(schedule[0].amount).toBe(50000);
    expect(schedule[0].status).toBe('pending');

    expect(schedule[1].due_date).toBe('2026-10-01');
    expect(schedule[2].due_date).toBe('2026-11-01');
  });

  it('generates Installment #0 for Advance / Down Payment when requested', () => {
    const startDate = '2026-09-01';
    const schedule = generateInstallmentSchedule({
      startDate,
      numberOfInstallments: 3,
      installmentAmount: 50000,
      totalFinancedPayable: 150000,
      frequency: 'monthly',
      includeDownPaymentEntry: true,
      downPaymentAmount: 100000,
      downPaymentPaid: true,
      downPaymentMethod: 'Bank Transfer',
    });

    expect(schedule).toHaveLength(4); // Installment #0 + 3 monthly installments
    expect(schedule[0].installment_no).toBe(0);
    expect(schedule[0].type).toBe('down_payment');
    expect(schedule[0].amount).toBe(100000);
    expect(schedule[0].status).toBe('paid');
    expect(schedule[0].payment_method).toBe('Bank Transfer');

    expect(schedule[1].installment_no).toBe(1);
    expect(schedule[1].type).toBe('monthly');
    expect(schedule[1].amount).toBe(50000);
    expect(schedule[1].status).toBe('pending');
  });
});


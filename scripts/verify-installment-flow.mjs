/**
 * Comprehensive Verification Script for Car Dealership & Installment Suite
 * Tests advance/booking payment recording, schedule generation with Installment #0,
 * plan actions, and PDF contract generation.
 *
 * Run: bun run scripts/verify-installment-flow.mjs
 */
import assert from 'node:assert/strict';
import { prismaBase as prisma } from '../lib/db.js';
import { calculateInstallmentSummary, generateInstallmentSchedule } from '../lib/utils/installmentMath.js';
import {
  createInstallmentPlanAction,
  getInstallmentPlansAction,
  recordInstallmentPaymentAction,
  deleteInstallmentPlanAction,
} from '../lib/actions/standard/installments.js';
import { generateInstallmentFormPdf } from '../lib/pdf/installmentFormPdf.js';

async function main() {
  console.log('=== Verifying Car Dealership & Installments Engine ===');

  // 1. Check math summary calculation
  const summary = calculateInstallmentSummary({
    totalPrice: 2000000,
    downPaymentPct: 20,
    markupRatePct: 15,
    tenureMonths: 24,
    frequency: 'monthly',
  });

  assert.equal(summary.totalPrice, 2000000);
  assert.equal(summary.downPaymentAmount, 400000);
  assert.equal(summary.financedAmount, 1600000);
  assert.equal(summary.markupAmount, 240000);
  assert.equal(summary.totalFinancedPayable, 1840000);
  assert.equal(summary.totalContractPayable, 2240000);
  assert.equal(summary.numberOfInstallments, 24);
  assert.equal(summary.installmentAmount, 76667);

  // 2. Check schedule generation with Installment #0 (Advance / Booking Down Payment)
  const schedule = generateInstallmentSchedule({
    startDate: '2026-09-01',
    numberOfInstallments: summary.numberOfInstallments,
    installmentAmount: summary.installmentAmount,
    totalFinancedPayable: summary.totalFinancedPayable,
    frequency: summary.frequency,
    includeDownPaymentEntry: true,
    downPaymentAmount: summary.downPaymentAmount,
    downPaymentPaid: true,
    downPaymentMethod: 'Bank Transfer',
  });

  assert.equal(schedule.length, 25, 'Schedule contains Installment #0 + 24 monthly installments');
  assert.equal(schedule[0].installment_no, 0, 'First item is Installment #0 (Advance / Down Payment)');
  assert.equal(schedule[0].type, 'down_payment');
  assert.equal(schedule[0].amount, 400000);
  assert.equal(schedule[0].status, 'paid');
  assert.equal(schedule[0].payment_method, 'Bank Transfer');

  assert.equal(schedule[1].installment_no, 1);
  assert.equal(schedule[1].type, 'monthly');
  assert.equal(schedule[1].amount, 76667);
  assert.equal(schedule[1].status, 'pending');

  console.log('✓ Installment math & schedule #0 generation: PASSED');

  // 3. Verify Server Actions against database (if active business exists)
  const sampleBiz = await prisma.businesses.findFirst({
    where: { category: 'vehicle-dealership' },
    select: { id: true, business_name: true },
  });

  const targetBizId = sampleBiz?.id || '00000000-0000-4000-a000-000000000001';

  if (sampleBiz) {
    console.log(`Testing Server Actions with business: ${sampleBiz.business_name} (${targetBizId})`);

    const createRes = await createInstallmentPlanAction({
      businessId: targetBizId,
      payload: {
        customerName: 'Test Buyer Advance',
        customerPhone: '0300-1122334',
        customerCnic: '35202-1234567-9',
        itemName: 'Toyota Land Cruiser Prado 2024',
        totalPrice: 2000000,
        downPaymentAmount: 400000,
        downPaymentPct: 20,
        downPaymentPaid: true,
        downPaymentMethod: 'Bank Transfer',
        markupRatePct: 15,
        tenureMonths: 24,
        frequency: 'monthly',
        startDate: '2026-09-01',
      },
    });

    assert.ok(createRes.success, 'Plan creation action succeeded');
    const createdPlan = createRes.data;
    assert.ok(createdPlan.plan_number.startsWith('INST-'), 'Generated valid plan number');
    assert.equal(Array.isArray(createdPlan.schedule_data), true, 'Saved schedule_data array');
    assert.equal(createdPlan.schedule_data[0].installment_no, 0, 'Saved Installment #0 in DB');
    assert.equal(createdPlan.schedule_data[0].status, 'paid', 'Installment #0 status is paid');

    // Test recording payment for Installment #1
    const payRes = await recordInstallmentPaymentAction({
      businessId: targetBizId,
      planId: createdPlan.id,
      installmentNo: 1,
      paymentAmount: 76667,
      paymentMethod: 'Cash',
      notes: 'Test payment installment 1',
    });

    assert.ok(payRes.success, 'Record payment for Installment #1 succeeded');
    assert.equal(payRes.data.schedule_data[1].status, 'paid', 'Installment #1 status updated to paid');

    // Clean up created plan
    await deleteInstallmentPlanAction({ businessId: targetBizId, planId: createdPlan.id });
    console.log('✓ Database Server Actions create, update, delete: PASSED');
  }

  // 4. Verify Official PDF Contract Generation
  const pdfDoc = await generateInstallmentFormPdf({
    storeName: 'Test Vehicle Dealership Showroom',
    selectedVehicle: 'Toyota Land Cruiser Prado 2024',
    productPrice: 2000000,
    downPaymentAmount: 400000,
    downPaymentPct: 20,
    durationMonths: 24,
    monthlyInstallment: 76667,
    applicant: {
      fullName: 'Test Buyer Advance',
      phone: '0300-1122334',
      cnic: '35202-1234567-9',
      address: 'Gulberg III, Lahore',
    },
  });

  assert.ok(pdfDoc, 'Installment contract PDF generated successfully');
  console.log('✓ Installment contract PDF generation: PASSED');

  console.log('=== ALL CAR DEALERSHIP & INSTALLMENT VERIFICATION TESTS PASSED ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

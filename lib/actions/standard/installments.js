'use server';

import { prismaBase as prisma } from '@/lib/db';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { calculateInstallmentSummary, generateInstallmentSchedule } from '@/lib/utils/installmentMath';

let tableEnsured = false;
async function ensureInstallmentPlansTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "installment_plans" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "business_id" UUID NOT NULL,
        "plan_number" VARCHAR(100) NOT NULL,
        "customer_id" UUID,
        "customer_name" VARCHAR(255) NOT NULL,
        "customer_phone" VARCHAR(100),
        "customer_cnic" VARCHAR(100),
        "customer_address" TEXT,
        "guarantor_name" VARCHAR(255),
        "guarantor_phone" VARCHAR(100),
        "guarantor_cnic" VARCHAR(100),
        "product_id" UUID,
        "item_name" VARCHAR(255) NOT NULL,
        "item_details" TEXT,
        "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "down_payment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "down_payment_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "financed_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "markup_rate_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "markup_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "total_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "frequency" VARCHAR(30) NOT NULL DEFAULT 'monthly',
        "tenure_months" INTEGER NOT NULL DEFAULT 12,
        "number_of_installments" INTEGER NOT NULL DEFAULT 12,
        "installment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'active',
        "notes" TEXT,
        "schedule_data" JSONB DEFAULT '[]',
        "domain_data" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "idx_installment_plan_business" ON "installment_plans"("business_id");
      CREATE INDEX IF NOT EXISTS "idx_installment_plan_status" ON "installment_plans"("business_id", "status");
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn('[ensureInstallmentPlansTable] warning:', err?.message || err);
  }
}

/**
 * Creates a new installment plan contract.
 * @param {object} params
 * @param {string} params.businessId
 * @param {object} params.payload
 */
export async function createInstallmentPlanAction({ businessId, payload }) {
  try {
    if (!businessId) {
      return { success: false, error: 'Business ID is required' };
    }
    await ensureInstallmentPlansTable();

    const {
      customerId,
      customerName,
      customerPhone,
      customerCnic,
      customerAddress,
      guarantorName,
      guarantorPhone,
      guarantorCnic,
      productId,
      itemName,
      itemDetails,
      totalPrice = 0,
      downPaymentAmount = 0,
      downPaymentPct = 20,
      downPaymentPaid = true,
      downPaymentMethod = 'Cash',
      downPaymentNotes = 'Advance / Booking Down Payment',
      markupRatePct = 20,
      tenureMonths = 24,
      frequency = 'monthly',
      startDate = new Date().toISOString().split('T')[0],
      notes = '',
    } = payload || {};

    if (!customerName || !customerName.trim()) {
      return { success: false, error: 'Customer name is required' };
    }
    if (!itemName || !itemName.trim()) {
      return { success: false, error: 'Item / vehicle model name is required' };
    }

    // Run calculation math
    const summary = calculateInstallmentSummary({
      totalPrice: Number(totalPrice),
      downPaymentAmount: Number(downPaymentAmount),
      downPaymentPct: Number(downPaymentPct),
      markupRatePct: Number(markupRatePct),
      tenureMonths: Number(tenureMonths),
      frequency,
    });

    // Generate schedule JSON including Installment #0 (Advance / Down Payment)
    const schedule = generateInstallmentSchedule({
      startDate: new Date(startDate),
      numberOfInstallments: summary.numberOfInstallments,
      installmentAmount: summary.installmentAmount,
      totalFinancedPayable: summary.totalFinancedPayable,
      frequency: summary.frequency,
      includeDownPaymentEntry: true,
      downPaymentAmount: summary.downPaymentAmount,
      downPaymentPaid,
      downPaymentMethod,
      downPaymentNotes,
    });

    // Auto-generate plan number e.g. INST-2026-XXXX
    const count = await prisma.installment_plans.count({
      where: { business_id: businessId },
    });
    const planNumber = `INST-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const plan = await prisma.installment_plans.create({
      data: {
        business_id: businessId,
        plan_number: planNumber,
        customer_id: customerId || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone?.trim() || null,
        customer_cnic: customerCnic?.trim() || null,
        customer_address: customerAddress?.trim() || null,
        guarantor_name: guarantorName?.trim() || null,
        guarantor_phone: guarantorPhone?.trim() || null,
        guarantor_cnic: guarantorCnic?.trim() || null,
        product_id: productId || null,
        item_name: itemName.trim(),
        item_details: itemDetails?.trim() || null,
        total_price: summary.totalPrice,
        down_payment_amount: summary.downPaymentAmount,
        down_payment_pct: summary.downPaymentPct,
        financed_amount: summary.financedAmount,
        markup_rate_pct: summary.markupRatePct,
        markup_amount: summary.markupAmount,
        total_payable: summary.totalContractPayable,
        frequency: summary.frequency,
        tenure_months: summary.tenureMonths,
        number_of_installments: summary.numberOfInstallments,
        installment_amount: summary.installmentAmount,
        start_date: new Date(startDate),
        status: 'active',
        notes: notes?.trim() || null,
        schedule_data: schedule,
      },
    });

    return {
      success: true,
      data: serializeDecimalsDeep(plan),
    };
  } catch (err) {
    console.error('[createInstallmentPlanAction] error:', err);
    return { success: false, error: err.message || 'Failed to create installment plan' };
  }
}

/**
 * Fetches installment plans for a business.
 * @param {object} params
 * @param {string} params.businessId
 * @param {string} [params.search]
 * @param {string} [params.status]
 * @param {string} [params.frequency]
 */
export async function getInstallmentPlansAction({ businessId, search = '', status = 'all', frequency = 'all' }) {
  try {
    if (!businessId) {
      return { success: false, error: 'Business ID is required', data: [] };
    }
    await ensureInstallmentPlansTable();

    const where = {
      business_id: businessId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (frequency && frequency !== 'all') {
      where.frequency = frequency;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { customer_name: { contains: query, mode: 'insensitive' } },
        { customer_phone: { contains: query, mode: 'insensitive' } },
        { customer_cnic: { contains: query, mode: 'insensitive' } },
        { plan_number: { contains: query, mode: 'insensitive' } },
        { item_name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const plans = await prisma.installment_plans.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    return {
      success: true,
      data: serializeDecimalsDeep(plans),
    };
  } catch (err) {
    console.error('[getInstallmentPlansAction] error:', err);
    return { success: false, error: err.message || 'Failed to fetch installment plans', data: [] };
  }
}

/**
 * Records payment for a specific installment number in a plan.
 * @param {object} params
 * @param {string} params.businessId
 * @param {string} params.planId
 * @param {number} params.installmentNo
 * @param {number} params.paymentAmount
 * @param {string} [params.paymentMethod='Cash']
 * @param {string} [params.notes='']
 */
export async function recordInstallmentPaymentAction({
  businessId,
  planId,
  installmentNo,
  paymentAmount,
  paymentMethod = 'Cash',
  notes = '',
}) {
  try {
    if (!businessId || !planId || installmentNo === undefined || installmentNo === null) {
      return { success: false, error: 'Missing required parameters' };
    }
    await ensureInstallmentPlansTable();

    const existingPlan = await prisma.installment_plans.findFirst({
      where: { id: planId, business_id: businessId },
    });

    if (!existingPlan) {
      return { success: false, error: 'Installment plan not found' };
    }

    const schedule = Array.isArray(existingPlan.schedule_data) ? [...existingPlan.schedule_data] : [];
    const itemIndex = schedule.findIndex((s) => Number(s.installment_no) === Number(installmentNo));

    if (itemIndex === -1) {
      return { success: false, error: `Installment #${installmentNo} not found in schedule` };
    }

    const item = { ...schedule[itemIndex] };
    const paidAmt = Number(paymentAmount) || Number(item.amount);

    item.status = 'paid';
    item.paid_amount = paidAmt;
    item.paid_date = new Date().toISOString().split('T')[0];
    item.payment_method = paymentMethod || 'Cash';
    item.notes = notes || '';

    schedule[itemIndex] = item;

    // Check if all installments in schedule are paid
    const allPaid = schedule.every((s) => s.status === 'paid');
    const newStatus = allPaid ? 'completed' : existingPlan.status;

    const updatedPlan = await prisma.installment_plans.update({
      where: { id: planId },
      data: {
        schedule_data: schedule,
        status: newStatus,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: serializeDecimalsDeep(updatedPlan),
    };
  } catch (err) {
    console.error('[recordInstallmentPaymentAction] error:', err);
    return { success: false, error: err.message || 'Failed to record installment payment' };
  }
}

/**
 * Deletes or cancels an installment plan.
 * @param {object} params
 * @param {string} params.businessId
 * @param {string} params.planId
 */
export async function deleteInstallmentPlanAction({ businessId, planId }) {
  try {
    if (!businessId || !planId) {
      return { success: false, error: 'Business ID and Plan ID are required' };
    }
    await ensureInstallmentPlansTable();

    const existingPlan = await prisma.installment_plans.findFirst({
      where: { id: planId, business_id: businessId },
    });

    if (!existingPlan) {
      return { success: false, error: 'Installment plan not found' };
    }

    await prisma.installment_plans.delete({
      where: { id: planId },
    });

    return { success: true };
  } catch (err) {
    console.error('[deleteInstallmentPlanAction] error:', err);
    return { success: false, error: err.message || 'Failed to delete installment plan' };
  }
}

/**
 * Installment Math Engine & Financial Calculations
 * Supports Monthly, 3-Monthly (Quarterly), and Yearly frequencies.
 */

/**
 * Calculates installment plan financial summary.
 * @param {object} params
 * @param {number} params.totalPrice Total Cash / Agreed price
 * @param {number} [params.downPaymentPct=20] Down payment percentage (0-100)
 * @param {number|null} [params.downPaymentAmount] Fixed down payment amount (if specified, overrides downPaymentPct calculation)
 * @param {number} [params.markupRatePct=20] Total markup / profit rate percentage for the tenure
 * @param {number} [params.tenureMonths=24] Total tenure in months (e.g. 6, 12, 18, 24, 36, 48, 60)
 * @param {'monthly'|'quarterly'|'yearly'} [params.frequency='monthly'] Payment interval
 */
export function calculateInstallmentSummary({
  totalPrice = 0,
  downPaymentPct = 20,
  downPaymentAmount = null,
  markupRatePct = 20,
  tenureMonths = 24,
  frequency = 'monthly',
}) {
  const price = Math.max(0, Number(totalPrice) || 0);
  const tenure = Math.max(1, Number(tenureMonths) || 12);
  const markupPct = Math.max(0, Number(markupRatePct) || 0);

  // Down Payment calculation
  let downPayment = 0;
  let effectiveDownPct = 0;

  if (downPaymentAmount !== null && downPaymentAmount !== undefined && !isNaN(Number(downPaymentAmount))) {
    downPayment = Math.min(price, Math.max(0, Number(downPaymentAmount)));
    effectiveDownPct = price > 0 ? Number(((downPayment / price) * 100).toFixed(2)) : 0;
  } else {
    effectiveDownPct = Math.min(100, Math.max(0, Number(downPaymentPct) || 0));
    downPayment = Math.round(price * (effectiveDownPct / 100));
  }

  // Financed principal
  const financedAmount = Math.max(0, price - downPayment);

  // Total Markup / Profit Amount
  const markupAmount = Math.round(financedAmount * (markupPct / 100));

  // Total Financed Payable (Principal + Markup)
  const totalFinancedPayable = financedAmount + markupAmount;

  // Total Contract Value (Down Payment + Financed Principal + Markup)
  const totalContractPayable = downPayment + totalFinancedPayable;

  // Number of Installments based on frequency
  let numberOfInstallments = tenure;
  let intervalMonths = 1;

  if (frequency === 'quarterly' || frequency === '3-monthly') {
    intervalMonths = 3;
    numberOfInstallments = Math.max(1, Math.ceil(tenure / 3));
  } else if (frequency === 'yearly') {
    intervalMonths = 12;
    numberOfInstallments = Math.max(1, Math.ceil(tenure / 12));
  } else {
    frequency = 'monthly';
    intervalMonths = 1;
    numberOfInstallments = tenure;
  }

  // Installment Amount per period
  const installmentAmount = numberOfInstallments > 0 ? Math.round(totalFinancedPayable / numberOfInstallments) : 0;

  return {
    totalPrice: price,
    downPaymentPct: effectiveDownPct,
    downPaymentAmount: downPayment,
    financedAmount,
    markupRatePct: markupPct,
    markupAmount,
    totalFinancedPayable,
    totalContractPayable,
    tenureMonths: tenure,
    frequency,
    intervalMonths,
    numberOfInstallments,
    installmentAmount,
  };
}

/**
 * Generates an array of scheduled installment payment items.
 * @param {object} params
 * @param {string|Date} [params.startDate] Starting date of contract / 1st payment
 * @param {number} params.numberOfInstallments Number of payments
 * @param {number} params.installmentAmount Amount per installment
 * @param {number|null} [params.totalFinancedPayable] Total amount to distribute
 * @param {'monthly'|'quarterly'|'yearly'} [params.frequency='monthly'] Interval
 * @param {boolean} [params.includeDownPaymentEntry=true] Whether to generate Installment #0 for Down Payment / Advance Booking
 * @param {number} [params.downPaymentAmount=0] Amount of down payment
 * @param {boolean} [params.downPaymentPaid=true] Whether down payment is already collected
 * @param {string} [params.downPaymentMethod='Cash'] Payment method for down payment
 * @param {string} [params.downPaymentNotes='Advance / Booking Down Payment'] Notes for down payment
 * @returns {Array<object>} Schedule items
 */
export function generateInstallmentSchedule({
  startDate = new Date(),
  numberOfInstallments = 12,
  installmentAmount = 0,
  totalFinancedPayable = null,
  frequency = 'monthly',
  includeDownPaymentEntry = true,
  downPaymentAmount = 0,
  downPaymentPaid = true,
  downPaymentMethod = 'Cash',
  downPaymentNotes = 'Advance / Booking Down Payment',
}) {
  const count = Math.max(1, Number(numberOfInstallments) || 12);
  const baseAmount = Number(installmentAmount) || 0;
  const start = startDate ? new Date(startDate) : new Date();

  let intervalMonths = 1;
  if (frequency === 'quarterly' || frequency === '3-monthly') {
    intervalMonths = 3;
  } else if (frequency === 'yearly') {
    intervalMonths = 12;
  }

  const schedule = [];
  const startIso = start.toISOString().split('T')[0];

  // Include Installment #0 (Advance / Down Payment / Booking Deposit) entry if requested & amount > 0
  const downAmt = Math.max(0, Number(downPaymentAmount) || 0);
  if (includeDownPaymentEntry && downAmt > 0) {
    schedule.push({
      installment_no: 0,
      due_date: startIso,
      amount: downAmt,
      status: downPaymentPaid ? 'paid' : 'pending',
      paid_amount: downPaymentPaid ? downAmt : 0,
      paid_date: downPaymentPaid ? startIso : null,
      payment_method: downPaymentPaid ? downPaymentMethod || 'Cash' : null,
      notes: downPaymentNotes || 'Advance / Booking Down Payment',
      type: 'down_payment',
    });
  }

  let accumAmount = 0;

  for (let i = 1; i <= count; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + intervalMonths * (i - 1));

    let currentAmount = baseAmount;
    if (i === count && totalFinancedPayable !== null && totalFinancedPayable > 0) {
      currentAmount = Math.max(0, Math.round(totalFinancedPayable - accumAmount));
    } else {
      accumAmount += baseAmount;
    }

    schedule.push({
      installment_no: i,
      due_date: dueDate.toISOString().split('T')[0],
      amount: currentAmount,
      status: 'pending',
      paid_amount: 0,
      paid_date: null,
      payment_method: null,
      notes: '',
      type: 'monthly',
    });
  }

  return schedule;
}


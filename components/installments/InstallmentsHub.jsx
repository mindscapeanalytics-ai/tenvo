'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Phone,
  CreditCard,
  Building2,
  DollarSign,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Filter,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { calculateInstallmentSummary, generateInstallmentSchedule } from '@/lib/utils/installmentMath';
import {
  createInstallmentPlanAction,
  getInstallmentPlansAction,
  recordInstallmentPaymentAction,
  deleteInstallmentPlanAction,
} from '@/lib/actions/standard/installments';
import { generateInstallmentFormPdf } from '@/lib/pdf/installmentFormPdf';

export function InstallmentsHub({ business, products = [], customers = [], currency = 'PKR' }) {
  const businessId = business?.id;
  const storeName = business?.business_name || 'Showroom';
  const category = business?.category || 'vehicle-dealership';

  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState('new'); // 'new' | 'ledger'

  // Ledger state & filters
  const [plans, setPlans] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  // Selected plan modal state
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [paymentInstallmentNo, setPaymentInstallmentNo] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Form State: Customer Info
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Form State: Guarantor Info
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorCnic, setGuarantorCnic] = useState('');

  // Form State: Vehicle / Product & Financial Terms
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDetails, setItemDetails] = useState('');
  const [totalPrice, setTotalPrice] = useState(500000);
  const [downPaymentType, setDownPaymentType] = useState('pct'); // 'pct' | 'amount'
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [downPaymentAmountInput, setDownPaymentAmountInput] = useState(100000);
  const [downPaymentPaid, setDownPaymentPaid] = useState(true);
  const [downPaymentMethod, setDownPaymentMethodState] = useState('Cash');
  const [markupRatePct, setMarkupRatePct] = useState(18);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [frequency, setFrequency] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load plans on mount or tab change
  const fetchPlans = async () => {
    if (!businessId) return;
    setLoadingLedger(true);
    try {
      const res = await getInstallmentPlansAction({
        businessId,
        search: searchTerm,
        status: statusFilter,
        frequency: frequencyFilter,
      });
      if (res.success) {
        setPlans(res.data || []);
      } else {
        toast.error(res.error || 'Failed to load installment plans');
      }
    } catch (err) {
      console.error('[InstallmentsHub] fetchPlans error:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [businessId, statusFilter, frequencyFilter, searchTerm]);

  // Handle Product Selection change
  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => String(p.id) === String(prodId));
    if (prod) {
      setItemName(prod.name || '');
      const price = Number(prod.price || prod.cost_price || 0);
      if (price > 0) {
        setTotalPrice(price);
        if (downPaymentType === 'pct') {
          setDownPaymentAmountInput(Math.round(price * (downPaymentPct / 100)));
        }
      }
    }
  };

  // Handle Customer Selection change
  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find((c) => String(c.id) === String(custId));
    if (cust) {
      setCustomerName(cust.name || '');
      setCustomerPhone(cust.phone || '');
      setCustomerCnic(cust.cnic || '');
      setCustomerAddress(cust.address || '');
    }
  };

  // Live Math Calculations
  const calculatedSummary = useMemo(() => {
    return calculateInstallmentSummary({
      totalPrice,
      downPaymentPct,
      downPaymentAmount: downPaymentType === 'amount' ? downPaymentAmountInput : null,
      markupRatePct,
      tenureMonths,
      frequency,
    });
  }, [totalPrice, downPaymentPct, downPaymentAmountInput, downPaymentType, markupRatePct, tenureMonths, frequency]);

  // Live Schedule Preview
  const liveSchedule = useMemo(() => {
    return generateInstallmentSchedule({
      startDate,
      numberOfInstallments: calculatedSummary.numberOfInstallments,
      installmentAmount: calculatedSummary.installmentAmount,
      totalFinancedPayable: calculatedSummary.totalFinancedPayable,
      frequency: calculatedSummary.frequency,
      includeDownPaymentEntry: true,
      downPaymentAmount: calculatedSummary.downPaymentAmount,
      downPaymentPaid,
      downPaymentMethod,
    });
  }, [startDate, calculatedSummary, downPaymentPaid, downPaymentMethod]);

  // Summary Metrics for Ledger
  const ledgerMetrics = useMemo(() => {
    let activeCount = 0;
    let totalFinanced = 0;
    let totalCollected = 0;
    let overdueCount = 0;

    plans.forEach((p) => {
      if (p.status === 'active') activeCount++;
      totalFinanced += Number(p.total_payable || 0);

      const sched = Array.isArray(p.schedule_data) ? p.schedule_data : [];
      sched.forEach((s) => {
        if (s.status === 'paid') {
          totalCollected += Number(s.paid_amount || s.amount || 0);
        } else if (new Date(s.due_date) < new Date() && s.status !== 'paid') {
          overdueCount++;
        }
      });
    });

    return {
      activeCount,
      totalPlans: plans.length,
      totalFinanced,
      totalCollected,
      overdueCount,
    };
  }, [plans]);

  // Reset Form
  const handleResetForm = () => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCnic('');
    setCustomerAddress('');
    setGuarantorName('');
    setGuarantorPhone('');
    setGuarantorCnic('');
    setSelectedProductId('');
    setItemName('');
    setItemDetails('');
    setTotalPrice(500000);
    setDownPaymentType('pct');
    setDownPaymentPct(20);
    setDownPaymentAmountInput(100000);
    setDownPaymentPaid(true);
    setDownPaymentMethodState('Cash');
    setMarkupRatePct(18);
    setTenureMonths(24);
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  // Submit Application
  const handleSubmitPlan = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter customer full name');
      return;
    }
    if (!itemName.trim()) {
      toast.error('Please enter vehicle or item model name');
      return;
    }
    if (totalPrice <= 0) {
      toast.error('Total price must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerCnic: customerCnic.trim() || null,
        customerAddress: customerAddress.trim() || null,
        guarantorName: guarantorName.trim() || null,
        guarantorPhone: guarantorPhone.trim() || null,
        guarantorCnic: guarantorCnic.trim() || null,
        productId: selectedProductId || null,
        itemName: itemName.trim(),
        itemDetails: itemDetails.trim() || null,
        totalPrice,
        downPaymentAmount: downPaymentType === 'amount' ? downPaymentAmountInput : calculatedSummary.downPaymentAmount,
        downPaymentPct: calculatedSummary.downPaymentPct,
        downPaymentPaid,
        downPaymentMethod,
        markupRatePct,
        tenureMonths,
        frequency,
        startDate,
        notes: notes.trim() || null,
      };

      const res = await createInstallmentPlanAction({ businessId, payload });

      if (res.success) {
        toast.success(`Installment Plan ${res.data.plan_number} created successfully!`);
        fetchPlans();
        setActiveSubTab('ledger');
        handleResetForm();
      } else {
        toast.error(res.error || 'Failed to save installment plan');
      }
    } catch (err) {
      console.error('[InstallmentsHub] handleSubmitPlan error:', err);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF Generator Trigger
  const handleDownloadPdf = async (planObj) => {
    try {
      toast.loading('Generating Official Installment Contract PDF…', { id: 'pdf-gen' });
      const target = planObj || {
        customerName,
        customerPhone,
        customerCnic,
        customerAddress,
        guarantorName,
        guarantorPhone,
        guarantorCnic,
        itemName,
        totalPrice,
        downPaymentAmount: calculatedSummary.downPaymentAmount,
        downPaymentPct: calculatedSummary.downPaymentPct,
        tenureMonths,
        frequency,
        installmentAmount: calculatedSummary.installmentAmount,
      };

      const doc = await generateInstallmentFormPdf({
        storeName: storeName || 'Showroom Installments',
        selectedVehicle: target.item_name || target.itemName || 'Vehicle / Product Model',
        productPrice: Number(target.total_price || target.totalPrice || 0),
        downPaymentAmount: Number(target.down_payment_amount || target.downPaymentAmount || 0),
        downPaymentPct: Number(target.down_payment_pct || target.downPaymentPct || 0),
        durationMonths: Number(target.tenure_months || target.tenureMonths || 24),
        monthlyInstallment: Number(target.installment_amount || target.installmentAmount || 0),
        applicant: {
          fullName: target.customer_name || target.customerName || '',
          cnic: target.customer_cnic || target.customerCnic || '',
          phone: target.customer_phone || target.customerPhone || '',
          address: target.customer_address || target.customerAddress || '',
          witness1Name: target.guarantor_name || target.guarantorName || '',
          witness1Phone: target.guarantor_phone || target.guarantorPhone || '',
          witness1Cnic: target.guarantor_cnic || target.guarantorCnic || '',
        },
        business,
        category,
      });

      doc.save(`TENVO-Installment-Plan-${target.plan_number || 'Contract'}.pdf`);
      toast.success('Official Installment Contract PDF downloaded!', { id: 'pdf-gen' });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Could not generate PDF form.', { id: 'pdf-gen' });
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (plan) => {
    setSelectedPlanForPayment(plan);
    const sched = Array.isArray(plan.schedule_data) ? plan.schedule_data : [];
    const nextUnpaid = sched.find((s) => s.status !== 'paid') || sched[0] || {};
    setPaymentInstallmentNo(nextUnpaid.installment_no || 1);
    setPaymentAmount(Number(nextUnpaid.amount || plan.installment_amount || 0));
    setPaymentMethod('Cash');
    setPaymentNotes('');
  };

  // Submit Payment Record
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanForPayment) return;

    setIsRecordingPayment(true);
    try {
      const res = await recordInstallmentPaymentAction({
        businessId,
        planId: selectedPlanForPayment.id,
        installmentNo: paymentInstallmentNo,
        paymentAmount,
        paymentMethod,
        notes: paymentNotes,
      });

      if (res.success) {
        toast.success(`Installment #${paymentInstallmentNo} payment recorded successfully!`);
        fetchPlans();
        setSelectedPlanForPayment(null);
        if (selectedPlanForDetails?.id === selectedPlanForPayment.id) {
          setSelectedPlanForDetails(res.data);
        }
      } else {
        toast.error(res.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('[InstallmentsHub] handleRecordPaymentSubmit error:', err);
      toast.error('An error occurred while saving payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this installment plan?')) return;
    try {
      const res = await deleteInstallmentPlanAction({ businessId, planId });
      if (res.success) {
        toast.success('Installment plan deleted');
        fetchPlans();
        if (selectedPlanForDetails?.id === planId) setSelectedPlanForDetails(null);
      } else {
        toast.error(res.error || 'Failed to delete plan');
      }
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 text-slate-800 dark:text-slate-100">
      {/* Top Header Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200/80 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60">
              <Sparkles className="h-3.5 w-3.5" />
              Automotive & Product Leasing Suite
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Installment Plans & Customer Financing
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Calculate down payments, record monthly, quarterly, or yearly installments, and issue official lease agreements for {storeName}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('new')}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm',
                activeSubTab === 'new'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Plus className="h-4 w-4" />
              New Application
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('ledger')}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm',
                activeSubTab === 'ledger'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <FileText className="h-4 w-4" />
              Installment Ledger ({plans.length})
            </button>
          </div>
        </div>

        {/* Header Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Contracts</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{ledgerMetrics.activeCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Financed</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(ledgerMetrics.totalFinanced, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Collections</p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
              {formatCurrency(ledgerMetrics.totalCollected, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Overdue Installments</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">{ledgerMetrics.overdueCount}</p>
          </div>
        </div>
      </div>

      {/* ────────────────── SUB-TAB 1: NEW APPLICATION & CALCULATOR ────────────────── */}
      {activeSubTab === 'new' && (
        <form onSubmit={handleSubmitPlan} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Input Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Customer Details</h2>
                </div>
                {customers.length > 0 && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Autofill from existing customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Muhammad Ali Shah"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CNIC / ID Number
                  </label>
                  <input
                    type="text"
                    value={customerCnic}
                    onChange={(e) => setCustomerCnic(e.target.value)}
                    placeholder="e.g. 42101-1234567-1"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. House 45, Block 6, PECHS, Karachi"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Guarantor Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Guarantor / Witness Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor Full Name
                  </label>
                  <input
                    type="text"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor Phone
                  </label>
                  <input
                    type="text"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    placeholder="e.g. +92 321 9876543"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guarantor CNIC
                  </label>
                  <input
                    type="text"
                    value={guarantorCnic}
                    onChange={(e) => setGuarantorCnic(e.target.value)}
                    placeholder="e.g. 42201-9876543-2"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle / Item & Financial Terms Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Vehicle & Financing Terms</h2>
                </div>
                {products.length > 0 && (
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Select from Inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price || 0, currency)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle / Product Model Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Toyota Corolla Altis 1.8 Grande 2024 / Honda Civic / Super Power EV 150"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Cash / Market Price ({currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Down Payment</label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setDownPaymentType('pct')}
                        className={cn(
                          'px-2 py-0.5 rounded font-medium transition-all',
                          downPaymentType === 'pct' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        )}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDownPaymentType('amount')}
                        className={cn(
                          'px-2 py-0.5 rounded font-medium transition-all',
                          downPaymentType === 'amount' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        )}
                      >
                        Fixed PKR
                      </button>
                    </div>
                  </div>

                  {downPaymentType === 'pct' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="5"
                        value={downPaymentPct}
                        onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                        className="w-full accent-red-600"
                      />
                      <span className="w-16 text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {downPaymentPct}%
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max={totalPrice}
                      value={downPaymentAmountInput}
                      onChange={(e) => setDownPaymentAmountInput(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  )}

                  {/* Advance / Down Payment Received Status */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/60">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={downPaymentPaid}
                        onChange={(e) => setDownPaymentPaid(e.target.checked)}
                        className="h-4 w-4 rounded accent-red-600"
                      />
                      <span>Down / Advance Payment Paid Upon Booking</span>
                    </label>

                    {downPaymentPaid && (
                      <select
                        value={downPaymentMethod}
                        onChange={(e) => setDownPaymentMethodState(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tenure Duration (Months)
                  </label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="monthly">Monthly (Every 1 Month)</option>
                    <option value="quarterly">Quarterly (Every 3 Months)</option>
                    <option value="yearly">Yearly (Every 1 Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Markup / Profit Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={markupRatePct}
                    onChange={(e) => setMarkupRatePct(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold tabular-nums text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Due Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4 text-red-600" />
                Download PDF Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Saving Plan…' : 'Save Installment Contract'}
              </button>
            </div>
          </div>

          {/* Right Column: Live Financial Calculation Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Summary</h3>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                  {calculatedSummary.frequency.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Cash / Market Price:</span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(calculatedSummary.totalPrice, currency)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    Down Payment ({calculatedSummary.downPaymentPct}%):
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(calculatedSummary.downPaymentAmount, currency)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Financed Principal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(calculatedSummary.financedAmount, currency)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    Profit / Markup ({calculatedSummary.markupRatePct}%):
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    + {formatCurrency(calculatedSummary.markupAmount, currency)}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {calculatedSummary.frequency === 'monthly'
                        ? 'Monthly Installment'
                        : calculatedSummary.frequency === 'quarterly'
                        ? '3-Monthly Installment'
                        : 'Yearly Installment'}
                    </span>
                    <span className="text-xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                      {formatCurrency(calculatedSummary.installmentAmount, currency)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total {calculatedSummary.numberOfInstallments} payments over {calculatedSummary.tenureMonths} months
                  </p>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <span>Total Contract Value:</span>
                  <span className="tabular-nums">{formatCurrency(calculatedSummary.totalContractPayable, currency)}</span>
                </div>
              </div>

              {/* Live Schedule Preview Accordion */}
              <div className="mt-6">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Payment Schedule Preview
                </p>
                <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-xs">
                  {liveSchedule.map((s) => {
                    const isDown = Number(s.installment_no) === 0;
                    return (
                      <div
                        key={s.installment_no}
                        className={cn(
                          'flex items-center justify-between rounded-lg p-2 text-slate-700 dark:text-slate-300',
                          isDown
                            ? 'bg-amber-50/80 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/40'
                            : 'bg-slate-50 dark:bg-slate-800/40'
                        )}
                      >
                        <span className="font-semibold flex items-center gap-1.5">
                          {isDown ? (
                            <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                              Advance / Down
                            </span>
                          ) : (
                            `Installment #${s.installment_no}`
                          )}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{s.due_date}</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(s.amount, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ────────────────── SUB-TAB 2: INSTALLMENT LEDGER & CUSTOMERS ────────────────── */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer name, CNIC, phone, vehicle model, plan #…"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Plans</option>
                  <option value="completed">Completed Plans</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>

              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Frequencies</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">3-Monthly (Quarterly)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {loadingLedger ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading installment ledger…</div>
            ) : plans.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No installment plans found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create a new application form to record installment customers.
                </p>
                <button
                  onClick={() => setActiveSubTab('new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" /> Create New Plan
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Plan # / Date</th>
                      <th className="px-4 py-3.5">Customer & Contact</th>
                      <th className="px-4 py-3.5">Vehicle / Model</th>
                      <th className="px-4 py-3.5">Financed / Price</th>
                      <th className="px-4 py-3.5">Installment Amount</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plans.map((p) => {
                      const sched = Array.isArray(p.schedule_data) ? p.schedule_data : [];
                      const paidCount = sched.filter((s) => s.status === 'paid' && Number(s.installment_no) > 0).length;
                      const isComplete = p.status === 'completed';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                            <span className="font-bold text-red-600 dark:text-red-400">{p.plan_number}</span>
                            <div className="text-xs text-slate-400">
                              {p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB') : '-'}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{p.customer_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {p.customer_phone || p.customer_cnic || 'No phone'}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                            {p.item_name}
                          </td>

                          <td className="px-4 py-3.5 tabular-nums">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(p.financed_amount || 0, currency)}
                            </p>
                            <p className="text-xs text-slate-400">
                              Down: {formatCurrency(p.down_payment_amount || 0, currency)}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 tabular-nums">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.installment_amount || 0, currency)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.frequency} ({paidCount}/{p.number_of_installments || p.tenure_months} paid)
                            </p>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              )}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedPlanForDetails(p)}
                                title="View Details & Schedule"
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenPaymentModal(p)}
                                title="Record Payment"
                                className="rounded-lg bg-emerald-600 p-2 text-white shadow-sm hover:bg-emerald-700"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(p)}
                                title="Print Official PDF"
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Printer className="h-4 w-4 text-red-600" />
                              </button>
                              <button
                                onClick={() => handleDeletePlan(p.id)}
                                title="Delete Plan"
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 1: PLAN DETAILS & SCHEDULE ────────────────── */}
      {selectedPlanForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {selectedPlanForDetails.plan_number}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedPlanForDetails.customer_name} — {selectedPlanForDetails.item_name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPlanForDetails(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-400">Total Price</p>
                <p className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(selectedPlanForDetails.total_price, currency)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-400">Down Payment</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(selectedPlanForDetails.down_payment_amount, currency)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-400">Financed Principal</p>
                <p className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(selectedPlanForDetails.financed_amount, currency)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-400">Per Installment</p>
                <p className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {formatCurrency(selectedPlanForDetails.installment_amount, currency)}
                </p>
              </div>
            </div>

            {/* Schedule Items List */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Installment Schedule Ledger</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(Array.isArray(selectedPlanForDetails.schedule_data) ? selectedPlanForDetails.schedule_data : []).map(
                  (s) => {
                    const isPaid = s.status === 'paid';
                    const isDown = Number(s.installment_no) === 0;

                    return (
                      <div
                        key={s.installment_no}
                        className={cn(
                          'flex items-center justify-between rounded-xl p-3 border text-xs sm:text-sm',
                          isDown
                            ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30'
                            : isPaid
                            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs',
                              isDown
                                ? 'bg-amber-600 text-white'
                                : isPaid
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            )}
                          >
                            {isPaid ? <Check className="h-4 w-4" /> : `#${s.installment_no}`}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {isDown ? (
                                <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                  Advance / Down Payment
                                </span>
                              ) : (
                                `Installment #${s.installment_no}`
                              )}
                            </p>
                            <p className="text-xs text-slate-500">Due: {s.due_date}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(s.amount, currency)}
                          </p>
                          {isPaid ? (
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Paid on {s.paid_date} ({s.payment_method || 'Cash'})
                            </p>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => handleDownloadPdf(selectedPlanForDetails)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                <Printer className="h-4 w-4 text-red-600" /> Print PDF Contract
              </button>
              <button
                onClick={() => setSelectedPlanForDetails(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 2: RECORD PAYMENT ────────────────── */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleRecordPaymentSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Installment Payment</h3>
                <p className="text-xs text-slate-500">
                  {selectedPlanForPayment.customer_name} ({selectedPlanForPayment.plan_number})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForPayment(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Installment Number
              </label>
              <select
                value={paymentInstallmentNo}
                onChange={(e) => {
                  const no = Number(e.target.value);
                  setPaymentInstallmentNo(no);
                  const sched = Array.isArray(selectedPlanForPayment.schedule_data)
                    ? selectedPlanForPayment.schedule_data
                    : [];
                  const target = sched.find((s) => Number(s.installment_no) === no);
                  if (target) setPaymentAmount(Number(target.amount || 0));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {(Array.isArray(selectedPlanForPayment.schedule_data)
                  ? selectedPlanForPayment.schedule_data
                  : []
                ).map((s) => (
                  <option key={s.installment_no} value={s.installment_no}>
                    {Number(s.installment_no) === 0
                      ? `Installment #0 — Advance / Down Payment (${s.status.toUpperCase()})`
                      : `Installment #${s.installment_no} — Due ${s.due_date} (${s.status.toUpperCase()})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Amount ({currency})
              </label>
              <input
                type="number"
                required
                min="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold tabular-nums text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Reference / Notes
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Receipt # 9841 / Bank Txn ID"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanForPayment(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRecordingPayment}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isRecordingPayment ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

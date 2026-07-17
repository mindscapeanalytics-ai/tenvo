'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, BookOpen, Receipt, CalendarRange, RefreshCcw,
    Globe, TrendingUp, TrendingDown,
    LayoutDashboard, ChevronRight, Loader2, FileText, ListTree, PenLine, GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/lib/context/BusinessContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { getGLAccountsAction } from '@/lib/actions/basic/accounting';
import { setExchangeRateAction } from '@/lib/actions/basic/exchangeRate';
import { getExpensesAction } from '@/lib/actions/basic/expense';
import { getCreditNotesAction, createCreditNoteAction } from '@/lib/actions/basic/creditNote';
import { getFiscalPeriodsAction } from '@/lib/actions/basic/fiscal';
import { getExchangeRatesAction } from '@/lib/actions/basic/exchangeRate';
import { ExpenseManager } from '@/components/finance/ExpenseManager';
import { JournalEntryForm } from '@/components/JournalEntryForm';
import { JournalEntryList } from '@/components/finance/JournalEntryList';
import { FiscalPeriodManager } from '@/components/finance/FiscalPeriodManager';
import { BankReconciliation } from '@/components/finance/BankReconciliation';
import { ChartOfAccountsManager } from '@/components/finance/ChartOfAccountsManager';
import { getVendorsAction } from '@/lib/actions/basic/vendor';
import { getInvoicesAction } from '@/lib/actions/basic/invoice';
import { toast } from 'react-hot-toast';
import FinancialReports from '@/components/FinancialReports';
import { GeneralLedgerReport } from '@/components/reports/GeneralLedgerReport';
import { MobileTabHeader } from '@/components/mobile/MobileTabHeader';
import { FinanceMobileNav } from '@/components/finance/FinanceMobileNav';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { accountingAPI } from '@/lib/api/accounting';
import { resolveFinanceHubNavigation } from '@/lib/config/tabs';

// --- Sub-Tab Definitions -----------------------------------------------------

const FINANCE_TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, permission: 'finance.view_reports', feature: null, group: 'Insights' },
    { key: 'statements', label: 'Statements', icon: FileText, permission: 'finance.view_reports', feature: 'basic_reports', group: 'Statements' },
    { key: 'accounts', label: 'Chart of Accounts', icon: ListTree, permission: 'finance.view_gl', feature: 'basic_accounting', group: 'Books' },
    { key: 'journal', label: 'Journal Entries', icon: PenLine, permission: 'finance.view_gl', feature: 'basic_accounting', group: 'Books' },
    { key: 'general-ledger', label: 'General Ledger', icon: BookOpen, permission: 'finance.view_gl', feature: 'basic_accounting', group: 'Books' },
    { key: 'reconciliation', label: 'Bank Reconciliation', icon: GitMerge, permission: 'finance.view_gl', feature: 'basic_accounting', group: 'Books' },
    { key: 'expenses', label: 'Expenses', icon: Receipt, permission: 'finance.manage_expenses', feature: 'expense_tracking', group: 'Cash' },
    { key: 'credit-notes', label: 'Credit Notes', icon: RefreshCcw, permission: 'finance.credit_notes', feature: 'credit_notes', group: 'Cash' },
    { key: 'fiscal', label: 'Fiscal Periods', icon: CalendarRange, permission: 'finance.close_period', feature: 'fiscal_periods', group: 'Close' },
    { key: 'exchange', label: 'Exchange Rates', icon: Globe, permission: 'finance.exchange_rates', feature: 'exchange_rates', group: 'Close' },
];

function goToPaymentsHub() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'payments');
    url.searchParams.delete('financeView');
    window.location.href = url.toString();
}

// --- KPI Card ----------------------------------------------------------------

function KPICard({ label, value, icon: Icon, trend, color = 'indigo', loading }) {
    const colors = {
        indigo: 'bg-brand-50 text-brand-primary border-brand-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        blue: 'bg-brand-50 text-brand-primary border-brand-100',
    };
    return (
        <div className={cn('rounded-xl border p-4', colors[color])}>
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 opacity-60" />
                {trend && (
                    <span className={cn('text-xs font-bold flex items-center gap-0.5',
                        trend > 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin opacity-40" />
            ) : (
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
            )}
            <p className="text-[11px] font-semibold opacity-60 mt-1">{label}</p>
        </div>
    );
}


// --- Credit Notes Panel ------------------------------------------------------

function CreditNotesPanel({ businessId, creditNotes, currency, onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [reason, setReason] = useState('');
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    const STATUS_STYLES = {
        draft: 'bg-gray-100 text-gray-600',
        issued: 'bg-brand-50 text-brand-primary',
        applied: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    };

    const loadInvoices = useCallback(async () => {
        if (!businessId) return;
        setLoadingInvoices(true);
        try {
            const res = await getInvoicesAction(businessId);
            if (res.success) {
                // Only show paid/partially_paid invoices eligible for credit notes
                setInvoices((res.invoices || []).filter(inv =>
                    ['paid', 'partially_paid', 'sent', 'overdue'].includes(inv.status)
                ));
            }
        } catch { /* silent */ } finally { setLoadingInvoices(false); }
    }, [businessId]);

    const handleSelectInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        // Pre-fill items from invoice
        const invItems = invoice.items || [];
        setItems(invItems.map(it => ({
            productId: it.product_id || null,
            description: it.description || it.product_name || 'Item',
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unit_price || it.price || 0),
            amount: Number(it.amount || it.total || 0),
            taxAmount: Number(it.tax_amount || 0),
            include: true,
        })));
    };

    const handleSubmit = async () => {
        if (!selectedInvoice || items.filter(i => i.include).length === 0) return;
        setSubmitting(true);
        try {
            const includedItems = items.filter(i => i.include);
            const res = await createCreditNoteAction({
                businessId,
                invoiceId: selectedInvoice.id,
                reason,
                date: new Date().toISOString(),
                items: includedItems.map(i => ({
                    productId: i.productId,
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    amount: i.amount,
                    taxAmount: i.taxAmount,
                })),
            });
            if (res.success) {
                setShowForm(false);
                setSelectedInvoice(null);
                setReason('');
                setItems([]);
                onRefresh?.();
            } else {
                toast.error(res.error || 'Failed to create credit note');
            }
        } catch (err) {
            toast.error(err.message || 'Error creating credit note');
        } finally { setSubmitting(false); }
    };

    const totalCredit = items.filter(i => i.include).reduce((s, i) => s + i.amount + i.taxAmount, 0);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold text-gray-800">Credit Notes</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold">{creditNotes.length} records</span>
                    <Button
                        onClick={() => { setShowForm(true); loadInvoices(); }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs px-4 h-8 shadow-lg shadow-red-500/20"
                    >
                        <RefreshCcw className="w-3 h-3 mr-1.5" /> New Credit Note
                    </Button>
                </div>
            </div>

            {/* Creation Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-red-100 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">Create Credit Note</h4>
                        <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>

                    {/* Invoice Selection */}
                    {!selectedInvoice ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600">Select Invoice to Credit</label>
                            {loadingInvoices ? (
                                <div className="flex items-center gap-2 py-4 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading invoices...
                                </div>
                            ) : invoices.length === 0 ? (
                                <p className="text-xs text-gray-400 py-4">No eligible invoices found</p>
                            ) : (
                                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
                                    {invoices.map(inv => (
                                        <button
                                            key={inv.id}
                                            onClick={() => handleSelectInvoice(inv)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-gray-800">{inv.invoice_number || inv.number}</span>
                                                <span className="text-xs text-gray-400 ml-2">{inv.customer_name || 'Walk-in'}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{currency} {Number(inv.grand_total || inv.total_amount || 0).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Selected invoice info */}
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <FileCheck className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-700">{selectedInvoice.invoice_number || selectedInvoice.number}</span>
                                <span className="text-xs text-gray-400">{selectedInvoice.customer_name}</span>
                                <span className="flex-1" />
                                <span className="text-xs font-bold">{currency} {Number(selectedInvoice.grand_total || selectedInvoice.total_amount || 0).toLocaleString()}</span>
                                <button onClick={() => { setSelectedInvoice(null); setItems([]); }} className="text-xs text-brand-primary hover:underline ml-2">Change</button>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="text-xs font-bold text-gray-600">Reason</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="e.g., Goods returned, pricing error, defective items"
                                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                                />
                            </div>

                            {/* Items to credit */}
                            <div>
                                <label className="text-xs font-bold text-gray-600 mb-1 block">Items to Credit</label>
                                <div className="divide-y divide-gray-50 border border-gray-100 rounded-lg">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={item.include}
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx] = { ...newItems[idx], include: e.target.checked };
                                                    setItems(newItems);
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-semibold text-gray-700">{item.description}</span>
                                                <span className="text-xs text-gray-400 ml-2">x{item.quantity}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{currency} {item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end mt-2">
                                    <span className="text-sm font-semibold text-red-600">Total: {currency} {totalCredit.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-2">
                                <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl text-xs h-9">Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || totalCredit === 0}
                                    className="rounded-xl font-bold h-9 px-6 shadow-lg shadow-red-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCcw className="w-3 h-3 mr-1.5" />}
                                    Issue Credit Note ({currency} {totalCredit.toLocaleString()})
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {creditNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <RefreshCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No credit notes yet</p>
                    <p className="text-xs">Credit notes appear when you create refunds</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {creditNotes.map(cn => (
                        <div key={cn.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-800">{cn.credit_note_number}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLES[cn.status] || STATUS_STYLES.draft}`}>
                                        {cn.status?.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{cn.reason || 'No reason specified'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-red-600">{currency} {Number(cn.total_amount).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">{formatDisplayDate(cn.date)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Exchange Rates Panel ----------------------------------------------------

function ExchangeRatesPanel({ businessId, rates, baseCurrencyCode, onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const fromCurrency = baseCurrencyCode || 'PKR';
    const [toCurrency, setToCurrency] = useState('USD');
    const [rate, setRate] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!businessId || !rate || !toCurrency) return;
        const n = Number(rate);
        if (!Number.isFinite(n) || n <= 0) {
            toast.error('Enter a valid positive rate');
            return;
        }
        setSubmitting(true);
        try {
            const res = await setExchangeRateAction({
                businessId,
                fromCurrency,
                toCurrency: toCurrency.trim().toUpperCase(),
                rate: n,
                effectiveDate,
                source: 'manual',
            });
            if (!res.success) {
                toast.error(res.error || 'Failed to save rate');
                return;
            }
            toast.success('Exchange rate saved');
            setShowForm(false);
            setRate('');
            setEffectiveDate(new Date().toISOString().split('T')[0]);
            onRefresh?.();
        } catch (err) {
            toast.error(err.message || 'Failed to add rate');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold text-gray-800">Exchange Rates</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold">{rates.length} rates</span>
                    <Button 
                        onClick={() => setShowForm(true)}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl font-bold text-xs px-4 h-8"
                    >
                        Add Rate
                    </Button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border border-brand-100 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">Add Exchange Rate</h4>
                        <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-600">Base Currency</label>
                            <input type="text" value={fromCurrency} readOnly className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600">Target Currency</label>
                            <input type="text" value={toCurrency} onChange={e => setToCurrency(e.target.value.toUpperCase())} placeholder="e.g. USD" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600">Rate</label>
                            <input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 280.5" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600">Effective date</label>
                            <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={submitting || !toCurrency || !rate || !effectiveDate} className="rounded-xl font-bold h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Save Rate'}
                        </Button>
                    </div>
                </div>
            )}

            {rates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No exchange rates configured</p>
                    <p className="text-xs">Add rates to enable multi-currency transactions</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {rates.map(r => (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-primary">
                                {r.from_currency}
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-semibold text-emerald-600">
                                {r.to_currency}
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold text-gray-800">
                                    1 {r.from_currency} = {Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.to_currency}
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                                    r.source === 'api' ? 'bg-brand-50 text-brand-primary' : 'bg-gray-100 text-gray-600'
                                )}>
                                    {r.source?.toUpperCase()}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatDisplayDate(r.effective_date)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Finance Overview Panel --------------------------------------------------

function FinanceOverview({
    accounts,
    expenses,
    creditNotes,
    currency,
    loading,
    coverage,
    reconciling,
    onNavigate,
    onReconcileStorefront,
}) {
    const totalExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]
    );
    const totalCreditNotes = useMemo(() =>
        creditNotes.reduce((sum, c) => sum + Number(c.total_amount || 0), 0), [creditNotes]
    );
    const activeAccounts = accounts.filter(a => a.is_active !== false).length;
    const thisMonthExpenses = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenses
            .filter(e => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }, [expenses]);

    const pendingSf = coverage?.storefrontPending || 0;
    const pendingRest = coverage?.restaurantMissingGl || 0;

    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-500">
                Formal statements read your books (GL). Sales dashboard KPIs may also include operational channels.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard label="GL Accounts" value={activeAccounts} icon={BookOpen} color="indigo" loading={loading} />
                <KPICard label="Total Expenses" value={`${currency} ${totalExpenses.toLocaleString()}`} icon={Receipt} color="red" loading={loading} />
                <KPICard label="This Month" value={`${currency} ${thisMonthExpenses.toLocaleString()}`} icon={TrendingDown} color="amber" loading={loading} />
                <KPICard label="Credit Notes" value={`${currency} ${totalCreditNotes.toLocaleString()}`} icon={RefreshCcw} color="blue" loading={loading} />
            </div>

            {(pendingSf > 0 || pendingRest > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Books coverage gap</p>
                        <p className="text-xs text-amber-800 mt-0.5">
                            {pendingSf > 0 && `${pendingSf} paid storefront order${pendingSf === 1 ? '' : 's'} not in GL. `}
                            {pendingRest > 0 && `${pendingRest} paid restaurant order${pendingRest === 1 ? '' : 's'} missing GL.`}
                        </p>
                    </div>
                    {pendingSf > 0 && (
                        <Button
                            size="sm"
                            className="bg-amber-700 hover:bg-amber-800 text-white"
                            disabled={reconciling}
                            onClick={onReconcileStorefront}
                        >
                            {reconciling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            Post storefront to books
                        </Button>
                    )}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('statements', 'pl')}>Run P&amp;L</Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('statements', 'tb')}>Trial Balance</Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('statements', 'day-book')}>Day Book</Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('reconciliation')}>Bank reconciliation</Button>
                <Button variant="outline" size="sm" onClick={goToPaymentsHub}>Payments &amp; vouchers</Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (typeof window === 'undefined') return;
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'gst');
                        url.searchParams.delete('financeView');
                        window.location.href = url.toString();
                    }}
                >
                    Tax / GST
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Expenses</h4>
                    {expenses.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="text-gray-600 truncate flex-1">{e.category || 'Uncategorized'}</span>
                            <span className="text-gray-800 font-semibold shrink-0">{currency} {Number(e.amount).toLocaleString()}</span>
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No expenses recorded</p>}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Categories</h4>
                    {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                        const count = accounts.filter(a => a.type === type && a.is_active !== false).length;
                        return (
                            <div key={type} className="flex items-center justify-between py-1.5 text-sm">
                                <span className="text-gray-600 capitalize">{type}s</span>
                                <span className="text-gray-800 font-semibold">{count} accounts</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ===============================================================================
// MAIN FINANCE HUB
// ===============================================================================

export default function FinanceHub({ businessId, initialTab, businessCategory = 'retail-shop', onInitialTabConsumed }) {
    const { business, currency, currencySymbol } = useBusiness();
    const { can, planCan } = usePermissions();
    const initialNav = resolveFinanceHubNavigation(initialTab || 'overview');
    const [activeTab, setActiveTab] = useState(initialNav.tab);
    const [statementReport, setStatementReport] = useState(initialNav.statementReport || 'pl');
    const [loading, setLoading] = useState(true);

    // Data state
    const [accounts, setAccounts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [rates, setRates] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [showJournalForm, setShowJournalForm] = useState(false);
    const [coverage, setCoverage] = useState(null);
    const [reconciling, setReconciling] = useState(false);

    const effectiveCurrency = currencySymbol || 'Rs.';
    const effectiveBusinessId = businessId || business?.id;

    const navigateFinance = useCallback((tabKey, report = null) => {
        const nav = resolveFinanceHubNavigation(tabKey);
        if (nav.preferPayments) {
            goToPaymentsHub();
            return;
        }
        setActiveTab(nav.tab);
        if (nav.tab === 'statements') {
            setStatementReport(report || nav.statementReport || 'pl');
        } else if (report) {
            setStatementReport(report);
        }
    }, []);

    // Load all finance data
    const loadData = useCallback(async () => {
        if (!effectiveBusinessId) return;
        setLoading(true);
        try {
            const [accRes, expRes, cnRes, fpRes, exRes, covRes] = await Promise.allSettled([
                getGLAccountsAction(effectiveBusinessId),
                getExpensesAction(effectiveBusinessId, { limit: 50 }),
                getCreditNotesAction(effectiveBusinessId),
                getFiscalPeriodsAction(effectiveBusinessId),
                getExchangeRatesAction(effectiveBusinessId, currency || 'PKR'),
                accountingAPI.getGlCoverage(effectiveBusinessId),
            ]);

            if (accRes.status === 'fulfilled' && accRes.value.success) setAccounts(accRes.value.accounts || []);
            if (expRes.status === 'fulfilled' && expRes.value.success) setExpenses(expRes.value.expenses || []);
            if (cnRes.status === 'fulfilled' && cnRes.value.success) setCreditNotes(cnRes.value.creditNotes || cnRes.value.credit_notes || []);
            if (fpRes.status === 'fulfilled' && fpRes.value.success) setPeriods(fpRes.value.periods || []);
            if (exRes.status === 'fulfilled' && exRes.value.success) setRates(exRes.value.rates || []);
            if (covRes.status === 'fulfilled' && covRes.value.success) setCoverage(covRes.value.coverage || null);

            const vendRes = await getVendorsAction(effectiveBusinessId);
            if (vendRes.success) setVendors(vendRes.vendors || []);
        } catch (err) {
            console.error('[FinanceHub] Load failed:', err);
        } finally {
            setLoading(false);
        }
    }, [effectiveBusinessId, currency]);

    useEffect(() => {
        queueMicrotask(() => {
            loadData();
        });
    }, [loadData]);

    // Filter tabs by permission + plan
    const visibleTabs = useMemo(() =>
        FINANCE_TABS.filter(tab => {
            if (tab.permission && !can(tab.permission)) return false;
            if (tab.feature && !planCan(tab.feature)) return false;
            return true;
        }),
        [can, planCan]);

    const visibleTabKeys = useMemo(() => visibleTabs.map((t) => t.key), [visibleTabs]);

    useEffect(() => {
        if (initialTab != null && initialTab !== '') {
            queueMicrotask(() => {
                const nav = resolveFinanceHubNavigation(initialTab);
                if (nav.preferPayments) {
                    onInitialTabConsumed?.();
                    goToPaymentsHub();
                    return;
                }
                setActiveTab(nav.tab);
                if (nav.statementReport) setStatementReport(nav.statementReport);
                onInitialTabConsumed?.();
            });
        }
    }, [initialTab, onInitialTabConsumed]);

    useEffect(() => {
        if (visibleTabKeys.length === 0) return;
        if (visibleTabKeys.includes(activeTab)) return;
        queueMicrotask(() => {
            const nav = resolveFinanceHubNavigation(activeTab);
            if (nav.preferPayments) {
                goToPaymentsHub();
                return;
            }
            if (visibleTabKeys.includes(nav.tab)) {
                setActiveTab(nav.tab);
                if (nav.statementReport) setStatementReport(nav.statementReport);
                return;
            }
            setActiveTab(visibleTabKeys[0]);
        });
    }, [visibleTabKeys, activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <FinanceOverview
                        accounts={accounts}
                        expenses={expenses}
                        creditNotes={creditNotes}
                        currency={effectiveCurrency}
                        loading={loading}
                        coverage={coverage}
                        reconciling={reconciling}
                        onNavigate={navigateFinance}
                        onReconcileStorefront={async () => {
                            setReconciling(true);
                            try {
                                const res = await accountingAPI.reconcilePendingStorefrontGl(effectiveBusinessId);
                                if (res.success) {
                                    toast.success(`Posted ${res.successful || 0} of ${res.total || 0} orders to books`);
                                    loadData();
                                } else {
                                    toast.error(res.error || 'Reconcile failed');
                                }
                            } catch (e) {
                                toast.error(e.message || 'Reconcile failed');
                            } finally {
                                setReconciling(false);
                            }
                        }}
                    />
                );
            case 'statements':
            case 'trial-balance':
            case 'day-book':
                return (
                    <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm">
                        <FinancialReports
                            businessId={effectiveBusinessId}
                            category={businessCategory}
                            initialReport={
                                activeTab === 'trial-balance'
                                    ? 'tb'
                                    : activeTab === 'day-book'
                                      ? 'day-book'
                                      : statementReport
                            }
                        />
                    </div>
                );
            case 'general-ledger':
                return (
                    <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm">
                        <GeneralLedgerReport businessId={effectiveBusinessId} />
                    </div>
                );
            case 'accounts':
                return <ChartOfAccountsManager businessId={effectiveBusinessId} accounts={accounts} onRefresh={loadData} />;
            case 'expenses':
                return (
                    <ExpenseManager
                        businessId={effectiveBusinessId}
                        expenses={expenses}
                        onCreateExpense={() => loadData()}
                        onDeleteExpense={() => loadData()}
                        currency={effectiveCurrency}
                        vendors={vendors}
                    />
                );
            case 'vouchers':
                return (
                    <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                        Opening Payments for receipts and vouchers…
                    </div>
                );
            case 'journal':
                return (
                    <div className="space-y-6">
                        <JournalEntryList
                            businessId={effectiveBusinessId}
                            currency={effectiveCurrency}
                            accounts={accounts}
                            onNewEntry={() => setShowJournalForm(true)}
                        />
                    </div>
                );
            case 'reconciliation':
                return (
                    <BankReconciliation
                        businessId={effectiveBusinessId}
                        currency={effectiveCurrency}
                        accounts={accounts}
                    />
                );
            case 'credit-notes':
                return <CreditNotesPanel businessId={effectiveBusinessId} creditNotes={creditNotes} currency={effectiveCurrency} onRefresh={loadData} />;
            case 'fiscal':
                return (
                    <FiscalPeriodManager
                        businessId={effectiveBusinessId}
                        currency={effectiveCurrency}
                        periods={periods}
                        onRefresh={loadData}
                    />
                );
            case 'exchange':
                return (
                    <ExchangeRatesPanel
                        businessId={effectiveBusinessId}
                        rates={rates}
                        baseCurrencyCode={currency || 'PKR'}
                        onRefresh={loadData}
                    />
                );
            default:
                return (
                    <FinanceOverview
                        accounts={accounts}
                        expenses={expenses}
                        creditNotes={creditNotes}
                        currency={effectiveCurrency}
                        loading={loading}
                        onNavigate={navigateFinance}
                    />
                );
        }
    };

    return (
        <div className="min-w-0 space-y-4 overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] touch-manipulation lg:space-y-4 lg:pb-0">
            <MobileTabHeader
                icon={Landmark}
                iconClassName="bg-brand-100 text-brand-primary"
                title="Finance & Accounting"
                subtitle="Statements · Books · Cash · Close"
            />

            {/* Desktop header */}
            <div className="hidden items-center gap-3 lg:flex">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Finance & Accounting</h2>
                    <p className="text-xs text-gray-400 font-medium">Statements · Books · Cash · Close</p>
                </div>
            </div>

            <FinanceMobileNav tabs={visibleTabs} activeTab={activeTab} onSelect={navigateFinance} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${activeTab}:${statementReport}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            {showJournalForm && (
                <JournalEntryForm
                    onClose={() => setShowJournalForm(false)}
                    onSave={() => loadData()}
                />
            )}
        </div>
    );
}

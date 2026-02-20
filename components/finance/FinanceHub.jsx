'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, BookOpen, Receipt, FileCheck, Calendar, RefreshCcw,
    Globe, CreditCard, TrendingUp, TrendingDown, DollarSign,
    BarChart3, ChevronRight, Loader2, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { usePermissions, FeatureGate } from '@/lib/hooks/usePermissions';
import { getGLAccountsAction, getTrialBalanceAction } from '@/lib/actions/basic/accounting';
import { getExpensesAction, getExpenseSummaryAction } from '@/lib/actions/basic/expense';
import { getCreditNotesAction } from '@/lib/actions/basic/creditNote';
import { getFiscalPeriodsAction } from '@/lib/actions/basic/fiscal';
import { getExchangeRatesAction } from '@/lib/actions/basic/exchangeRate';
import { ExpenseManager } from '@/components/finance/ExpenseManager';

// ─── Sub-Tab Definitions ─────────────────────────────────────────────────────

const FINANCE_TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3, permission: 'finance.view_reports', feature: null },
    { key: 'accounts', label: 'Chart of Accounts', icon: BookOpen, permission: 'finance.view_gl', feature: 'basic_accounting' },
    { key: 'expenses', label: 'Expenses', icon: Receipt, permission: 'finance.manage_expenses', feature: 'expense_tracking' },
    { key: 'credit-notes', label: 'Credit Notes', icon: RefreshCcw, permission: 'finance.credit_notes', feature: 'credit_notes' },
    { key: 'fiscal', label: 'Fiscal Periods', icon: Calendar, permission: 'finance.close_period', feature: 'fiscal_periods' },
    { key: 'exchange', label: 'Exchange Rates', icon: Globe, permission: 'finance.exchange_rates', feature: 'exchange_rates' },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, trend, color = 'indigo', loading }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
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
                <p className="text-2xl font-black tracking-tight">{value}</p>
            )}
            <p className="text-[11px] font-semibold opacity-60 mt-1">{label}</p>
        </div>
    );
}

// ─── Chart of Accounts Panel ─────────────────────────────────────────────────

function ChartOfAccountsPanel({ businessId, accounts, currency }) {
    const ACCOUNT_TYPE_ICONS = {
        asset: '🏦', liability: '📋', equity: '🏛️', income: '💰', expense: '💸',
    };

    const grouped = useMemo(() => {
        const groups = { asset: [], liability: [], equity: [], income: [], expense: [] };
        accounts.forEach(acc => {
            const type = acc.type || 'asset';
            if (groups[type]) groups[type].push(acc);
        });
        return groups;
    }, [accounts]);

    const [expanded, setExpanded] = useState({ asset: true, liability: true });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Chart of Accounts</h3>
                <span className="text-xs text-gray-400 font-semibold">{accounts.length} accounts</span>
            </div>

            {Object.entries(grouped).map(([type, accs]) => {
                if (accs.length === 0) return null;
                const isExpanded = expanded[type] !== false;
                return (
                    <div key={type} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setExpanded(prev => ({ ...prev, [type]: !prev[type] }))}
                            className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <span className="text-base">{ACCOUNT_TYPE_ICONS[type]}</span>
                            <span className="text-sm font-bold text-gray-800 capitalize flex-1">{type}s</span>
                            <span className="text-xs font-semibold text-gray-400">{accs.length}</span>
                            <ChevronRight className={cn('w-4 h-4 text-gray-300 transition-transform', isExpanded && 'rotate-90')} />
                        </button>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t border-gray-50">
                                        {accs.sort((a, b) => (a.code || '').localeCompare(b.code || '')).map(acc => (
                                            <div key={acc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-25 text-sm border-b border-gray-50 last:border-0">
                                                <span className="text-xs font-mono text-gray-400 w-12">{acc.code}</span>
                                                <span className="flex-1 font-medium text-gray-700">{acc.name}</span>
                                                <span className={cn('text-xs font-bold',
                                                    acc.sub_type === 'current_asset' || acc.sub_type === 'fixed_asset' ? 'text-emerald-600' : 'text-gray-500'
                                                )}>
                                                    {acc.sub_type?.replace(/_/g, ' ')}
                                                </span>
                                                {acc.is_system && (
                                                    <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 font-black rounded-full">SYS</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Credit Notes Panel ──────────────────────────────────────────────────────

function CreditNotesPanel({ businessId, creditNotes, currency }) {
    const STATUS_STYLES = {
        draft: 'bg-gray-100 text-gray-600',
        issued: 'bg-blue-100 text-blue-700',
        applied: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Credit Notes</h3>
                <span className="text-xs text-gray-400 font-semibold">{creditNotes.length} records</span>
            </div>

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
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${STATUS_STYLES[cn.status] || STATUS_STYLES.draft}`}>
                                        {cn.status?.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{cn.reason || 'No reason specified'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-red-600">{currency} {Number(cn.total_amount).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">{new Date(cn.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Fiscal Periods Panel ────────────────────────────────────────────────────

function FiscalPeriodsPanel({ businessId, periods, currency }) {
    const STATUS_STYLES = {
        open: 'bg-emerald-100 text-emerald-700',
        closed: 'bg-gray-100 text-gray-600',
        locked: 'bg-red-100 text-red-600',
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Fiscal Periods</h3>
                <span className="text-xs text-gray-400 font-semibold">{periods.length} periods</span>
            </div>

            {periods.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No fiscal periods defined</p>
                    <p className="text-xs">Set up your fiscal year structure to control GL posting</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {periods.map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                            <Calendar className="w-4 h-4 text-gray-300 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(p.start_date).toLocaleDateString()} — {new Date(p.end_date).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${STATUS_STYLES[p.status] || STATUS_STYLES.open}`}>
                                {p.status?.toUpperCase()}
                            </span>
                            {p.closed_by && (
                                <span className="text-[9px] text-gray-400">by {p.closed_by}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Exchange Rates Panel ────────────────────────────────────────────────────

function ExchangeRatesPanel({ businessId, rates, currency }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Exchange Rates</h3>
                <span className="text-xs text-gray-400 font-semibold">{rates.length} rates</span>
            </div>

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
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600">
                                {r.from_currency}
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-black text-emerald-600">
                                {r.to_currency}
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold text-gray-800">
                                    1 {r.from_currency} = {Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.to_currency}
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-black',
                                    r.source === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                )}>
                                    {r.source?.toUpperCase()}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(r.effective_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Finance Overview Panel ──────────────────────────────────────────────────

function FinanceOverview({ accounts, expenses, creditNotes, currency, loading }) {
    const totalExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]
    );
    const totalCreditNotes = useMemo(() =>
        creditNotes.reduce((sum, c) => sum + Number(c.total_amount || 0), 0), [creditNotes]
    );
    const activeAccounts = accounts.filter(a => !a.is_deleted).length;
    const thisMonthExpenses = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenses
            .filter(e => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }, [expenses]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard label="GL Accounts" value={activeAccounts} icon={BookOpen} color="indigo" loading={loading} />
                <KPICard label="Total Expenses" value={`${currency} ${totalExpenses.toLocaleString()}`} icon={Receipt} color="red" loading={loading} />
                <KPICard label="This Month" value={`${currency} ${thisMonthExpenses.toLocaleString()}`} icon={TrendingDown} color="amber" loading={loading} />
                <KPICard label="Credit Notes" value={`${currency} ${totalCreditNotes.toLocaleString()}`} icon={RefreshCcw} color="blue" loading={loading} />
            </div>

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Recent Expenses */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Expenses</h4>
                    {expenses.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="text-gray-600 truncate flex-1">{e.category || 'Uncategorized'}</span>
                            <span className="text-gray-800 font-bold shrink-0">{currency} {Number(e.amount).toLocaleString()}</span>
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No expenses recorded</p>}
                </div>

                {/* Account Types Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account Categories</h4>
                    {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                        const count = accounts.filter(a => a.type === type).length;
                        return (
                            <div key={type} className="flex items-center justify-between py-1.5 text-sm">
                                <span className="text-gray-600 capitalize">{type}s</span>
                                <span className="text-gray-800 font-bold">{count} accounts</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FINANCE HUB
// ═══════════════════════════════════════════════════════════════════════════════

export default function FinanceHub({ businessId }) {
    const { business, currency, currencySymbol } = useBusiness();
    const { can, planCan } = usePermissions();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Data state
    const [accounts, setAccounts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [rates, setRates] = useState([]);

    const effectiveCurrency = currencySymbol || 'Rs.';
    const effectiveBusinessId = businessId || business?.id;

    // Load all finance data
    const loadData = useCallback(async () => {
        if (!effectiveBusinessId) return;
        setLoading(true);
        try {
            const [accRes, expRes, cnRes, fpRes, exRes] = await Promise.allSettled([
                getGLAccountsAction(effectiveBusinessId),
                getExpensesAction(effectiveBusinessId, { limit: 50 }),
                getCreditNotesAction(effectiveBusinessId),
                getFiscalPeriodsAction(effectiveBusinessId),
                getExchangeRatesAction(effectiveBusinessId),
            ]);

            if (accRes.status === 'fulfilled' && accRes.value.success) setAccounts(accRes.value.accounts || []);
            if (expRes.status === 'fulfilled' && expRes.value.success) setExpenses(expRes.value.expenses || []);
            if (cnRes.status === 'fulfilled' && cnRes.value.success) setCreditNotes(cnRes.value.creditNotes || cnRes.value.credit_notes || []);
            if (fpRes.status === 'fulfilled' && fpRes.value.success) setPeriods(fpRes.value.periods || []);
            if (exRes.status === 'fulfilled' && exRes.value.success) setRates(exRes.value.rates || []);
        } catch (err) {
            console.error('[FinanceHub] Load failed:', err);
        } finally {
            setLoading(false);
        }
    }, [effectiveBusinessId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Filter tabs by permission + plan
    const visibleTabs = useMemo(() =>
        FINANCE_TABS.filter(tab => {
            if (tab.permission && !can(tab.permission)) return false;
            if (tab.feature && !planCan(tab.feature)) return false;
            return true;
        }),
        [can, planCan]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <FinanceOverview accounts={accounts} expenses={expenses} creditNotes={creditNotes} currency={effectiveCurrency} loading={loading} />;
            case 'accounts':
                return <ChartOfAccountsPanel businessId={effectiveBusinessId} accounts={accounts} currency={effectiveCurrency} />;
            case 'expenses':
                return (
                    <ExpenseManager
                        businessId={effectiveBusinessId}
                        expenses={expenses}
                        onCreateExpense={() => loadData()}
                        onDeleteExpense={() => loadData()}
                        currency={effectiveCurrency}
                    />
                );
            case 'credit-notes':
                return <CreditNotesPanel businessId={effectiveBusinessId} creditNotes={creditNotes} currency={effectiveCurrency} />;
            case 'fiscal':
                return <FiscalPeriodsPanel businessId={effectiveBusinessId} periods={periods} currency={effectiveCurrency} />;
            case 'exchange':
                return <ExchangeRatesPanel businessId={effectiveBusinessId} rates={rates} currency={effectiveCurrency} />;
            default:
                return <FinanceOverview accounts={accounts} expenses={expenses} creditNotes={creditNotes} currency={effectiveCurrency} loading={loading} />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Finance Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Finance & Accounting</h2>
                    <p className="text-xs text-gray-400 font-medium">General Ledger · Expenses · Credit Notes · Fiscal Periods</p>
                </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {visibleTabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

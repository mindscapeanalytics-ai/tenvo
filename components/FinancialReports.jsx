'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, Scale, ArrowUpRight, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { accountingAPI } from '@/lib/api/accounting';
import { useBusiness } from '@/lib/context/BusinessContext';
import { resolveDisplayCurrency } from '@/lib/utils/businessRegionalContext';
import { AgingReportsPanel } from '@/components/reports/AgingReportsPanel';
import TrialBalanceView from '@/components/TrialBalanceView';
import DayBookReport from '@/components/finance/DayBookReport';
import { generateFinanceStatementPDF, generateSectionedFinancePDF, buildFinancePdfMeta } from '@/lib/pdf/financeStatementPdf';
import toast from 'react-hot-toast';

// Helper for row rendering
const ReportRow = ({ label, amount, type = 'normal', indent = false, currency }) => (
    <div className={`flex justify-between py-2 border-b border-gray-150 dark:border-slate-800/40 ${type === 'total' ? 'font-bold bg-gray-50/50 dark:bg-slate-900/50 px-2 rounded mt-1' : ''} ${indent ? 'pl-8' : ''}`}>
        <span className={`${type === 'total' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
        <span className={`${type === 'total' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 font-mono'}`}>
            {formatCurrency(amount || 0, currency)}
        </span>
    </div>
);

// Helper for section header
const SectionHeader = ({ title, icon: Icon, color }) => (
    <div className="flex items-center gap-2 mt-6 mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">{title}</h3>
    </div>
);

/**
 * @param {Object} props
 * @param {string} props.businessId
 * @param {string} [props.category] optional, reserved for future domain-specific report chrome
 * @param {string} [props.initialReport] pl | bs | cf | tb | day-book | aging
 */
export default function FinancialReports({ businessId, initialReport = 'pl' }) {
    const { business, currency: businessCurrencyCode, regionalPack } = useBusiness();
    const reportCurrency = resolveDisplayCurrency(
      { currency: businessCurrencyCode || business?.currency },
      regionalPack
    );
    const reportLocale = regionalPack?.locale;
    const taxIdLabel = regionalPack?.taxIdLabel || 'Tax ID';
    const taxIdLine = business?.ntn ? `${taxIdLabel}: ${business.ntn}` : null;
    const [activeTab, setActiveTab] = useState(() => {
        const allowed = new Set(['pl', 'bs', 'cf', 'tb', 'day-book', 'aging']);
        return allowed.has(initialReport) ? initialReport : 'pl';
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const allowed = new Set(['pl', 'bs', 'cf', 'tb', 'day-book', 'aging']);
        if (initialReport && allowed.has(initialReport)) {
            setActiveTab(initialReport);
        }
    }, [initialReport]);

    // Date States
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // First day of month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]); // Today for BS
    const [cfStartDate, setCfStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [cfEndDate, setCfEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Data States
    const [plData, setPlData] = useState(null);
    const [bsData, setBsData] = useState(null);
    const [cfData, setCfData] = useState(null);

    const fetchPL = async () => {
        setLoading(true);
        try {
            const res = await accountingAPI.getProfitLoss(businessId, startDate, endDate);
            if (res.success) setPlData(res.statement);
            else toast.error(res.error || 'Failed to load P&L');
        } catch { toast.error('Error loading P&L'); }
        finally { setLoading(false); }
    };

    const fetchBS = async () => {
        setLoading(true);
        try {
            const res = await accountingAPI.getBalanceSheet(businessId, asOfDate);
            if (res.success) setBsData(res.statement);
            else toast.error(res.error || 'Failed to load Balance Sheet');
        } catch { toast.error('Error loading Balance Sheet'); }
        finally { setLoading(false); }
    };

    const fetchCashFlow = async () => {
        setLoading(true);
        try {
            const res = await accountingAPI.getCashFlow(businessId, cfStartDate, cfEndDate);
            if (!res.success) {
                toast.error(res.error || 'Failed to load Cash Flow Statement');
                return;
            }
            const s = res.statement;
            setCfData({
                netIncome: s.netIncome,
                arChange: s.adjustments?.accountsReceivable || 0,
                inventoryChange: s.adjustments?.inventory || 0,
                apChange: s.adjustments?.accountsPayable || 0,
                taxChange: s.adjustments?.taxPayable || 0,
                operatingCashFlow: s.operatingCashFlow,
                investingFinancingNet: s.investingFinancingNet,
                netChangeInCash: s.netChangeInCash,
                cashStart: s.openingCash,
                cashEnd: s.closingCash,
            });
        } catch { toast.error('Error loading Cash Flow'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!businessId) return;
        queueMicrotask(() => {
            // Keep prior statement in memory when switching PL/BS/CF (no remount storm).
            if (activeTab === 'pl' && !plData) void fetchPL();
            else if (activeTab === 'bs' && !bsData) void fetchBS();
            else if (activeTab === 'cf' && !cfData) void fetchCashFlow();
        });
        // Fetches close over date state; ranges refresh via explicit Refresh buttons.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, activeTab, plData, bsData, cfData]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
        try {
            const baseMeta = buildFinancePdfMeta(business, {
                currency: reportCurrency,
                locale: reportLocale,
                taxIdLabel,
                footnote: taxIdLine || 'Confidential',
            });
            if (activeTab === 'pl' && plData) {
                generateSectionedFinancePDF(
                    {
                        ...baseMeta,
                        title: 'Profit & Loss Statement',
                        periodLabel: `${startDate} to ${endDate}`,
                    },
                    [
                        {
                            heading: 'Income',
                            rows: (plData.income || []).map((a) => ({ label: a.name, amount: a.amount })),
                            totalLabel: 'Total Income',
                            totalAmount: plData.totalIncome,
                        },
                        {
                            heading: 'Cost of Goods Sold',
                            rows: (plData.cogs || []).map((a) => ({ label: a.name, amount: a.amount })),
                            totalLabel: 'Total COGS',
                            totalAmount: plData.totalCOGS,
                        },
                        {
                            heading: 'Gross Profit',
                            rows: [
                                {
                                    label: `Gross Margin ${Number(plData.grossMargin || 0).toFixed(1)}%`,
                                    amount: plData.grossProfit,
                                },
                            ],
                            totalLabel: 'Gross Profit',
                            totalAmount: plData.grossProfit,
                        },
                        {
                            heading: 'Operating Expenses',
                            rows: (plData.otherExpenses || []).map((a) => ({ label: a.name, amount: a.amount })),
                            totalLabel: 'Total Operating Expenses',
                            totalAmount: Number(plData.totalExpense || 0) - Number(plData.totalCOGS || 0),
                        },
                        {
                            heading: 'Net Income',
                            rows: [],
                            totalLabel: 'Net Income',
                            totalAmount: plData.netIncome,
                        },
                    ],
                    { filename: `Profit-Loss-${startDate}-${endDate}.pdf` }
                );
            } else if (activeTab === 'bs' && bsData) {
                generateSectionedFinancePDF(
                    {
                        ...baseMeta,
                        title: 'Balance Sheet',
                        periodLabel: `As of ${asOfDate}`,
                        balanced: bsData.isBalanced,
                    },
                    [
                        {
                            heading: 'Assets',
                            rows: (bsData.assets || []).map((a) => ({ label: a.name, amount: a.balance })),
                            totalLabel: 'Total Assets',
                            totalAmount: bsData.totalAssets,
                        },
                        {
                            heading: 'Liabilities',
                            rows: (bsData.liabilities || []).map((a) => ({ label: a.name, amount: a.balance })),
                            totalLabel: 'Total Liabilities',
                            totalAmount: bsData.totalLiabilities,
                        },
                        {
                            heading: 'Equity',
                            rows: [
                                ...(bsData.equity || []).map((a) => ({ label: a.name, amount: a.balance })),
                                { label: 'Retained Earnings (to date)', amount: bsData.retainedEarnings },
                            ],
                            totalLabel: 'Total Equity',
                            totalAmount: bsData.totalEquity,
                        },
                    ],
                    { filename: `Balance-Sheet-${asOfDate}.pdf` }
                );
            } else if (activeTab === 'cf' && cfData) {
                generateFinanceStatementPDF(
                    {
                        ...baseMeta,
                        title: 'Cash Flow Statement',
                        periodLabel: `${cfStartDate} to ${cfEndDate}`,
                        footnote: 'Indirect method. Other / reconciling is the residual to match cash movement.',
                    },
                    [
                        { key: 'label', label: 'Line' },
                        { key: 'amount', label: 'Amount' },
                    ],
                    [
                        { label: 'Net Income', amount: cfData.netIncome },
                        { label: 'Change in AR', amount: cfData.arChange },
                        { label: 'Change in Inventory', amount: cfData.inventoryChange },
                        { label: 'Change in AP', amount: cfData.apChange },
                        { label: 'Change in Tax Payable', amount: cfData.taxChange },
                        { label: 'Operating Cash Flow', amount: cfData.operatingCashFlow },
                        { label: 'Other / reconciling items (plug)', amount: cfData.investingFinancingNet },
                        { label: 'Net Change in Cash', amount: cfData.netChangeInCash },
                        { label: 'Opening Cash', amount: cfData.cashStart },
                        { label: 'Closing Cash', amount: cfData.cashEnd },
                    ],
                    { filename: `Cash-Flow-${cfStartDate}-${cfEndDate}.pdf` }
                );
            } else {
                toast.error('Load the report before downloading PDF');
            }
        } catch (err) {
            console.error(err);
            toast.error('PDF export failed');
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">Comprehensive view of your business financial health.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
                            <TabsTrigger value="pl" className="text-xs sm:text-sm">Profit & Loss</TabsTrigger>
                            <TabsTrigger value="bs" className="text-xs sm:text-sm">Balance Sheet</TabsTrigger>
                            <TabsTrigger value="cf" className="text-xs sm:text-sm">Cash Flow</TabsTrigger>
                            <TabsTrigger value="tb" className="text-xs sm:text-sm">Trial Balance</TabsTrigger>
                            <TabsTrigger value="day-book" className="text-xs sm:text-sm">Day Book</TabsTrigger>
                            <TabsTrigger value="aging" className="text-xs sm:text-sm">A/R & A/P Aging</TabsTrigger>
                        </TabsList>

                        <div className="flex flex-wrap items-center gap-2 print:hidden">
                            {activeTab === 'pl' ? (
                                <>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-md px-2 py-1">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm outline-none w-32 bg-transparent text-gray-900 dark:text-gray-100" />
                                        <span className="text-gray-400">-</span>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm outline-none w-32 bg-transparent text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchPL} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </>
                            ) : activeTab === 'bs' ? (
                                <>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-md px-2 py-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">As of:</span>
                                        <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="text-sm outline-none w-32 bg-transparent text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchBS} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </>
                            ) : activeTab === 'cf' ? (
                                <>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-md px-2 py-1">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <input type="date" value={cfStartDate} onChange={e => setCfStartDate(e.target.value)} className="text-sm outline-none w-32 bg-transparent text-gray-900 dark:text-gray-100" />
                                        <span className="text-gray-400">-</span>
                                        <input type="date" value={cfEndDate} onChange={e => setCfEndDate(e.target.value)} className="text-sm outline-none w-32 bg-transparent text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchCashFlow} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </>
                            ) : null}
                            {activeTab !== 'aging' && activeTab !== 'tb' && activeTab !== 'day-book' && (
                            <>
                            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                Print
                            </Button>
                            </>
                            )}
                        </div>
                    </div>

                    {/* PROFIT & LOSS CONTENT */}
                    <TabsContent value="pl">
                        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm print:shadow-none bg-white dark:bg-slate-950 min-h-[500px]">
                            <CardContent className="p-3 sm:p-8">
                                <div className="text-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase">Profit & Loss Statement</h2>
                                    {business?.business_name && (
                                        <p className="text-gray-800 dark:text-gray-200 font-semibold text-base mt-2">{business.business_name}</p>
                                    )}
                                    {(business?.ntn || business?.address) && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            {[taxIdLine, business.address].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        For the period {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                                    </p>
                                </div>

                                {loading && !plData ? (
                                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                                ) : plData ? (
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        {/* INCOME SECTION */}
                                        <section>
                                            <SectionHeader title="Operating Income" icon={TrendingUp} color="bg-green-500" />
                                            <div className="space-y-1">
                                                {plData.income.length > 0 ? (
                                                    plData.income.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 italic py-2 px-4">No income recorded</div>
                                                )}
                                                <ReportRow currency={reportCurrency} label="Total Income" amount={plData.totalIncome} type="total" />
                                            </div>
                                        </section>

                                        {/* COGS SECTION */}
                                        <section>
                                            <SectionHeader title="Cost of Goods Sold" icon={TrendingDown} color="bg-orange-500" />
                                            <div className="space-y-1">
                                                {plData.cogs.length > 0 ? (
                                                    plData.cogs.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 italic py-2 px-4">No COGS recorded</div>
                                                )}
                                                <ReportRow currency={reportCurrency} label="Total COGS" amount={plData.totalCOGS} type="total" />
                                            </div>
                                        </section>

                                        {/* GROSS PROFIT SUMMARY */}
                                        <section className="bg-green-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-green-100 dark:border-emerald-900/30 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-green-800 dark:text-emerald-300">Gross Profit</h3>
                                                <p className="text-green-600/70 dark:text-emerald-400/60 text-xs">Operating Income - COGS</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-bold ${Number(plData.grossProfit) >= 0 ? 'text-green-700 dark:text-emerald-400' : 'text-red-700 dark:text-rose-400'}`}>
                                                    {formatCurrency(Number(plData.grossProfit), reportCurrency)}
                                                </div>
                                                <div className="text-[10px] font-bold text-green-600 dark:text-emerald-500 uppercase tracking-wider">
                                                    {Number(plData.totalIncome) > 0 ? Math.round((Number(plData.grossProfit) / Number(plData.totalIncome)) * 100) : 0}% Margin
                                                </div>
                                            </div>
                                        </section>

                                        {/* OTHER EXPENSE SECTION */}
                                        <section>
                                            <SectionHeader title="Operating Expenses" icon={TrendingDown} color="bg-red-500" />
                                            <div className="space-y-1">
                                                {plData.otherExpenses.length > 0 ? (
                                                    plData.otherExpenses.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 dark:text-gray-500 italic py-2 px-4">No other expenses recorded</div>
                                                )}
                                                <ReportRow currency={reportCurrency} label="Total Operating Expenses" amount={plData.totalExpense - plData.totalCOGS} type="total" />
                                            </div>
                                        </section>

                                        {/* NET INCOME SUMMARY */}
                                        <section className={`p-6 rounded-xl border flex items-center justify-between mt-8 ${
                                            Number(plData.netIncome) >= 0 
                                                ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                                                : 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                                        }`}>
                                            <div>
                                                <h3 className={`text-lg font-bold ${Number(plData.netIncome) >= 0 ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}>Net Income</h3>
                                                <p className={`${Number(plData.netIncome) >= 0 ? 'text-emerald-700/80 dark:text-emerald-400/80' : 'text-red-700/80 dark:text-red-400/80'} text-xs mt-0.5`}>Gross Profit - Operating Expenses</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${Number(plData.netIncome) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {formatCurrency(Number(plData.netIncome), reportCurrency)}
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-12">Click refresh to load data</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BALANCE SHEET CONTENT */}
                    <TabsContent value="bs">
                        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm print:shadow-none bg-white dark:bg-slate-950 min-h-[500px]">
                            <CardContent className="p-3 sm:p-8">
                                <div className="text-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase">Balance Sheet</h2>
                                    {business?.business_name && (
                                        <p className="text-gray-800 dark:text-gray-200 font-semibold text-base mt-2">{business.business_name}</p>
                                    )}
                                    {(business?.ntn || business?.address) && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            {[taxIdLine, business.address].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        As of {new Date(asOfDate).toLocaleDateString()}
                                    </p>
                                </div>

                                {loading && !bsData ? (
                                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                                ) : bsData ? (
                                    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                        {/* ASSETS */}
                                        <div className="space-y-8">
                                            <section>
                                                <SectionHeader title="Assets" icon={TrendingUp} color="bg-blue-500" />
                                                <div className="space-y-1">
                                                    {bsData.assets.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <div className="mt-4 pt-2 border-t-2 border-gray-900 dark:border-gray-100">
                                                        <ReportRow currency={reportCurrency} label="Total Assets" amount={bsData.totalAssets} type="total" />
                                                    </div>
                                                </div>
                                            </section>
                                        </div>

                                        {/* LIABILITIES & EQUITY */}
                                        <div className="space-y-8">
                                            <section>
                                                <SectionHeader title="Liabilities" icon={TrendingDown} color="bg-orange-500" />
                                                <div className="space-y-1">
                                                    {bsData.liabilities.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <ReportRow currency={reportCurrency} label="Total Liabilities" amount={bsData.totalLiabilities} type="total" />
                                                </div>
                                            </section>

                                            <section>
                                                <SectionHeader title="Equity" icon={Scale} color="bg-wine-500" />
                                                <div className="space-y-1">
                                                    {bsData.equity.map(acc => (
                                                        <ReportRow currency={reportCurrency} key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <ReportRow currency={reportCurrency} label="Net Income (Retained)" amount={bsData.retainedEarnings} indent />
                                                    <ReportRow currency={reportCurrency} label="Total Equity" amount={bsData.totalEquity} type="total" />
                                                </div>
                                            </section>

                                            <div className="pt-4 mt-4 border-t-2 border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-slate-900/50 p-2 rounded">
                                                <div className="flex justify-between items-center font-bold text-gray-900 dark:text-gray-100">
                                                    <span>Total Liabilities & Equity</span>
                                                    <span>{formatCurrency(bsData.totalLiabilitiesAndEquity, reportCurrency)}</span>
                                                </div>
                                                {!bsData.isBalanced && (
                                                    <div className="text-xs text-red-500 mt-1 font-medium bg-red-50 dark:bg-red-950/20 p-1 rounded">
                                                        Unbalanced: {formatCurrency(Math.abs(bsData.totalAssets - bsData.totalLiabilitiesAndEquity), reportCurrency)} difference
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-12">Click refresh to load data</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CASH FLOW STATEMENT */}
                    <TabsContent value="cf">
                        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm print:shadow-none bg-white dark:bg-slate-950 min-h-[500px]">
                            <CardContent className="p-3 sm:p-8">
                                <div className="text-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase">Cash Flow Statement</h2>
                                    {business?.business_name && (
                                        <p className="text-gray-800 dark:text-gray-200 font-semibold text-base mt-2">{business.business_name}</p>
                                    )}
                                    {(business?.ntn || business?.address) && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            {[taxIdLine, business.address].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        For the period {new Date(cfStartDate).toLocaleDateString()} to {new Date(cfEndDate).toLocaleDateString()} (Indirect Method)
                                    </p>
                                </div>

                                {loading && !cfData ? (
                                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                                ) : cfData ? (
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        <section>
                                            <SectionHeader title="Cash from Operating Activities" icon={Banknote} color="bg-green-500" />
                                            <div className="space-y-1">
                                                <ReportRow currency={reportCurrency} label="Net Income" amount={cfData.netIncome} />
                                                <ReportRow currency={reportCurrency} label="Change in Accounts Receivable" amount={cfData.arChange} indent />
                                                <ReportRow currency={reportCurrency} label="Change in Inventory" amount={cfData.inventoryChange} indent />
                                                <ReportRow currency={reportCurrency} label="Change in Accounts Payable" amount={cfData.apChange} indent />
                                                <ReportRow currency={reportCurrency} label="Change in Tax Payable" amount={cfData.taxChange} indent />
                                                <ReportRow currency={reportCurrency} label="Net Cash from Operations" amount={cfData.operatingCashFlow} type="total" />
                                            </div>
                                        </section>

                                        <section>
                                            <SectionHeader title="Other / reconciling items" icon={ArrowUpRight} color="bg-wine-500" />
                                            <div className="space-y-1">
                                                <ReportRow currency={reportCurrency} label="Residual to match cash movement" amount={cfData.investingFinancingNet} />
                                            </div>
                                        </section>

                                        <section className={`p-6 rounded-xl border mt-8 space-y-4 ${
                                            cfData.netChangeInCash >= 0
                                                ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                                                : 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className={`text-lg font-semibold ${cfData.netChangeInCash >= 0 ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}>Net Change in Cash</h3>
                                                    <p className={`${cfData.netChangeInCash >= 0 ? 'text-emerald-700/80 dark:text-emerald-400/80' : 'text-red-700/80 dark:text-red-400/80'} text-xs mt-0.5`}>From GL cash and bank accounts</p>
                                                </div>
                                                <div className={`text-2xl font-semibold ${cfData.netChangeInCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {formatCurrency(cfData.netChangeInCash, reportCurrency)}
                                                </div>
                                            </div>
                                            <div className={`border-t pt-3 flex justify-between text-sm ${cfData.netChangeInCash >= 0 ? 'border-emerald-100/50 dark:border-emerald-900/30' : 'border-red-100/50 dark:border-red-900/30'}`}>
                                                <span className={cfData.netChangeInCash >= 0 ? 'text-emerald-700/80 dark:text-emerald-400/80' : 'text-red-700/80 dark:text-red-400/80'}>Beginning Cash Balance</span>
                                                <span className={`font-mono ${cfData.netChangeInCash >= 0 ? 'text-emerald-900/90 dark:text-emerald-300/90' : 'text-red-900/90 dark:text-red-300/90'}`}>{formatCurrency(cfData.cashStart, reportCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className={cfData.netChangeInCash >= 0 ? 'text-emerald-700/80 dark:text-emerald-400/80' : 'text-red-700/80 dark:text-red-400/80'}>Ending Cash Balance</span>
                                                <span className={`font-mono font-semibold ${cfData.netChangeInCash >= 0 ? 'text-emerald-950 dark:text-emerald-200' : 'text-red-950 dark:text-red-200'}`}>{formatCurrency(cfData.cashEnd, reportCurrency)}</span>
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-12">Click refresh to load data</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tb" className="mt-0">
                        <TrialBalanceView
                            businessId={businessId}
                            currency={reportCurrency}
                        />
                    </TabsContent>

                    <TabsContent value="day-book" className="mt-0">
                        <DayBookReport businessId={businessId} />
                    </TabsContent>

                    <TabsContent value="aging" className="mt-0">
                        <AgingReportsPanel businessId={businessId} currency={reportCurrency} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}


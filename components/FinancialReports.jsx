'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { accountingAPI } from '@/lib/api/accounting';
import { getDomainColors } from '@/lib/domainColors';
import toast from 'react-hot-toast';

// Helper for row rendering
const ReportRow = ({ label, amount, type = 'normal', indent = false, currency = 'PKR' }) => (
    <div className={`flex justify-between py-2 border-b border-gray-50 ${type === 'total' ? 'font-bold bg-gray-50/50 px-2 rounded mt-1' : ''} ${indent ? 'pl-8' : ''}`}>
        <span className={`${type === 'total' ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
        <span className={`${type === 'total' ? 'text-gray-900' : 'text-gray-700 font-mono'}`}>
            {formatCurrency(amount, currency)}
        </span>
    </div>
);

// Helper for section header
const SectionHeader = ({ title, icon: Icon, color }) => (
    <div className="flex items-center gap-2 mt-6 mb-3 pb-2 border-b border-gray-100">
        <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
    </div>
);

export default function FinancialReports({ businessId, category = 'retail-shop' }) {
    const colors = getDomainColors(category);
    const [activeTab, setActiveTab] = useState('pl');
    const [loading, setLoading] = useState(false);

    // Date States
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // First day of month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]); // Today for BS

    // Data States
    const [plData, setPlData] = useState(null);
    const [bsData, setBsData] = useState(null);

    const fetchPL = async () => {
        setLoading(true);
        try {
            const res = await accountingAPI.getProfitLoss(businessId, startDate, endDate);
            if (res.success) setPlData(res.statement);
            else toast.error(res.error || 'Failed to load P&L');
        } catch (e) { toast.error('Error loading P&L'); }
        finally { setLoading(false); }
    };

    const fetchBS = async () => {
        setLoading(true);
        try {
            const res = await accountingAPI.getBalanceSheet(businessId, asOfDate);
            if (res.success) setBsData(res.statement);
            else toast.error(res.error || 'Failed to load Balance Sheet');
        } catch (e) { toast.error('Error loading Balance Sheet'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (businessId) {
            if (activeTab === 'pl') fetchPL();
            else fetchBS();
        }
    }, [businessId, activeTab]);

    const handlePrint = () => window.print();

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Financial Reports</CardTitle>
                        <CardDescription>Comprehensive view of your business financial health.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-white border">
                            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                            <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 print:hidden">
                            {activeTab === 'pl' ? (
                                <>
                                    <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm outline-none w-32" />
                                        <span className="text-gray-400">-</span>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm outline-none w-32" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchPL} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
                                        <span className="text-xs text-gray-500 font-medium">As of:</span>
                                        <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="text-sm outline-none w-32" />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchBS} disabled={loading}>
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* PROFIT & LOSS CONTENT */}
                    <TabsContent value="pl">
                        <Card className="border shadow-sm print:shadow-none bg-white min-h-[500px]">
                            <CardContent className="p-8">
                                <div className="text-center mb-8 border-b pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 uppercase">Profit & Loss Statement</h2>
                                    <p className="text-gray-500 text-sm mt-1">
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
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 italic py-2 px-4">No income recorded</div>
                                                )}
                                                <ReportRow label="Total Income" amount={plData.totalIncome} type="total" />
                                            </div>
                                        </section>

                                        {/* COGS SECTION */}
                                        <section>
                                            <SectionHeader title="Cost of Goods Sold" icon={TrendingDown} color="bg-orange-500" />
                                            <div className="space-y-1">
                                                {plData.cogs.length > 0 ? (
                                                    plData.cogs.map(acc => (
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 italic py-2 px-4">No COGS recorded</div>
                                                )}
                                                <ReportRow label="Total COGS" amount={plData.totalCOGS} type="total" />
                                            </div>
                                        </section>

                                        {/* GROSS PROFIT SUMMARY */}
                                        <section className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-green-800">Gross Profit</h3>
                                                <p className="text-green-600/70 text-xs">Operating Income - COGS</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-bold ${plData.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {formatCurrency(plData.grossProfit, 'PKR')}
                                                </div>
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                                    {plData.totalIncome > 0 ? Math.round((plData.grossProfit / plData.totalIncome) * 100) : 0}% Margin
                                                </div>
                                            </div>
                                        </section>

                                        {/* OTHER EXPENSE SECTION */}
                                        <section>
                                            <SectionHeader title="Operating Expenses" icon={TrendingDown} color="bg-red-500" />
                                            <div className="space-y-1">
                                                {plData.otherExpenses.length > 0 ? (
                                                    plData.otherExpenses.map(acc => (
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.amount} />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-400 italic py-2 px-4">No other expenses recorded</div>
                                                )}
                                                <ReportRow label="Total Operating Expenses" amount={plData.totalExpense - plData.totalCOGS} type="total" />
                                            </div>
                                        </section>

                                        {/* NET INCOME SUMMARY */}
                                        <section className="bg-gray-900 p-6 rounded-xl shadow-lg flex items-center justify-between mt-8 text-white">
                                            <div>
                                                <h3 className="text-lg font-bold">Net Income</h3>
                                                <p className="text-gray-400 text-sm">Gross Profit - Operating Expenses</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${plData.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatCurrency(plData.netIncome, 'PKR')}
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
                        <Card className="border shadow-sm print:shadow-none bg-white min-h-[500px]">
                            <CardContent className="p-8">
                                <div className="text-center mb-8 border-b pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 uppercase">Balance Sheet</h2>
                                    <p className="text-gray-500 text-sm mt-1">
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
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <div className="mt-4 pt-2 border-t-2 border-gray-900">
                                                        <ReportRow label="Total Assets" amount={bsData.totalAssets} type="total" />
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
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <ReportRow label="Total Liabilities" amount={bsData.totalLiabilities} type="total" />
                                                </div>
                                            </section>

                                            <section>
                                                <SectionHeader title="Equity" icon={Scale} color="bg-purple-500" />
                                                <div className="space-y-1">
                                                    {bsData.equity.map(acc => (
                                                        <ReportRow key={acc.id} label={acc.name} amount={acc.balance} />
                                                    ))}
                                                    <ReportRow label="Net Income (Retained)" amount={bsData.retainedEarnings} indent />
                                                    <ReportRow label="Total Equity" amount={bsData.totalEquity} type="total" />
                                                </div>
                                            </section>

                                            <div className="pt-4 mt-4 border-t-2 border-gray-900 bg-gray-50 p-2 rounded">
                                                <div className="flex justify-between items-center font-bold text-gray-900">
                                                    <span>Total Liabilities & Equity</span>
                                                    <span>{formatCurrency(bsData.totalLiabilitiesAndEquity, 'PKR')}</span>
                                                </div>
                                                {!bsData.isBalanced && (
                                                    <div className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-1 rounded">
                                                        Unbalanced: {formatCurrency(Math.abs(bsData.totalAssets - bsData.totalLiabilitiesAndEquity), 'PKR')} difference
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
                </Tabs>
            </CardContent>
        </Card>
    );
}

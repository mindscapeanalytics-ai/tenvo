import { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users,
    ArrowUpRight, ArrowDownRight, Rocket, Target, Star,
    Calendar, Filter, Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import {
    SalesChart,
    RevenueBarChart,
    TopProductsChart
} from './AdvancedCharts';
import { aggregateMonthlyData, getTopCatalysts } from '@/lib/utils/analytics';

export function SalesManager({
    invoices = [],
    customers = [],
    products = [],
    category = 'retail-shop'
}) {
    const colors = getDomainColors(category);
    const [timeframe, setTimeframe] = useState('monthly');

    // Intelligence: Aggregate real-time sales metrics
    const metrics = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
        const count = invoices.length;
        const avg = count > 0 ? Number(total) / count : 0;

        return {
            total: formatCurrency(total, 'PKR'),
            count: count.toString(),
            avg: formatCurrency(avg, 'PKR'),
            customers: customers.length.toString()
        };
    }, [invoices, customers]);

    // Intelligence: Calculate conversion/performance data
    const chartData = useMemo(() => {
        return aggregateMonthlyData(invoices, 6);
    }, [invoices]);

    const topCatalysts = useMemo(() => {
        return getTopCatalysts(invoices, products, 5);
    }, [invoices, products]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Sales Command Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 p-6 rounded-3xl border border-gray-100 backdrop-blur-md shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase flex items-center gap-3">
                        <TrendingUp className="w-8 h-8" style={{ color: colors.primary }} />
                        Sales Command Center
                    </h2>
                    <p className="text-gray-500 font-medium italic">High-velocity business intelligence & revenue tracking</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    <Button
                        variant={timeframe === 'monthly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setTimeframe('monthly')}
                    >
                        Monthly
                    </Button>
                    <Button
                        variant={timeframe === 'quarterly' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setTimeframe('quarterly')}
                    >
                        Quarterly
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Gross Revenue', value: metrics.total, icon: DollarSign, trend: '+12.5%', sub: 'Total Invoiced' },
                    { label: 'Order Volume', value: metrics.count, icon: ShoppingCart, trend: '+8.2%', sub: 'Completed Deals' },
                    { label: 'Avg Order Value', value: metrics.avg, icon: Target, trend: '+4.1%', sub: 'Basket Size' },
                    { label: 'Client Base', value: metrics.customers, icon: Users, trend: '+15%', sub: 'Active Accounts' }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-xl bg-white/70 backdrop-blur-sm group hover:scale-[1.02] transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-gray-50 group-hover:bg-wine/5 transition-colors">
                                    <kpi.icon className="w-6 h-6" style={{ color: colors.primary }} />
                                </div>
                                <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-black text-[10px]">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {kpi.trend}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                                <p className="text-[10px] font-bold text-gray-400 italic mt-2">{kpi.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Analytics Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-50 bg-white/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black uppercase italic">Revenue Velocity</CardTitle>
                                <CardDescription>6-Month transactional performance analysis</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Download className="w-4 h-4 text-gray-400" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <SalesChart data={chartData} colors={colors} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-gray-50 bg-white/30">
                        <CardTitle className="text-lg font-black uppercase italic">Top Catalysts</CardTitle>
                        <CardDescription>Highest moving products</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-6 space-y-4">
                            {topCatalysts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-white/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xs text-gray-400 group-hover:bg-wine/10 group-hover:text-wine transition-colors">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 leading-none">{p.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{p.category || 'Standard'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black" style={{ color: colors.primary }}>{formatCurrency(p.revenue, 'PKR')}</p>
                                        <p className="text-[10px] font-bold text-green-500 uppercase">{p.sales} Sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase italic">Order Distribution</CardTitle>
                        <CardDescription>Revenue by item category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <RevenueBarChart data={chartData} colors={colors} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase italic">Recent Transactions</CardTitle>
                        <CardDescription>Real-time sales feed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoices.slice(0, 5).map((inv, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-gray-50 bg-white/50 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{inv.customer?.name || 'Walk-in'}</p>
                                            <p className="text-[10px] font-bold text-gray-400">{inv.invoice_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(inv.grand_total, 'PKR')}</p>
                                        <p className="text-[10px] font-black uppercase text-green-600">Secure</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

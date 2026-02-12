import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IntegratedPerformanceChart } from './charts/IntegratedPerformanceChart.client';
import { DemandForecast } from '@/components/DemandForecast';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
    businessId?: string;
    chartData: any[];
    products: any[];
    invoices: any[]; // New prop for Dual-Source engine
    colors?: any;
    category?: string;
}

export function AnalyticsDashboard({ businessId, chartData, products, invoices, colors, category }: AnalyticsDashboardProps) {
    if (!chartData || chartData.length === 0) {
        return (
            <Card className="h-[400px] flex flex-col items-center justify-center border-dashed border-2">
                <BarChart3 className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">Insufficient data for financial trends</p>
                <p className="text-xs text-muted-foreground mt-1">Record more transactions to see analytics</p>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Tabs defaultValue="visual" className="w-full">
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden border">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-5 border-b bg-gray-50/30 backdrop-blur-md space-y-0">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <CardTitle className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5 text-wine" />
                                    Performance Analytics
                                </CardTitle>
                                <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">AI-Enhanced Growth Monitoring</span>
                            </div>

                            <TabsList className="bg-slate-200/40 h-8 p-1 rounded-lg">
                                <TabsTrigger value="visual" className="text-[9px] px-4 h-6 uppercase font-black data-[state=active]:bg-white data-[state=active]:text-wine">Trends</TabsTrigger>
                                <TabsTrigger value="predictive" className="text-[9px] px-4 h-6 uppercase font-black data-[state=active]:bg-white data-[state=active]:text-wine">Projections</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">System Status</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Live Intelligence Active</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <TabsContent value="visual" className="m-0 p-4 pt-6">
                            <div className="h-[320px] w-full">
                                <IntegratedPerformanceChart revenueData={chartData} invoices={invoices} colors={colors} />
                            </div>
                        </TabsContent>

                        <TabsContent value="predictive" className="m-0 p-4 overflow-y-auto max-h-[450px]">
                            <DemandForecast
                                businessId={businessId}
                                category={category}
                                products={products}
                            />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </motion.div>
    );
}

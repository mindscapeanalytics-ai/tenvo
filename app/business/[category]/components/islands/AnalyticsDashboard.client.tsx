'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RevenueAreaChart } from '@/components/AdvancedCharts';
import { DemandForecast } from '@/components/DemandForecast';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LineChart } from 'lucide-react';

interface AnalyticsDashboardProps {
    chartData: any[];
    products: any[];
    colors?: any;
}

export function AnalyticsDashboard({ chartData, products, colors }: AnalyticsDashboardProps) {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <Tabs defaultValue="revenue" className="w-full">
                <Card className="backdrop-blur-sm bg-white/60 border-primary/10 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <LineChart className="w-5 h-5 text-primary" />
                                Business Performance
                            </CardTitle>
                            <CardDescription>Financial trends over the last 6 months</CardDescription>
                        </div>
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="revenue" className="text-xs">Revenue Trend</TabsTrigger>
                            <TabsTrigger value="forecast" className="text-xs">Demand Forecast</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TabsContent value="revenue" className="mt-0">
                            <div className="h-[300px] w-full">
                                <RevenueAreaChart data={chartData} colors={colors} />
                            </div>
                        </TabsContent>
                        <TabsContent value="forecast" className="mt-0">
                            <div className="h-[300px] w-full">
                                <DemandForecast products={products} />
                            </div>
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </motion.div>
    );
}

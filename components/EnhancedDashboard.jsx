'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download, RefreshCw, Bell, Settings, Search, Receipt, FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { RevenueAreaChart } from '@/components/AdvancedCharts';
import {
  ShoppingBag, Shirt, Tv, Thermometer, Notebook, Palette, Recycle, Scissors,
  Printer, Sofa, Grid, Plane, Wrench, Pill, Soup, Dumbbell, Bed, PartyPopper,
  CarFront, GraduationCap, Car, Monitor, Zap as ZapIcon, Sprout, Gem, Home as HomeIcon,
  Bird, Sun, Truck, Boxes, Fuel, Snowflake, BookOpen, BicepsFlexed, BrickWall,
  Utensils, Coffee, Store, Globe, Smartphone
} from 'lucide-react';

const IconRenderer = ({ name, ...props }) => {
  const IconComponent = {
    Store, ShoppingBag, Package, Globe, Shirt, Smartphone, Tv, Thermometer,
    Notebook, Palette, Recycle, Scissors, Printer, Sofa, Grid, Plane, Wrench, Pill,
    Soup, Dumbbell, Bed, PartyPopper, CarFront, GraduationCap, Car, Monitor, Zap: ZapIcon,
    Sprout, Gem, Home: HomeIcon, Bird, Sun, Truck, Boxes, Fuel, Snowflake, BookOpen,
    BicepsFlexed, BrickWall, Utensils, Coffee
  }[name] || Package;
  return <IconComponent {...props} />;
};

import { useBusiness } from '@/lib/context/BusinessContext';
import { calculateGrowth } from '@/lib/utils/analytics';

export function EnhancedDashboard({ category, data = {}, onQuickAction, invoices = [] }) {
  const { business, currency } = useBusiness();
  const { language } = useLanguage();
  const t = translations[language];
  const colors = getDomainColors(category);
  const knowledge = getDomainKnowledge(category);
  const [timeRange, setTimeRange] = useState('month');

  const isManufacturing = knowledge?.manufacturingEnabled || knowledge?.inventoryFeatures?.includes('Manufacturing/BOM');
  const isService = !knowledge?.batchTrackingEnabled && !knowledge?.manufacturingEnabled && !knowledge?.inventoryFeatures?.includes('Stock Valuation');
  const hasQuotations = knowledge?.inventoryFeatures?.includes('Quotation Management');

  const stats = [
    {
      label: t.total_revenue,
      value: data.revenue || formatCurrency(0, currency),
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      ...colors.stats.revenue,
      target: 300000,
      current: parseInt(data.revenue?.replace(/[^0-9]/g, '') || '0'),
    },
    {
      label: t.total_orders,
      value: data.orders || '0',
      change: '+15.3%',
      trend: 'up',
      icon: ShoppingCart,
      ...colors.stats.orders,
      target: 1500,
      current: parseInt(data.orders || '0'),
    },
  ];

  // Dynamic Stats Injection
  if (isManufacturing) {
    stats.push({
      label: t.active_productions || 'Active Productions',
      value: data.activeProductions?.toString() || '0',
      change: t.on_track || 'On Track',
      trend: 'up',
      icon: Wrench,
      ...colors.stats.products, // Use products theme as fallback for manufacturing
      target: 10,
      current: parseInt(data.activeProductions || '0'),
    });
  } else {
    // Default Product count for Retail/Wholesale
    stats.push({
      label: t.products_stat,
      value: data.products || '0',
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      ...colors.stats.products,
      target: 500,
      current: parseInt(data.products || '0'),
    });
  }

  // Hide Low Stock for pure service businesses if they don't track stock
  if (!isService) {
    stats.push({
      label: t.low_stock_items,
      value: data.lowStockCount || '0',
      change: data.lowStockCount > 0 ? t.action_required : t.optimal,
      trend: data.lowStockCount > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      target: 10,
      current: parseInt(data.lowStockCount || '0'),
    });
  } else {
    // Show something else for services? maybe tax liability here as a primary stat
    stats.push({
      label: t.tax_liability,
      value: data.taxLiability || formatCurrency(0, currency),
      change: t.next_filing,
      trend: 'none',
      icon: Receipt,
      bg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      target: 50000,
      current: parseInt(data.taxLiability?.replace(/[^0-9]/g, '') || '0'),
    });
  }

  // If we didn't add tax liability above, add it now or another stat
  if (stats.length < 4 && !stats.find(s => s.label === t.tax_liability)) {
    stats.push({
      label: t.tax_liability,
      value: data.taxLiability || formatCurrency(0, currency),
      change: t.next_filing,
      trend: 'none',
      icon: Receipt,
      bg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      target: 50000,
      current: parseInt(data.taxLiability?.replace(/[^0-9]/g, '') || '0'),
    });
  }

  const quickActions = [
    { label: t.new_invoice, icon: DollarSign, id: 'new-invoice' },
  ];

  if (hasQuotations) {
    quickActions.push({ label: t.new_quotation || 'New Quotation', icon: FileText, id: 'new-quotation' });
  }

  if (isManufacturing) {
    quickActions.push({ label: t.new_production || 'New Production', icon: Wrench, id: 'new-production' });
  } else {
    quickActions.push({ label: t.add_product, icon: Package, id: 'add-product' });
  }

  quickActions.push({ label: t.new_customer, icon: Users, id: 'new-customer' });
  // Ensure max 4
  if (quickActions.length < 4) {
    quickActions.push({ label: t.reports, icon: Download, id: 'generate-report' });
  }

  const recentActivity = useMemo(() => {
    if (invoices.length === 0) {
      return [
        { type: 'system', message: 'No recent activity found', time: 'Just now', status: 'neutral' }
      ];
    }

    return invoices.slice(0, 4).map(inv => ({
      type: 'invoice',
      message: `New invoice ${inv.invoice_number} - ${inv.customer_name || 'Walk-in'}`,
      time: format(new Date(inv.date), 'MMM dd, HH:mm'),
      status: inv.status === 'paid' ? 'success' : 'warning'
    }));
  }, [invoices]);

  const revenueChartData = useMemo(() => {
    return data.chartData || [
      { date: 'Jan', revenue: 0, expenses: 0 },
      { date: 'Feb', revenue: 0, expenses: 0 },
      { date: 'Mar', revenue: 0, expenses: 0 },
      { date: 'Apr', revenue: 0, expenses: 0 },
      { date: 'May', revenue: 0, expenses: 0 },
      { date: 'Jun', revenue: 0, expenses: 0 },
    ];
  }, [data.chartData]);

  const alerts = useMemo(() => {
    const list = [];
    if (data.lowStockCount > 0) list.push('low_stock');
    if (invoices.filter(inv => inv.status === 'pending').length > 0) list.push('payment_pending');
    return list;
  }, [data.lowStockCount, invoices]);

  return (
    <div className="space-y-6">
      {/* Stats Grid with Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const progress = Math.min((stat.current / stat.target) * 100, 100);
          return (
            <Card
              key={idx}
              className="glass-card cursor-pointer border-none"
              onClick={() => onQuickAction?.(stat.label.toLowerCase().replace(/ /g, '-'))}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">{stat.label}</CardTitle>
                <div className={`p-2.5 rounded-2xl ${stat.bg} border ${stat.bg.replace('bg-', 'border-').replace('-50', '-200')} shadow-inner`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-black text-premium-gradient mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <div className={`flex items-center px-1.5 py-0.5 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                      )}
                      {stat.change}
                    </div>
                    <span className="text-muted-foreground/60">{t.vs_last_month}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">
                    <span>{t.performance}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: colors.primary,
                        boxShadow: `0 0 10px ${colors.primary}40`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Chart Section */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-bold text-gray-800">Revenue Performance</CardTitle>
            <CardDescription>Monthly revenue vs expenses overview</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs">Last 6 Months</Button>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] w-full pl-0">
          <RevenueAreaChart
            data={revenueChartData}
            colors={colors}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-all border-border hover:border-primary/50"
            onClick={() => onQuickAction?.(action.id)}
          >
            <action.icon className="w-5 h-5" style={{ color: colors.primary }} />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">{t.recent_activity}</CardTitle>
                <CardDescription>{t.latest_activities}</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className={`p-1.5 rounded-full ${activity.status === 'success' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">{t.system_alerts}</CardTitle>
                <CardDescription>{t.important_notifications}</CardDescription>
              </div>
              <Badge variant="secondary">{`${alerts.length} ${t.new_alerts}`}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockCount > 0 && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle>{t.low_stock}</AlertTitle>
                  <AlertDescription className="text-red-800">
                    {`${data.lowStockCount} ${t.low_stock_desc}`}
                  </AlertDescription>
                </Alert>
              )}
              {invoices.filter(inv => inv.status === 'pending').length > 0 && (
                <Alert variant="default" className="bg-blue-50 text-blue-900 border-blue-200">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <AlertTitle>{t.payment_pending}</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    {t.pending_payment_desc.replace('{amount}', formatCurrency(
                      invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0),
                      currency
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              <Alert variant="default" className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>{t.system_update}</AlertTitle>
                <AlertDescription className="text-green-800">
                  {t.smooth_running} {format(new Date(), 'MMM dd, yyyy')}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

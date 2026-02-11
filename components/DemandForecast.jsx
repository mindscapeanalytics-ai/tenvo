import { useMemo, memo, useState, useEffect } from 'react';
import { getDemandForecastAction } from '@/lib/actions/analytics';
import { TrendingUp, TrendingDown, AlertCircle, Package, Rocket, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


/**
 * @typedef {Object} DemandForecastProps
 * @property {string} [businessId]
 * @property {string} [category]
 * @property {any[]} [products]
 * @property {any[]} [invoices]
 * @property {any} [domainKnowledge]
 */

/** @type {React.NamedExoticComponent<DemandForecastProps>} */
export const DemandForecast = memo(function DemandForecast({
  businessId,
  category = 'retail-shop',
  products = [],
  invoices = [],
  domainKnowledge: propDomainKnowledge
}) {
  const domainKnowledge = propDomainKnowledge || getDomainKnowledge(category);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!businessId) return;
      const res = await getDemandForecastAction(businessId, domainKnowledge?.intelligence);
      if (res.success) {
        setForecastData(res.data);
      }
      setLoading(false);
    }
    load();
  }, [businessId, domainKnowledge]);

  const chartData = useMemo(() =>
    forecastData.slice(0, 5).map((item) => ({
      name: item.name.split(' ')[0],
      current: item.current,
      forecast: item.forecast,
      recommended: item.recommended,
    })), [forecastData]);

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading Forecast Engine...</div>;
  }

  if (!forecastData || forecastData.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-gray-400">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">No sales history available for forecasting logic.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Demand Forecast</h2>
          <p className="text-gray-500 font-medium">AI-powered predictive modeling for {domainKnowledge?.name || 'Inventory'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-bold text-wine border-wine/20 bg-wine/5">
            <Rocket className="w-3 h-3 mr-1" />
            V3 Prediction Engine
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecastData.slice(0, 6).map((item, idx) => (
          <Card key={idx} className={`group hover:shadow-xl transition-all duration-300 border-wine/10 overflow-hidden ${item.priority === 'high' ? 'ring-2 ring-red-500/20' : ''}`}>
            <CardHeader className="pb-2 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold truncate max-w-[150px]">{item.name}</CardTitle>
                <div className={`p-1.5 rounded-full ${item.trend === 'up' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {item.trend === 'up' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Stock</span>
                  <span className="font-black text-lg">{item.current}</span>
                </div>
                <div className="flex justify-between items-end border-b border-dashed border-gray-100 pb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Forecasted Demand</span>
                  <span className="font-black text-lg text-wine">{item.forecast}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Optimal Level</span>
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="text-[9px] py-0">
                      {item.recommended} Units
                    </Badge>
                  </div>
                  {item.insight && (
                    <div className={`p-2 rounded-lg text-[10px] font-bold flex items-start gap-2 mt-2 leading-tight ${item.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-wine/5 text-wine border border-wine/10'}`}>
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {item.insight}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-wine/20 shadow-2xl bg-white/50 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-wine">Market Trend Projection</CardTitle>
            <CardDescription className="font-medium text-gray-500">Visualizing stock vs predicted demand variance</CardDescription>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-wine" /> Stock</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-wine/30" /> Forecast</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Recommended</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1538" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  cursor={{ stroke: '#8B1538', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="current" stroke="#8B1538" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" name="Current Stock" />
                <Area type="monotone" dataKey="forecast" stroke="#A01A42" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Forecast" />
                <Area type="monotone" dataKey="recommended" stroke="#10b981" strokeWidth={3} fill="transparent" name="Recommended" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});









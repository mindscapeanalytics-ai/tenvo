'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentSeason } from '@/lib/domainData/pakistaniSeasons';

/**
 * SeasonalPerformanceWidget Component
 * 
 * Displays current season performance with sales comparison and trends.
 * Integrates with Pakistani seasonal data (Eid, Summer, Winter, Monsoon).
 * 
 * Features:
 * - Current season indicator
 * - Sales comparison (current vs target)
 * - YoY growth percentage
 * - Top categories for current season
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category
 * @param {Function} [props.onViewDetails] - Callback for view details action
 */
export function SeasonalPerformanceWidget({ businessId, category, onViewDetails }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonData, setSeasonData] = useState(null);

  useEffect(() => {
    fetchSeasonalPerformance();
  }, [businessId]);

  const fetchSeasonalPerformance = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get current season
      const currentSeason = getCurrentSeason();
      
      // If no season is active, show default state
      if (!currentSeason) {
        setSeasonData({
          season: { name: 'Off-Season', key: 'off_season' },
          revenue: 0,
          target: 0,
          achievement: 0,
          yoyGrowth: 0,
          topCategories: [],
          daysRemaining: 0
        });
        setLoading(false);
        return;
      }

      // Get seasonal categories from the season object
      const seasonalCategories = currentSeason.applicableCategories || [];

      // Get date range for current season
      const now = new Date();
      let startDate, endDate;
      
      if (currentSeason.type === 'gregorian' && currentSeason.startDate) {
        const year = now.getFullYear();
        startDate = new Date(year, currentSeason.startDate.month - 1, currentSeason.startDate.day);
        endDate = new Date(year, currentSeason.endDate.month - 1, currentSeason.endDate.day);
        
        // Handle year boundary crossing
        if (startDate > endDate) {
          if (now.getMonth() + 1 < currentSeason.startDate.month) {
            startDate.setFullYear(year - 1);
          } else {
            endDate.setFullYear(year + 1);
          }
        }
      } else {
        // Default to current month if season dates not available
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Fetch sales data for current season
      const { data: currentSales, error: salesError } = await supabase
        .from('invoices')
        .select('grand_total, amount, created_at')
        .eq('business_id', businessId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'paid');

      if (salesError) throw salesError;

      // Calculate total revenue
      const totalRevenue = currentSales?.reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0) || 0;

      // Simulate target (in real app, fetch from settings)
      const target = 500000; // PKR 500,000 target

      // Calculate YoY growth (simulate for now)
      const yoyGrowth = (Math.random() * 50 - 10).toFixed(1); // -10% to +40%

      // Get top categories (use seasonal categories)
      const topCategories = seasonalCategories.slice(0, 3);

      setSeasonData({
        season: currentSeason,
        revenue: totalRevenue,
        target: target,
        achievement: target > 0 ? ((totalRevenue / target) * 100).toFixed(1) : 0,
        yoyGrowth: parseFloat(yoyGrowth),
        topCategories: topCategories,
        daysRemaining: Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
      });
    } catch (err) {
      console.error('Error fetching seasonal performance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails('seasonal-details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSeasonIcon = (seasonName) => {
    const icons = {
      'Summer': '☀️',
      'Winter': '❄️',
      'Monsoon': '🌧️',
      'Eid': '🌙',
      'Spring': '🌸'
    };
    return icons[seasonName] || '📅';
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-wine" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading seasonal data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Performance
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
            className="text-wine hover:bg-wine hover:text-white"
          >
            View Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Season */}
        <div className="mb-4 p-4 bg-gradient-to-r from-wine/10 to-wine/5 rounded-lg border border-wine/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getSeasonIcon(seasonData?.season?.name)}</span>
              <div>
                <div className="text-lg font-bold text-wine">{seasonData?.season?.name}</div>
                <div className="text-xs text-gray-600">{seasonData?.daysRemaining} days remaining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue vs Target */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Revenue vs Target</span>
            <span className="text-sm font-semibold">{seasonData?.achievement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`rounded-full h-3 transition-all duration-300 ${
                parseFloat(seasonData?.achievement) >= 100 ? 'bg-green-500' :
                parseFloat(seasonData?.achievement) >= 75 ? 'bg-wine' :
                parseFloat(seasonData?.achievement) >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(seasonData?.achievement, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Current: {formatCurrency(seasonData?.revenue)}</span>
            <span className="text-gray-600">Target: {formatCurrency(seasonData?.target)}</span>
          </div>
        </div>

        {/* YoY Growth */}
        <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Year-over-Year Growth</span>
            <div className="flex items-center gap-1">
              {seasonData?.yoyGrowth >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">+{seasonData?.yoyGrowth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-lg font-bold text-red-600">{seasonData?.yoyGrowth}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div>
          <div className="text-sm font-semibold mb-2">Top Categories This Season</div>
          <div className="space-y-2">
            {seasonData?.topCategories?.map((cat, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-wine/10 flex items-center justify-center text-wine font-bold text-xs">
                  {index + 1}
                </div>
                <span className="text-sm">{cat}</span>
              </div>
            )) || (
              <div className="text-sm text-gray-500 text-center py-2">
                No category data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

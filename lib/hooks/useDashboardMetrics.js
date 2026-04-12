/**
 * useDashboardMetrics Hook
 * 
 * Custom hook for fetching dashboard metrics with caching, error handling,
 * and real-time updates.
 * 
 * Features:
 * - Automatic data fetching with business context
 * - Request caching (5-minute TTL)
 * - Error handling with retry
 * - Loading states
 * - Real-time updates support
 * 
 * Usage:
 *   const { metrics, loading, error, refetch } = useDashboardMetrics();
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '@/lib/context/BusinessContext';
import { DataFetchingService } from '@/lib/services/dataFetching';
import { ErrorHandlingService } from '@/lib/services/errorHandling';

export function useDashboardMetrics(options = {}) {
  const {
    autoFetch = true,
    timeRange = '30d', // '7d', '30d', '90d', '1y'
    includeChartData = false
  } = options;

  const { business } = useBusiness();
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!business?.id) {
      setError(new Error('No business context available'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch main metrics
      const metricsResponse = await DataFetchingService.fetchWithCache(
        `/api/dashboard/metrics?business_id=${business.id}`,
        {
          cacheKey: `dashboard-metrics-${business.id}`,
          cacheTTL: 5 * 60 * 1000 // 5 minutes
        }
      );

      if (!metricsResponse.success) {
        throw new Error(metricsResponse.error || 'Failed to fetch metrics');
      }

      setMetrics(metricsResponse.data);

      // Fetch chart data if requested
      if (includeChartData) {
        const chartResponse = await DataFetchingService.fetchWithCache(
          `/api/dashboard/revenue-chart?business_id=${business.id}&range=${timeRange}`,
          {
            cacheKey: `revenue-chart-${business.id}-${timeRange}`,
            cacheTTL: 5 * 60 * 1000
          }
        );

        if (chartResponse.success) {
          setChartData(chartResponse.data || []);
        }
      }
    } catch (err) {
      const handledError = ErrorHandlingService.handleError(err, {
        context: 'useDashboardMetrics',
        businessId: business.id
      });
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [business?.id, timeRange, includeChartData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && business?.id) {
      fetchMetrics();
    }
  }, [autoFetch, business?.id, fetchMetrics]);

  // Refetch function with retry logic
  const refetch = useCallback(async () => {
    try {
      await ErrorHandlingService.retryWithBackoff(fetchMetrics, {
        maxRetries: 3,
        initialDelay: 1000
      });
    } catch (err) {
      console.error('Failed to refetch metrics after retries:', err);
    }
  }, [fetchMetrics]);

  return {
    metrics,
    chartData,
    loading,
    error,
    refetch
  };
}

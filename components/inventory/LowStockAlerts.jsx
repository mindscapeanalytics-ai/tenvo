'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingDown, RotateCcw, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/currency';
import { InventoryErrorCard } from './InventoryErrorBoundary';
import { InventoryCardLoading } from './InventoryLoadingState';

/**
 * Low Stock Alerts Dashboard Widget
 * Real-time visibility into products below minimum stock levels
 * Supports: filtering, dismissing alerts, quick reorder actions
 */
export function LowStockAlerts({
    businessId,
    currency = 'PKR',
    maxAlerts = 8,
    onReorderClick,
    isCompact = false
}) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dismissing, setDismissing] = useState(new Set());

    useEffect(() => {
        loadAlerts();
        const interval = setInterval(loadAlerts, 5 * 60 * 1000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, [businessId]);

    const loadAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/v1/inventory/low-stock-alerts?business_id=${businessId}&limit=${maxAlerts}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to load alerts (${res.status})`);
            }
            
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (err) {
            console.error('[LowStockAlerts] Load error:', err);
            setError(err.message || 'Failed to load alerts');
        } finally {
            setLoading(false);
        }
    }, [businessId, maxAlerts]);

    const handleDismiss = async (alertId) => {
        try {
            setDismissing(prev => new Set([...prev, alertId]));
            const res = await fetch(`/api/v1/inventory/low-stock-alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'dismissed' })
            });

            if (!res.ok) throw new Error('Failed to dismiss alert');
            
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            toast.success('Alert dismissed');
        } catch (error) {
            toast.error('Error dismissing alert: ' + error.message);
        } finally {
            setDismissing(prev => {
                const next = new Set(prev);
                next.delete(alertId);
                return next;
            });
        }
    };

    if (isCompact) {
        return (
            <Card className="border-orange-100 bg-orange-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <CardTitle className="text-base font-bold">Low Stock Alert</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{alerts.length}</Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={loadAlerts}
                                disabled={loading}
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                {/* Error in compact mode */}
                {error && (
                    <CardContent className="pb-2">
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            Failed to load alerts
                        </div>
                    </CardContent>
                )}
                
                {alerts.length > 0 ? (
                    <CardContent className="space-y-2">
                        {alerts.slice(0, 3).map(alert => (
                            <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-100 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-800">{alert.product_name}</p>
                                    <p className="text-xs text-gray-500">{alert.current_stock} / {alert.min_stock_level} units</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onReorderClick?.(alert)}
                                    className="text-orange-600 hover:bg-orange-100"
                                >
                                    Reorder
                                </Button>
                            </div>
                        ))}
                        {alerts.length > 3 && (
                            <p className="text-xs text-gray-500 text-center py-2">+{alerts.length - 3} more</p>
                        )}
                    </CardContent>
                ) : !loading && !error && (
                    <CardContent>
                        <div className="text-center py-4">
                            <p className="text-xs text-gray-500">All stock levels healthy</p>
                        </div>
                    </CardContent>
                )}
            </Card>
        );
    }

    return (
        <Card className="border-orange-100">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle>Low Stock Alerts</CardTitle>
                            <p className="text-xs text-gray-500 mt-1">Products below minimum stock level</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAlerts}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Error Display */}
                {error && (
                    <InventoryErrorCard 
                        error={error} 
                        onRetry={loadAlerts}
                        onDismiss={() => setError(null)}
                    />
                )}
                
                {loading && alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-3" />
                        <p className="text-sm text-gray-500">Loading alerts...</p>
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className="p-3 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-transparent hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-gray-800">{alert.product_name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">SKU: {alert.sku}</p>
                                    </div>
                                    <Badge className="bg-orange-600 text-white text-xs">Critical</Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-white rounded border border-orange-100">
                                    <div>
                                        <p className="text-xs text-gray-500">Current</p>
                                        <p className="font-bold text-orange-600">{alert.current_stock}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Min Level</p>
                                        <p className="font-bold">{alert.min_stock_level}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Shortage</p>
                                        <p className="font-bold text-red-600">{alert.min_stock_level - alert.current_stock}</p>
                                    </div>
                                </div>

                                {alert.selling_price && (
                                    <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                                        Potential stock-out cost: {formatCurrency((alert.min_stock_level - alert.current_stock) * alert.selling_price, currency)}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDismiss(alert.id)}
                                        disabled={dismissing.has(alert.id)}
                                        className="flex-1 text-xs"
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onReorderClick?.(alert)}
                                        className="flex-1 gap-1 text-xs bg-orange-600 hover:bg-orange-700"
                                    >
                                        <AlertTriangle className="w-3 h-3" />
                                        Reorder
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingDown className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-gray-900 font-semibold mb-2">All inventory levels healthy</h4>
                        <p className="text-gray-500 text-sm mb-4">No items below minimum stock levels</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadAlerts}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Check Again
                        </Button>
                    </div>
                )}

                {alerts.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-xs text-gray-500">{alerts.length} active alerts</span>
                        <Button
                            variant="link"
                            size="sm"
                            className="gap-1 text-orange-600 hover:text-orange-700"
                        >
                            View All <ChevronRight className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

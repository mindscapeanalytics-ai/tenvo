'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';

/**
 * AutoReorderManager Component
 * Automatically generates purchase orders based on reorder points
 * 
 * @param {Object} props
 * @param {any[]} [props.products] - Array of products
 * @param {any[]} [props.vendors] - Array of vendors
 * @param {(poData: any) => void} [props.onGeneratePO] - Callback to generate purchase order
 * @param {string} [props.currency] - Currency code
 */
export function AutoReorderManager({
  products = [],
  vendors = [],
  onGeneratePO,
  currency = 'PKR',
}) {
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate reorder suggestions
  useEffect(() => {
    const suggestions = products
      .filter(product => {
        const stock = product.stock || 0;
        const reorderPoint = product.reorderPoint || 0;
        const minStock = product.minStock || 0;
        return stock <= reorderPoint || stock <= minStock;
      })
      .map(product => {
        const stock = product.stock || 0;
        const reorderPoint = product.reorder_point || product.reorderPoint || 0;
        const reorderQuantity = product.reorder_quantity || product.reorderQuantity || 0;
        const minStock = product.min_stock || product.minStock || 0;
        const maxStock = product.max_stock || product.maxStock || 0;

        // Calculate suggested quantity
        let suggestedQty = reorderQuantity;
        if (maxStock > 0) {
          suggestedQty = Math.max(reorderQuantity, maxStock - stock);
        }

        // Calculate urgency
        const stockPercentage = (stock / (reorderPoint || 1)) * 100;
        let urgency = 'low';
        if (stockPercentage <= 25) urgency = 'critical';
        else if (stockPercentage <= 50) urgency = 'high';
        else if (stockPercentage <= 75) urgency = 'medium';

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock: stock,
          reorderPoint,
          minStock,
          maxStock,
          suggestedQuantity: suggestedQty,
          urgency,
          leadTime: product.lead_time || product.leadTime || 7, // days
          vendorId: product.vendor_id || product.vendorId || null,
          costPrice: product.cost_price || product.costPrice || 0,
          estimatedCost: (product.cost_price || product.costPrice || 0) * suggestedQty,
        };
      })
      .sort((a, b) => {
        // Sort by urgency
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

    setReorderSuggestions(suggestions);
  }, [products]);

  const handleGeneratePO = async (suggestion) => {
    setIsProcessing(true);
    try {
      if (onGeneratePO) {
        await onGeneratePO({
          productId: suggestion.productId,
          quantity: suggestion.suggestedQuantity,
          vendorId: suggestion.vendorId,
          estimatedCost: suggestion.estimatedCost,
        });
      }
      // Remove from suggestions after PO is generated
      setReorderSuggestions(prev => prev.filter(s => s.productId !== suggestion.productId));
    } catch (error) {
      console.error('Error generating PO:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAllPOs = async () => {
    if (!confirm(`Generate purchase orders for ${reorderSuggestions.length} products?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      for (const suggestion of reorderSuggestions) {
        if (onGeneratePO) {
          await onGeneratePO({
            productId: suggestion.productId,
            quantity: suggestion.suggestedQuantity,
            vendorId: suggestion.vendorId,
            estimatedCost: suggestion.estimatedCost,
          });
        }
      }
      setReorderSuggestions([]);
    } catch (error) {
      console.error('Error generating POs:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const criticalCount = reorderSuggestions.filter(s => s.urgency === 'critical').length;
  const totalEstimatedCost = reorderSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Auto Reorder Manager</h3>
          <p className="text-sm text-gray-500">Automatically generate purchase orders for low stock items</p>
        </div>
        {reorderSuggestions.length > 0 && (
          <Button
            onClick={handleGenerateAllPOs}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Generate All POs
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items to Reorder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reorderSuggestions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reorderSuggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEstimatedCost, currency)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Reorder Suggestions</CardTitle>
            <CardDescription>
              Products below reorder point that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reorderSuggestions.map((suggestion) => {
                const vendor = vendors.find(v => v.id === suggestion.vendorId);
                return (
                  <div
                    key={suggestion.productId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded ${getUrgencyColor(suggestion.urgency)}`}>
                        {suggestion.urgency === 'critical' ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.productName}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {suggestion.sku}
                          {' • '}
                          Current: {suggestion.currentStock}
                          {' • '}
                          Reorder Point: {suggestion.reorderPoint}
                          {' • '}
                          Suggested: {suggestion.suggestedQuantity}
                        </div>
                        {vendor && (
                          <div className="text-xs text-gray-400 mt-1">
                            Vendor: {vendor.name} • Lead Time: {suggestion.leadTime} days
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(suggestion.estimatedCost, currency)}</div>
                        <Badge className={getUrgencyColor(suggestion.urgency)}>
                          {suggestion.urgency}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        onClick={() => handleGeneratePO(suggestion)}
                        disabled={isProcessing}
                        size="sm"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                        Generate PO
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
            <p className="text-gray-600 font-medium">All products are well stocked!</p>
            <p className="text-sm text-gray-500 mt-1">No reorder suggestions at this time.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


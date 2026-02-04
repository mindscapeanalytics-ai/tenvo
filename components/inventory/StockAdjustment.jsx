'use client';

import { useState } from 'react';
import { Plus, Minus, RotateCcw, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

/**
 * StockAdjustment Component
 * Manages stock adjustments (increase/decrease) with reasons
 * 
 * @param {Array} adjustments - Array of adjustment history
 * @param {Array} products - Array of products
 * @param {Function} onAdjust - Adjustment callback
 * @param {string} currency - Currency code
 */
export function StockAdjustment({
  adjustments = [],
  products = [],
  onAdjust,
  currency = 'PKR',
}) {
  const [adjustmentHistory, setAdjustmentHistory] = useState(adjustments);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    adjustmentType: 'increase', // increase, decrease
    quantity: 0,
    reason: '',
    notes: '',
    costPrice: 0,
  });

  const adjustmentReasons = [
    'Stock Count Correction',
    'Damaged Goods',
    'Expired Stock',
    'Theft/Loss',
    'Return to Vendor',
    'Found Stock',
    'Sample/Display',
    'Other',
  ];

  const handleAdjust = () => {
    if (!formData.productId || formData.quantity <= 0) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const adjustment = {
      id: Date.now(),
      productId: formData.productId,
      productName: product.name,
      adjustmentType: formData.adjustmentType,
      quantity: parseFloat(formData.quantity),
      previousStock: product.stock || 0,
      newStock: formData.adjustmentType === 'increase'
        ? (product.stock || 0) + parseFloat(formData.quantity)
        : (product.stock || 0) - parseFloat(formData.quantity),
      reason: formData.reason,
      notes: formData.notes,
      costPrice: parseFloat(formData.costPrice) || product.costPrice || 0,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User', // In real app, get from auth
    };

    const updated = [adjustment, ...adjustmentHistory];
    setAdjustmentHistory(updated);

    // Call onAdjust to update product stock
    if (onAdjust) {
      onAdjust({
        productId: formData.productId,
        newStock: adjustment.newStock,
        adjustment: adjustment,
      });
    }

    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      notes: '',
      costPrice: 0,
    });
  };

  const totalAdjustments = adjustmentHistory.length;
  const increases = adjustmentHistory.filter(a => a.adjustmentType === 'increase').length;
  const decreases = adjustmentHistory.filter(a => a.adjustmentType === 'decrease').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Stock Adjustments</h3>
          <p className="text-sm text-gray-500">Adjust stock quantities with reasons</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Stock Adjustment</DialogTitle>
              <DialogDescription>
                Record a stock increase or decrease with a specific reason for auditing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = products.find(p => p.id === productId);
                    setFormData({
                      ...formData,
                      productId,
                      costPrice: product?.costPrice || 0,
                    });
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current Stock: {product.stock || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adjustment Type *</Label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="increase">Increase Stock</option>
                    <option value="decrease">Decrease Stock</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              {formData.productId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">Current Stock: {products.find(p => p.id === formData.productId)?.stock || 0}</div>
                    <div className="text-gray-600">
                      After Adjustment: {
                        formData.adjustmentType === 'increase'
                          ? (products.find(p => p.id === formData.productId)?.stock || 0) + (formData.quantity || 0)
                          : (products.find(p => p.id === formData.productId)?.stock || 0) - (formData.quantity || 0)
                      }
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reason *</Label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Reason</option>
                  {adjustmentReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this adjustment"
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjust}
                  disabled={!formData.productId || formData.quantity <= 0 || !formData.reason}
                  className={formData.adjustmentType === 'increase' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {formData.adjustmentType === 'increase' ? (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Increase Stock
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 mr-2" />
                      Decrease Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdjustments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Increases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{increases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Decreases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{decreases}</div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment History */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adjustmentHistory.slice(0, 50).map((adjustment) => (
              <div
                key={adjustment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded ${adjustment.adjustmentType === 'increase' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {adjustment.adjustmentType === 'increase' ? (
                      <Plus className="w-5 h-5 text-green-600" />
                    ) : (
                      <Minus className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{adjustment.productName}</div>
                    <div className="text-sm text-gray-500">
                      {adjustment.adjustmentType === 'increase' ? '+' : '-'}{adjustment.quantity} units
                      {' • '}
                      {adjustment.previousStock} → {adjustment.newStock}
                      {' • '}
                      Reason: {adjustment.reason}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(adjustment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={adjustment.adjustmentType === 'increase' ? 'default' : 'destructive'}>
                    {adjustment.adjustmentType === 'increase' ? 'Increase' : 'Decrease'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {adjustmentHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <RotateCcw className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No adjustments yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


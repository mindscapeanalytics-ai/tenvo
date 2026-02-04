'use client';

import { useState } from 'react';
import { Lock, Unlock, Calendar, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/DatePicker';
import { toast } from 'react-hot-toast';

/**
 * StockReservation Component
 * Manages stock reservations for sales orders, customers, etc.
 * 
 * @param {Array} reservations - Array of reservation objects
 * @param {Array} products - Array of products
 * @param {Array} customers - Array of customers
 * @param {Function} onSave - Save callback
 * @param {string} currency - Currency code
 */
export function StockReservation({
  reservations = [],
  products = [],
  customers = [],
  onSave,
  currency = 'PKR',
}) {
  const [reservationList, setReservationList] = useState(reservations);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    customerId: '',
    orderId: '',
    reservedUntil: '',
    reason: '',
    notes: '',
  });

  const handleReserve = () => {
    if (!formData.productId || formData.quantity <= 0) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    // Check available stock
    const reservedQty = reservationList
      .filter(r => r.productId === formData.productId && r.status === 'active')
      .reduce((sum, r) => sum + r.quantity, 0);

    const availableStock = (product.stock || 0) - reservedQty;

    if (formData.quantity > availableStock) {
      toast.error(`Only ${availableStock} units available for reservation`);
      return;
    }

    const reservation = {
      id: Date.now(),
      productId: formData.productId,
      quantity: parseFloat(formData.quantity),
      customerId: formData.customerId || null,
      orderId: formData.orderId || null,
      reservedUntil: formData.reservedUntil || '',
      reason: formData.reason || '',
      notes: formData.notes || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updated = [...reservationList, reservation];
    setReservationList(updated);
    if (onSave) {
      onSave(updated);
    }

    setShowForm(false);
    resetForm();
  };

  const handleRelease = (id) => {
    const updated = reservationList.map(r =>
      r.id === id ? { ...r, status: 'released', releasedAt: new Date().toISOString() } : r
    );
    setReservationList(updated);
    if (onSave) {
      onSave(updated);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      quantity: 0,
      customerId: '',
      orderId: '',
      reservedUntil: '',
      reason: '',
      notes: '',
    });
  };

  const activeReservations = reservationList.filter(r => r.status === 'active');
  const totalReserved = activeReservations.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Stock Reservations</h3>
          <p className="text-sm text-gray-500">Reserve stock for orders and customers</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Lock className="w-4 h-4 mr-2" />
              Reserve Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reserve Stock</DialogTitle>
              <DialogDescription>
                Place a hold on items for a specific customer or upcoming order to prevent overselling.
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
                    const reservedQty = reservationList
                      .filter(r => r.productId === productId && r.status === 'active')
                      .reduce((sum, r) => sum + r.quantity, 0);
                    const available = (product?.stock || 0) - reservedQty;

                    setFormData({ ...formData, productId });
                    if (product) {
                      // Show available stock
                      console.log(`Available: ${available} units`);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => {
                    const reservedQty = reservationList
                      .filter(r => r.productId === product.id && r.status === 'active')
                      .reduce((sum, r) => sum + r.quantity, 0);
                    const available = (product.stock || 0) - reservedQty;
                    return (
                      <option key={product.id} value={product.id}>
                        {product.name} (Available: {available}, Reserved: {reservedQty})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Reserved Until</Label>
                  <Input
                    type="date"
                    value={formData.reservedUntil}
                    onChange={(e) => setFormData({ ...formData, reservedUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Customer</Label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select Customer (Optional)</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Order ID</Label>
                <Input
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  placeholder="Order reference (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for reservation"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleReserve} disabled={!formData.productId || formData.quantity <= 0}>
                  Reserve Stock
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
            <CardTitle className="text-sm font-medium">Active Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReservations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReserved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reservationList.filter(r => r.status === 'released').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reservationList.map((reservation) => {
              const product = products.find(p => p.id === reservation.productId);
              const customer = customers.find(c => c.id === reservation.customerId);
              return (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {reservation.status === 'active' ? (
                        <Lock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Unlock className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium">{product?.name || 'Unknown Product'}</div>
                        <div className="text-sm text-gray-500">
                          Quantity: {reservation.quantity}
                          {customer && ` • Customer: ${customer.name}`}
                          {reservation.orderId && ` • Order: ${reservation.orderId}`}
                        </div>
                        {reservation.reservedUntil && (
                          <div className="text-xs text-gray-400 mt-1">
                            Until: {new Date(reservation.reservedUntil + 'T00:00:00').toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={reservation.status === 'active' ? 'default' : 'secondary'}>
                      {reservation.status}
                    </Badge>
                  </div>
                  {reservation.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRelease(reservation.id)}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Release
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {reservationList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No reservations yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


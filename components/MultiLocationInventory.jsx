'use client';

import { useState } from 'react';
import {
  Warehouse, MapPin, ArrowRight, Plus, Edit, Trash2, Settings,
  Package, TrendingUp, AlertTriangle, CheckCircle2,
  User, Phone, Mail, QrCode, Star, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'react-hot-toast';
import { CityAutocomplete } from './CityAutocomplete';

export function MultiLocationInventory({
  locations = [],
  products = [],
  businessId,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
  onStockTransfer
}) {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');

  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    contactPerson: '',
    phone: '',
    email: '',
    isActive: true,
    isPrimary: false,
    type: 'warehouse',
    code: ''
  });

  const [transferData, setTransferData] = useState({
    fromLocation: '',
    toLocation: '',
    product: '',
    quantity: '',
    reason: '',
  });

  const handleAddLocation = async () => {
    if (!newLocation.name) {
      toast.error('Location name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedLocation) {
        await onLocationUpdate?.(selectedLocation.id, newLocation);
      } else {
        await onLocationAdd?.(newLocation);
        // Parent handleLocationAdd in page.js handles success toast and state update
      }

      setNewLocation({
        name: '', code: '', address: '', city: '', contactPerson: '', phone: '', email: '', isActive: true, isPrimary: false, type: 'warehouse'
      });
      setSelectedLocation(null);
      setShowAddLocation(false);
    } catch (error) {
      console.error('Location Error:', error);
      // No toast here as parent handler in page.js already has it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockTransfer = async () => {
    if (!transferData.fromLocation || !transferData.toLocation || !transferData.product || !transferData.quantity) {
      toast.error('Please fill in all transfer details');
      return;
    }

    if (transferData.fromLocation === transferData.toLocation) {
      toast.error('Source and destination locations must be different');
      return;
    }

    const selectedProd = products.find(p => p.id === transferData.product);
    const availableAtSrc = selectedProd?.locations?.[transferData.fromLocation] || 0;

    if (availableAtSrc < Number(transferData.quantity)) {
      toast.error(`Insufficient stock at source. Available: ${availableAtSrc}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onStockTransfer?.({
        from_location_id: transferData.fromLocation,
        to_location_id: transferData.toLocation,
        business_id: businessId,
        items: [{
          product_id: transferData.product,
          quantity: Number(transferData.quantity)
        }],
        reason: transferData.reason
      });
      setTransferData({
        fromLocation: '', toLocation: '', product: '', quantity: '', reason: '',
      });
      setShowTransfer(false);
    } catch (error) {
      console.error('Transfer Error:', error);
      // Parent handleStockTransfer in page.js handles the toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationStock = (locationId) => {
    // Fallback: This usually comes from product_stock_locations joined or fetched separately
    // If props `products` has locations nested, we use it.
    return products.reduce((sum, p) => {
      const locationStock = p.locations?.[locationId] || 0;
      return sum + (locationStock * (p.cost_price || p.price || 0));
    }, 0);
  };

  const getLocationProductCount = (locationId) => {
    return products.filter(p => (p.locations?.[locationId] || 0) > 0).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Multi-Location Inventory</h2>
          <p className="text-gray-500 font-medium">Strategic stock management across warehouses & godowns</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTransfer(true)}
            className="rounded-xl border-gray-200 font-bold hover:bg-gray-50 h-11"
          >
            <ArrowRight className="w-4 h-4 mr-2 text-wine" />
            Transfer Stock
          </Button>
          <Button
            onClick={() => {
              setSelectedLocation(null);
              setNewLocation({
                name: '', code: '', address: '', city: '', contactPerson: '', phone: '', email: '', isActive: true, isPrimary: false, type: 'warehouse'
              });
              setShowAddLocation(true);
            }}
            className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl h-11 shadow-lg shadow-wine/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card key={location.id} className="group border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-wine/10 rounded-xl text-wine group-hover:scale-110 transition-transform">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {location.name}
                      {location.is_primary && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </CardTitle>
                    <CardDescription className="text-xs font-black text-wine uppercase tracking-widest">
                      {location.type || 'WAREHOUSE'} | {location.code || 'NO-CODE'}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={location.is_active !== false ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                  {location.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Location Address</p>
                    <p className="text-sm font-bold text-gray-700">{location.address || 'Street details not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active SKUs</p>
                    <p className="text-2xl font-black text-gray-900">{getLocationProductCount(location.id)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Valuation</p>
                    <p className="text-xl font-black text-wine">{formatCurrency(getLocationStock(location.id), 'PKR')}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-wine hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this location? Status will be set to inactive.')) {
                        onLocationDelete?.(location.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-wine hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(location);
                      setNewLocation({
                        name: location.name,
                        code: location.code || '',
                        address: location.address || '',
                        city: location.city || '',
                        contactPerson: location.contact_person || '',
                        phone: location.phone || '',
                        email: location.email || '',
                        isActive: location.is_active !== false,
                        isPrimary: location.is_primary === true,
                        type: location.type || 'warehouse'
                      });
                      setShowAddLocation(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-wine hover:bg-wine/5 font-bold rounded-xl"
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowInventory(true);
                    }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Inventory
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {locations.length === 0 && (
          <Card className="col-span-full border-dashed border-2 py-12 flex flex-col items-center justify-center bg-gray-50/30 rounded-3xl">
            <div className="p-6 bg-white rounded-full shadow-lg mb-6 text-gray-300">
              <Warehouse className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Establish Your First Godown</h3>
            <p className="text-gray-500 max-w-sm text-center mt-2 mb-8 font-medium">You haven't configured any stock locations yet. Add a warehouse to start tracking inventory across multiple points.</p>
            <Button onClick={() => setShowAddLocation(true)} className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-wine/20">
              <Plus className="w-4 h-4 mr-2" />
              Configure Initial Warehouse
            </Button>
          </Card>
        )}
      </div>

      {/* Add/Edit Location Dialog */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="p-3 bg-wine text-white rounded-2xl w-fit mb-4 rotate-3">
              <Warehouse className="w-6 h-6" />
            </div>
            <DialogTitle className="text-3xl font-black text-gray-900">
              {selectedLocation ? 'Update Location Details' : 'Register New Location'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium text-lg">
              Set up a physical storage point for your inventory tracking
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Location Title *</Label>
              <Input
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                placeholder="e.g. North Side Hub"
                className="rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Establishment Type</Label>
              <select
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 font-bold focus:ring-wine focus:border-wine outline-none transition-all"
              >
                <option value="warehouse">Main Godown</option>
                <option value="showroom">Retail Showroom</option>
                <option value="hub">Distribution Hub</option>
                <option value="cutting">Cutting/Production Unit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Short Code</Label>
              <Input
                value={newLocation.code}
                onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value.toUpperCase() })}
                placeholder="e.g. G-01"
                className="rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-black uppercase"
              />
            </div>

            <div className="col-span-2 flex items-center gap-2 bg-gray-50 p-4 rounded-2xl">
              <input
                type="checkbox"
                id="isPrimary"
                checked={newLocation.isPrimary}
                onChange={(e) => setNewLocation({ ...newLocation, isPrimary: e.target.checked })}
                className="w-5 h-5 accent-wine rounded"
              />
              <Label htmlFor="isPrimary" className="font-black text-gray-900 cursor-pointer">
                Designate as Primary Location for this Business
                <span className="block text-[10px] text-gray-500 font-medium">Automatic stock assignments will target this warehouse if unspecified.</span>
              </Label>
            </div>

            <div className="col-span-1 space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Street Address</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  placeholder="e.g. Plot 123, Sector 5-G"
                  className="pl-12 rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-medium"
                />
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <CityAutocomplete
                value={newLocation.city}
                onChange={(val) => setNewLocation({ ...newLocation, city: val })}
                required={true}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Contact Authority</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={newLocation.contactPerson}
                  onChange={(e) => setNewLocation({ ...newLocation, contactPerson: e.target.value })}
                  placeholder="John Doe"
                  className="pl-12 rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700 ml-1">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={newLocation.phone}
                  onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="pl-12 rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-gray-50 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddLocation(false)}
              className="rounded-xl border-gray-200 font-bold h-12 px-6"
            >
              Discard
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={isSubmitting}
              className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl h-12 px-8 shadow-lg shadow-wine/20 flex-1"
            >
              {isSubmitting ? 'Syncing...' : (selectedLocation ? 'Update Configuration' : 'Establish Godown')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="p-3 bg-blue-600 text-white rounded-2xl w-fit mb-4 rotate-3">
              <ArrowRight className="w-6 h-6" />
            </div>
            <DialogTitle className="text-3xl font-black text-gray-900">Intra-Stock Transfer</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium text-lg">Relocate inventory between your registered locations</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md text-blue-600">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source Location</Label>
                <select
                  value={transferData.fromLocation}
                  onChange={(e) => setTransferData({ ...transferData, fromLocation: e.target.value })}
                  className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="">Select Origin</option>
                  {locations.filter(l => l.is_active !== false).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination</Label>
                <select
                  value={transferData.toLocation}
                  onChange={(e) => setTransferData({ ...transferData, toLocation: e.target.value })}
                  className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="">Select Target</option>
                  {locations.filter(l => l.is_active !== false && l.id !== transferData.fromLocation).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-gray-700 ml-1">Asset To Transfer</Label>
                <select
                  value={transferData.product}
                  onChange={(e) => setTransferData({ ...transferData, product: e.target.value })}
                  className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 font-bold focus:ring-2 focus:ring-wine/10 outline-none transition-all appearance-none"
                >
                  <option value="">Select a product from inventory</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name} (Global Stock: {prod.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 ml-1">Quantity</Label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      value={transferData.quantity}
                      onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                      placeholder="Units"
                      className="pl-12 rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-black"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 ml-1">Reason / Reference</Label>
                  <Input
                    value={transferData.reason}
                    onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                    placeholder="e.g. Stock Rebalancing"
                    className="rounded-xl border-gray-200 h-12 focus:ring-wine focus:border-wine font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-gray-50 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTransfer(false)}
              className="rounded-xl border-gray-200 font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStockTransfer}
              disabled={isSubmitting}
              className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl h-12 px-8 shadow-lg shadow-wine/20 flex-1"
            >
              {isSubmitting ? 'Processing...' : 'Authorize Transfer'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Stock Viewer Dialog */}
      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="max-w-4xl bg-white rounded-3xl p-8 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-black text-gray-900">
                  {selectedLocation?.name} Asset Registry
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium text-lg">
                  Real-time stock levels for this specific godown
                </DialogDescription>
              </div>
              <div className="p-3 bg-wine/10 text-wine rounded-2xl">
                <Package className="w-8 h-8" />
              </div>
            </div>
          </DialogHeader>

          <div className="relative mb-6">
            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products in this location..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="pl-12 rounded-xl h-12 bg-gray-50 border-none font-bold"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {products
                .filter(p => (p.locations?.[selectedLocation?.id] || 0) > 0)
                .filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.sku.toLowerCase().includes(inventorySearch.toLowerCase()))
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-[10px] font-black text-wine uppercase tracking-widest">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Available Quantity</p>
                      <p className="text-2xl font-black text-gray-900">
                        {product.locations[selectedLocation.id]} <span className="text-sm font-bold text-gray-500">{product.unit || 'units'}</span>
                      </p>
                      <p className="text-xs font-bold text-wine">{formatCurrency(product.locations[selectedLocation.id] * (product.cost_price || 0), 'PKR')}</p>
                    </div>
                  </div>
                ))}

              {products.filter(p => (p.locations?.[selectedLocation?.id] || 0) > 0).length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold">No stock currently assigned to this location</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-gray-50">
            <Button
              onClick={() => setShowInventory(false)}
              className="bg-gray-900 hover:bg-black text-white font-black rounded-xl h-12 px-8"
            >
              Close Ledger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}









'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, Loader2, ArrowRight, Warehouse, Package, Search, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBusiness } from '@/lib/context/BusinessContext';
import { transferStockAction } from '@/lib/actions/standard/inventory/stock';
import toast from 'react-hot-toast';

export function StockTransferForm({ onClose, onSave, products = [], warehouses = [] }) {
    const { business } = useBusiness();
    const [isSaving, setIsSaving] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const [formData, setFormData] = useState({
        source_warehouse_id: warehouses[0]?.id || '',
        destination_warehouse_id: warehouses[1]?.id || '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
        items: []
    });

    // Filter products
    const filteredProducts = products.filter(p =>
        !productSearch ||
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 15);

    const addItem = (product) => {
        // Prevent duplicate
        if (formData.items.some(i => i.product_id === product.id)) {
            toast.error('Product already added');
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku || '',
                    available_stock: product.current_stock || product.stock || 0,
                    quantity: 1,
                }
            ]
        }));
        setProductSearch('');
        setShowSearch(false);
    };

    const removeItem = (id) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(i => i.id !== id)
        }));
    };

    const updateItemQty = (id, quantity) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(i => i.id === id ? { ...i, quantity: Math.max(0, parseInt(quantity) || 0) } : i)
        }));
    };

    const totalItems = formData.items.reduce((sum, i) => sum + i.quantity, 0);
    const hasErrors = formData.items.some(i => i.quantity > i.available_stock || i.quantity <= 0);

    const handleSave = async () => {
        if (formData.source_warehouse_id === formData.destination_warehouse_id) {
            toast.error('Source and destination warehouses must be different');
            return;
        }
        if (formData.items.length === 0) {
            toast.error('Add at least one product to transfer');
            return;
        }
        if (hasErrors) {
            toast.error('Fix quantity errors before saving');
            return;
        }

        setIsSaving(true);
        try {
            // Transfer each item
            for (const item of formData.items) {
                const result = await transferStockAction({
                    businessId: business?.id,
                    productId: item.product_id,
                    sourceWarehouseId: formData.source_warehouse_id,
                    destinationWarehouseId: formData.destination_warehouse_id,
                    quantity: item.quantity,
                    notes: formData.notes || `Transfer ${item.name}`,
                    reference: formData.reference,
                    date: formData.date,
                });

                if (!result.success) {
                    throw new Error(result.error || `Failed to transfer ${item.name}`);
                }
            }

            toast.success(`Transferred ${formData.items.length} product(s) successfully`);
            onSave?.();
            onClose?.();
        } catch (error) {
            console.error('Transfer error:', error);
            toast.error(`Transfer failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const sourceWarehouse = warehouses.find(w => w.id === formData.source_warehouse_id);
    const destWarehouse = warehouses.find(w => w.id === formData.destination_warehouse_id);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border-none rounded-3xl">
                {/* Header */}
                <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 text-white flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/50">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Stock Transfer</CardTitle>
                            <p className="text-xs font-bold text-violet-300/70 uppercase tracking-widest mt-1">
                                {business?.name} • Inter-Warehouse Movement
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/40 font-black text-xs">
                            {formData.items.length} items • {totalItems} units
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/50 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
                    {/* Warehouse Selectors */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source Warehouse *</Label>
                            <select
                                className="w-full h-12 px-4 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 transition-all outline-none font-bold shadow-sm"
                                value={formData.source_warehouse_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, source_warehouse_id: e.target.value }))}
                            >
                                <option value="">Select Source</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} {w.location ? `(${w.location})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-shrink-0 mt-6">
                            <div className="p-3 rounded-full bg-violet-100 text-violet-600">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination Warehouse *</Label>
                            <select
                                className="w-full h-12 px-4 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 transition-all outline-none font-bold shadow-sm"
                                value={formData.destination_warehouse_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, destination_warehouse_id: e.target.value }))}
                            >
                                <option value="">Select Destination</option>
                                {warehouses.filter(w => w.id !== formData.source_warehouse_id).map(w => (
                                    <option key={w.id} value={w.id}>{w.name} {w.location ? `(${w.location})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {formData.source_warehouse_id === formData.destination_warehouse_id && formData.source_warehouse_id && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm font-bold">
                            ⚠️ Source and destination cannot be the same
                        </div>
                    )}

                    {/* Transfer Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Products to Transfer</Label>
                            <div className="relative">
                                <Button onClick={() => setShowSearch(true)} size="sm" className="h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold px-3">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                                </Button>
                            </div>
                        </div>

                        {/* Product search dropdown */}
                        {showSearch && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-3 space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Search products to add..."
                                        className="h-10 pl-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="w-full px-3 py-2 text-left hover:bg-violet-50 rounded-lg transition-colors flex items-center gap-3 text-sm"
                                        >
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-900">{p.name}</span>
                                                <span className="text-gray-400 ml-2 text-xs">Stock: {p.current_stock || p.stock || 0}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => { setShowSearch(false); setProductSearch(''); }} className="text-gray-400 text-xs font-bold">
                                        Close Search
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Line items table */}
                        {formData.items.length > 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="col-span-5">Product</div>
                                    <div className="col-span-2 text-center">Available</div>
                                    <div className="col-span-3 text-center">Transfer Qty</div>
                                    <div className="col-span-2 text-center">Action</div>
                                </div>
                                {formData.items.map(item => {
                                    const overStock = item.quantity > item.available_stock;
                                    return (
                                        <div key={item.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-0 ${overStock ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                                            <div className="col-span-5">
                                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">{item.sku || '—'}</p>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <Badge variant="outline" className="rounded-full font-bold text-[10px]">
                                                    {item.available_stock}
                                                </Badge>
                                            </div>
                                            <div className="col-span-3 text-center">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={item.available_stock}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQty(item.id, e.target.value)}
                                                    className={`h-9 text-center font-bold rounded-lg ${overStock ? 'border-red-400 text-red-600 bg-red-50' : 'border-gray-200'}`}
                                                />
                                                {overStock && (
                                                    <p className="text-[9px] text-red-500 font-bold mt-1">Exceeds available</p>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 font-medium text-sm">No products added yet</p>
                                <p className="text-gray-300 text-xs mt-1">Click "Add Product" to start</p>
                            </div>
                        )}
                    </div>

                    {/* Notes + Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference # (Optional)</Label>
                            <Input
                                placeholder="e.g. STN-2026-001"
                                className="h-12 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500"
                                value={formData.reference}
                                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transfer Date</Label>
                            <Input
                                type="date"
                                className="h-12 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes (Optional)</Label>
                        <textarea
                            className="w-full h-20 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 transition-all outline-none font-medium shadow-sm resize-none"
                            placeholder="Transfer reason or additional details..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>
                </CardContent>

                {/* Footer */}
                <div className="p-6 bg-white border-t flex justify-between items-center bg-gray-50/80 backdrop-blur-md flex-shrink-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving} className="font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900">
                        Cancel
                    </Button>
                    <Button
                        disabled={isSaving || formData.items.length === 0 || hasErrors || !formData.source_warehouse_id || !formData.destination_warehouse_id || formData.source_warehouse_id === formData.destination_warehouse_id}
                        onClick={handleSave}
                        className="h-12 px-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                        Execute Transfer
                    </Button>
                </div>
            </Card>
        </div>
    );
}

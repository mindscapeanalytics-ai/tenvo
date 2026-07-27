'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus, Trash2, Save, Package, Loader2, X,
    Building2, Warehouse, Hash, CalendarDays,
    FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Combobox } from '@/components/ui/combobox';
import { formatCurrency } from '@/lib/currency';
import { useFormRegionalContext } from '@/lib/hooks/useFormRegionalContext';
import { calculatePurchaseLineTotal, calculatePurchaseTotals } from '@/lib/utils/purchaseTotals';
import { resolveInventoryDomainFeatures } from '@/lib/utils/inventoryDomainFeatures';
import { showActionError } from '@/lib/utils/formErrorHandler';
import { purchaseAPI } from '@/lib/api/purchases';
import { productAPI } from '@/lib/api/product';
import { vendorAPI } from '@/lib/api/vendors';
import { warehouseAPI } from '@/lib/api/warehouse';
import { QuickVendorForm } from '@/components/QuickVendorForm';
import { QuickWarehouseForm } from '@/components/QuickWarehouseForm';
import { POMobileLineItems } from '@/components/purchase/POMobileLineItems';
import toast from 'react-hot-toast';
import { purchaseSchema, validateWithSchema } from '@/lib/validation/schemas';
import { PURCHASE_STATUSES } from '@/lib/constants/purchaseStatus';
import { cn } from '@/lib/utils';
import { MOBILE_NO_ZOOM_TEXT } from '@/lib/utils/formMobileStyles';

const PO_LINE_GRID =
    'minmax(0,1fr) minmax(3.5rem,4.5rem) minmax(4.5rem,5.75rem) minmax(3.25rem,4.25rem) minmax(4.5rem,5.75rem) 2.25rem';

function createEmptyLine(defaultTaxRate = 0) {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        productId: '',
        description: '',
        quantity: 1,
        unitCost: 0,
        taxRate: Number(defaultTaxRate) || 0,
        batchNumber: '',
        expiryDate: '',
        total: 0,
    };
}

function isValidPurchaseLine(item) {
    return Boolean(item?.productId) && Number(item?.quantity) > 0 && Number(item?.unitCost) >= 0;
}

function warehouseDescription(w) {
    return [w?.address, w?.city, w?.location].filter(Boolean).join(', ');
}

export default function EnhancedPOBuilder({ businessId, onSuccess, onCancel, category = 'retail-shop', colors }) {
    const accentColor = colors?.primary || '#059669';
    const { currency, defaultTaxRate, domainKnowledge, taxLabel, business } = useFormRegionalContext(category);

    const domainFeatures = useMemo(
        () => resolveInventoryDomainFeatures(category, { domainKnowledge, business }),
        [category, domainKnowledge, business]
    );
    const showBatchFields = domainFeatures.batchTrackingEnabled;
    const showExpiryFields = domainFeatures.expiryTrackingEnabled;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [showVendorForm, setShowVendorForm] = useState(false);
    const [showWarehouseForm, setShowWarehouseForm] = useState(false);

    const [header, setHeader] = useState(() => ({
        vendorId: '',
        warehouseId: '',
        purchaseNumber: `PO-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'draft',
    }));

    const [items, setItems] = useState(() => [createEmptyLine(0)]);

    useEffect(() => {
        async function loadData() {
            if (!businessId) return;
            setLoading(true);
            try {
                const [vendResult, prodResult, whResult] = await Promise.allSettled([
                    vendorAPI.getAll(businessId),
                    productAPI.getAll(businessId, { includeSerials: false }),
                    warehouseAPI.getLocations(businessId),
                ]);
                if (vendResult.status === 'fulfilled') setVendors(vendResult.value || []);
                else toast.error('Could not load suppliers');

                if (prodResult.status === 'fulfilled') setProducts(prodResult.value || []);
                else toast.error('Could not load products');

                if (whResult.status === 'fulfilled') {
                    const locs = (whResult.value || []).filter((w) => w?.is_active !== false);
                    setWarehouses(locs);
                    if (locs.length > 0) {
                        const primary = locs.find((w) => w.is_primary) || locs[0];
                        setHeader((p) => ({ ...p, warehouseId: p.warehouseId || primary.id }));
                    }
                } else {
                    toast.error('Could not load warehouses');
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [businessId]);

    const addItem = () => setItems((prev) => [...prev, createEmptyLine(defaultTaxRate)]);

    const updateItem = (id, field, value) => {
        if (field === 'productId' && value) {
            const duplicate = items.find(
                (row) => row.id !== id && String(row.productId) === String(value)
            );
            if (duplicate) {
                const prod = products.find((p) => String(p.id) === String(value));
                const name = prod?.name || 'This product';
                const merge = window.confirm(
                    `${name} is already on another line. Increase quantity on the existing line instead?`
                );
                if (merge) {
                    setItems((prev) => {
                        const next = prev
                            .map((item) => {
                                if (item.id !== duplicate.id) return item;
                                const quantity = Number(item.quantity || 0) + 1;
                                return {
                                    ...item,
                                    quantity,
                                    total: calculatePurchaseLineTotal(
                                        quantity,
                                        item.unitCost,
                                        item.taxRate
                                    ),
                                };
                            })
                            .filter((item) => item.id !== id);
                        return next.length > 0 ? next : [createEmptyLine(defaultTaxRate)];
                    });
                    return;
                }
            }
        }

        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const updated = { ...item, [field]: value };
                if (field === 'productId') {
                    const prod = products.find((p) => String(p.id) === String(value));
                    if (prod) {
                        updated.description = prod.name;
                        updated.unitCost = parseFloat(prod.cost_price || prod.price || 0);
                        updated.taxRate = parseFloat(prod.tax_percent || defaultTaxRate || 0);
                    }
                }
                if (['quantity', 'unitCost', 'taxRate', 'productId'].includes(field)) {
                    updated.total = calculatePurchaseLineTotal(
                        updated.quantity,
                        updated.unitCost,
                        updated.taxRate
                    );
                }
                return updated;
            })
        );
    };

    const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

    const validItems = useMemo(() => items.filter(isValidPurchaseLine), [items]);

    const validLineTotals = useMemo(() => calculatePurchaseTotals(validItems), [validItems]);

    const lineSummary = useMemo(() => {
        const productCount = validItems.length;
        const unitCount = validItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return { productCount, unitCount };
    }, [validItems]);

    const canSubmit = Boolean(
        header.vendorId &&
            header.warehouseId &&
            validItems.length > 0 &&
            !isSubmitting
    );

    const productOptions = useMemo(
        () =>
            products.map((p) => ({
                value: String(p.id),
                label: p.name,
                description: `${p.sku ? `SKU: ${p.sku}` : ''} ${p.cost_price ? `· ${currency}${p.cost_price}` : ''}`.trim(),
            })),
        [products, currency]
    );

    const mapItemForApi = (item) => ({
        product_id: item.productId,
        description: item.description || 'Item',
        quantity: Number(item.quantity || 0),
        unit_cost: Number(item.unitCost || 0),
        tax_rate: Number(item.taxRate || 0),
        tax_amount: parseFloat(((Number(item.quantity || 0) * Number(item.unitCost || 0)) * Number(item.taxRate || 0) / 100).toFixed(2)),
        batch_number: item.batchNumber || null,
        expiry_date: item.expiryDate || null,
        total_amount: Number(item.total || 0),
    });

    const handleSubmit = async () => {
        if (!header.vendorId) {
            toast.error('Please select a supplier');
            return;
        }
        if (!header.warehouseId) {
            toast.error('Please select a warehouse');
            return;
        }
        if (!header.purchaseNumber?.trim()) {
            toast.error('PO number is required');
            return;
        }
        if (validItems.length === 0) {
            toast.error('Add at least one line with a product, quantity, and unit cost');
            return;
        }

        const isReceived = header.status === PURCHASE_STATUSES.RECEIVED;
        if (showBatchFields && isReceived) {
            const missingBatch = validItems.find((item) => !String(item.batchNumber || '').trim());
            if (missingBatch) {
                toast.error('Batch number is required for Direct Inward on this business type');
                return;
            }
        }
        if (showExpiryFields && isReceived) {
            const missingExpiry = validItems.find((item) => !item.expiryDate);
            if (missingExpiry) {
                toast.error('Expiry date is required for Direct Inward on this business type');
                return;
            }
        }

        if (isReceived) {
            const confirmed = window.confirm(
                `Receive stock now for ${validItems.length} product${validItems.length === 1 ? '' : 's'} (${formatCurrency(validLineTotals.grandTotal, currency)})? Inventory and payables will update immediately.`
            );
            if (!confirmed) return;
        }

        const mappedItems = validItems.map(mapItemForApi);
        const validation = validateWithSchema(purchaseSchema, {
            business_id: businessId,
            vendor_id: header.vendorId,
            purchase_number: header.purchaseNumber.trim(),
            date: header.date,
            warehouse_id: header.warehouseId,
            status: header.status,
            items: mappedItems,
            subtotal: validLineTotals.subtotal,
            tax_total: validLineTotals.taxTotal,
            total_amount: validLineTotals.total,
            notes: header.notes || null,
        });
        if (!validation.success) {
            toast.error(Object.values(validation.errors)[0] || 'Please fix validation errors');
            return;
        }

        try {
            setIsSubmitting(true);
            await purchaseAPI.create({
                business_id: businessId,
                vendor_id: header.vendorId,
                warehouse_id: header.warehouseId,
                purchase_number: header.purchaseNumber.trim(),
                date: header.date,
                notes: header.notes,
                status: header.status,
                subtotal: validLineTotals.subtotal,
                tax_total: validLineTotals.taxTotal,
                total_amount: validLineTotals.total,
                items: mappedItems,
            });
            toast.success(
                isReceived
                    ? 'Purchase received and stock updated'
                    : 'Purchase order saved successfully'
            );
            onSuccess?.();
        } catch (error) {
            showActionError({
                success: false,
                error: error.message || 'Failed to create purchase order',
                code: error.code || null,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center justify-center h-80 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">Loading purchase order form…</p>
            </div>
        );
    }

    const isDraft = header.status === 'draft';
    const selectedVendor = vendors.find(v => String(v.id) === String(header.vendorId));
    const selectedWarehouse = warehouses.find(w => String(w.id) === String(header.warehouseId));

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[min(92dvh,900px)] w-full">

            {/* ── Modal Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">New Purchase Order</h2>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">{header.purchaseNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Status pill */}
                    <div className={cn(
                        'hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap',
                        isDraft
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    )}>
                        {isDraft
                            ? <FileText className="w-3 h-3 shrink-0" />
                            : <CheckCircle2 className="w-3 h-3 shrink-0" />}
                        <span className="hidden md:inline">{isDraft ? 'Draft PO' : 'Direct Inward'}</span>
                        <span className="md:hidden">{isDraft ? 'Draft' : 'Direct'}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── Scrollable Body ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

                {/* ── Section 1: Header Fields ─────────────────────── */}
                <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-slate-50">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">

                        {/* Supplier */}
                        <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Supplier *
                            </Label>
                            <div className="flex gap-1.5">
                                <Combobox
                                    options={vendors.map(v => ({ value: String(v.id), label: v.name, description: v.city || v.phone || '' }))}
                                    value={String(header.vendorId)}
                                    onChange={val => setHeader(p => ({ ...p, vendorId: val }))}
                                    placeholder={vendors.length ? 'Select supplier…' : 'Add a supplier first'}
                                    emptyText="No suppliers yet — use + to add one"
                                    className={cn('h-9 text-sm flex-1 min-w-0', MOBILE_NO_ZOOM_TEXT)}
                                />
                                <Button size="icon" variant="outline"
                                    className="h-9 w-9 shrink-0 border-dashed border-slate-300 text-slate-400 hover:text-emerald-600 hover:border-emerald-300"
                                    onClick={() => setShowVendorForm(true)} title="Add new vendor">
                                    <Plus className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            {selectedVendor?.phone && (
                                <p className="text-[10px] text-slate-400 pl-0.5 truncate">{selectedVendor.phone}</p>
                            )}
                            {(selectedVendor?.address || selectedVendor?.city) && (
                                <p className="text-[10px] text-slate-400 pl-0.5 truncate">
                                    {[selectedVendor.address, selectedVendor.city].filter(Boolean).join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Warehouse */}
                        <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Warehouse className="w-3 h-3" /> Warehouse *
                            </Label>
                            <div className="flex gap-1.5">
                                <Combobox
                                    options={warehouses.map(w => ({ value: String(w.id), label: w.name, description: warehouseDescription(w) }))}
                                    value={String(header.warehouseId)}
                                    onChange={val => setHeader(p => ({ ...p, warehouseId: val }))}
                                    placeholder={warehouses.length ? 'Select warehouse…' : 'Add a warehouse first'}
                                    emptyText="No warehouses yet — use + to add one"
                                    className={cn('h-9 text-sm flex-1 min-w-0', MOBILE_NO_ZOOM_TEXT)}
                                />
                                <Button size="icon" variant="outline"
                                    className="h-9 w-9 shrink-0 border-dashed border-slate-300 text-slate-400 hover:text-emerald-600 hover:border-emerald-300"
                                    onClick={() => setShowWarehouseForm(true)} title="Add new warehouse">
                                    <Plus className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            {warehouseDescription(selectedWarehouse) && (
                                <p className="text-[10px] text-slate-400 pl-0.5 truncate">{warehouseDescription(selectedWarehouse)}</p>
                            )}
                        </div>

                        {/* PO Number */}
                        <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Hash className="w-3 h-3" /> PO Number
                            </Label>
                            <Input
                                value={header.purchaseNumber}
                                onChange={e => setHeader(p => ({ ...p, purchaseNumber: e.target.value }))}
                                className={cn('h-9 text-sm font-mono font-semibold border-slate-200 w-full min-w-0', MOBILE_NO_ZOOM_TEXT)}
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5 sm:col-span-1">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> Date
                            </Label>
                            <Input
                                type="date"
                                value={header.date}
                                onChange={e => setHeader(p => ({ ...p, date: e.target.value }))}
                                className={cn('h-9 text-sm border-slate-200 w-full min-w-[10.5rem]', MOBILE_NO_ZOOM_TEXT)}
                            />
                        </div>
                    </div>

                    {/* Inventory Mode Toggle */}
                    <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">Inventory Mode:</span>
                        <div className="flex items-start sm:items-center gap-2 flex-wrap">
                            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 shrink-0">
                                <button
                                    onClick={() => setHeader(p => ({ ...p, status: PURCHASE_STATUSES.DRAFT }))}
                                    className={cn(
                                        'px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all whitespace-nowrap',
                                        isDraft
                                            ? 'bg-slate-800 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}>
                                    Draft PO
                                </button>
                                <button
                                    onClick={() => setHeader(p => ({ ...p, status: PURCHASE_STATUSES.RECEIVED }))}
                                    className={cn(
                                        'px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all whitespace-nowrap',
                                        !isDraft
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}>
                                    Direct Inward
                                </button>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 italic leading-relaxed">
                                {isDraft ? '⏳ No stock change until received' : '✓ Stock added immediately on save'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Line Items ─────────────────────────── */}
                <div className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 min-w-0">
                            <Package className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                            <span className="truncate">Line Items</span>
                            <span className="ml-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                {validItems.length}/{items.length}
                            </span>
                        </h3>
                        <Button size="sm" variant="outline" onClick={addItem}
                            className="h-7 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-bold border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 shrink-0">
                            <Plus className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Add Item</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </div>

                    {/* Mobile — stacked cards */}
                    <div className="lg:hidden">
                        <POMobileLineItems
                            items={items}
                            products={products}
                            currency={currency}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            addItem={addItem}
                            showBatchFields={showBatchFields}
                            showExpiryFields={showExpiryFields}
                            taxLabel={taxLabel || 'Tax'}
                        />
                    </div>

                    {/* Desktop — compact grid table */}
                    <div className="hidden lg:block">
                        <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                            <div
                                className="grid bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                                style={{ gridTemplateColumns: PO_LINE_GRID }}
                            >
                                <div className="px-3 py-2">Product</div>
                                <div className="px-2 py-2 text-center">Qty</div>
                                <div className="px-2 py-2 text-right">Unit Cost</div>
                                <div className="px-2 py-2 text-right">{taxLabel || 'Tax'} %</div>
                                <div className="px-2 py-2 text-right">Total</div>
                                <div className="px-1 py-2" />
                            </div>

                            <div className="divide-y divide-slate-50">
                                {items.map((item) => {
                                    const base = parseFloat(item.quantity || 0) * parseFloat(item.unitCost || 0);
                                    const tax = base * parseFloat(item.taxRate || 0) / 100;
                                    const rowValid = isValidPurchaseLine(item);
                                    return (
                                        <div key={item.id} className={cn(rowValid ? '' : 'bg-amber-50/40')}>
                                            <div
                                                className="grid items-center transition-colors group hover:bg-slate-50/60"
                                                style={{ gridTemplateColumns: PO_LINE_GRID }}
                                            >
                                            <div className="px-3 py-2 min-w-0">
                                                <Combobox
                                                    options={productOptions}
                                                    value={String(item.productId || '')}
                                                    onChange={val => updateItem(item.id, 'productId', val)}
                                                    placeholder="Select product…"
                                                    emptyText="No products found"
                                                    className="h-8 text-xs border-transparent bg-transparent hover:bg-white hover:border-slate-200 focus-within:bg-white focus-within:border-slate-300 transition-all"
                                                />
                                            </div>

                                            <div className="px-2 py-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    inputMode="decimal"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                    className="h-8 text-center text-xs font-semibold px-1 border-slate-200 bg-white tabular-nums"
                                                />
                                            </div>

                                            <div className="px-2 py-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    value={item.unitCost}
                                                    onChange={e => updateItem(item.id, 'unitCost', e.target.value)}
                                                    className="h-8 text-right text-xs font-semibold px-1.5 border-slate-200 bg-white tabular-nums"
                                                />
                                            </div>

                                            <div className="px-2 py-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    inputMode="decimal"
                                                    value={item.taxRate}
                                                    onChange={e => updateItem(item.id, 'taxRate', e.target.value)}
                                                    className="h-8 text-right text-xs px-1.5 border-slate-200 bg-white tabular-nums"
                                                />
                                            </div>

                                            <div className="px-2 py-2 text-right min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate tabular-nums">
                                                    {formatCurrency(item.total, currency)}
                                                </p>
                                                {item.taxRate > 0 && (
                                                    <p className="text-[10px] text-slate-400 leading-tight truncate tabular-nums">
                                                        {formatCurrency(base, currency)}+{formatCurrency(tax, currency)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="px-1 py-2 flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={items.length === 1}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    aria-label="Remove line"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            </div>

                                            {(showBatchFields || showExpiryFields) && (
                                                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 bg-slate-50/40 px-3 py-2">
                                                    {showBatchFields ? (
                                                        <div className="min-w-0 space-y-1">
                                                            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                                Batch No.
                                                            </Label>
                                                            <Input
                                                                value={item.batchNumber || ''}
                                                                onChange={(e) => updateItem(item.id, 'batchNumber', e.target.value)}
                                                                placeholder="Lot / batch"
                                                                className="h-8 text-xs border-slate-200 bg-white"
                                                            />
                                                        </div>
                                                    ) : null}
                                                    {showExpiryFields ? (
                                                        <div className="min-w-0 space-y-1">
                                                            <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                                Expiry
                                                            </Label>
                                                            <Input
                                                                type="date"
                                                                value={item.expiryDate || ''}
                                                                onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)}
                                                                className="h-8 text-xs border-slate-200 bg-white min-w-0"
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {items.length === 0 && (
                                <div className="py-8 text-center text-slate-400">
                                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm font-medium">No items added</p>
                                    <p className="text-xs mt-0.5">Click &quot;Add Item&quot; to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Notes + Totals ─────────────────────── */}
                <div className="grid grid-cols-1 gap-3.5 px-4 pb-3.5 sm:px-6 sm:pb-4 md:grid-cols-2 md:gap-5">

                    {/* Notes */}
                    <div className="space-y-1.5 order-2 md:order-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Notes & Instructions
                        </Label>
                        <textarea
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none transition-all"
                            placeholder="Delivery terms, special instructions…"
                            value={header.notes}
                            onChange={e => setHeader(p => ({ ...p, notes: e.target.value }))}
                        />
                    </div>

                    {/* Totals card */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5 sm:p-4 space-y-2.5 self-start order-1 md:order-2">
                        <div className="flex justify-between items-center text-sm text-slate-600">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(validLineTotals.subtotal, currency)}
                            </span>
                        </div>
                        {validLineTotals.taxTotal > 0 && (
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <span>Tax</span>
                                <span className="tabular-nums">
                                    {formatCurrency(validLineTotals.taxTotal, currency)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                            <span className="text-sm sm:text-base font-bold text-slate-800">Grand Total</span>
                            <span className="text-lg sm:text-xl font-semibold tabular-nums" style={{ color: accentColor }}>
                                {formatCurrency(validLineTotals.grandTotal, currency)}
                            </span>
                        </div>

                        <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1">
                            <Package className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                                {lineSummary.productCount} product{lineSummary.productCount !== 1 ? 's' : ''} ·{' '}
                                {lineSummary.unitCount} unit{lineSummary.unitCount !== 1 ? 's' : ''} total
                            </span>
                        </div>
                        {validItems.length === 0 && items.length > 0 ? (
                            <p className="text-[10px] text-amber-600">
                                Select a product and enter quantity on each line to include it in totals.
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ── Sticky Footer ─────────────────────────────────────── */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-400 order-2 sm:order-1">
                    {!header.vendorId && (
                        <span className="flex items-center gap-1 text-amber-600 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 shrink-0" /> Supplier required
                        </span>
                    )}
                    {!header.warehouseId && (
                        <span className="flex items-center gap-1 text-amber-600 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 shrink-0" /> Warehouse required
                        </span>
                    )}
                    {validItems.length === 0 && (
                        <span className="flex items-center gap-1 text-amber-600 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 shrink-0" /> Add at least one complete line
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button variant="ghost" onClick={onCancel}
                        className="h-9 px-3 sm:px-4 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex-1 sm:flex-initial">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="h-9 px-4 sm:px-5 text-sm font-bold rounded-lg text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60 flex-1 sm:flex-initial"
                        style={{ backgroundColor: accentColor }}>
                        {isSubmitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Saving…</>
                            : <><Save className="w-3.5 h-3.5 mr-2" />
                                <span className="hidden sm:inline">{isDraft ? 'Save Draft PO' : 'Confirm & Receive Stock'}</span>
                                <span className="sm:hidden">{isDraft ? 'Save Draft' : 'Receive Stock'}</span>
                            </>}
                    </Button>
                </div>
            </div>

            {/* ── Quick-add Dialogs ─────────────────────────────────── */}
            <Dialog open={showVendorForm} onOpenChange={setShowVendorForm}>
                <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] sm:w-full max-h-[min(90vh,800px)] overflow-y-auto overscroll-contain">
                    <div className="sr-only"><DialogTitle>Add New Vendor</DialogTitle></div>
                    <QuickVendorForm
                        onSave={(v) => {
                            if (!v?.id) return;
                            setVendors((prev) => {
                                if (prev.some((row) => String(row.id) === String(v.id))) return prev;
                                return [...prev, v];
                            });
                            setHeader((p) => ({ ...p, vendorId: String(v.id) }));
                            setShowVendorForm(false);
                        }}
                        onCancel={() => setShowVendorForm(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showWarehouseForm} onOpenChange={setShowWarehouseForm}>
                <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] sm:w-full max-h-[min(90vh,800px)] overflow-y-auto overscroll-contain">
                    <div className="sr-only"><DialogTitle>Add Storage Location</DialogTitle></div>
                    <QuickWarehouseForm
                        onSave={(w) => {
                            if (!w?.id) return;
                            setWarehouses((prev) => {
                                if (prev.some((row) => String(row.id) === String(w.id))) return prev;
                                return [...prev, w];
                            });
                            setHeader((p) => ({ ...p, warehouseId: String(w.id) }));
                            setShowWarehouseForm(false);
                        }}
                        onCancel={() => setShowWarehouseForm(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

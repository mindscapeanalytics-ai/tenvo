'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Calculator as CalcIcon,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  getDomainInvoiceColumns,
  getDomainUnits,
  isBatchTrackingEnabled,
  isExpiryTrackingEnabled,
  isSerialTrackingEnabled,
} from '@/lib/utils/domainHelpers';
import { resolveTextileLineQty, autoFillTextileLineOnUnitChange, resolveProductPrice } from '@/lib/utils/invoiceHelpers';
import { ExpertActionPanel } from '@/components/domain/ExpertActionPanel';
import { BarcodeScanTrigger } from '@/components/inventory/BarcodeScanTrigger';
import { QuickCalculatorModal } from './QuickCalculatorModal';

/**
 * Safely evaluates simple math expressions like "10*4", "1250/5", "15+3.5".
 */
function evaluateMathExpression(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  const cleaned = val.trim();
  if (!isNaN(cleaned)) return parseFloat(cleaned);
  // Allow only digits, +, -, *, /, ., (), spaces
  if (!/^[0-9+\-*/. ()]+$/.test(cleaned)) return parseFloat(cleaned) || 0;
  try {
    const fn = new Function(`return (${cleaned})`);
    const res = fn();
    if (typeof res === 'number' && Number.isFinite(res) && res >= 0) {
      return Math.round(res * 10000) / 10000;
    }
  } catch {
    /* Ignore syntax errors while typing */
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Resolves domain unit conversion hints across verticals (Textile, Tiles, Gold, Pharmacy, etc.)
 */
function resolveDomainConversionHint(item, category, currency) {
  const isTextile = category === 'textile-wholesale' || category === 'textile';
  if (isTextile) {
    const conv = resolveTextileLineQty(item);
    if (conv?.conversionNote) {
      return { note: conv.conversionNote, badge: 'Textile Conversion' };
    }
  }

  const isTiles = category === 'ceramics-tiles' || category === 'tiles-marbles' || category === 'building-materials';
  if (isTiles) {
    const qty = Number(item.quantity || 0);
    const unit = String(item.unit || '').toLowerCase();
    const sqftPerBox = Number(item.sqft_per_box || item.coverage || 15.5);
    if (unit === 'box' && qty > 0 && sqftPerBox > 0) {
      const totalSqft = Math.round(qty * sqftPerBox * 100) / 100;
      return {
        note: `${qty} Boxes × ${sqftPerBox} sqft/box = ${totalSqft} sqft total`,
        badge: 'Coverage Conversion',
      };
    }
  }

  const isJewellery = category === 'gems-jewellery' || category === 'gold';
  if (isJewellery) {
    const weight = Number(item.weight_grams || item.weight || item.quantity || 0);
    const karatStr = String(item.purity_karat || item.karat || '24K').toUpperCase();
    const karatNum = parseInt(karatStr.replace(/\D/g, '')) || 24;
    const making = Number(item.making_charges || item.making || 0);

    if (weight > 0) {
      const tolas = Math.round((weight / 11.6638) * 100) / 100;
      const pureGold = Math.round((weight * (karatNum / 24)) * 100) / 100;
      return {
        note: `${weight}g (${tolas} Tola) @ ${karatStr} • Pure Gold: ${pureGold}g${making > 0 ? ` + Making: ${formatCurrency(making, currency)}` : ''}`,
        badge: 'Purity Calculation',
      };
    }
  }

  const isPharmacy = category === 'pharmacy' || category === 'fmcg';
  if (isPharmacy) {
    const qty = Number(item.quantity || 0);
    const unit = String(item.unit || '').toLowerCase();
    const stripsPerPack = Number(item.strips_per_pack || item.packSize || 10);
    if (unit === 'pack' && qty > 0 && stripsPerPack > 1) {
      return {
        note: `${qty} Packs × ${stripsPerPack} Strips/pack = ${qty * stripsPerPack} Strips`,
        badge: 'Pack Conversion',
      };
    }
  }

  return null;
}

/**
 * DomainMultiRowLineItems Component
 * Pristine 2 to 3 Row Item Card layout for Invoice Builder.
 * Eliminates horizontal scrollbar completely across all domains and viewports.
 */
export function DomainMultiRowLineItems({
  items = [],
  products = [],
  category = 'retail-shop',
  currency = 'PKR',
  colors = { primary: '#10B981' },
  business = null,
  updateItem,
  removeItem,
  addItem,
  onScanBarcode,
  showTax = true,
}) {
  const domainCols = getDomainInvoiceColumns(category);
  const isTextileDomain = category === 'textile-wholesale' || category === 'textile';
  const defaultUnits = isTextileDomain
    ? ['meter', 'thaan', 'gaz', 'suit', 'guth', 'pcs', 'kg']
    : ['pcs', 'sqft', 'm', 'kg', 'box'];
  const unitOptions = getDomainUnits(category) || defaultUnits;
  const brandAccent = colors.primary || '#10B981';

  // Calculator modal state
  const [calcModal, setCalcModal] = useState({
    isOpen: false,
    itemId: null,
    field: 'quantity',
    title: 'Quantity',
    initialValue: 0,
  });

  // Local text input states for math expression typing (prevents losing focus while typing math string)
  const [mathInputs, setMathInputs] = useState({});

  const handleMathInputChange = (itemId, field, rawVal) => {
    const key = `${itemId}-${field}`;
    setMathInputs((prev) => ({ ...prev, [key]: rawVal }));

    // Evaluate on the fly if it turns into a clean number
    const evaluated = evaluateMathExpression(rawVal);
    if (Number.isFinite(evaluated) && evaluated >= 0) {
      updateItem(itemId, field, evaluated);
    }
  };

  const finalizeMathInput = (itemId, field, rawVal) => {
    const key = `${itemId}-${field}`;
    const evaluated = evaluateMathExpression(rawVal);
    updateItem(itemId, field, evaluated);
    setMathInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const openCalculator = (itemId, field, title, currentVal) => {
    setCalcModal({
      isOpen: true,
      itemId,
      field,
      title,
      initialValue: currentVal ?? 0,
    });
  };

  const handleApplyCalculator = (val) => {
    if (calcModal.itemId && calcModal.field) {
      updateItem(calcModal.itemId, calcModal.field, val);
    }
  };

  const duplicateItem = (id) => {
    const source = items.find((i) => i.id === id);
    if (!source) return;
    const newItem = {
      ...source,
      id: Date.now() + Math.random(),
    };
    const sourceIndex = items.findIndex((i) => i.id === id);
    const updated = [...items];
    updated.splice(sourceIndex + 1, 0, newItem);
    // Trigger bulk state update in parent by adding item
    if (addItem) {
      addItem(); // allocate slot
    }
    // Update fields
    Object.keys(newItem).forEach((k) => updateItem(newItem.id, k, newItem[k]));
  };

  const handleUnitChange = (item, newUnit) => {
    updateItem(item.id, 'unit', newUnit);
    const matchedProduct = products.find((p) => p.id === item.productId);
    const isTextile = category === 'textile-wholesale' || category === 'textile';
    if (isTextile) {
      const patches = autoFillTextileLineOnUnitChange(item, matchedProduct, newUnit);
      Object.entries(patches).forEach(([k, v]) => updateItem(item.id, k, v));
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h4 className="text-base font-semibold text-slate-700">No items added to invoice</h4>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Scan a product barcode or tap Add Line to start building your sales invoice.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onScanBarcode && (
            <BarcodeScanTrigger
              business={business}
              onScan={onScanBarcode}
              label="Scan barcode"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold shadow-sm"
            />
          )}
          {addItem && (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: brandAccent }}
              onClick={addItem}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add line
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Stack (Multi-Row Cards) */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const qty = Number(item.quantity || 0);
          const rate = Number(item.rate || 0);
          const discountPct = Number(item.discount || 0);
          const taxPct = showTax ? Number(item.taxPercent || 0) : 0;
          
          const textileConv = isTextileDomain ? resolveTextileLineQty(item) : null;
          const effectiveBilledQty =
            textileConv?.totalMeters &&
            item._rate_basis !== 'per_thaan' &&
            item._rate_basis !== 'per_suit'
              ? textileConv.totalMeters
              : qty;

          const base = effectiveBilledQty * rate;
          const discountVal = (base * discountPct) / 100;
          const taxable = base - discountVal;
          const taxVal = (taxable * taxPct) / 100;
          const netAmount = item.amount ?? taxable + taxVal;

          const matchedProduct = products.find((p) => p.id === item.productId);
          const stock = matchedProduct?.stock;
          const conversionHint = resolveDomainConversionHint(item, category, currency);

          // Auto-sync rate if item rate is 0 but product has resolved price
          if (matchedProduct && rate === 0) {
            const resolvedPrice = resolveProductPrice(matchedProduct);
            if (resolvedPrice > 0) {
              setTimeout(() => {
                updateItem(item.id, 'rate', resolvedPrice);
              }, 0);
            }
          }

          const isLastRow = index === items.length - 1;

          return (
            <div
              key={item.id}
              className="group rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md space-y-3"
            >
              {/* ==================== ROW 1: Header, Product Selector & Domain Identifiers ==================== */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Left: Line Badge & Product Combobox */}
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: brandAccent }}
                  >
                    #{index + 1}
                  </span>

                  <div className="flex-1">
                    <Combobox
                      options={products.map((p) => ({
                        value: String(p.id),
                        label: p.name,
                        description: p.sku
                          ? `SKU: ${p.sku}${resolveProductPrice(p) > 0 ? ` | ${formatCurrency(resolveProductPrice(p), currency)}` : ''}`
                          : resolveProductPrice(p) > 0
                            ? formatCurrency(resolveProductPrice(p), currency)
                            : '',
                      }))}
                      value={String(item.productId || '')}
                      onChange={(val) => updateItem(item.id, 'productId', val)}
                      placeholder="Search products (Name, SKU, Barcode)..."
                      emptyText="No matching products"
                      className="h-9 w-full rounded-xl text-xs font-medium border-slate-200 shadow-sm"
                    />
                  </div>
                </div>

                {/* Product Stock & HSN Badge */}
                {matchedProduct && (
                  <div className="flex items-center gap-2 text-[11px]">
                    {stock != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold rounded-lg px-2 py-0.5',
                          stock > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        Stock: {stock} {matchedProduct.unit || 'pcs'}
                      </Badge>
                    )}
                    {item.hsn && (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">
                        HSN: {item.hsn}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Right: Dynamic Domain Fields Grid (Article, Design, Thaan Length, Batch, Expiry, Serial, etc.) */}
                {domainCols.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 flex-1 lg:max-w-xl">
                    {domainCols.map((col) => (
                      <div key={col.field} className="space-y-1">
                        <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                          {col.header}
                        </Label>
                        {col.type === 'select' && Array.isArray(col.options) ? (
                          <select
                            value={item[col.field] || ''}
                            onChange={(e) => updateItem(item.id, col.field, e.target.value)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 text-xs font-medium text-slate-700 shadow-sm focus:bg-white focus:ring-1 focus:ring-slate-300"
                          >
                            <option value="">{col.placeholder || `Select…`}</option>
                            {col.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            {item[col.field] && !col.options.includes(item[col.field]) && (
                              <option value={item[col.field]}>{item[col.field]}</option>
                            )}
                          </select>
                        ) : (
                          <Input
                            type={col.type || 'text'}
                            value={item[col.field] || ''}
                            onChange={(e) => updateItem(item.id, col.field, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isLastRow && addItem) {
                                addItem();
                              }
                            }}
                            placeholder={col.placeholder || col.header}
                            className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 shadow-sm focus:bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ==================== ROW 2: Financial Calculator & Quantities Row ==================== */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2.5 items-end rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                {/* Quantity Input + Math Parser & Calculator Popover */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Qty</Label>
                    <button
                      type="button"
                      onClick={() => openCalculator(item.id, 'quantity', 'Quantity', qty)}
                      title="Open calculator"
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                    >
                      <CalcIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={mathInputs[`${item.id}-quantity`] ?? item.quantity ?? 1}
                    onChange={(e) => handleMathInputChange(item.id, 'quantity', e.target.value)}
                    onBlur={(e) => finalizeMathInput(item.id, 'quantity', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finalizeMathInput(item.id, 'quantity', e.currentTarget.value);
                        if (isLastRow && addItem) addItem();
                      }
                    }}
                    className="h-8 text-xs text-right font-semibold shadow-sm border-slate-200 bg-white"
                  />
                </div>

                {/* Unit Selector */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-2 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Unit</Label>
                  <select
                    value={item.unit || 'pcs'}
                    onChange={(e) => handleUnitChange(item, e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm focus:ring-1 focus:ring-slate-300 cursor-pointer"
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    {item.unit && !unitOptions.includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                  </select>
                </div>

                {/* Rate Input + Calculator Trigger */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Rate {item._rate_basis ? `(${item._rate_basis.replace('per_', '/')})` : ''}
                    </Label>
                    <button
                      type="button"
                      onClick={() => openCalculator(item.id, 'rate', 'Unit Rate', rate)}
                      title="Open calculator"
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                    >
                      <CalcIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={mathInputs[`${item.id}-rate`] ?? item.rate ?? 0}
                    onChange={(e) => handleMathInputChange(item.id, 'rate', e.target.value)}
                    onBlur={(e) => finalizeMathInput(item.id, 'rate', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finalizeMathInput(item.id, 'rate', e.currentTarget.value);
                        if (isLastRow && addItem) addItem();
                      }
                    }}
                    className="h-8 text-xs text-right font-semibold shadow-sm border-slate-200 bg-white"
                  />
                </div>

                {/* Discount % Input */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-1.5 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Disc %</Label>
                  <Input
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="h-8 text-xs text-right shadow-sm border-slate-200 bg-white"
                  />
                </div>

                {/* Tax % Input */}
                {showTax && (
                  <div className="col-span-1 sm:col-span-1 lg:col-span-1.5 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tax %</Label>
                    <Input
                      type="number"
                      value={item.taxPercent || 0}
                      onChange={(e) => updateItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isLastRow && addItem) addItem();
                      }}
                      min={0}
                      max={100}
                      className="h-8 text-xs text-right shadow-sm border-slate-200 bg-white"
                    />
                  </div>
                )}

                {/* Net Calculated Line Amount (2-way calculated) */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-2 space-y-1">
                  <Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Amount</Label>
                  <Input
                    type="number"
                    value={item.amount || 0}
                    onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className="h-8 text-xs text-right font-bold text-emerald-800 bg-emerald-50/70 border-emerald-200 shadow-sm"
                  />
                </div>

                {/* Line Actions (Expert AI, Duplicate, Delete) */}
                <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-center justify-end gap-1 pb-0.5">
                  <ExpertActionPanel
                    category={category}
                    item={item}
                    onUpdate={(field, val) => updateItem(item.id, field, val)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateItem(item.id)}
                    title="Duplicate line"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {removeItem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      title="Remove line"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* ==================== ROW 3: Live Conversion & Tax Breakdown Bar ==================== */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500 font-mono">
                {/* Financial breakdown pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    Base: {formatCurrency(base, currency)}
                  </span>
                  {discountVal > 0 && (
                    <span className="rounded bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 border border-rose-100">
                      Disc: -{formatCurrency(discountVal, currency)}
                    </span>
                  )}
                  {showTax && taxVal > 0 && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 border border-blue-100">
                      Tax ({taxPct}%): +{formatCurrency(taxVal, currency)}
                    </span>
                  )}
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                    Net: {formatCurrency(netAmount, currency)}
                  </span>
                </div>

                {/* Live Domain Conversion Note */}
                {conversionHint && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/80 px-2.5 py-0.5 font-sans font-semibold text-indigo-700 text-xs shadow-2xs">
                    <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{conversionHint.note}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculator Modal */}
      <QuickCalculatorModal
        isOpen={calcModal.isOpen}
        onClose={() => setCalcModal((prev) => ({ ...prev, isOpen: false }))}
        onApply={handleApplyCalculator}
        title={calcModal.title}
        initialValue={calcModal.initialValue}
      />
    </div>
  );
}

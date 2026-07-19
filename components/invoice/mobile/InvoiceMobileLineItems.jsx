'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatting';
import { getDomainInvoiceColumns, getDomainUnits } from '@/lib/utils/domainHelpers';
import { MOBILE_INPUT_CLASS, MOBILE_GRID_FIELDS } from '@/lib/utils/formMobileStyles';
import { BarcodeScanTrigger } from '@/components/inventory/BarcodeScanTrigger';

/**
 * App-style stacked line items for invoice builder on mobile (no horizontal table scroll).
 */
export function InvoiceMobileLineItems({
  items = [],
  products = [],
  category = 'retail-shop',
  currency = 'PKR',
  colors = { primary: '#10B981' },
  business = null,
  updateItem,
  removeItem,
  addItem,
  onEnterLastRow,
  onScanBarcode,
  showTax = true,
}) {
  const domainColumns = getDomainInvoiceColumns(category);
  const unitOptions = getDomainUnits(category) || ['pcs', 'sqft', 'm', 'kg', 'box'];

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No items added yet</p>
        <p className="mt-1 text-xs text-slate-400">Tap Add line or scan a barcode</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onScanBarcode && (
          <BarcodeScanTrigger
            business={business}
            onScan={onScanBarcode}
            label="Scan barcode"
            size="sm"
            className="h-9 rounded-xl text-xs font-semibold"
          />
        )}
        {addItem && (
          <Button
            type="button"
            size="sm"
            className="mt-4 h-9 rounded-xl text-xs font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
            onClick={addItem}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add line
          </Button>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {onScanBarcode && (
        <div className="flex justify-end">
          <BarcodeScanTrigger
            business={business}
            onScan={onScanBarcode}
            label="Scan to add"
            size="sm"
            variant="outline"
            className="h-9 rounded-xl text-xs font-semibold"
          />
        </div>
      )}
    <ul className="space-y-3">
      {items.map((item, index) => {
        const qty = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const discountPct = Number(item.discount || 0);
        const taxPct = Number(item.taxPercent || 0);
        const base = qty * rate;
        const discountValue = (base * discountPct) / 100;
        const taxable = base - discountValue;
        const taxValue = (taxable * taxPct) / 100;

        return (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Line {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-emerald-700">
                  {formatCurrency(item.amount || taxable + taxValue, currency)}
                </span>
                {removeItem && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 p-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-500">Product / item</Label>
                <Combobox
                  options={products.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                    description: p.sku
                      ? `SKU: ${p.sku}`
                      : p.price
                        ? formatCurrency(p.price, currency)
                        : '',
                  }))}
                  value={String(item.productId || '')}
                  onChange={(val) => updateItem?.(item.id, 'productId', val)}
                  placeholder="Search products..."
                  emptyText="No products found"
                  className={cn(MOBILE_INPUT_CLASS, 'w-full')}
                />
              </div>

              {domainColumns.length > 0 && (
                <div className={MOBILE_GRID_FIELDS}>
                  {domainColumns.map((col) => (
                    <div key={col.field} className="space-y-1.5">
                      <Label className="text-[11px] font-semibold text-slate-500">{col.header}</Label>
                      <Input
                        type={col.type || 'text'}
                        value={item[col.field] || ''}
                        onChange={(e) => updateItem?.(item.id, col.field, e.target.value)}
                        className={MOBILE_INPUT_CLASS}
                        placeholder={col.header}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Qty</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.quantity ?? 0}
                    onChange={(e) =>
                      updateItem?.(item.id, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    className={cn(MOBILE_INPUT_CLASS, 'text-right tabular-nums')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Unit</Label>
                  <select
                    value={item.unit || 'pcs'}
                    onChange={(e) => updateItem?.(item.id, 'unit', e.target.value)}
                    className={cn(MOBILE_INPUT_CLASS, 'bg-white')}
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    {item.unit && !unitOptions.includes(item.unit) && (
                      <option value={item.unit}>{item.unit}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Rate</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.rate ?? 0}
                    onChange={(e) => updateItem?.(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                    className={cn(MOBILE_INPUT_CLASS, 'text-right tabular-nums')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Disc %</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.discount ?? 0}
                    onChange={(e) =>
                      updateItem?.(item.id, 'discount', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    max={100}
                    className={cn(MOBILE_INPUT_CLASS, 'text-right tabular-nums')}
                  />
                </div>
                {showTax && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Tax %</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.taxPercent ?? 0}
                    onChange={(e) =>
                      updateItem?.(item.id, 'taxPercent', parseFloat(e.target.value) || 0)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && index === items.length - 1) {
                        onEnterLastRow?.();
                      }
                    }}
                    min={0}
                    max={100}
                    className={cn(MOBILE_INPUT_CLASS, 'text-right tabular-nums')}
                  />
                </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-500">Line total</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={item.amount ?? 0}
                  onChange={(e) => updateItem?.(item.id, 'amount', parseFloat(e.target.value) || 0)}
                  min={0}
                  step="0.01"
                  className={cn(MOBILE_INPUT_CLASS, 'text-right font-semibold tabular-nums')}
                />
                <p className="text-right text-[10px] text-slate-400 tabular-nums">
                  {showTax
                    ? `${formatCurrency(taxable, currency)} + ${formatCurrency(taxValue, currency)} tax`
                    : formatCurrency(taxable, currency)}
                </p>
              </div>
            </div>
          </li>
        );
      })}

      {addItem && (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl border-dashed text-xs font-semibold"
          onClick={addItem}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add another line
        </Button>
      )}
    </ul>
    </div>
  );
}

export default InvoiceMobileLineItems;

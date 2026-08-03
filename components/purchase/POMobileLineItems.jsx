'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { MOBILE_GRID_FIELDS, MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT } from '@/lib/utils/formMobileStyles';

/**
 * Stacked purchase order line items for mobile — no horizontal table scroll.
 */
export function POMobileLineItems({
  items = [],
  products = [],
  currency = 'PKR',
  updateItem,
  removeItem,
  addItem,
  showBatchFields = false,
  showExpiryFields = false,
  taxLabel = 'Tax',
}) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No items added yet</p>
        <p className="mt-1 text-xs text-slate-400">Tap Add Item to start your purchase order</p>
        {addItem ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4 h-9 rounded-xl border-dashed text-xs font-semibold"
            onClick={addItem}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add item
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item, index) => {
          const qty = Number(item.quantity) || 0;
          const unitCost = Number(item.unitCost) || 0;
          const taxRate = Number(item.taxRate) || 0;
          const base = qty * unitCost;
          const tax = (base * taxRate) / 100;
          const incomplete = !item.productId || qty <= 0;

          return (
            <li
              key={item.id}
              className={cn(
                'overflow-hidden rounded-xl border bg-white shadow-sm',
                incomplete ? 'border-amber-200' : 'border-slate-200'
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Line {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-emerald-700">
                    {formatCurrency(item.total || base + tax, currency)}
                  </span>
                  {removeItem ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-500">Product</Label>
                  <Combobox
                    options={products.map((p) => ({
                      value: String(p.id),
                      label: p.name,
                      description: `${p.sku ? `SKU: ${p.sku}` : ''} ${p.cost_price ? `· ${currency}${p.cost_price}` : ''}`.trim(),
                    }))}
                    value={String(item.productId || '')}
                    onChange={(val) => updateItem?.(item.id, 'productId', val)}
                    placeholder="Search products…"
                    emptyText="No products found"
                    className={cn(MOBILE_INPUT_CLASS, 'w-full')}
                  />
                </div>

                <div className={MOBILE_GRID_FIELDS}>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500">Qty</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={item.quantity ?? 0}
                      onChange={(e) => updateItem?.(item.id, 'quantity', e.target.value)}
                      className={cn(MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT, 'text-right tabular-nums')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500">Unit cost</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={item.unitCost ?? 0}
                      onChange={(e) => updateItem?.(item.id, 'unitCost', e.target.value)}
                      className={cn(MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT, 'text-right tabular-nums')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-500">{taxLabel} %</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      value={item.taxRate ?? 0}
                      onChange={(e) => updateItem?.(item.id, 'taxRate', e.target.value)}
                      className={cn(MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT, 'text-right tabular-nums')}
                    />
                  </div>
                </div>

                {(showBatchFields || showExpiryFields) && (
                  <div className={MOBILE_GRID_FIELDS}>
                    {showBatchFields ? (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-500">Batch No.</Label>
                        <Input
                          value={item.batchNumber || ''}
                          onChange={(e) => updateItem?.(item.id, 'batchNumber', e.target.value)}
                          placeholder="Batch / lot"
                          className={cn(MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT)}
                        />
                      </div>
                    ) : null}
                    {showExpiryFields ? (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-500">Expiry</Label>
                        <Input
                          type="date"
                          value={item.expiryDate || ''}
                          onChange={(e) => updateItem?.(item.id, 'expiryDate', e.target.value)}
                          className={cn(MOBILE_INPUT_CLASS, MOBILE_NO_ZOOM_TEXT, 'min-w-0')}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {taxRate > 0 ? (
                  <p className="text-right text-[10px] text-slate-400 tabular-nums">
                    {formatCurrency(base, currency)} + {formatCurrency(tax, currency)} tax
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {addItem ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl border-dashed text-xs font-semibold"
          onClick={addItem}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add another item
        </Button>
      ) : null}
    </div>
  );
}

export default POMobileLineItems;

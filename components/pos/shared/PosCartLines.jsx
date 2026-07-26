'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Weight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductThumbnail } from '@/components/product/ProductThumbnail';
import { cn } from '@/lib/utils';

/**
 * Shared POS cart line list (browse stays outside — lines live in the cart panel).
 *
 * @param {{
 *   items: object[],
 *   currency?: string,
 *   businessCategory?: string,
 *   theme?: 'dark' | 'light',
 *   onQuantityChange: (idx: number, qty: number) => void,
 *   onWeightChange?: (idx: number, weight: number) => void,
 *   onRemoveItem: (idx: number) => void,
 *   showBulkQuickAdds?: boolean,
 *   bulkQuickAdds?: number[],
 *   emptyTitle?: string,
 *   emptyHint?: string,
 *   className?: string,
 * }} props
 */
export function PosCartLines({
    items = [],
    currency = 'Rs.',
    businessCategory,
    theme = 'dark',
    onQuantityChange,
    onWeightChange,
    onRemoveItem,
    showBulkQuickAdds = false,
    bulkQuickAdds = [5, 12],
    emptyTitle = 'Cart is empty',
    emptyHint = 'Scan or tap products to add',
    className,
}) {
    const isDark = theme === 'dark';
    const quickAdds = Array.isArray(bulkQuickAdds) && bulkQuickAdds.length
        ? bulkQuickAdds
        : [5, 12];

    return (
        <div
            className={cn('flex-1 min-h-0 overflow-y-auto', className)}
            role="list"
            aria-label="Cart items"
        >
            <div className={cn(isDark ? 'divide-y divide-slate-800' : 'space-y-1.5 px-2 py-2')}>
                <AnimatePresence initial={false}>
                    {items.map((item, idx) => {
                        const isWeight = Boolean(item.isWeightItem);
                        const step = isWeight ? 0.1 : 1;
                        const minQty = isWeight ? 0.1 : 1;
                        const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);

                        return (
                            <motion.div
                                key={`${item.productId}-${item.batchId || ''}-${item.variantId || ''}-${idx}`}
                                initial={{ opacity: 0, y: isDark ? -8 : 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                    'flex items-center gap-2.5 group',
                                    isDark
                                        ? 'px-3 py-2.5 hover:bg-slate-800/40'
                                        : 'p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm shadow-gray-900/5'
                                )}
                                role="listitem"
                            >
                                <ProductThumbnail
                                    product={{
                                        image_url: item.image || item.imageUrl,
                                        name: item.name,
                                        id: item.productId,
                                    }}
                                    businessCategory={businessCategory}
                                    size={isDark ? 'md' : 'cart'}
                                    className="border border-gray-100 shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            'text-xs font-semibold truncate',
                                            isDark ? 'text-white' : 'text-gray-900'
                                        )}
                                        title={item.name}
                                    >
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span
                                            className={cn(
                                                'text-[10px] font-mono',
                                                isDark ? 'text-slate-500' : 'text-gray-400'
                                            )}
                                        >
                                            {item.sku || item.barcode || '--'}
                                        </span>
                                        {isWeight ? (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px] h-4 px-1',
                                                    isDark
                                                        ? 'border-amber-500/40 text-amber-400'
                                                        : 'border-amber-300 text-amber-600'
                                                )}
                                            >
                                                <Weight className="w-2.5 h-2.5 mr-0.5" />
                                                Weight
                                            </Badge>
                                        ) : null}
                                        {item.batchNumber ? (
                                            <span
                                                className={cn(
                                                    'text-[10px]',
                                                    isDark ? 'text-slate-500' : 'text-gray-400'
                                                )}
                                            >
                                                Batch {item.batchNumber}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p
                                        className={cn(
                                            'text-[10px] mt-0.5',
                                            isDark ? 'text-slate-400' : 'text-gray-500'
                                        )}
                                    >
                                        @{currency}
                                        {Number(item.unitPrice || 0).toLocaleString()}
                                        {item.unit ? ` / ${item.unit}` : ''}
                                    </p>
                                </div>

                                <div
                                    className={cn(
                                        'flex items-center gap-0.5 rounded-lg p-0.5 shrink-0',
                                        isDark ? 'bg-slate-800' : 'bg-gray-100'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onQuantityChange(
                                                idx,
                                                Math.max(minQty, Number(item.quantity || 0) - step)
                                            )
                                        }
                                        className={cn(
                                            'p-1.5 rounded-md transition-colors',
                                            isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
                                        )}
                                        aria-label={`Decrease ${item.name}`}
                                    >
                                        <Minus
                                            className={cn(
                                                'w-3 h-3',
                                                isDark ? 'text-slate-400' : 'text-gray-500'
                                            )}
                                        />
                                    </button>

                                    {isWeight ? (
                                        <input
                                            type="number"
                                            data-pos-role="qty"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                onWeightChange?.(
                                                    idx,
                                                    parseFloat(e.target.value) || minQty
                                                )
                                            }
                                            className={cn(
                                                'w-14 text-center text-xs font-semibold rounded px-1 py-1 border-0',
                                                isDark
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white text-gray-900'
                                            )}
                                            step="0.01"
                                            min="0.01"
                                        />
                                    ) : (
                                        <div className="flex items-center">
                                            <span
                                                className={cn(
                                                    'w-8 text-center text-xs font-semibold tabular-nums',
                                                    isDark ? 'text-white' : 'text-gray-900'
                                                )}
                                            >
                                                {item.quantity}
                                            </span>
                                            {showBulkQuickAdds && !isWeight ? (
                                                <div
                                                    className={cn(
                                                        'flex flex-col ml-0.5 border-l pl-0.5',
                                                        isDark ? 'border-slate-700' : 'border-gray-200'
                                                    )}
                                                >
                                                    {quickAdds.slice(0, 2).map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() =>
                                                                onQuantityChange(
                                                                    idx,
                                                                    Number(item.quantity || 0) + n
                                                                )
                                                            }
                                                            className={cn(
                                                                'text-[7px] font-semibold px-1 rounded',
                                                                isDark
                                                                    ? 'text-emerald-400 hover:bg-slate-700'
                                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                            )}
                                                        >
                                                            +{n}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onQuantityChange(
                                                idx,
                                                Number(item.quantity || 0) + step
                                            )
                                        }
                                        className={cn(
                                            'p-1.5 rounded-md transition-colors',
                                            isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
                                        )}
                                        aria-label={`Increase ${item.name}`}
                                    >
                                        <Plus
                                            className={cn(
                                                'w-3 h-3',
                                                isDark ? 'text-slate-400' : 'text-gray-500'
                                            )}
                                        />
                                    </button>
                                </div>

                                <span
                                    className={cn(
                                        'text-xs font-semibold w-[4.5rem] text-right shrink-0 tabular-nums',
                                        isDark ? 'text-emerald-400' : 'text-brand-primary'
                                    )}
                                >
                                    {currency}
                                    {lineTotal.toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(idx)}
                                    className={cn(
                                        'p-1 rounded transition-all shrink-0',
                                        isDark
                                            ? 'opacity-70 hover:bg-red-500/20'
                                            : 'opacity-0 group-hover:opacity-100 hover:bg-red-50'
                                    )}
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <X className="w-3.5 h-3.5 text-red-400" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {items.length === 0 ? (
                <div
                    className={cn(
                        'flex flex-col items-center justify-center py-12 px-4 text-center',
                        isDark ? 'text-slate-500' : 'text-gray-400'
                    )}
                    role="status"
                >
                    <ShoppingCart
                        className={cn('w-10 h-10 mb-3 opacity-30', isDark && 'text-slate-600')}
                    />
                    <p className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-gray-700')}>
                        {emptyTitle}
                    </p>
                    <p className="text-[10px] mt-1 opacity-80">{emptyHint}</p>
                </div>
            ) : null}
        </div>
    );
}

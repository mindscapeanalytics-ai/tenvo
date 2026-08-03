'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MODES = [
    {
        id: 'standard',
        title: 'Standard',
        hint: 'Apply configured GST and PST (when set)',
    },
    {
        id: 'gst_only',
        title: 'GST only',
        hint: 'Skip provincial PST for this sale',
    },
    {
        id: 'exempt',
        title: 'Tax exempt',
        hint: 'No tax on this sale (zero-rated / exempt)',
    },
];

/**
 * Cart-level tax mode panel (F7).
 */
export function PosTaxPanel({
    open,
    onOpenChange,
    taxMode = 'standard',
    onTaxModeChange,
    components = [],
    currency = '₨',
    sampleTaxAmount = 0,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tax for this sale</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Active rates
                        </p>
                        {components.length === 0 ? (
                            <p className="text-xs text-gray-500">No tax (exempt or zero rates)</p>
                        ) : (
                            components.map((c) => (
                                <div key={c.key} className="flex justify-between text-xs text-gray-700">
                                    <span>{c.label}</span>
                                    <span className="tabular-nums font-semibold">{c.rate}%</span>
                                </div>
                            ))
                        )}
                        {sampleTaxAmount > 0 && (
                            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 text-gray-600">
                                <span>Tax on current cart</span>
                                <span className="tabular-nums font-semibold">
                                    {currency}{Number(sampleTaxAmount).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        {MODES.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => onTaxModeChange?.(mode.id)}
                                className={cn(
                                    'text-left rounded-xl border px-3 py-2.5 transition-colors',
                                    taxMode === mode.id
                                        ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                )}
                            >
                                <p className="text-sm font-semibold text-gray-900">{mode.title}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{mode.hint}</p>
                            </button>
                        ))}
                    </div>

                    <Button
                        type="button"
                        className="w-full"
                        onClick={() => onOpenChange?.(false)}
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function formatHeldTime(ts) {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

function heldTotal(entry) {
    const items = entry?.items || [];
    const subtotal = items.reduce(
        (sum, i) => sum + Number(i.unitPrice || 0) * Number(i.quantity || 0),
        0
    );
    const tax = items.reduce((sum, i) => {
        const line = Number(i.unitPrice || 0) * Number(i.quantity || 0);
        return sum + line * (Number(i.taxPercent || 0) / 100);
    }, 0);
    const discount = Number(entry?.discount || 0);
    const discountType = entry?.discountType === 'percentage' ? 'percentage' : 'fixed';
    const discountAmt =
        discountType === 'percentage'
            ? Math.round(subtotal * (discount / 100) * 100) / 100
            : discount;
    return Math.round((subtotal + tax - discountAmt) * 100) / 100;
}

/**
 * Pick / discard parked POS sales (multi-held).
 */
export function PosHeldSalesSheet({
    open,
    onOpenChange,
    heldOrders = [],
    currency = 'Rs.',
    onResume,
    onDiscard,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Held sales ({heldOrders.length})
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    {heldOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 py-6 text-center">No held sales</p>
                    ) : (
                        [...heldOrders].reverse().map((entry) => {
                            const total = heldTotal(entry);
                            const lines = entry.items?.length || 0;
                            const label = entry.customer?.name || 'Walk-in Customer';
                            return (
                                <div
                                    key={entry.id}
                                    className="rounded-xl border border-gray-200 bg-white p-3 space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {label}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {formatHeldTime(entry.timestamp)}
                                                {' · '}
                                                {lines} {lines === 1 ? 'line' : 'lines'}
                                                {' · '}
                                                {currency}
                                                {total.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="flex-1 h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600"
                                            onClick={() => onResume?.(entry.id)}
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                            Resume
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => onDiscard?.(entry.id)}
                                            aria-label={`Discard held sale for ${label}`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

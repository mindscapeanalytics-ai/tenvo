'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getPosLoyaltySummaryAction,
    redeemPosLoyaltyPointsAction,
} from '@/lib/actions/standard/posOperations';
import toast from 'react-hot-toast';

/**
 * Show / redeem loyalty points for the selected walk-up customer.
 */
export function PosLoyaltyPanel({
    open,
    onOpenChange,
    businessId,
    customer,
    currency = '₨',
    onRedeemDiscount,
}) {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [points, setPoints] = useState('');
    const [redeeming, setRedeeming] = useState(false);

    useEffect(() => {
        if (!open || !businessId || !customer?.id) {
            setSummary(null);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getPosLoyaltySummaryAction(businessId, customer.id);
                if (!cancelled && res?.success) {
                    setSummary(res);
                    const min = res.program?.minRedeemPoints || 100;
                    setPoints(String(Math.min(res.balance || 0, min)));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, businessId, customer?.id]);

    const handleRedeem = async () => {
        if (!summary?.program || !customer?.id) return;
        const pts = parseInt(points, 10);
        if (!Number.isFinite(pts) || pts <= 0) {
            toast.error('Enter points to redeem');
            return;
        }
        setRedeeming(true);
        try {
            const res = await redeemPosLoyaltyPointsAction({
                businessId,
                programId: summary.program.id,
                customerId: customer.id,
                points: pts,
            });
            if (!res?.success) {
                toast.error(res?.error || 'Redeem failed');
                return;
            }
            onRedeemDiscount?.(res.discountAmount || 0, res.newBalance);
            toast.success(`Redeemed ${pts} pts for ${currency}${Number(res.discountAmount || 0).toLocaleString()}`);
            onOpenChange?.(false);
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Loyalty · {customer?.name || 'Customer'}</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <p className="text-sm text-gray-500 py-6 text-center">Loading balance…</p>
                ) : !summary?.program ? (
                    <p className="text-sm text-gray-500 py-6 text-center">
                        No active loyalty program. Create one in CRM Loyalty.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                            <p className="text-[10px] uppercase font-semibold text-gray-400">{summary.program.name}</p>
                            <p className="text-2xl font-semibold tabular-nums text-gray-900 mt-1">
                                {summary.balance} pts
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Min redeem {summary.program.minRedeemPoints} · {currency}
                                {summary.program.currencyPerPoint}/pt
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={summary.program.minRedeemPoints}
                                max={summary.balance}
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                className="h-10"
                                aria-label="Points to redeem"
                            />
                            <Button
                                type="button"
                                disabled={redeeming || summary.balance < summary.program.minRedeemPoints}
                                onClick={() => void handleRedeem()}
                            >
                                {redeeming ? '…' : 'Redeem'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

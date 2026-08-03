'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recordPosCashMovementAction } from '@/lib/actions/standard/posOperations';
import { openCashDrawer } from '@/lib/utils/posCashDrawer';
import { resolvePosSettings } from '@/lib/config/posSettings';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/**
 * Open drawer + paid in / paid out for the active shift.
 * Drawer kick prints a labeled 58mm slip (not a blank page).
 */
export function PosCashToolsPanel({
    open,
    onOpenChange,
    businessId,
    sessionId,
    business,
    currencyCode,
    onRequirePinForPaidOut,
}) {
    const [mode, setMode] = useState('paid_in');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const posSettings = resolvePosSettings(business);
    const paperSize = posSettings.paperSize === '80mm' ? '80mm' : '58mm';
    const businessName = business?.business_name || business?.name || 'Store';
    const resolvedCurrency = currencyCode || business?.currency || '';

    const kickDrawer = (opts = {}) =>
        openCashDrawer({
            businessName,
            currencyCode: resolvedCurrency,
            paperSize,
            ...opts,
        });

    const submitMovement = async () => {
        const run = async () => {
            setBusy(true);
            try {
                const parsedAmount = parseFloat(amount);
                if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                    toast.error('Enter a valid amount');
                    return;
                }
                const res = await recordPosCashMovementAction({
                    businessId,
                    sessionId,
                    type: mode,
                    amount: parsedAmount,
                    reason,
                });
                if (!res?.success) {
                    toast.error(res?.error || 'Could not record movement');
                    return;
                }
                toast.success(mode === 'paid_in' ? 'Paid in recorded' : 'Paid out recorded');
                kickDrawer({
                    label: mode === 'paid_in' ? 'Paid in' : 'Paid out',
                    amount: parsedAmount,
                    reason,
                });
                setAmount('');
                setReason('');
                onOpenChange?.(false);
            } finally {
                setBusy(false);
            }
        };

        if (mode === 'paid_out' && onRequirePinForPaidOut) {
            onRequirePinForPaidOut(run);
            return;
        }
        await run();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cash drawer</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full font-semibold"
                        onClick={() => {
                            void kickDrawer({ label: 'Open cash drawer' }).then((ok) => {
                                toast[ok ? 'success' : 'error'](
                                    ok
                                        ? 'Print dialog opened — choose your receipt printer'
                                        : 'Could not open print dialog'
                                );
                            });
                        }}
                    >
                        Open cash drawer
                    </Button>
                    <p className="text-[11px] font-medium leading-snug text-neutral-500">
                        Opens a short {paperSize} slip with drawer kick. Select your thermal printer and turn on Save paper.
                    </p>

                    {!sessionId ? (
                        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Start a shift to record paid in / paid out.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    className={cn(
                                        mode === 'paid_in'
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : ''
                                    )}
                                    variant={mode === 'paid_in' ? 'default' : 'outline'}
                                    onClick={() => setMode('paid_in')}
                                >
                                    Paid in
                                </Button>
                                <Button
                                    type="button"
                                    className={cn(
                                        mode === 'paid_out'
                                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                                            : ''
                                    )}
                                    variant={mode === 'paid_out' ? 'default' : 'outline'}
                                    onClick={() => setMode('paid_out')}
                                >
                                    Paid out
                                </Button>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Reason</Label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Float top-up, expenses, …"
                                />
                            </div>
                            <Button
                                type="button"
                                className={cn(
                                    'w-full font-semibold',
                                    mode === 'paid_in'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                )}
                                disabled={busy || !amount}
                                onClick={() => void submitMovement()}
                            >
                                {busy ? 'Saving…' : 'Record'}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

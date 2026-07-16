'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recordPosCashMovementAction } from '@/lib/actions/standard/posOperations';
import { openCashDrawer } from '@/lib/utils/posCashDrawer';
import toast from 'react-hot-toast';

/**
 * Open drawer + paid in / paid out for the active shift.
 */
export function PosCashToolsPanel({
    open,
    onOpenChange,
    businessId,
    sessionId,
    onRequirePinForPaidOut,
}) {
    const [mode, setMode] = useState('paid_in');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const submitMovement = async () => {
        const run = async () => {
            setBusy(true);
            try {
                const res = await recordPosCashMovementAction({
                    businessId,
                    sessionId,
                    type: mode,
                    amount: parseFloat(amount),
                    reason,
                });
                if (!res?.success) {
                    toast.error(res?.error || 'Could not record movement');
                    return;
                }
                toast.success(mode === 'paid_in' ? 'Paid in recorded' : 'Paid out recorded');
                openCashDrawer({ label: mode });
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
                        className="w-full"
                        onClick={() => {
                            const ok = openCashDrawer({ label: 'Open drawer' });
                            toast[ok ? 'success' : 'error'](
                                ok ? 'Drawer kick sent to printer' : 'Could not open drawer'
                            );
                        }}
                    >
                        Open cash drawer
                    </Button>

                    {!sessionId ? (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            Start a shift to record paid in / paid out.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={mode === 'paid_in' ? 'default' : 'outline'}
                                    onClick={() => setMode('paid_in')}
                                >
                                    Paid in
                                </Button>
                                <Button
                                    type="button"
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
                                className="w-full"
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

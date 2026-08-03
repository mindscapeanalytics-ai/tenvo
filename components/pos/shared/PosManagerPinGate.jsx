'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { verifyPosManagerPinAction } from '@/lib/actions/standard/posOperations';
import { posActionRequiresManagerPin } from '@/lib/config/posSettings';
import toast from 'react-hot-toast';

/**
 * Gate privileged POS actions behind an optional manager PIN.
 */
export function usePosManagerGate({ businessId, posSettings }) {
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);

    const requestApproval = useCallback((action, run, ctx = {}) => {
        if (!posActionRequiresManagerPin(action, posSettings, ctx)) {
            run?.();
            return;
        }
        setPending({ action, run });
        setPin('');
        setOpen(true);
    }, [posSettings]);

    const submit = useCallback(async () => {
        if (!businessId || !pending) return;
        setBusy(true);
        try {
            const res = await verifyPosManagerPinAction(businessId, pin);
            if (!res?.success) {
                toast.error(res?.error || 'PIN rejected', { id: 'pos-pin' });
                return;
            }
            setOpen(false);
            const fn = pending.run;
            setPending(null);
            setPin('');
            fn?.();
        } finally {
            setBusy(false);
        }
    }, [businessId, pending, pin]);

    const dialog = (
        <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Manager PIN required</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-gray-500">
                    Enter the manager PIN set in POS settings to continue.
                </p>
                <Input
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            void submit();
                        }
                    }}
                    placeholder="PIN"
                    className="h-11 text-center text-lg tracking-widest"
                    autoFocus
                />
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={busy}
                        onClick={() => { setOpen(false); setPending(null); }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={busy || !pin}
                        onClick={() => void submit()}
                    >
                        {busy ? 'Checking…' : 'Approve'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    return { requestApproval, managerPinDialog: dialog };
}

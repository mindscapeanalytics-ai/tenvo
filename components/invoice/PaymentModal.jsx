'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, CheckCircle2, Loader2, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: DollarSign },
    { id: 'check', label: 'Check', icon: DollarSign },
    { id: 'digital_wallet', label: 'Digital Wallet (JazzCash, EasyPaisa, etc.)', icon: CreditCard },
    { id: 'other', label: 'Other', icon: DollarSign }
];

function coerceMoney(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    if (!Number.isFinite(n) || n < 0) return fallback;
    return n;
}

export function PaymentModal({
    isOpen,
    onClose,
    invoice,
    currency = 'PKR',
    onRecordPayment
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingBalance, setIsFetchingBalance] = useState(true);
    const [liveBalance, setLiveBalance] = useState(null);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');

    const total = coerceMoney(invoice?.grand_total, 0);
    const fallbackBalance = coerceMoney(invoice?.balance, total);
    const balance = liveBalance !== null ? liveBalance : fallbackBalance;
    const alreadyPaid = Math.max(0, total - balance);

    // Fetch live balance when modal opens
    useEffect(() => {
        if (!invoice?.id || !invoice?.business_id || !isOpen) return;
        let cancelled = false;
        const fb = coerceMoney(invoice.balance, coerceMoney(invoice.grand_total, 0));
        setIsFetchingBalance(true);
        setLiveBalance(null);
        (async () => {
            try {
                const { getInvoicePaymentSummaryAction } = await import('@/lib/actions/standard/invoice-payments');
                const result = await getInvoicePaymentSummaryAction(invoice.business_id, invoice.id);
                if (!cancelled && result.success && result.summary) {
                    setLiveBalance(
                        coerceMoney(
                            result.summary.balance ?? result.summary.remaining,
                            fb
                        )
                    );
                } else if (!cancelled) {
                    setLiveBalance(fb);
                }
            } catch {
                if (!cancelled) setLiveBalance(fb);
            } finally {
                if (!cancelled) setIsFetchingBalance(false);
            }
        })();
        return () => { cancelled = true; };
    }, [invoice?.id, invoice?.business_id, invoice?.balance, invoice?.grand_total, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || Number(amount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        if (Number(amount) > balance) {
            toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(balance, currency)}`);
            return;
        }

        if (!paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }

        setIsLoading(true);

        try {
            await onRecordPayment({
                invoiceId: invoice.id,
                businessId: invoice.business_id,
                amount: Number(amount),
                paymentMethod,
                referenceNumber: referenceNumber || null,
                notes: notes || null
            });

            toast.success('Payment recorded successfully!');
            onClose();
        } catch (error) {
            console.error('Payment recording failed:', error);
            toast.error(error.message || 'Failed to record payment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (value) => {
        // Only allow positive numbers up to the remaining balance
        const numValue = Number(value);
        if (numValue > balance) {
            setAmount(String(balance));
        } else {
            setAmount(value);
        }
    };

    const handleQuickAmount = (percentage) => {
        const amount = Math.round((balance * percentage) * 100) / 100;
        setAmount(String(amount));
    };

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Record Payment
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Invoice Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Invoice #</span>
                            <span className="font-medium">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Customer</span>
                            <span className="font-medium">{invoice.customer_name || invoice.customer?.name || 'Walk-in Customer'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Invoice Total</span>
                            <span className="font-medium">{formatCurrency(total, currency)}</span>
                        </div>
                        {alreadyPaid > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600">Already Paid</span>
                                <span className="font-medium text-green-600">{formatCurrency(alreadyPaid, currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t items-center">
                            <span className="text-gray-900">Balance Due</span>
                            <span className="flex items-center gap-2">
                                {isFetchingBalance ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-hidden />
                                ) : null}
                                <span
                                    className={
                                        balance > 0.005
                                            ? 'text-amber-700'
                                            : 'text-emerald-600'
                                    }
                                >
                                    {formatCurrency(balance, currency)}
                                </span>
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                    {currency === 'PKR' ? '₨' : '$'}
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={balance}
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    className="pl-10"
                                    placeholder="Enter amount"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAmount(1)}
                                    className="text-xs flex-1"
                                    disabled={isLoading}
                                >
                                    Full Amount
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAmount(0.5)}
                                    className="text-xs flex-1"
                                    disabled={isLoading}
                                >
                                    50%
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAmount(0.25)}
                                    className="text-xs flex-1"
                                    disabled={isLoading}
                                >
                                    25%
                                </Button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method *</Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((method) => (
                                        <SelectItem key={method.id} value={method.id}>
                                            <div className="flex items-center gap-2">
                                                <method.icon className="w-4 h-4" />
                                                {method.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference Number */}
                        <div className="space-y-2">
                            <Label htmlFor="referenceNumber">
                                Reference / Check / Transaction #
                                <span className="text-gray-400 font-normal"> (Optional)</span>
                            </Label>
                            <Input
                                id="referenceNumber"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="e.g., CHK-001234, TXN-56789"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">
                                Notes
                                <span className="text-gray-400 font-normal"> (Optional)</span>
                            </Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                disabled={isLoading}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isLoading || !amount || !paymentMethod}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Record Payment
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

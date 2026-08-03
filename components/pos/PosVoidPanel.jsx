'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Search, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { posAPI } from '@/lib/api/pos';
import { getRecentPosTransactionsForRefundAction } from '@/lib/actions/standard/posRefund';
import { MobileTabHeader } from '@/components/mobile/MobileTabHeader';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';

const VOID_REASONS = [
    'Wrong item scanned',
    'Duplicate transaction',
    'Customer cancelled',
    'Price error',
    'Cashier error',
    'Other',
];

function resolveTxNumber(tx) {
    return tx?.transactionNumber || tx?.transaction_number || '';
}

function resolveTxTotal(tx) {
    const n = Number(tx?.totalAmount ?? tx?.total_amount);
    return Number.isFinite(n) ? n : 0;
}

function resolveTxDate(tx) {
    const raw = tx?.createdAt || tx?.created_at;
    if (!raw) return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatTxWhen(tx) {
    const d = resolveTxDate(tx);
    if (!d) return '—';
    try {
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return d.toLocaleString();
    }
}

export function PosVoidPanel({ businessId, currency: currencyProp }) {
    const { currency: businessCurrency, currencySymbol } = useBusiness();
    const currencyCode = currencyProp || businessCurrency || 'PKR';

    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [lookupId, setLookupId] = useState('');
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState(VOID_REASONS[0]);
    const [customReason, setCustomReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatMoney = useCallback(
        (amount) => {
            try {
                return formatCurrency(resolveTxTotal({ totalAmount: amount }), currencyCode);
            } catch {
                const n = Number(amount);
                const safe = Number.isFinite(n) ? n : 0;
                return `${currencySymbol || currencyCode}${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
            }
        },
        [currencyCode, currencySymbol]
    );

    const loadRecent = useCallback(async () => {
        if (!businessId) return;
        setLoading(true);
        setLoadError(null);
        try {
            const res = await getRecentPosTransactionsForRefundAction(businessId, 15);
            if (res?.success) {
                setRecent(
                    (res.transactions || []).filter((t) => !t.isVoided && !t.is_voided)
                );
            } else {
                setRecent([]);
                setLoadError(res?.error || 'Could not load transactions');
            }
        } catch (err) {
            setRecent([]);
            setLoadError(err?.message || 'Could not load transactions');
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        loadRecent();
    }, [loadRecent]);

    const filtered = useMemo(() => {
        const q = lookupId.trim().toLowerCase();
        if (!q) return recent;
        return recent.filter((t) => {
            const number = String(resolveTxNumber(t)).toLowerCase();
            const id = String(t.id || '').toLowerCase();
            return number.includes(q) || id.includes(q);
        });
    }, [recent, lookupId]);

    const handleVoid = async () => {
        if (!selected?.id || !businessId) return;
        const finalReason = reason === 'Other' ? customReason.trim() : reason;
        if (!finalReason) {
            toast.error('Please provide a void reason');
            return;
        }
        setSubmitting(true);
        try {
            const res = await posAPI.voidTransaction({
                businessId,
                transactionId: selected.id,
                reason: finalReason,
            });
            if (res?.success) {
                toast.success(`Voided ${resolveTxNumber(selected)}`);
                setSelected(null);
                loadRecent();
            } else {
                toast.error(res?.error || 'Void failed');
            }
        } catch (err) {
            toast.error(err?.message || 'Void failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-3 lg:space-y-4">
            <MobileTabHeader
                icon={Ban}
                iconClassName="bg-slate-100 text-slate-700"
                title="Void Transaction"
                subtitle="Reverse posted sales (manager)"
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                Void restores stock and reverses accounting. Use refunds for partial customer returns.
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="Search receipt #…"
                    className="pl-9 h-10"
                />
            </div>

            {loadError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => loadRecent()}
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-white divide-y max-h-72 overflow-y-auto">
                    {loading && <p className="p-4 text-xs text-gray-400">Loading…</p>}
                    {!loading && filtered.length === 0 && (
                        <p className="p-4 text-xs text-gray-400">No voidable transactions</p>
                    )}
                    {filtered.map((tx) => (
                        <button
                            key={tx.id}
                            type="button"
                            onClick={() => setSelected(tx)}
                            className={cn(
                                'w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors',
                                selected?.id === tx.id && 'bg-brand-primary/5'
                            )}
                        >
                            <p className="text-xs font-bold text-gray-900">{resolveTxNumber(tx) || 'Receipt'}</p>
                            <p className="text-[10px] text-gray-500 tabular-nums">
                                {formatMoney(resolveTxTotal(tx))} · {formatTxWhen(tx)}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
                    {selected ? (
                        <>
                            <div>
                                <p className="text-sm font-bold">{resolveTxNumber(selected)}</p>
                                <p className="text-lg font-bold text-emerald-600 tabular-nums">
                                    {formatMoney(resolveTxTotal(selected))}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatTxWhen(selected)}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-gray-600">Reason</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {VOID_REASONS.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setReason(r)}
                                            className={cn(
                                                'px-2.5 py-1 rounded-lg text-[10px] font-bold border',
                                                reason === r
                                                    ? 'border-slate-800 bg-slate-900 text-white'
                                                    : 'border-gray-200 text-gray-600'
                                            )}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                                {reason === 'Other' && (
                                    <Input
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Describe reason…"
                                        className="h-9 text-xs"
                                    />
                                )}
                            </div>
                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                onClick={handleVoid}
                            >
                                {submitting ? 'Voiding…' : 'Void Transaction'}
                            </Button>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400 py-8 text-center">Select a transaction to void</p>
                    )}
                </div>
            </div>
        </div>
    );
}

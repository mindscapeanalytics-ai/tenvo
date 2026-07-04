'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bitcoin, Copy, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PLAN_TIERS } from '@/lib/config/plans';
import useSubscription from '@/lib/hooks/useSubscription';

const PAID_TIERS = Object.keys(PLAN_TIERS).filter((k) => k !== 'free' && k !== 'enterprise');

const CRYPTO_OPTIONS = [
  { code: 'usdt', label: 'USDT' },
  { code: 'btc', label: 'Bitcoin (BTC)' },
  { code: 'eth', label: 'Ethereum (ETH)' },
  { code: 'ltc', label: 'Litecoin (LTC)' },
];

/**
 * SaaS billing — pay subscription with cryptocurrency (NOWPayments).
 * Amounts follow the same catalog as Stripe dynamic pricing.
 */
export default function CryptoBillingPanel({ onActivated }) {
  const { createCryptoPayment, checkCryptoPaymentStatus } = useSubscription();
  const [configured, setConfigured] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [planTier, setPlanTier] = useState('business');
  const [cryptoCurrency, setCryptoCurrency] = useState('usdt');
  const [currency, setCurrency] = useState('usd');
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/billing/crypto/config');
        if (res.ok) {
          const data = await res.json();
          setConfigured(Boolean(data.configured));
        }
      } finally {
        setLoadingConfig(false);
      }
    })();
  }, []);

  const amountMajor = useMemo(() => {
    const tier = PLAN_TIERS[planTier];
    if (!tier) return null;
    return currency === 'usd' ? tier.price_usd : tier.price_pkr;
  }, [planTier, currency]);

  const startPayment = useCallback(async () => {
    if (!amountMajor) {
      toast.error('Select a paid plan');
      return;
    }
    setBusy(true);
    try {
      const data = await createCryptoPayment({
        amount: amountMajor,
        currency,
        cryptoCurrency,
        planTier,
      });
      setPayment(data);
      toast.success('Send the exact crypto amount to the address below');
    } catch {
      // toast handled in hook
    } finally {
      setBusy(false);
    }
  }, [amountMajor, createCryptoPayment, cryptoCurrency, currency, planTier]);

  const pollStatus = useCallback(async () => {
    if (!payment?.paymentId) return;
    setPolling(true);
    try {
      const status = await checkCryptoPaymentStatus(payment.paymentId);
      const normalized = String(status || '').toLowerCase();
      if (['confirmed', 'finished', 'paid', 'complete'].includes(normalized)) {
        toast.success('Payment confirmed — your plan is activating');
        setPayment(null);
        onActivated?.();
      } else {
        toast('Payment still pending on the network', { icon: '⏳' });
      }
    } finally {
      setPolling(false);
    }
  }, [checkCryptoPaymentStatus, onActivated, payment?.paymentId]);

  const copyAddress = async () => {
    if (!payment?.payAddress) return;
    try {
      await navigator.clipboard.writeText(payment.payAddress);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy address');
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking crypto billing…
      </div>
    );
  }

  if (!configured) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Bitcoin className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-950">Pay with cryptocurrency</p>
          <p className="text-xs text-amber-900/70 mt-1">
            Same plan prices as Stripe checkout (dynamic catalog). BTC, ETH, USDT and 100+ coins via NOWPayments.
          </p>
        </div>
      </div>

      {!payment ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Plan</Label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {PAID_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {PLAN_TIERS[tier].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Invoice currency</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="usd">USD</option>
              <option value="pkr">PKR</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Pay with</Label>
            <select
              value={cryptoCurrency}
              onChange={(e) => setCryptoCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {CRYPTO_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              Total: {currency.toUpperCase()} {amountMajor}
            </p>
            <Button
              type="button"
              onClick={startPayment}
              disabled={busy}
              className="rounded-xl bg-amber-600 hover:bg-amber-700"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bitcoin className="w-4 h-4 mr-2" />}
              Create crypto invoice
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-amber-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Send payment</p>
          <p className="text-sm text-slate-700">
            Send exactly{' '}
            <span className="font-bold tabular-nums">
              {payment.payAmount} {String(payment.payCurrency || '').toUpperCase()}
            </span>{' '}
            to:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 rounded-lg bg-slate-50 border px-3 py-2 text-xs break-all">
              {payment.payAddress}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copyAddress} className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Payment ID: {payment.paymentId}. We will activate your plan automatically once the network confirms.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={pollStatus}
              disabled={polling}
              className="rounded-xl"
            >
              {polling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Check status
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPayment(null)} className="rounded-xl">
              New payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

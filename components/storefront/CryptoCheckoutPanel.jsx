'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bitcoin, Copy, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const CRYPTO_OPTIONS = [
  { code: 'usdt', label: 'USDT' },
  { code: 'btc', label: 'Bitcoin (BTC)' },
  { code: 'eth', label: 'Ethereum (ETH)' },
];

/**
 * Storefront checkout — pay order with NOWPayments after order is created.
 */
export function CryptoCheckoutPanel({
  businessDomain,
  orderNumber,
  customerEmail,
  accent,
  onPaid,
  onCancel,
}) {
  const [cryptoCurrency, setCryptoCurrency] = useState('usdt');
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [payment, setPayment] = useState(null);
  const [paid, setPaid] = useState(false);
  const startedRef = useRef(false);

  const createPayment = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/storefront/${businessDomain}/crypto/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, cryptoCurrency }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create crypto payment');
      }
      setPayment(data);
      toast.success('Send the exact amount to the address below');
    } catch (err) {
      toast.error(err.message || 'Crypto payment failed');
    } finally {
      setBusy(false);
    }
  }, [businessDomain, cryptoCurrency, orderNumber]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void createPayment();
  }, [createPayment]);

  const pollStatus = useCallback(async () => {
    if (!payment?.paymentId && !orderNumber) return;
    setPolling(true);
    try {
      const qs = new URLSearchParams({
        paymentId: payment?.paymentId || '',
        orderNumber,
        email: customerEmail,
      });
      const res = await fetch(`/api/storefront/${businessDomain}/crypto/status?${qs}`);
      const data = await res.json();
      if (data.isCompleted || data.orderPaymentStatus === 'paid') {
        setPaid(true);
        toast.success('Payment confirmed!');
        onPaid?.();
      } else {
        toast('Still waiting for blockchain confirmation', { icon: '⏳' });
      }
    } catch {
      toast.error('Could not check payment status');
    } finally {
      setPolling(false);
    }
  }, [businessDomain, customerEmail, onPaid, orderNumber, payment?.paymentId]);

  useEffect(() => {
    if (!payment?.paymentId || paid) return undefined;
    const id = setInterval(() => {
      void pollStatus();
    }, 20000);
    return () => clearInterval(id);
  }, [paid, payment?.paymentId, pollStatus]);

  const copyAddress = async () => {
    if (!payment?.payAddress) return;
    try {
      await navigator.clipboard.writeText(payment.payAddress);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  if (paid) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" />
        <h2 className="text-xl font-semibold text-gray-900">Payment received</h2>
        <p className="text-sm text-gray-500 mt-2">Order #{orderNumber} is confirmed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bitcoin className="w-5 h-5" style={{ color: accent }} />
        <h2 className="text-lg font-bold text-gray-900">Pay with cryptocurrency</h2>
      </div>
      <p className="text-sm text-gray-600">
        Order <span className="font-semibold">#{orderNumber}</span> — send the exact amount below. Digital products
        are delivered after network confirmation.
      </p>

      {!payment ? (
        <div className="space-y-3">
          <select
            value={cryptoCurrency}
            onChange={(e) => setCryptoCurrency(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            disabled={busy}
          >
            {CRYPTO_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <Button
            onClick={createPayment}
            disabled={busy}
            className="w-full rounded-xl font-bold"
            style={{ backgroundColor: accent }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generate payment address
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
          <p className="text-sm">
            Send{' '}
            <span className="font-bold tabular-nums">
              {payment.payAmount} {String(payment.payCurrency || '').toUpperCase()}
            </span>
          </p>
          <div className="flex gap-2">
            <code className="flex-1 rounded-lg bg-white border px-3 py-2 text-xs break-all">
              {payment.payAddress}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={pollStatus} disabled={polling} className="rounded-xl">
              {polling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Check status
            </Button>
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * NowPayments Integration for Cryptocurrency Payments
 * Supports Bitcoin, Ethereum, USDT, and 100+ cryptocurrencies
 */

import crypto from 'crypto';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// Lazy initialization (API key only; IPN secret is read fresh each call — see getCredentials)
let apiKey = null;

/** IPN signing secret from NOWPayments dashboard (IPN settings). Supports common env aliases. */
function resolveIpnSecret() {
  const raw =
    process.env.NOWPAYMENTS_IPN_SECRET?.trim() ||
    process.env.NOWPAYMENTS_SECRET?.trim() ||
    process.env.NOWPAYMENTS_SECRATE?.trim() ||
    process.env.NOWPAYMENTS_IPN_SECRECT?.trim();
  return raw || null;
}

function getCredentials() {
  if (!apiKey && process.env.NOWPAYMENTS_API_KEY) {
    // Handle the duplicate key format in the .env file
    const keyValue = process.env.NOWPAYMENTS_API_KEY;
    if (keyValue.includes('=')) {
      // Format: NOWPAYMENTS_API_KEY=T7E4DMN-5J94N44-GG1KYBT-K3A0K0V
      apiKey = keyValue.split('=').pop().trim();
    } else {
      apiKey = keyValue.trim();
    }
  }
  return { apiKey, ipnSecret: resolveIpnSecret() };
}

/** True when API key is present (crypto checkout can be offered). */
export function isNowPaymentsConfigured() {
  return Boolean(getCredentials().apiKey);
}

/**
 * Recursively sort object keys (NOWPayments IPN spec).
 * @param {unknown} value
 */
function sortIpnPayload(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortIpnPayload(value[key]);
      return acc;
    }, {});
}

/**
 * Make authenticated request to NowPayments API
 */
async function makeRequest(endpoint, options = {}) {
  const { apiKey } = getCredentials();
  
  if (!apiKey) {
    console.log('[NowPayments] Not configured, skipping request');
    return { skipped: true };
  }

  const url = `${NOWPAYMENTS_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NowPayments API error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[NowPayments] Request error:', error);
    throw error;
  }
}

/**
 * Get available payment currencies
 */
export async function getCurrencies() {
  try {
    const data = await makeRequest('/currencies');
    return data.currencies || [];
  } catch (error) {
    console.error('[NowPayments] Get currencies error:', error);
    return [];
  }
}

/**
 * Get estimated price in cryptocurrency
 */
export async function getEstimatedPrice({ amount, currencyFrom = 'usd', currencyTo = 'btc' }) {
  try {
    const data = await makeRequest(`/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`);
    return {
      estimatedAmount: data.estimated_amount,
      currencyFrom: data.currency_from,
      currencyTo: data.currency_to,
    };
  } catch (error) {
    console.error('[NowPayments] Get estimate error:', error);
    return null;
  }
}

/**
 * Create a payment invoice
 */
export async function createPayment({
  priceAmount,
  priceCurrency = 'usd',
  payCurrency = 'btc',
  orderId,
  orderDescription,
  customerEmail,
  customerName,
  callbackUrl,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  try {
    const body = {
      price_amount: priceAmount,
      price_currency: priceCurrency.toLowerCase(),
      pay_currency: payCurrency.toLowerCase(),
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: callbackUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      ...(customerName && { customer_name: customerName }),
      ...metadata,
    };

    const data = await makeRequest('/payment', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (data.skipped) {
      return { skipped: true };
    }

    return {
      paymentId: data.payment_id,
      paymentStatus: data.payment_status,
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      priceAmount: data.price_amount,
      priceCurrency: data.price_currency,
      expirationEstimateDate: data.expiration_estimate_date,
      orderId: data.order_id,
    };
  } catch (error) {
    console.error('[NowPayments] Create payment error:', error);
    throw error;
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentId) {
  try {
    const data = await makeRequest(`/payment/${paymentId}`);
    return {
      paymentId: data.payment_id,
      paymentStatus: data.payment_status,
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      actuallyPaid: data.actually_paid,
      payCurrency: data.pay_currency,
      priceAmount: data.price_amount,
      priceCurrency: data.price_currency,
      orderId: data.order_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[NowPayments] Get payment status error:', error);
    return null;
  }
}

/**
 * Verify IPN (Instant Payment Notification) signature.
 * @see https://documenter.getpostman.com/view/7907941/S1a32n38 — sort keys, JSON.stringify, HMAC-SHA512
 */
export function verifyIPN(payload, signature) {
  const { ipnSecret } = getCredentials();

  if (!ipnSecret) {
    console.warn('[NowPayments] IPN secret not configured');
    return process.env.NODE_ENV !== 'production';
  }

  if (!signature) return false;

  try {
    const sorted = sortIpnPayload(payload);
    const sortedJson = JSON.stringify(sorted);
    const computedSignature = crypto
      .createHmac('sha512', ipnSecret.trim())
      .update(sortedJson)
      .digest('hex');

    const received = String(signature).trim();
    if (computedSignature.length !== received.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(received, 'utf8')
    );
  } catch (error) {
    console.error('[NowPayments] IPN verification error:', error);
    return false;
  }
}

/**
 * Handle IPN callback
 */
export async function handleIPN(payload) {
  const { payment_id, payment_status, order_id, actually_paid } = payload;

  console.log('[NowPayments] IPN received:', {
    paymentId: payment_id,
    status: payment_status,
    orderId: order_id,
    paid: actually_paid,
  });

  // Payment status flow:
  // waiting -> confirming -> confirmed -> finished
  // or waiting -> confirmed -> failed
  
  const status = payment_status.toLowerCase();
  
  return {
    paymentId: payment_id,
    orderId: order_id,
    status,
    isCompleted: ['confirmed', 'finished'].includes(status),
    isFailed: status === 'failed',
    amount: actually_paid,
    raw: payload,
  };
}

/**
 * Get minimum payment amount for a currency
 */
export async function getMinimumPaymentAmount(currencyFrom = 'usd', currencyTo = 'btc') {
  try {
    const data = await makeRequest(`/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`);
    return {
      minAmount: data.min_amount,
      currencyFrom: data.currency_from,
      currencyTo: data.currency_to,
    };
  } catch (error) {
    console.error('[NowPayments] Get min amount error:', error);
    return null;
  }
}

/**
 * Get exchange rate
 */
export async function getExchangeRate(currencyFrom = 'usd', currencyTo = 'btc') {
  try {
    const data = await makeRequest(`/estimate?amount=1&currency_from=${currencyFrom}&currency_to=${currencyTo}`);
    return {
      rate: data.estimated_amount,
      currencyFrom: data.currency_from,
      currencyTo: data.currency_to,
    };
  } catch (error) {
    console.error('[NowPayments] Get exchange rate error:', error);
    return null;
  }
}

// Supported cryptocurrencies for Tenvo
export const SUPPORTED_CRYPTO = [
  { code: 'btc', name: 'Bitcoin', icon: 'Bitcoin', network: 'bitcoin' },
  { code: 'eth', name: 'Ethereum', icon: 'Ethereum', network: 'ethereum' },
  { code: 'usdt', name: 'Tether (USDT)', icon: 'DollarSign', network: 'ethereum' },
  { code: 'usdc', name: 'USD Coin', icon: 'DollarSign', network: 'ethereum' },
  { code: 'ltc', name: 'Litecoin', icon: 'Bitcoin', network: 'litecoin' },
  { code: 'doge', name: 'Dogecoin', icon: 'Dog', network: 'dogecoin' },
  { code: 'bnb', name: 'BNB', icon: 'Coins', network: 'bsc' },
  { code: 'sol', name: 'Solana', icon: 'Sun', network: 'solana' },
  { code: 'xrp', name: 'Ripple', icon: 'Repeat', network: 'ripple' },
  { code: 'trx', name: 'TRON', icon: 'Zap', network: 'tron' },
];

export default {
  isNowPaymentsConfigured,
  getCurrencies,
  getEstimatedPrice,
  createPayment,
  getPaymentStatus,
  verifyIPN,
  handleIPN,
  getMinimumPaymentAmount,
  getExchangeRate,
  SUPPORTED_CRYPTO,
};

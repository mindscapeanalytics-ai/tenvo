/**
 * Pakistani Payment Gateways Integration
 * Supports JazzCash, Easypaisa, PayFast, and local bank transfers
 */

export const pakistaniPaymentGateways = {
  jazzcash: {
    name: 'JazzCash',
    id: 'jazzcash',
    icon: '📱',
    enabled: true,
    features: [
      'Wallet payments',
      'Mobile account linking',
      'QR code payments',
      'Bill payments',
      'Instant transfers',
    ],
    supportedMethods: ['wallet', 'qr', 'mobile'],
    fees: {
      wallet: 0, // No fees for wallet-to-wallet
      merchant: 0.025, // 2.5% merchant fee
    },
    apiEndpoint: 'https://sandbox.jazzcash.com.pk',
    documentation: 'https://developer.jazzcash.com.pk',
  },
  easypaisa: {
    name: 'Easypaisa',
    id: 'easypaisa',
    icon: '💳',
    enabled: true,
    features: [
      'Mobile wallet',
      'QR payments',
      'Bill payments',
      'Bank transfers',
      'Cash deposits',
    ],
    supportedMethods: ['wallet', 'qr', 'mobile', 'bank'],
    fees: {
      wallet: 0,
      merchant: 0.025,
    },
    apiEndpoint: 'https://easypay.easypaisa.com.pk',
    documentation: 'https://developer.easypaisa.com.pk',
  },
  payfast: {
    name: 'PayFast',
    id: 'payfast',
    icon: '⚡',
    enabled: true,
    features: [
      'Online payments',
      'Credit/Debit cards',
      'Bank transfers',
      'Recurring payments',
      'Payment links',
    ],
    supportedMethods: ['card', 'bank', 'link'],
    fees: {
      card: 0.025,
      bank: 0.015,
      link: 0.02,
    },
    apiEndpoint: 'https://api.payfast.pk',
    documentation: 'https://developer.payfast.pk',
  },
  bankTransfer: {
    name: 'Bank Transfer',
    id: 'bank_transfer',
    icon: '🏦',
    enabled: true,
    features: [
      'HBL transfers',
      'UBL transfers',
      'MCB transfers',
      'Allied Bank',
      'Bank Al Habib',
      'Meezan Bank',
    ],
    supportedBanks: [
      { code: 'HBL', name: 'Habib Bank Limited' },
      { code: 'UBL', name: 'United Bank Limited' },
      { code: 'MCB', name: 'MCB Bank' },
      { code: 'ABL', name: 'Allied Bank Limited' },
      { code: 'BAH', name: 'Bank Al Habib' },
      { code: 'MEZ', name: 'Meezan Bank' },
      { code: 'ASK', name: 'Askari Bank' },
      { code: 'NBP', name: 'National Bank of Pakistan' },
    ],
    fees: {
      interbank: 0, // Free interbank transfers
      merchant: 0,
    },
  },
  cod: {
    name: 'Cash on Delivery',
    id: 'cod',
    icon: '💵',
    enabled: true,
    features: [
      'Cash payment on delivery',
      'No online payment required',
      'Common in Pakistan',
    ],
    supportedMethods: ['cash'],
    fees: {
      cash: 0,
      delivery: 0, // Delivery charges may apply
    },
    requiresDelivery: true,
  },
};

/**
 * Get payment gateway by ID
 */
export function getPaymentGateway(gatewayId) {
  return pakistaniPaymentGateways[gatewayId] || null;
}

/**
 * Get all enabled payment gateways
 */
export function getEnabledGateways() {
  return Object.values(pakistaniPaymentGateways).filter(g => g.enabled);
}

/**
 * Calculate payment fees
 */
export function calculatePaymentFees(amount, gatewayId, method = 'default') {
  const gateway = getPaymentGateway(gatewayId);
  if (!gateway) return 0;

  const feeRate = gateway.fees[method] || gateway.fees.merchant || 0;
  return amount * feeRate;
}

/**
 * Format payment gateway name for display
 */
export function formatGatewayName(gatewayId) {
  const gateway = getPaymentGateway(gatewayId);
  return gateway ? `${gateway.icon} ${gateway.name}` : gatewayId;
}

/**
 * Check if gateway supports a payment method
 */
export function supportsMethod(gatewayId, method) {
  const gateway = getPaymentGateway(gatewayId);
  if (!gateway) return false;
  return gateway.supportedMethods?.includes(method) || false;
}



'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEnabledGateways, formatGatewayName, supportsMethod } from '@/lib/payment/pakistaniGateways';
import { formatCurrency } from '../../lib/currency';

/**
 * Pakistani Payment Gateway Selector
 * Allows selection of Pakistani payment methods
 */
export function PakistaniPaymentSelector({
  selectedGateway,
  onSelect,
  amount = 0,
  showCOD = true,
}) {
  const gateways = getEnabledGateways();
  const [selected, setSelected] = useState(selectedGateway || null);

  const handleSelect = (gatewayId) => {
    setSelected(gatewayId);
    onSelect?.(gatewayId);
  };

  const getGatewayIcon = (gatewayId) => {
    const icons = {
      jazzcash: <Smartphone className="w-5 h-5" />,
      easypaisa: <Wallet className="w-5 h-5" />,
      payfast: <CreditCard className="w-5 h-5" />,
      bank_transfer: <Building2 className="w-5 h-5" />,
      cod: <Truck className="w-5 h-5" />,
    };
    return icons[gatewayId] || <CreditCard className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
        <p className="text-sm text-gray-500">Select your preferred payment method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gateways
          .filter(g => showCOD || g.id !== 'cod')
          .map((gateway) => (
            <Card
              key={gateway.id}
              className={`cursor-pointer transition-all hover:border-blue-500 ${selected === gateway.id ? 'border-blue-500 border-2' : ''
                }`}
              onClick={() => handleSelect(gateway.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getGatewayIcon(gateway.id)}
                    <CardTitle className="text-base">{gateway.name}</CardTitle>
                  </div>
                  {selected === gateway.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {gateway.features.slice(0, 2).join(', ')}
                </CardDescription>
              </CardHeader>
              {gateway.id === 'cod' && (
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Pay cash when your order is delivered
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      {selected && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Selected:</span>
            <span>{formatGatewayName(selected)}</span>
          </div>
          {amount > 0 && (
            <div className="text-sm text-gray-600">
              Amount: {formatCurrency(amount, 'PKR')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



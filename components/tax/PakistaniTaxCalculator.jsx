'use client';

import { useState } from 'react';
import { Calculator, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculatePakistaniTax, getTaxCategoryForDomain } from '@/lib/tax/pakistaniTax';
import { formatCurrency } from '@/lib/currency';

/**
 * Pakistani Tax Calculator Component
 * Calculates FBR-compliant taxes for invoices
 */
export function PakistaniTaxCalculator({
  amount = 0,
  category = 'retail-standard',
  province = 'punjab',
  domain = 'retail-shop',
  onCalculate,
}) {
  const [baseAmount, setBaseAmount] = useState(amount);
  const [taxCategory, setTaxCategory] = useState(category || getTaxCategoryForDomain(domain));
  const [selectedProvince, setSelectedProvince] = useState(province);

  const provinces = [
    { value: 'punjab', label: 'Punjab' },
    { value: 'sindh', label: 'Sindh' },
    { value: 'kp', label: 'Khyber Pakhtunkhwa' },
    { value: 'balochistan', label: 'Balochistan' },
    { value: 'islamabad', label: 'Islamabad (Federal)' },
  ];

  const taxCategories = [
    { value: 'retail-standard', label: 'Retail Standard (18%)' },
    { value: 'retail-reduced', label: 'Retail Reduced (10%)' },
    { value: 'retail-exempt', label: 'Retail Exempt (0%)' },
    { value: 'food-essential', label: 'Food Essential (0%)' },
    { value: 'food-processed', label: 'Food Processed (18%)' },
    { value: 'pharma-essential', label: 'Pharma Essential (0%)' },
    { value: 'pharma-standard', label: 'Pharma Standard (18%)' },
    { value: 'electronics-standard', label: 'Electronics Standard (18%)' },
  ];

  const taxBreakdown = calculatePakistaniTax(
    parseFloat(baseAmount) || 0,
    taxCategory,
    selectedProvince
  );

  const handleCalculate = () => {
    if (onCalculate) {
      onCalculate(taxBreakdown);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          <CardTitle>Pakistani Tax Calculator</CardTitle>
        </div>
        <CardDescription>FBR-compliant tax calculation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Amount (PKR)</Label>
            <Input
              type="number"
              value={baseAmount || ''}
              onChange={(e) => setBaseAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Province</Label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {provinces.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tax Category</Label>
            <select
              value={taxCategory}
              onChange={(e) => setTaxCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {taxCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Base Amount:</span>
            <span className="font-semibold">{formatCurrency(taxBreakdown.baseAmount, 'PKR')}</span>
          </div>

          {taxBreakdown.breakdown.federal.amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Federal Sales Tax ({taxBreakdown.breakdown.federal.rate * 100}%):</span>
              <span>{formatCurrency(taxBreakdown.breakdown.federal.amount, 'PKR')}</span>
            </div>
          )}

          {taxBreakdown.breakdown.provincial.applicable && taxBreakdown.breakdown.provincial.amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Provincial Tax ({taxBreakdown.breakdown.provincial.rate * 100}%):</span>
              <span>{formatCurrency(taxBreakdown.breakdown.provincial.amount, 'PKR')}</span>
            </div>
          )}

          {taxBreakdown.breakdown.wht.amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Withholding Tax ({taxBreakdown.breakdown.wht.rate * 100}%):</span>
              <span>{formatCurrency(taxBreakdown.breakdown.wht.amount, 'PKR')}</span>
            </div>
          )}

          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-medium">Total Tax:</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(taxBreakdown.totalTax, 'PKR')}
            </span>
          </div>

          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-lg font-bold">Grand Total:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(taxBreakdown.totalAmount, 'PKR')}
            </span>
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <Receipt className="w-4 h-4 mr-2" />
          Use This Calculation
        </Button>
      </CardContent>
    </Card>
  );
}



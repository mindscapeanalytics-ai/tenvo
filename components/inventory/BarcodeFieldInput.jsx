'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { BarcodeScanTrigger } from '@/components/inventory/BarcodeScanTrigger';
import { isValidGtinFormat } from '@/lib/utils/barcodeUtils';
import { checkBarcodeExistsAction } from '@/lib/actions/standard/inventory/validation';
import { cn } from '@/lib/utils';

/**
 * Barcode field with camera scan, wedge-friendly input, and optional uniqueness check.
 */
export function BarcodeFieldInput({
  id = 'barcode',
  value = '',
  onChange,
  businessId = null,
  excludeProductId = null,
  business = null,
  placeholder = 'Scan or type barcode',
  className = '',
  inputClassName = 'h-9 rounded-md pr-10',
  onValidated,
  showCamera = true,
  validateUnique = true,
  validateGtin = true,
}) {
  const [warning, setWarning] = useState('');
  const debounceRef = useRef(null);

  const handleScan = useCallback(
    (code) => {
      onChange?.(code);
    },
    [onChange]
  );

  const runValidation = useCallback(
    async (nextValue) => {
      const trimmed = String(nextValue || '').trim();
      if (!trimmed) {
        setWarning('');
        onValidated?.({ valid: true });
        return;
      }

      if (validateGtin && !isValidGtinFormat(trimmed)) {
        setWarning('Check digit may be invalid for this GTIN/EAN');
        onValidated?.({ valid: true, warning: 'invalid_checksum' });
      } else {
        setWarning('');
      }

      if (!validateUnique || !businessId || trimmed.length < 3) {
        onValidated?.({ valid: true });
        return;
      }

      try {
        const result = await checkBarcodeExistsAction(trimmed, businessId, excludeProductId);
        if (result.exists) {
          setWarning('This barcode is already used by another product');
          onValidated?.({ valid: false, error: 'duplicate' });
        } else {
          onValidated?.({ valid: true });
        }
      } catch {
        onValidated?.({ valid: true });
      }
    },
    [businessId, excludeProductId, onValidated, validateGtin, validateUnique]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runValidation(value);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runValidation]);

  return (
    <div className={cn('relative min-w-0', className)}>
      <Input
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClassName, showCamera && 'pr-10')}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {showCamera && (
        <div className="pointer-events-auto absolute inset-y-0 right-1 flex items-center">
          <BarcodeScanTrigger
            business={business}
            onScan={handleScan}
            title="Scan product barcode"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-emerald-600 hover:bg-emerald-50"
          />
        </div>
      )}
      {warning && (
        <p
          className={cn(
            'mt-1 text-[10px] font-medium',
            warning.includes('already used') ? 'text-red-600' : 'text-amber-700'
          )}
        >
          {warning}
        </p>
      )}
    </div>
  );
}

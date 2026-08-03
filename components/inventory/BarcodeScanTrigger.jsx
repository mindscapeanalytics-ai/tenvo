'use client';

import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PosCameraScanner } from '@/components/pos/shared/PosCameraScanner';
import { canUseBarcodeScan } from '@/lib/utils/barcodeAccess';

/**
 * Compact scan button that opens PosCameraScanner (mobile + desktop).
 */
export function BarcodeScanTrigger({
  onScan,
  business = null,
  title = 'Scan barcode',
  hint,
  className = '',
  size = 'icon',
  variant = 'outline',
  label,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const allowed = canUseBarcodeScan(business);

  if (!allowed) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={label || title}
        title={label || title}
      >
        <ScanLine className={size === 'icon' ? 'h-4 w-4' : 'mr-1.5 h-4 w-4'} />
        {label && size !== 'icon' ? label : null}
      </Button>

      <PosCameraScanner
        open={open}
        onClose={() => setOpen(false)}
        onScan={(code) => {
          onScan?.(code);
          setOpen(false);
        }}
        title={title}
        hint={
          hint ||
          'QR, EAN-13, UPC-A, Code 128 · USB wedge scanners work in any search field'
        }
      />
    </>
  );
}

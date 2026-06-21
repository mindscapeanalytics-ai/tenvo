'use client';

import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';

const SIZE_CLASS = {
  xs: 'h-7 w-7 rounded-md',
  sm: 'h-8 w-8 rounded-md',
  md: 'h-10 w-10 rounded-lg',
  lg: 'aspect-square w-full rounded-lg',
  cart: 'h-10 w-10 shrink-0 rounded-lg',
};

/**
 * Hub + POS product image with merchant upload priority and category-aware fallback.
 */
export function ProductThumbnail({
  product,
  businessCategory,
  alt,
  className,
  imgClassName,
  size = 'sm',
  showPlaceholderIcon = true,
}) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(
    () => getEffectiveProductImageUrl(product, businessCategory),
    [product, businessCategory]
  );

  const label = alt || product?.name || 'Product';
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.sm;
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100',
        sizeClass,
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => setFailed(true)}
        />
      ) : showPlaceholderIcon ? (
        <div className="flex h-full w-full items-center justify-center text-neutral-300">
          <Package className={cn(size === 'lg' ? 'h-8 w-8' : 'h-3.5 w-3.5')} aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

export default ProductThumbnail;

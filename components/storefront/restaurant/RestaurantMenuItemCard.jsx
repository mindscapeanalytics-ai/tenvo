'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Package } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { catalogProductNeedsVariantPage } from '@/lib/storefront/storefrontProductVariants';
import { isPurchasableStorefrontProduct, resolveStorefrontProductBrowseHref } from '@/lib/storefront/storefrontPurchasability';
import { RESTAURANT_MENU_THEME } from '@/lib/storefront/restaurantMenu';
import { toast } from 'react-hot-toast';

function useRestaurantMenuLine(product, businessDomain) {
  const { cart, addItem, updateQuantity } = useCart();
  const { business, businessId } = useStorefront();
  const [isBusy, setIsBusy] = useState(false);

  const line = cart?.items?.find(
    (item) => item.productId === product.id && (item.variantId == null || item.variantId === '')
  );
  const qty = line?.quantity || 0;
  const maxQty = line?.maxQuantity;
  const isOutOfStock =
    product.stock !== null && product.stock !== undefined && Number(product.stock) <= 0;
  const productHref = resolveStorefrontProductBrowseHref(product, businessDomain);
  const needsVariantPage = catalogProductNeedsVariantPage(product);
  const isPreviewProduct = !isPurchasableStorefrontProduct(product);

  const bump = async (delta) => {
    if (isOutOfStock || isBusy) return;
    if (isPreviewProduct) {
      toast.error('Browse the full menu to order this item');
      window.location.href = `/store/${businessDomain}/products`;
      return;
    }
    if (needsVariantPage) {
      window.location.href = productHref;
      return;
    }

    const next = qty + delta;
    if (next <= 0) {
      updateQuantity(product.id, null, 0);
      return;
    }
    if (maxQty != null && next > maxQty) {
      toast.error(`Only ${maxQty} available`);
      return;
    }

    setIsBusy(true);
    try {
      if (delta > 0) {
        await addItem({
          productId: product.id,
          quantity: delta,
          variantId: null,
          businessId,
        });
        if (qty === 0) {
          toast.success('Added to bag', { duration: 1400 });
        }
      } else {
        updateQuantity(product.id, null, next);
      }
    } catch (err) {
      const message = err.message || 'Could not update item';
      if (/variant|options|size/i.test(message)) {
        window.location.href = productHref;
        return;
      }
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  return {
    qty,
    isBusy,
    isOutOfStock,
    productHref,
    imageUrl: getEffectiveProductImageUrl(product, business?.category),
    bump,
  };
}

/**
 * Light-theme menu card — image, name, price, quick add / qty stepper.
 * Stays on the menu for multi-item ordering (does not open the cart drawer).
 */
export function RestaurantMenuItemCard({ product, businessDomain, accent, className }) {
  const { currency } = useStorefront();
  const {
    qty,
    isBusy,
    isOutOfStock,
    productHref,
    imageUrl,
    bump,
  } = useRestaurantMenuLine(product, businessDomain);

  const comparePrice = product.compare_price ?? product.compare_at_price;
  const onSale = comparePrice && Number(comparePrice) > Number(product.price);
  const ctaColor = accent || RESTAURANT_MENU_THEME.cartCta;

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white',
        'shadow-sm motion-safe:transition motion-safe:duration-200',
        'motion-safe:hover:border-zinc-300 motion-safe:hover:shadow-md',
        isOutOfStock && 'opacity-55',
        className
      )}
    >
      <Link href={productHref} className="relative block aspect-square overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <SmartProductImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100">
            <Package className="h-8 w-8 text-zinc-300" aria-hidden />
          </div>
        )}
        {qty > 0 ? (
          <span
            className="absolute left-1.5 top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: ctaColor }}
            aria-hidden
          >
            {qty}
          </span>
        ) : null}
      </Link>

      <div className="border-t border-zinc-100 p-2 sm:p-2.5">
        <Link href={productHref}>
          <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-snug text-zinc-900 sm:text-[13px]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-sm font-semibold tabular-nums text-zinc-900">
              {formatCurrency(product.price, currency)}
            </span>
            {onSale ? (
              <span className="ml-1 text-[10px] text-zinc-400 line-through tabular-nums">
                {formatCurrency(comparePrice, currency)}
              </span>
            ) : null}
          </div>
          {!isOutOfStock ? (
            qty > 0 ? (
              <div
                className="inline-flex h-8 items-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: ctaColor }}
                role="group"
                aria-label={`Quantity for ${product.name}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    bump(-1);
                  }}
                  disabled={isBusy}
                  className="flex h-8 w-7 items-center justify-center rounded-l-full disabled:opacity-60"
                  aria-label={`Remove one ${product.name}`}
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </button>
                <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    bump(1);
                  }}
                  disabled={isBusy}
                  className="flex h-8 w-7 items-center justify-center rounded-r-full disabled:opacity-60"
                  aria-label={`Add another ${product.name}`}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  bump(1);
                }}
                disabled={isBusy}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm motion-safe:transition motion-safe:hover:scale-105 active:scale-95 disabled:opacity-60 sm:h-8 sm:w-8"
                style={{ backgroundColor: ctaColor }}
                aria-label={`Add ${product.name} to bag`}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </button>
            )
          ) : (
            <span className="text-[10px] font-medium text-zinc-400">Sold out</span>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Compact list row for menu list view — same quiet multi-add + stepper UX.
 */
export function RestaurantMenuListItem({ product, businessDomain, accent }) {
  const { currency } = useStorefront();
  const {
    qty,
    isBusy,
    isOutOfStock,
    productHref,
    imageUrl,
    bump,
  } = useRestaurantMenuLine(product, businessDomain);

  const ctaColor = accent || RESTAURANT_MENU_THEME.cartCta;

  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/90 bg-white p-2.5 motion-safe:transition hover:border-zinc-300 hover:shadow-sm sm:gap-3.5 sm:p-3">
      <Link href={productHref} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 sm:h-[72px] sm:w-[72px]">
        {imageUrl ? (
          <SmartProductImage src={imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-zinc-300" />
          </div>
        )}
        {qty > 0 ? (
          <span
            className="absolute left-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-0.5 text-[9px] font-semibold text-white"
            style={{ backgroundColor: ctaColor }}
            aria-hidden
          >
            {qty}
          </span>
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {product.category_name ? (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {product.category_name}
            </p>
          ) : null}
          <Link href={productHref}>
            <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{product.name}</h3>
          </Link>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {formatCurrency(product.price, currency)}
          </span>
          {!isOutOfStock ? (
            qty > 0 ? (
              <div
                className="inline-flex h-8 items-center rounded-md text-white"
                style={{ backgroundColor: ctaColor }}
                role="group"
                aria-label={`Quantity for ${product.name}`}
              >
                <button
                  type="button"
                  onClick={() => bump(-1)}
                  disabled={isBusy}
                  className="flex h-8 w-8 items-center justify-center disabled:opacity-60"
                  aria-label={`Remove one ${product.name}`}
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => bump(1)}
                  disabled={isBusy}
                  className="flex h-8 w-8 items-center justify-center disabled:opacity-60"
                  aria-label={`Add another ${product.name}`}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bump(1)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: ctaColor }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add
              </button>
            )
          ) : (
            <span className="text-xs text-zinc-400">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}

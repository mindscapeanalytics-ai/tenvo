'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import {
  RESTAURANT_MENU_THEME,
  restaurantOrderModeToShipping,
} from '@/lib/storefront/restaurantMenu';
import { useRestaurantChromeOptional } from '@/components/storefront/restaurant/RestaurantChromeContext';
import { toast } from 'react-hot-toast';

/**
 * Food-app sticky bag bar — keep browsing while building a multi-item order,
 * then checkout in one tap. Hidden on cart/checkout and when the bag is empty.
 */
export function RestaurantStickyCartBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, calculateTotals, syncCartFromReconcile, hydrated, setIsOpen, isLoading } = useCart();
  const { currency, businessDomain, businessId } = useStorefront();
  const restaurantChrome = useRestaurantChromeOptional();
  const { subtotal, itemCount } = calculateTotals();

  const root = `/store/${businessDomain}`;
  const hideOnRoute =
    pathname.includes('/checkout') ||
    pathname.includes('/cart') ||
    pathname.includes('/account/login') ||
    pathname.includes('/account/register');

  const cartMismatch = Boolean(
    cart.businessId && businessId && cart.businessId !== businessId
  );

  if (!hydrated || hideOnRoute || itemCount <= 0) return null;

  const handleViewBag = () => {
    setIsOpen(true);
  };

  const handleCheckout = async () => {
    if (cartMismatch) {
      toast.error('Your cart has items from another store. Clear it to continue.');
      return;
    }
    try {
      const result = await syncCartFromReconcile(businessDomain);
      if (!result.ok) {
        toast.error(result.error || 'Some items are no longer available');
        return;
      }
    } catch (err) {
      toast.error(err.message || 'Could not validate your cart');
      return;
    }

    const params = new URLSearchParams();
    if (restaurantChrome?.orderMode) {
      params.set('mode', restaurantChrome.orderMode);
      params.set('shipping', restaurantOrderModeToShipping(restaurantChrome.orderMode));
    }
    const qs = params.toString();
    router.push(`${root}/checkout${qs ? `?${qs}` : ''}`);
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[55]',
        'bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-5'
      )}
      data-restaurant-sticky-cart
    >
      <div className="pointer-events-auto mx-auto w-full max-w-lg px-3 sm:max-w-xl sm:px-4 lg:max-w-2xl">
        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl border border-zinc-800/10 bg-zinc-900 p-1.5 pl-3',
            'shadow-[0_12px_40px_rgba(0,0,0,0.28)]',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'
          )}
          role="region"
          aria-label="Your order"
        >
          <button
            type="button"
            onClick={handleViewBag}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1.5 text-left transition hover:bg-white/5 active:scale-[0.99]"
            aria-label={`View bag, ${itemCount} items, ${formatCurrency(subtotal, currency)}`}
          >
            <span
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: RESTAURANT_MENU_THEME.cartCta }}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold tabular-nums text-zinc-900">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {itemCount === 1 ? '1 item' : `${itemCount} items`}
              </span>
              <span className="block truncate text-xs tabular-nums text-zinc-400">
                {formatCurrency(subtotal, currency)} · View bag
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isLoading || cartMismatch}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-white',
              'motion-safe:transition active:scale-[0.98] disabled:opacity-60'
            )}
            style={{ backgroundColor: RESTAURANT_MENU_THEME.cartCta }}
          >
            Checkout
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

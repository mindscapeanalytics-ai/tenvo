'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

/**
 * Package/bundle showcase grid — inspired by The Best Nails USA bundle cards.
 * Skewed discount badges, custom accent borders, strikethrough pricing, and quick-buy CTAs.
 *
 * Works for both jewelry gift sets and beauty starter kits/bundles.
 */
export function BeautyJewelleryBundleGrid({
  title = 'BUNDLES & SETS',
  subtitle = 'Save more with curated sets',
  products = [],
  businessDomain,
  accent = '#c9a227',
  currency = 'PKR',
  animations = true,
}) {
  if (!products.length) return null;

  const displayProducts = products.slice(0, 6);

  return (
    <section className="border-t border-stone-100 bg-gradient-to-br from-stone-50 to-white py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            Curated for You
          </p>
          <h2 className={cn(STORE_SECTION_HEADING, 'mt-1 text-stone-900')}>
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-lg text-sm text-stone-600 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayProducts.map((product, i) => {
            const href = `/store/${businessDomain}/products/${product.slug || product.id}`;
            const price = Number(product.price) || 0;
            const comparePrice = Number(product.compare_price) || 0;
            const onSale = comparePrice > price && price > 0;
            const discountPct = onSale
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : 0;

            return (
              <Link
                key={product.id}
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all hover:shadow-xl"
                style={{
                  borderColor: `${accent}25`,
                  ...(animations
                    ? { animationDelay: `${i * 80}ms`, animationFillMode: 'both' }
                    : {}),
                }}
              >
                {/* Discount badge — skewed */}
                {onSale && discountPct > 0 && (
                  <div
                    className="absolute left-0 top-5 z-20 -skew-y-2 px-4 py-1.5 text-white shadow-md"
                    style={{ backgroundColor: accent }}
                  >
                    <p className="text-[11px] font-black uppercase tracking-wider">
                      Save {discountPct}%
                    </p>
                  </div>
                )}

                {/* Accent glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]"
                  style={{
                    background: `radial-gradient(ellipse at 50% 30%, ${accent} 0%, transparent 70%)`,
                  }}
                />

                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-stone-100">
                  <SmartProductImage
                    src={product.image_url || product.images?.[0]?.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {product.brand && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: accent }}
                    >
                      {product.brand}
                    </p>
                  )}
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 group-hover:text-stone-700 sm:text-base">
                    {product.name}
                  </h3>

                  {/* Pricing */}
                  <div className="mt-auto flex items-baseline gap-2.5">
                    <span
                      className="text-lg font-black tabular-nums sm:text-xl"
                      style={{ color: onSale ? accent : '#292524' }}
                    >
                      {formatCurrency(price, currency)}
                    </span>
                    {onSale && (
                      <span className="text-sm text-stone-400 line-through tabular-nums">
                        {formatCurrency(comparePrice, currency)}
                      </span>
                    )}
                  </div>

                  {/* Quick buy CTA */}
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    style={{ backgroundColor: accent }}
                    onClick={(e) => {
                      e.preventDefault();
                      // Navigate to product detail page
                      window.location.href = href;
                    }}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

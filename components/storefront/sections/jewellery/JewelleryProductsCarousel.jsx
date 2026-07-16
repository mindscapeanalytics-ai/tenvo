'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';

/**
 * Auto-scrolling jewelry/beauty products carousel with premium styling.
 * Replaces hardcoded Sale mosaic with real catalog products.
 * 
 * Features:
 * - Auto-scroll marquee with pause on hover
 * - Category badges with golden accents
 * - Price display with sale pricing
 * - Smooth infinite loop
 * - Mobile-optimized with touch swipe
 * 
 * @param {{
 *   title?: string;
 *   subtitle?: string;
 *   products: Array<object>;
 *   businessDomain: string;
 *   businessCategory?: string;
 *   currency?: string;
 *   accent?: string;
 *   autoScroll?: boolean;
 *   scrollSpeed?: number;
 * }} props
 */
export function JewelleryProductsCarousel({
  title = 'Featured Jewelry',
  subtitle = 'Discover our curated selection of gold, diamonds, and precious gems',
  products = [],
  businessDomain,
  businessCategory,
  currency = 'PKR',
  accent = '#c9a227',
  autoScroll = true,
  scrollSpeed = 30, // seconds for one full loop
}) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);
  const storeBase = `/store/${businessDomain}`;

  // Duplicate products for infinite scroll effect
  const displayProducts = products.length > 0 ? [...products, ...products] : [];

  useEffect(() => {
    if (!autoScroll || isPaused || !scrollRef.current || products.length === 0) return;

    const container = scrollRef.current;
    const scrollWidth = container.scrollWidth / 2; // Half because we duplicated
    let animationId;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed / (scrollSpeed * 1000)) % 1;
      
      container.scrollLeft = progress * scrollWidth;
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [autoScroll, isPaused, scrollSpeed, products.length]);

  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden border-t border-stone-200 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 text-center sm:mb-8">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08`, color: accent }}
          >
            <Sparkles className="h-3 w-3" />
            Handpicked Collection
          </div>
          <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-stone-900')}>{title}</h2>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scrolling carousel */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto scrollbar-hide sm:gap-6"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayProducts.map((product, index) => {
            const imageUrl = getEffectiveProductImageUrl(product, businessCategory);
            const price = Number(product.price) || 0;
            const comparePrice = Number(product.compare_price) || 0;
            const hasDiscount = comparePrice > price && price > 0;
            const discountPercent = hasDiscount
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : 0;

            return (
              <Link
                key={`${product.id}-${index}`}
                href={`${storeBase}/products/${product.slug || product.id}`}
                className="group relative flex-shrink-0 overflow-hidden rounded-2xl bg-stone-50 shadow-md transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
                style={{ width: '280px' }}
              >
                {/* Product image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                  <SmartProductImage
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="280px"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Discount badge */}
                  {hasDiscount && (
                    <div
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-black text-white shadow-lg"
                      style={{ backgroundColor: accent }}
                    >
                      -{discountPercent}%
                    </div>
                  )}

                  {/* Category badge */}
                  {product.category_name && (
                    <div className="absolute bottom-3 left-3 rounded-lg border bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-stone-700 shadow-sm backdrop-blur-sm"
                      style={{ borderColor: `${accent}30` }}
                    >
                      {product.category_name}
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="p-4">
                  <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-tight text-stone-900 group-hover:text-stone-700">
                    {product.name}
                  </h3>
                  
                  {/* Brand */}
                  {product.brand && (
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                      {product.brand}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-stone-900" style={{ color: accent }}>
                      {formatCurrency(price, currency)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-stone-400 line-through">
                        {formatCurrency(comparePrice, currency)}
                      </span>
                    )}
                  </div>

                  {/* Domain-specific metadata */}
                  {product.domain_data && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.domain_data.carat && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          {product.domain_data.carat}
                        </span>
                      )}
                      {product.domain_data.clarity && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          {product.domain_data.clarity}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 border-2 border-transparent transition-colors group-hover:border-stone-200 rounded-2xl pointer-events-none" />
              </Link>
            );
          })}
        </div>

        {/* Scroll hint (mobile) */}
        <div className="mt-6 text-center lg:hidden">
          <p className="text-xs text-stone-500">
            ← Swipe to explore more →
          </p>
        </div>

        {/* View all link */}
        <div className="mt-8 text-center">
          <Link
            href={`${storeBase}/products`}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            style={{ backgroundColor: accent }}
          >
            View Full Collection
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

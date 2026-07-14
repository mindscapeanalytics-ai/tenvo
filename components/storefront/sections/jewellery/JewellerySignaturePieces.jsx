'use client';

import Link from 'next/link';
import { ArrowRight, Award } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

/**
 * Signature jewelry pieces showcase — featured high-value items.
 * 2026 design: Large cards with premium hover effects, certification badges, golden accents.
 */
export function JewellerySignaturePieces({
  products = [],
  businessDomain,
  businessCategory,
  accent = '#c9a227',
  title = 'SIGNATURE PIECES',
  subtitle = 'Handcrafted excellence',
  viewAllHref,
  animations = true,
}) {
  if (!products.length) return null;

  const displayProducts = products.slice(0, 4);

  return (
    <section className="border-t border-stone-100 bg-gradient-to-br from-white to-stone-50/50 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" style={{ color: accent }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Featured Collection
              </p>
            </div>
            <h2 className={cn(STORE_SECTION_HEADING, 'mt-1 text-stone-900')}>{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-stone-600 sm:text-base">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
              style={{ color: accent }}
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {displayProducts.map((product, i) => {
            const href = `/store/${businessDomain}/products/${product.slug || product.id}`;
            const price = Number(product.price) || 0;
            const comparePrice = Number(product.compare_price) || 0;
            const onSale = comparePrice > price && price > 0;
            const domainData = product.domain_data || {};
            const certification = domainData.certification || domainData.hallmark;

            return (
              <Link
                key={product.id}
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl"
                style={
                  animations
                    ? {
                        animationDelay: `${i * 75}ms`,
                        animationFillMode: 'both',
                      }
                    : undefined
                }
              >
                {/* Golden glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-5"
                  style={{ background: `radial-gradient(circle at 50% 40%, ${accent} 0%, transparent 70%)` }}
                />

                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                  <SmartProductImage
                    src={product.image_url || product.images?.[0]?.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Certification badge */}
                  {certification && (
                    <div className="absolute right-3 top-3 z-20 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 backdrop-blur-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                        Certified
                      </p>
                    </div>
                  )}

                  {/* On sale badge */}
                  {onSale && (
                    <div
                      className="absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <p className="text-[10px] uppercase tracking-wider">Sale</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {product.brand && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      {product.brand}
                    </p>
                  )}
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 group-hover:text-stone-700 sm:text-base">
                    {product.name}
                  </h3>

                  <div className="mt-auto flex items-baseline gap-2">
                    <span
                      className="text-base font-bold tabular-nums sm:text-lg"
                      style={{ color: onSale ? accent : '#292524' }}
                    >
                      {formatCurrency(price, 'PKR')}
                    </span>
                    {onSale && (
                      <span className="text-sm text-stone-400 line-through">
                        {formatCurrency(comparePrice, 'PKR')}
                      </span>
                    )}
                  </div>

                  {/* Carat info */}
                  {domainData.carat && (
                    <p className="text-xs text-stone-600">
                      <span className="font-semibold">{domainData.carat}</span>
                      {domainData.weight && ` · ${domainData.weight}g`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

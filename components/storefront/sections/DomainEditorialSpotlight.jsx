'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { resolveEditorialSpotlightFallback } from '@/lib/storefront/storefrontImagePlaceholders';
import { cn } from '@/lib/utils';

/**
 * Glovida-style editorial category spotlight between product rows.
 * Uses a full-bleed background image with gradient overlay for a premium banner look.
 */
export function DomainEditorialSpotlight({
  spotlight,
  accent,
  accentDark,
  businessDomain,
  variant = 'default',
  canonical,
}) {
  if (!spotlight) return null;

  const href = spotlight.href || `/store/${businessDomain}/products`;
  const isEditorial = variant === 'editorial';
  const isDark = spotlight.tone === 'dark' || isEditorial || (!spotlight.tone && !spotlight.image);
  const isAccent = spotlight.tone === 'accent' && !isEditorial;
  const isLight = spotlight.tone === 'light';
  const imageSrc =
    spotlight.image || resolveEditorialSpotlightFallback(spotlight.id, canonical, 0);
  const hasImage = Boolean(imageSrc);

  const useLightText = isDark || isAccent || (hasImage && !isLight);

  return (
    <section
      className={cn(
        'mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8',
        isEditorial ? 'py-6 sm:py-8' : 'py-6 sm:py-8'
      )}
    >
      <div
        className={cn(
          'group relative isolate overflow-hidden rounded-3xl',
          'min-h-[220px] sm:min-h-[280px] lg:min-h-[320px]',
          hasImage ? 'bg-neutral-900' : isDark ? 'bg-stone-900' : isAccent ? '' : 'bg-white border border-slate-100'
        )}
        style={
          !hasImage && isAccent
            ? { background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)` }
            : undefined
        }
      >
        {hasImage ? (
          <>
            <SmartProductImage
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition duration-[8000ms] ease-out motion-safe:group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 1400px"
              fallbackSrc={resolveEditorialSpotlightFallback(spotlight.id, canonical, 1)}
            />
            <div
              className={cn(
                'absolute inset-0',
                isLight
                  ? 'bg-gradient-to-r from-white/95 via-white/82 to-white/45'
                  : isAccent
                    ? 'bg-gradient-to-r from-black/88 via-black/55 to-black/25'
                    : 'bg-gradient-to-r from-black/88 via-black/58 to-black/20'
              )}
              aria-hidden
            />
            {!isLight ? (
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-35 blur-3xl transition group-hover:opacity-50"
                style={{ backgroundColor: isAccent ? accent : accentDark || accent }}
                aria-hidden
              />
            ) : null}
          </>
        ) : null}

        <div className="relative z-10 flex min-h-[inherit] flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="max-w-xl">
            {spotlight.eyebrow ? (
              <p
                className={cn(
                  'text-xs font-bold uppercase tracking-widest mb-2',
                  useLightText ? 'text-white/75' : 'text-slate-500'
                )}
              >
                {spotlight.eyebrow}
              </p>
            ) : null}
            <h2
              className={cn(
                'store-heading text-2xl sm:text-3xl lg:text-4xl mb-3',
                useLightText ? 'store-heading--inverse text-white' : ''
              )}
            >
              {spotlight.title}
            </h2>
            <p
              className={cn(
                'text-sm sm:text-base mb-6 leading-relaxed max-w-lg',
                useLightText ? 'text-white/85' : 'text-slate-600'
              )}
            >
              {spotlight.subtitle}
            </p>
            <Link
              href={href}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02]',
                useLightText ? 'bg-white text-slate-900 shadow-lg' : 'text-white shadow-md'
              )}
              style={!useLightText ? { backgroundColor: accent } : undefined}
            >
              {spotlight.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

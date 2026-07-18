'use client';

import Link from 'next/link';
import {
  Calendar, ExternalLink, Dumbbell, UtensilsCrossed, Sparkles,
} from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import {
  dedupeFitnessServices,
  resolveFitnessBookHref,
  resolveFitnessImageFallback,
} from '@/lib/storefront/fitnessStorefront';
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';

const SERVICE_ICONS = {
  'personal training': Dumbbell,
  classes: Sparkles,
  nutrition: UtensilsCrossed,
};

function resolveServiceIcon(product) {
  const cat = String(product?.category_name || product?.category || '').toLowerCase();
  if (cat.includes('training') && /nutrition/i.test(product?.name || '')) return UtensilsCrossed;
  if (cat.includes('class')) return Sparkles;
  return SERVICE_ICONS[cat] || Dumbbell;
}

function resolveServiceEyebrow(product) {
  const cat = String(product?.category_name || product?.category || '').toLowerCase();
  if (/nutrition/i.test(product?.name || '')) return 'Nutrition';
  if (cat.includes('class')) return 'Classes';
  if (cat.includes('training')) return 'Personal training';
  return 'Coaching';
}

/** Two identical tracks for seamless -50% marquee (gap-safe). */
function TrainingMarqueeTrack({
  items,
  trackId,
  storeBase,
  productsUrl,
  currency,
  accent,
  meetingUrl,
  ariaHidden,
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-stretch gap-3 pr-3 sm:gap-4 sm:pr-4',
        ariaHidden && 'pointer-events-none'
      )}
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((product, index) => (
        <TrainingOverlayCard
          key={`${trackId}-${product.sku || product.id || product.name}-${index}`}
          product={product}
          storeBase={storeBase}
          productsUrl={productsUrl}
          currency={currency}
          accent={accent}
          meetingUrl={meetingUrl}
        />
      ))}
    </div>
  );
}

function TrainingOverlayCard({
  product,
  storeBase,
  productsUrl,
  currency,
  accent,
  meetingUrl,
  className,
}) {
  const Icon = resolveServiceIcon(product);
  const eyebrow = resolveServiceEyebrow(product);
  const price = Number(product.price) || 0;
  const compare = product.compare_price ?? product.compare_at_price;
  const savings =
    compare && Number(compare) > price
      ? Math.round(((Number(compare) - price) / Number(compare)) * 100)
      : 0;
  const slug = product.slug || (isStorefrontProductUuid(product.id) ? product.id : null);
  const productHref = slug
    ? `${storeBase}/products/${slug}`
    : `${productsUrl}?search=${encodeURIComponent(String(product.name || ''))}`;
  const bookHref = resolveFitnessBookHref(storeBase, {
    meetingUrl,
    subject: 'appointment',
    packageName: product.name,
  });
  const bookExternal = Boolean(meetingUrl);

  return (
    <article
      className={cn(
        'group relative h-[min(78vw,360px)] w-[min(94vw,540px)] shrink-0 overflow-hidden rounded-2xl border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
        'sm:h-[380px] sm:w-[500px] lg:h-[420px] lg:w-[560px]',
        className
      )}
    >
      <SmartProductImage
        src={product.image_url}
        alt={product.name}
        fill
        fallbackSrc={resolveFitnessImageFallback(product.name || product.id || 'training')}
        className="object-cover object-center transition duration-700 group-hover:scale-[1.05]"
        sizes="560px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />

      {savings > 0 ? (
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg"
          style={{ backgroundColor: accent }}
        >
          -{savings}%
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3.5 p-5 sm:gap-4 sm:p-6">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {eyebrow}
        </span>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight text-white sm:text-2xl">
            <Link href={productHref} className="hover:text-rose-100">
              {product.name}
            </Link>
          </h3>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-white/75">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
              {formatCurrency(price, currency, { maximumFractionDigits: 0 })}
            </span>
            {compare && Number(compare) > price ? (
              <span className="text-sm tabular-nums text-white/45 line-through sm:text-base">
                {formatCurrency(Number(compare), currency, { maximumFractionDigits: 0 })}
              </span>
            ) : null}
          </div>

          <a
            href={bookHref}
            target={bookExternal ? '_blank' : undefined}
            rel={bookExternal ? 'noopener noreferrer' : undefined}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/35 transition hover:opacity-95 active:scale-[0.98] sm:w-auto sm:min-w-[11rem]"
            style={{ backgroundColor: accent }}
          >
            <Calendar className="h-4 w-4" aria-hidden />
            Book session
            {bookExternal ? <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden /> : null}
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * Full-bleed training carousel — overlay cards, auto-scroll, booking-only CTAs.
 */
export function FitnessTrainingServices({
  services = [],
  storeBase,
  productsUrl,
  currency = 'PKR',
  accent = '#e11d48',
  meetingUrl,
}) {
  const items = dedupeFitnessServices(services);

  if (!items.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden border-t border-white/10 bg-black py-10 sm:py-12 lg:py-14"
      id="training"
      aria-label="Training and classes"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(225,29,72,0.12) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="relative min-h-[min(78vw,360px)] sm:min-h-[380px] lg:min-h-[420px]">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black via-black/95 to-transparent sm:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black via-black/95 to-transparent sm:w-20"
          aria-hidden
        />

        <div className="relative overflow-hidden">
          <div className="fitness-training-marquee-track flex w-max items-stretch">
            <TrainingMarqueeTrack
              trackId="a"
              items={items}
              storeBase={storeBase}
              productsUrl={productsUrl}
              currency={currency}
              accent={accent}
              meetingUrl={meetingUrl}
            />
            <TrainingMarqueeTrack
              trackId="b"
              items={items}
              storeBase={storeBase}
              productsUrl={productsUrl}
              currency={currency}
              accent={accent}
              meetingUrl={meetingUrl}
              ariaHidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default FitnessTrainingServices;

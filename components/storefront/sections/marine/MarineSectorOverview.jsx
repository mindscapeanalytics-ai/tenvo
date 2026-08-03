'use client';

import Link from 'next/link';
import { Anchor, ArrowRight, Package, Ship, Wrench, Zap } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import { STORE_SECTION_HEADING } from '@/lib/utils/typography';

const ICONS = {
  ship: Ship,
  wrench: Wrench,
  package: Package,
  anchor: Anchor,
  zap: Zap,
};

function resolveHref(storeBase, href) {
  if (!href) return storeBase;
  if (href.startsWith('http')) return href;
  const path = href.startsWith('/') ? href : `/${href}`;
  if (path.startsWith('/store/')) return path;
  return `${storeBase}${path}`;
}

/**
 * Premium dual-sector overview for marine / industrial ship-parts storefronts.
 * Skewed parallelogram frames inspired by industrial OEM homepages.
 *
 * @param {{
 *   storeBase: string,
 *   accent?: string,
 *   eyebrow?: string,
 *   title?: string,
 *   layout?: 'skewed' | 'standard',
 *   cards?: Array<{
 *     id: string,
 *     icon?: string,
 *     title: string,
 *     body: string,
 *     ctaLabel: string,
 *     href: string,
 *     image: string,
 *   }>,
 * }} props
 */
export function MarineSectorOverview({
  storeBase,
  accent = '#002d54',
  eyebrow = 'What we deliver',
  title = 'Systems and lifecycle support for fleets at sea',
  layout = 'skewed',
  cards = [],
}) {
  if (!cards.length) return null;
  const skewed = layout !== 'standard';

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 max-w-3xl lg:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
          <h2 className={cn(STORE_SECTION_HEADING, 'mt-2 text-neutral-900')}>{title}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {cards.map((card, index) => {
            const Icon = ICONS[card.icon] || Ship;
            const href = resolveHref(storeBase, card.href);
            return (
              <article
                key={card.id}
                className={cn(
                  'group relative isolate',
                  skewed && 'lg:pt-2',
                  index === 1 && skewed && 'lg:-mt-4'
                )}
              >
                <div
                  className={cn(
                    'relative overflow-hidden bg-neutral-200',
                    skewed
                      ? 'aspect-[16/11] [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)] sm:[clip-path:polygon(5%_0,100%_0,95%_100%,0_100%)]'
                      : 'aspect-[16/11] rounded-2xl'
                  )}
                >
                  <SmartProductImage
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
                    placeholderLabel={card.title}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#001830]/55 via-transparent to-[#001830]/15"
                    aria-hidden
                  />
                </div>

                <div
                  className={cn(
                    'relative z-10 -mt-16 mx-4 max-w-md border border-neutral-200/90 bg-white/95 p-5 shadow-lg shadow-neutral-900/10 backdrop-blur-sm sm:mx-6 sm:p-6',
                    skewed
                      ? '[clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)] sm:max-w-sm'
                      : 'rounded-2xl'
                  )}
                >
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accent}12`, color: accent }}
                  >
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{card.body}</p>
                  <Link
                    href={href}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-50"
                    style={{ borderColor: accent, color: accent }}
                  >
                    {card.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

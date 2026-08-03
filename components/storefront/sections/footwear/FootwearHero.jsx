'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import {
  getFootwearConfig,
  FOOTWEAR_ACCENTS,
  FOOTWEAR_SALE_STACK_IMAGES,
  formatFootwearStoreName,
} from '@/lib/storefront/footwearStorefront';

const FLOAT = [
  { y: [4, -18, 4], duration: 5.5, delay: 0 },
  { y: [-22, 6, -22], duration: 6.2, delay: 0.35 },
  { y: [10, -12, 10], duration: 5.8, delay: 0.7 },
];

/**
 * Foot Locker-style split sale hero — yellow accent panel + BIG SALE + floating pairs.
 */
export function FootwearHero({ preset, businessDomain, accent, accentDark }) {
  const base = preset.base || `/store/${businessDomain}`;
  const productsUrl = `${base}/products`;
  const config = getFootwearConfig(preset.settings, businessDomain);
  const storeName = formatFootwearStoreName(preset.storeName || '');
  const yellow = accent || FOOTWEAR_ACCENTS.accent;
  const reduceMotion = useReducedMotion();
  void accentDark;

  if (!config.showSaleHero) {
    return null;
  }

  const title = config.saleHeroTitle || 'Huge savings: up to 40% off';
  const subtitle =
    config.saleHeroSubtitle || 'Save on Nike, Adidas, New Balance and more. Exclusions apply.';
  const stack =
    (preset.slides || [])
      .map((s) => s?.image)
      .filter(Boolean)
      .slice(0, 3)
      .concat(FOOTWEAR_SALE_STACK_IMAGES)
      .slice(0, 3);

  return (
    <section className="relative bg-white" aria-label={`${storeName} sale hero`}>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div
          className="relative flex min-h-[320px] flex-col justify-center px-6 py-12 sm:min-h-[400px] sm:px-10 lg:min-h-[520px] lg:px-14"
          style={{ backgroundColor: yellow }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900/70">
            {storeName}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-900/80 sm:text-base">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { label: "Shop Men's", href: `${productsUrl}?gender=men` },
              { label: "Shop Women's", href: `${productsUrl}?gender=women` },
              { label: "Shop Kids'", href: `${productsUrl}?gender=kids` },
            ].map((cta) => (
              <Link
                key={cta.label}
                href={cta.href}
                className="inline-flex items-center rounded-full border-2 border-zinc-950 bg-transparent px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
              >
                {cta.label}
              </Link>
            ))}
          </div>
          <Link
            href={`${productsUrl}?onSale=true`}
            className="mt-4 inline-flex w-fit text-sm font-semibold text-zinc-950 underline underline-offset-4"
          >
            Shop the sale
          </Link>
        </div>

        <div className="relative min-h-[300px] overflow-hidden bg-white sm:min-h-[400px] lg:min-h-[520px]">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-0 flex items-center pr-1 sm:pr-4 lg:pr-6"
            aria-hidden
          >
            <span className="select-none text-[4.5rem] font-semibold leading-none tracking-tight text-zinc-950 sm:text-[7rem] lg:text-[10rem] [writing-mode:vertical-rl] rotate-180">
              BIG SALE
            </span>
          </div>
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 px-4 sm:gap-5 sm:px-10 lg:justify-start lg:pl-8 lg:pr-32">
            {stack.map((src, i) => {
              const float = FLOAT[i] || FLOAT[0];
              return (
                <motion.div
                  key={`${src}-${i}`}
                  className="relative w-[28%] max-w-[190px] overflow-hidden bg-zinc-50 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                  style={{ aspectRatio: '3 / 4' }}
                  animate={reduceMotion ? undefined : { y: float.y }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: float.duration, repeat: Infinity, ease: 'easeInOut', delay: float.delay }
                  }
                >
                  <SmartProductImage
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="190px"
                    priority={i === 0}
                  />
                </motion.div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-l from-white via-transparent to-transparent opacity-35" />
        </div>
      </div>

      {config.showPromoStrip ? (
        <div className="border-y border-zinc-800 bg-zinc-950">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-white">
              {config.promoStripText || 'Members get exclusive drops, size alerts, and sale access'}
            </p>
            <Link
              href={`${productsUrl}?sort=newest`}
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-950"
              style={{ backgroundColor: yellow }}
            >
              Shop new
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

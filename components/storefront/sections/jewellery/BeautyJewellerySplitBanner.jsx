'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium split banner — inspired by Olive & June "Mani Match" design.
 * Left: Elegant serif typography with CTA buttons.
 * Right: Full-bleed product/lifestyle image with hover parallax.
 *
 * Works for both jewelry ("Discover Your Signature Piece") and beauty ("Find Your Perfect Match") modes.
 */
export function BeautyJewellerySplitBanner({
  eyebrow = 'Take the quiz',
  headline = 'Find Your Perfect Match',
  headlineAccent = 'Perfect Match',
  description = 'Answer a few quick questions and we will recommend the best products for you.',
  ctaLabel = 'Take the Quiz',
  ctaHref = '#',
  secondaryLabel = 'Shop Best Sellers',
  secondaryHref = '#',
  image = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=85&auto=format&fit=crop',
  accent = '#c9a227',
  bgTint = '#faf5ef',
  reverse = false,
}) {
  // Split headline into accented portion
  const parts = headline.split(headlineAccent);
  const hasAccent = parts.length > 1;

  return (
    <section className="overflow-hidden border-y border-stone-200">
      <div className={cn('flex flex-col lg:flex-row', reverse && 'lg:flex-row-reverse')}>
        {/* ── Text Side ───────────────────────────────────────────────────── */}
        <div
          className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
          style={{ backgroundColor: bgTint }}
        >
          {/* Eyebrow */}
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {eyebrow}
          </p>

          {/* Headline — serif with italic accent */}
          <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
            {hasAccent ? (
              <>
                {parts[0]}
                <em className="font-medium italic" style={{ color: accent }}>
                  {headlineAccent}
                </em>
                {parts[1]}
              </>
            ) : (
              headline
            )}
          </h2>

          {/* Description */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
            {description}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-[0.98]"
              style={{ backgroundColor: accent }}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: accent }}
              >
                {secondaryLabel}
                <span className="inline-block border-b transition-all group-hover:border-current" style={{ borderColor: accent }}>
                  →
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Image Side ──────────────────────────────────────────────────── */}
        <div className="group relative aspect-[4/3] flex-1 overflow-hidden lg:aspect-auto">
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {/* Subtle overlay gradient */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${accent}22 0%, transparent 50%)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

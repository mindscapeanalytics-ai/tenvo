import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';
import {
  filterPageSectionsByPlacement,
  getActivePageSections,
  getSectionBackgroundStyle,
  isImageOnlyBanner,
} from '@/lib/storefront/storePageSections';

/**
 * Owner-configured marketing blocks on the public store homepage.
 *
 * @param {{
 *   sections?: unknown;
 *   businessDomain: string;
 *   accent?: string;
 *   placement?: 'after-hero' | 'mid-page' | 'before-footer';
 *   className?: string;
 * }} props
 */
export function StoreMarketingSections({
  sections,
  businessDomain,
  accent = '#2563eb',
  placement,
  className,
}) {
  const active = placement
    ? filterPageSectionsByPlacement(sections, placement)
    : getActivePageSections(sections);
  if (!active.length) return null;

  const base = `/store/${businessDomain}`;
  const isAfterHero = placement === 'after-hero';

  return (
    <div className={cn('space-y-0', className)}>
      {active.map((section) => {
        const href = section.ctaHref.startsWith('/')
          ? `${base}${section.ctaHref === '/' ? '' : section.ctaHref}`
          : section.ctaHref;
        const style = getSectionBackgroundStyle(section, accent);
        const textStyle = { color: section.textColor || '#ffffff' };
        const linkable = !!(section.ctaLabel || (isImageOnlyBanner(section) && section.ctaHref));

        if (section.type === 'promo-strip') {
          const inner = (
            <div
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 text-center sm:flex-row sm:gap-3"
              style={style}
            >
              <p className="text-sm font-semibold sm:text-base" style={textStyle}>
                {section.title || section.subtitle}
              </p>
              {section.title && section.subtitle ? (
                <p className="text-xs opacity-90 sm:text-sm" style={textStyle}>
                  {section.subtitle}
                </p>
              ) : null}
              {section.ctaLabel ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold underline sm:ml-2 sm:text-sm"
                  style={textStyle}
                >
                  {section.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
          );

          if (section.ctaLabel) {
            return (
              <Link key={section.id} href={href} className="block transition hover:opacity-95">
                {inner}
              </Link>
            );
          }
          return (
            <div key={section.id} className="border-b border-white/10">
              {inner}
            </div>
          );
        }

        if (isImageOnlyBanner(section)) {
          const imageBlock = (
            <div
              className={cn(
                'relative w-full overflow-hidden bg-slate-100',
                isAfterHero
                  ? 'aspect-[21/9] min-h-[120px] sm:min-h-[160px] lg:min-h-[200px]'
                  : 'aspect-[21/9] min-h-[140px] rounded-2xl sm:min-h-[180px] sm:rounded-3xl'
              )}
            >
              <SmartProductImage
                src={section.imageUrl}
                alt={section.title || 'Store promotion'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1400px"
              />
            </div>
          );

          const wrapped = linkable ? (
            <Link
              href={href}
              className="block transition hover:opacity-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={section.title || section.ctaLabel || 'View promotion'}
            >
              {imageBlock}
            </Link>
          ) : (
            imageBlock
          );

          return (
            <section
              key={section.id}
              className={cn(
                'border-b border-slate-200/60',
                isAfterHero ? 'py-0' : 'py-4 sm:py-6'
              )}
            >
              {isAfterHero ? (
                wrapped
              ) : (
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">{wrapped}</div>
              )}
            </section>
          );
        }

        return (
          <section key={section.id} className="border-b border-slate-200/60">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
              <div
                className="relative min-h-[220px] overflow-hidden rounded-2xl sm:min-h-[260px] sm:rounded-3xl px-6 py-10 sm:px-10 sm:py-14 shadow-sm"
                style={style}
              >
                <div className="relative z-[1] max-w-2xl">
                  {section.title ? (
                    <h2 className="text-2xl font-black tracking-tight sm:text-4xl" style={textStyle}>
                      {section.title}
                    </h2>
                  ) : null}
                  {section.subtitle ? (
                    <p className="mt-2 text-sm leading-relaxed opacity-95 sm:text-lg" style={textStyle}>
                      {section.subtitle}
                    </p>
                  ) : null}
                  {section.ctaLabel ? (
                    <Link
                      href={href}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-md transition hover:bg-white/95 sm:mt-6 sm:px-6 sm:py-3 sm:text-base"
                    >
                      {section.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

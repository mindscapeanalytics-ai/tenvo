/**
 * Positioning pillars for `/why-tenvo` — narrative compare cards with demo proof imagery.
 */
'use client';

import Link from 'next/link';
import Image from '@/components/marketing/ui/MarketingImage';
import * as LucideIcons from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { WHY_TENVO_COMPARE } from '@/lib/marketing/homeVisualThemes';
import { cn } from '@/lib/utils';

export default function WhyTenvoPositioningSection() {
  return (
    <MarketingSection id="positioning" className="scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50">
      <div className="mx-auto mb-8 max-w-3xl space-y-3 sm:mb-10 lg:mb-12">
        <p className={MARKETING_EYEBROW}>How we differ</p>
        <h2 className={MARKETING_SECTION_HEADING}>
          Built for operators who need depth, not another app icon.
        </h2>
        <p className={MARKETING_LEAD}>
          Storefront-only tools excel at checkout. Multi-app suites add logins. TENVO connects catalog,
          fulfilment, and books so your team stops reconciling spreadsheets between systems.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {WHY_TENVO_COMPARE.map((pillar) => {
          const Icon = LucideIcons[pillar.icon];
          const { card, icon: iconClass, check } = pillar.accent || {};

          return (
            <article
              key={pillar.id}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl',
                card
              )}
            >
              {pillar.heroImage ? (
                <div className="relative aspect-[16/10] border-b border-neutral-200/80 bg-neutral-100">
                  <Image
                    src={pillar.heroImage}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
                {Icon ? (
                  <div
                    className={cn(
                      'mb-4 flex h-11 w-11 items-center justify-center rounded-xl',
                      iconClass
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                ) : null}
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
                  {pillar.title}
                </h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-neutral-600">
                  {pillar.body}
                </p>
                {pillar.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm font-semibold text-neutral-700">
                    {pillar.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current', check)} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {pillar.href ? (
                  <Link
                    href={pillar.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
                  >
                    See live demo
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </MarketingSection>
  );
}

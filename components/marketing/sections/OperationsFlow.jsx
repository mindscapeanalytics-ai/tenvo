'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { marketingContent } from '@/lib/marketing/content';
import {
  MARKETING_CONTAINER,
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const DEFAULT_FLOW = marketingContent.operationsFlow;

/**
 * Three-step operational flow: capture → operate → control.
 */
export default function OperationsFlow({
  id = 'how-it-works',
  title = DEFAULT_FLOW.title,
  subtitle = DEFAULT_FLOW.subtitle,
  steps = DEFAULT_FLOW.steps,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!steps?.length) return null;

  return (
    <section
      id={id}
      className={cn(MARKETING_SECTION, 'scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50')}
    >
      <div className={MARKETING_CONTAINER}>
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-12">
          <p className={cn(MARKETING_EYEBROW, 'mb-3')}>How it works</p>
          <h2 className={MARKETING_SECTION_HEADING}>{title}</h2>
          {subtitle ? <p className={cn(MARKETING_LEAD, 'mt-4')}>{subtitle}</p> : null}
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon ? LucideIcons[step.icon] : null;

            return (
              <article
                key={step.id || step.title}
                className={cn(
                  'relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8',
                  'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300 motion-safe:hover:border-brand-primary/25 motion-safe:hover:shadow-md',
                  mounted ? 'animate-fade-in-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="absolute right-5 top-5 text-[10px] font-semibold tabular-nums text-neutral-400">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {StepIcon ? (
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <StepIcon className="h-5 w-5" aria-hidden />
                  </div>
                ) : null}

                <h3 className="text-lg font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-neutral-500">
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          Same catalog from import through POS, storefront, and finance
        </p>
      </div>
    </section>
  );
}

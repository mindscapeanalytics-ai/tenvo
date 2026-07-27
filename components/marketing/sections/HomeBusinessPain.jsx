'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  LayoutDashboard,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const IMPACT_POINTS = [
  {
    icon: LayoutDashboard,
    title: 'One workspace',
    body: 'Commerce, finance, inventory, and analytics share the same live picture.',
  },
  {
    icon: Bot,
    title: 'AI that acts',
    body: 'Restock alerts, revenue opportunities, and health scores beside your KPIs.',
  },
  {
    icon: Smartphone,
    title: 'Desk and pocket',
    body: 'The same hub on desktop and phone so floor teams never lose the thread.',
  },
  {
    icon: Activity,
    title: 'Live control',
    body: 'Revenue, cash flow, orders, and inventory health update in one view.',
  },
];

/**
 * One TENVO Hub — impact copy + desktop/mobile composite.
 */
export default function HomeBusinessPain({ workspaceHref = '/register' }) {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/80 bg-gradient-to-b from-[#F7F8FA] via-white to-white"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        <div className="min-w-0 space-y-6 lg:col-span-5 xl:col-span-4 lg:space-y-7">
          <div className="space-y-3 sm:space-y-4">
            <p className={MARKETING_EYEBROW}>One TENVO Hub</p>
            <h2 className={cn(MARKETING_SECTION_HEADING, 'max-w-lg')}>
              Stop juggling apps. Run the whole business from{' '}
              <span className="text-brand-primary">one screen.</span>
            </h2>
            <p className={cn(MARKETING_LEAD, 'max-w-md')}>
              Revenue, inventory, orders, and AI insights stay linked so you decide once and
              execute everywhere.
            </p>
          </div>

          <ul className="space-y-3.5">
            {IMPACT_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3.5">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary ring-1 ring-brand-100">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <p className="mt-0.5 text-sm font-medium leading-relaxed text-neutral-500">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-12 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-dark"
            >
              <Link href={workspaceHref}>Start free trial</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-neutral-300 px-6 font-semibold"
            >
              <MarketingCtaLink href={getBookMeetingHref()}>Book a demo</MarketingCtaLink>
            </Button>
          </div>

          <p className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.75} aria-hidden />
            No credit card required
          </p>
        </div>

        <div className="relative min-w-0 lg:col-span-7 xl:col-span-8">
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-brand-primary/5 blur-2xl sm:-inset-6"
            aria-hidden
          />
          <div
            className={cn(
              'relative overflow-hidden rounded-[1.5rem] bg-[#F3F4F6]',
              'ring-1 ring-neutral-200/90',
              'shadow-[0_28px_70px_-36px_rgba(15,23,42,0.35)]',
              'sm:rounded-[1.75rem] lg:rounded-[2rem]'
            )}
          >
            {/* Native 3:2 — One-TENVO-Hub.webp */}
            <div className="relative aspect-[3/2] w-full">
              <Image
                src={TENVO_IMG.oneTenvoHub}
                alt="TENVO Hub on desktop and mobile with live KPIs, AI insights, and unified commerce modules"
                fill
                className="object-contain object-center"
                sizes="(max-width: 1024px) 96vw, 60vw"
                quality={80}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-center lg:justify-start">
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              Explore the full hub
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}

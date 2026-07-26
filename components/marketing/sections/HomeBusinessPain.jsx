'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  Calculator,
  Check,
  Layers,
  LogIn,
  MessageSquare,
  X,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const CHAOS_TOOLS = ['Inventory', 'Accounting', 'POS', 'Store', 'CRM', 'Marketing'];

const CHAOS_STACK = [
  { label: 'Chat · Orders', icon: MessageSquare, rot: '-rotate-6', pos: 'left-[6%] top-[14%]' },
  { label: 'Login · App 3', icon: LogIn, rot: 'rotate-3', pos: 'right-[8%] top-[18%]' },
  { label: 'Calc · Tax', icon: Calculator, rot: '-rotate-2', pos: 'left-[18%] top-[42%]' },
  { label: 'Tab · CRM', icon: Layers, rot: 'rotate-6', pos: 'right-[14%] top-[46%]' },
];

const CONTROL_POINTS = [
  'One stock picture across counter, web, and warehouse',
  'Orders, invoices, and payments stay linked',
  'AI signals and reports without spreadsheet stitching',
];

/**
 * Before (fragmented tools, no Excel screenshot) → After (one TENVO Hub).
 */
export default function HomeBusinessPain() {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/80 bg-gradient-to-b from-[#F7F8FA] via-white to-white"
    >
      <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-14">
        <p className={MARKETING_EYEBROW}>From chaos to control</p>
        <h2 className={MARKETING_SECTION_HEADING}>
          Your business shouldn&apos;t depend on scattered tools and ten different apps
        </h2>
        <p className={MARKETING_LEAD}>
          Disconnected systems. Manual work. Lost time. TENVO replaces the pile of tabs with one
          intelligent workspace.
        </p>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-7 xl:gap-8">
        {/* BEFORE — brand-red panel, white type, fragmented tools collage */}
        <div
          className={cn(
            'relative overflow-hidden rounded-[1.5rem]',
            'bg-gradient-to-br from-brand-primary via-[#C62828] to-brand-primary-dark',
            'shadow-[0_24px_60px_-24px_rgba(210,43,43,0.55)]',
            'ring-1 ring-brand-primary/30 sm:rounded-[1.75rem]'
          )}
        >
          <div className="relative flex min-h-[22rem] flex-col sm:min-h-[26rem] lg:min-h-[28rem]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 65% 45% at 15% 0%, rgba(255,255,255,0.22), transparent), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(0,0,0,0.22), transparent)',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
              aria-hidden
            />

            <div className="relative z-10 flex-1 px-5 pt-8 sm:px-7 sm:pt-10">
              <div className="relative mx-auto h-[11.5rem] w-full max-w-md sm:h-[13rem]">
                {CHAOS_STACK.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className={cn(
                        'absolute flex w-[9.5rem] items-center gap-2.5 rounded-xl border border-white/35 bg-white/15 px-3 py-2.5 shadow-lg backdrop-blur-md sm:w-[10.5rem]',
                        card.rot,
                        card.pos
                      )}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-primary shadow-sm">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-white">{card.label}</p>
                        <p className="text-[9px] font-medium text-white/70">Disconnected</p>
                      </div>
                      <X className="ml-auto h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 mt-auto space-y-4 p-6 sm:p-8 lg:p-9">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
                  Before
                </p>
                <p className="max-w-md text-2xl font-semibold leading-snug tracking-tight text-white sm:text-[1.65rem]">
                  Tabs, calculators, and five logins for one order.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CHAOS_TOOLS.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md"
                  >
                    <X className="h-3 w-3 text-white" strokeWidth={2.75} aria-hidden />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AFTER — One TENVO Hub */}
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-[1.5rem] border border-sky-200/80 bg-white',
            'shadow-[0_24px_60px_-28px_rgba(14,165,233,0.28)]',
            'sm:rounded-[1.75rem]'
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-7 sm:py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                After
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                One TENVO Hub
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/35">
              <Check className="h-5 w-5" strokeWidth={2.75} aria-hidden />
            </span>
          </div>

          <div className="relative aspect-[16/11] w-full overflow-hidden bg-neutral-50 sm:aspect-[5/3]">
            <Image
              src={TENVO_IMG.retailDashboard}
              alt="TENVO Easy Mode hub with quick entry, charts, and live metrics"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
              aria-hidden
            />
          </div>

          <div className="flex flex-1 flex-col justify-between gap-5 px-5 pb-6 pt-4 sm:px-7 sm:pb-7">
            <ul className="space-y-2.5">
              {CONTROL_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-neutral-600">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <Link
              href="/features"
              className="inline-flex items-center justify-center gap-2 self-center rounded-full border-2 border-brand-primary px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary transition-colors hover:bg-brand-50"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              Fragmented apps to one OS
            </Link>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}

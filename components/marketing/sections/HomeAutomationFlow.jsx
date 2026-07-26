'use client';

import {
  BellRing,
  FileText,
  PackageCheck,
  ShoppingBag,
  Truck,
  Warehouse,
  BarChart3,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const STEPS = [
  { title: 'Customer order', description: 'Sale lands from storefront, POS, or invoice.', icon: ShoppingBag },
  { title: 'Inventory updated', description: 'Stock decrements across locations in sync.', icon: PackageCheck },
  { title: 'Invoice created', description: 'Documents and ledgers post without re-entry.', icon: FileText },
  { title: 'Warehouse assigned', description: 'Fulfilment picks the right location to ship.', icon: Warehouse },
  { title: 'Courier ready', description: 'Order hub queues packing and handoff.', icon: Truck },
  { title: 'Customer notified', description: 'Transactional updates keep buyers informed.', icon: BellRing },
  { title: 'Reports updated', description: 'KPIs and channel analytics refresh automatically.', icon: BarChart3 },
];

/**
 * Automation timeline — order → inventory → invoice → warehouse → courier → notify → reports.
 */
export default function HomeAutomationFlow() {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/80 bg-white"
    >
      <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-14">
        <p className={MARKETING_EYEBROW}>Automation rhythm</p>
        <h2 className={MARKETING_SECTION_HEADING}>One order. The whole business updates.</h2>
        <p className={MARKETING_LEAD}>
          Stop copying data between apps. When a customer buys, TENVO keeps stock, documents,
          fulfilment, and reporting moving together.
        </p>
      </div>

      {/* Desktop horizontal timeline */}
      <div className="hidden lg:block">
        <div className="relative">
          <div
            className="absolute left-6 right-6 top-[2.15rem] h-px bg-gradient-to-r from-brand-primary/10 via-brand-primary/40 to-brand-primary/10"
            aria-hidden
          />
          <ol className="grid grid-cols-7 gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-4 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-primary shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                  <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-neutral-500">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <ol className="relative space-y-0 lg:hidden">
        <div
          className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-gradient-to-b from-brand-primary/20 via-brand-primary/45 to-brand-primary/15"
          aria-hidden
        />
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              <div
                className={cn(
                  'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-primary shadow-sm'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/80 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{step.title}</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </MarketingSection>
  );
}

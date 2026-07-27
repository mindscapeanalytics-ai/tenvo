'use client';

import Image from '@/components/marketing/ui/MarketingImage';
import {
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  LineChart,
  MessageSquareText,
  PackageSearch,
  ShoppingBag,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const AI_CARDS = [
  {
    title: 'Predict inventory',
    description: 'Smart restock signals from demand patterns on supported plans.',
    icon: PackageSearch,
  },
  {
    title: 'Forecast sales',
    description: 'Trend views that help you plan buying and staffing ahead of peaks.',
    icon: LineChart,
  },
  {
    title: 'Smart purchasing',
    description: 'Turn low-stock and forecast cues into clearer purchase decisions.',
    icon: ShoppingBag,
  },
  {
    title: 'Customer insights',
    description: 'Loyalty and sales history stay tied to the same customer record.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Business reports',
    description: 'Operational dashboards and report builder without spreadsheet exports.',
    icon: BrainCircuit,
  },
  {
    title: 'Natural language analytics',
    description: 'Ask the AI Business Analyst in plain language when keys and plan allow.',
    icon: MessageSquareText,
  },
  {
    title: 'Demand forecasting',
    description: 'Seasonality-aware signals for verticals with perishable or peak demand.',
    icon: Bot,
  },
  {
    title: 'Cash flow analysis',
    description: 'See receipts, payables context, and channel revenue in one finance hub.',
    icon: WalletCards,
  },
];

/**
 * AI section — brand-theme colors (no purple/violet fork).
 */
export default function HomeAISection() {
  return (
    <MarketingSection
      padding="loose"
      className="relative overflow-hidden border-b border-neutral-200/80 bg-gradient-to-b from-brand-50/80 via-white to-white"
    >
      <div
        className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-brand-primary/8 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-5">
          <p className={cn(MARKETING_EYEBROW, 'text-brand-primary')}>AI-powered intelligence</p>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Meet your <span className="text-brand-primary">AI Business Manager</span>
          </h2>
          <p className={cn(MARKETING_LEAD, 'text-neutral-600')}>
            Make smarter decisions with live operational data, forecasting signals, and an AI
            Business Analyst on Business+ when your AI keys are configured.
          </p>

          <div className="overflow-hidden rounded-[1.5rem] border border-brand-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(210,43,43,0.28)]">
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/30">
                <Bot className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">TENVO Analyst</p>
                <p className="text-xs font-medium text-neutral-500">Ask about stock, sales, or margin</p>
              </div>
            </div>
            <div className="relative aspect-[16/10] w-full bg-neutral-50">
              <Image
                src={TENVO_IMG.advancedDashboard}
                alt="TENVO dashboard used by AI Business Analyst context"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 420px"
                quality={78}
              />
            </div>
            <div className="space-y-2 border-t border-brand-100 bg-brand-50/70 px-4 py-3 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                Suggested insight
              </p>
              <p className="text-sm font-medium leading-relaxed text-neutral-700">
                Top fashion SKUs are trending up week over week. Review restock before weekend traffic.
              </p>
            </div>
          </div>

          <Button
            asChild
            className="h-12 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-dark"
          >
            <Link href="/features#analytics">Learn more about Analytics & AI</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
          {AI_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50/40 sm:p-5"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-primary ring-1 ring-brand-200/70">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">{card.title}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-neutral-500">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </MarketingSection>
  );
}

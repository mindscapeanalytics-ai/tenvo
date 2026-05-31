'use client';

import Link from 'next/link';
import { Megaphone, Heart, Brain, TrendingUp, ClipboardList, CheckSquare, Users, BarChart3 } from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import CTASection from '@/components/marketing/sections/CTASection';
import { Button } from '@/components/ui/button';

const PILLARS = [
  {
    id: 'campaigns',
    icon: Megaphone,
    title: 'Campaigns & marketing',
    body:
      'Run promotions and customer journeys without exporting lists to a separate email tool. Segments and offers stay tied to real purchase history, storefront activity, and POS - closer to how Zoho Campaigns or Shopify Email sit on top of real commerce data.',
    bullets: ['Promotion windows and messaging hooks', 'Plan-gated on Professional+ where enabled', 'Same customer record as invoices & POS'],
  },
  {
    id: 'crm',
    icon: Heart,
    title: 'Loyalty & CRM',
    body:
      'Reward repeat buyers, track preferences, and give frontline staff context at checkout or on the phone. Designed for retail and hospitality teams who outgrow spreadsheets but do not want yet another disconnected CRM.',
    bullets: ['Loyalty alongside POS and web orders', 'Customer 360 tied to sales history', 'Works with your existing roles & permissions'],
  },
  {
    id: 'analytics',
    icon: Brain,
    title: 'Analytics & AI',
    body:
      'Dashboards and reports draw from one ledger: inventory, orders, payments, and tax. Ask better questions without stitching exports from five silos - the same promise buyers expect from enterprise analytics, without a separate BI stack for day-one operators.',
    bullets: ['Operational and financial signals together', 'Roadmap: guided insights with human approval', 'Drill from summary to underlying documents'],
  },
];

const SALES_OPS = [
  {
    icon: TrendingUp,
    title: 'Quotations & Sales Manager',
    body:
      'B2B quotes, follow-ups, and pipeline-style tracking live next to inventory availability and credit exposure, so sales teams stop promising SKUs you cannot fulfil.',
  },
  {
    icon: CheckSquare,
    title: 'Approvals & governance',
    body:
      'Discounts, refunds, and high-impact changes can follow approval paths so growing teams keep control like they would in larger ERPs, without slowing honest day-to-day selling.',
  },
];

export default function MarketingCrmSolutionsPage() {
  return (
    <MarketingLayout>
      <Hero
        variant="centered"
        badge="Growth & customer experience"
        title={
          <>
            Marketing & CRM that share <span className="text-brand-primary">one source of truth</span>
          </>
        }
        subtitle="Campaigns, loyalty, analytics, and B2B selling - wired to the same products, orders, and payments as your storefront and POS. Positioned for teams comparing TENVO to stitched Current Solutions + spreadsheets."
        primaryCTA={{ text: 'Start free trial', href: '/register' }}
        secondaryCTA={{ text: 'Compare positioning', href: '/why-tenvo' }}
      />

      <section className="border-b border-neutral-200/80 bg-white py-16 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-brand-primary">Why this page exists</p>
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 md:text-4xl">
              Subscribers choose suites that cover operations and growth
            </h2>
            <p className="mt-4 text-lg font-medium text-neutral-600">
              Shopify wins on storefront + apps; Zoho wins on breadth. TENVO&apos;s story is{' '}
              <strong className="text-neutral-800">one hub</strong>: when campaigns and CRM read the same stock and
              invoices as finance, you reduce double entry, reconciliation drama, and “which system is right?”
              arguments.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PILLARS.map(({ id, icon: Icon, title, body, bullets }) => (
              <article
                key={id}
                id={id}
                className="scroll-mt-28 rounded-3xl border border-neutral-200/90 bg-neutral-50/60 p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-xl font-black text-neutral-900">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-600">{body}</p>
                <ul className="mt-5 space-y-2.5 text-sm font-semibold text-neutral-700">
                  {bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sales-suite" className="scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50 py-16 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-brand-primary">Sales & operations</p>
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 md:text-4xl">What else sits next to campaigns</h2>
            <p className="mt-4 text-lg font-medium text-neutral-600">
              These modules mirror what power users see in the Enterprise Hub sidebar - so marketing promises match the
              product surface.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {SALES_OPS.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-black text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-6 rounded-3xl border border-neutral-200 bg-white p-8 md:grid-cols-2 md:p-10">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">Payroll & HR</h3>
                <p className="mt-1 text-sm font-medium text-neutral-600">
                  People, shifts, and pay runs stay in the same permissioned workspace as operations - important for
                  chains that promote staff between outlets and still need clean audit trails.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-primary">
                <BarChart3 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">Audit trail</h3>
                <p className="mt-1 text-sm font-medium text-neutral-600">
                  Who changed prices, approved a refund, or edited tax settings - surfaced for finance and compliance
                  reviewers alongside FBR-facing workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="rounded-xl bg-brand-primary font-black text-white hover:bg-brand-primary-dark">
              <Link href="/features#analytics">Explore analytics on Features</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl font-bold">
              <Link href="/integrations">View integrations</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ClipboardList className="mx-auto mb-4 h-10 w-10 text-brand-primary" aria-hidden />
          <h2 className="text-2xl font-black text-neutral-900">Plans & domain fit</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-600">
            Campaigns and some automation surfaces are <strong>tiered by plan</strong> and <strong>business domain</strong>{' '}
            (for example hospitality vs pure wholesale). Always confirm exact entitlements on{' '}
            <Link href="/pricing" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              Pricing
            </Link>{' '}
            or a{' '}
            <Link href="/demo" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              demo call
            </Link>{' '}
             we prefer accurate expectations over overselling.
          </p>
        </div>
      </section>

      <CTASection
        variant="split"
        title="Show growth and operations in one walkthrough"
        subtitle="Book a demo to map campaigns, CRM, and storefront data to how your team already works."
        primaryCTA={{ text: 'Book a demo', href: '/demo' }}
        secondaryCTA={{ text: 'View pricing', href: '/pricing' }}
      />
    </MarketingLayout>
  );
}

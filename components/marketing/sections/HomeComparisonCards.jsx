'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TenvoIcon } from '@/components/branding/TenvoIcon';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { MARKETING_LEAD } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const BENEFITS = [
  'All-in-One Platform',
  'Easy to Use',
  'Affordable Pricing',
  'Local Support',
  'Built for Growth',
];

const ROWS = [
  { label: 'All-in-One Solution', shopify: false, odoo: true, busy: false, tenvo: true },
  { label: 'Easy to Use', shopify: true, odoo: false, busy: true, tenvo: true },
  { label: 'Affordable Pricing', shopify: false, odoo: false, busy: true, tenvo: true },
  { label: 'Local Support', shopify: false, odoo: false, busy: true, tenvo: true },
  { label: 'AI & Automation', shopify: false, odoo: true, busy: false, tenvo: true },
  { label: 'Multi-Business', shopify: false, odoo: true, busy: false, tenvo: true },
  { label: 'Offline POS', shopify: false, odoo: true, busy: true, tenvo: 'partial' },
  { label: 'Regional Compliance', shopify: false, odoo: false, busy: true, tenvo: true },
];

function CellMark({ value, highlight = false }) {
  if (value === true) {
    return (
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full',
          highlight ? 'bg-brand-primary text-white' : 'bg-emerald-50 text-emerald-600'
        )}
      >
        <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
        P1
        <span className="sr-only">Phase 1 / plan gated</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
      <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      <span className="sr-only">No</span>
    </span>
  );
}

/**
 * Screenshot-style comparison: benefits list + Shopify / Odoo / Busy / TENVO table.
 * Offline POS marked Partial (plan-gated Phase 1). Regional compliance is global-ready wording.
 */
export default function HomeComparisonCards() {
  return (
    <MarketingSection padding="loose" className="border-b border-neutral-200/80 bg-white">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-6 lg:col-span-4">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Why Businesses Choose{' '}
            <span className="text-brand-primary">TENVO</span>
          </h2>
          <p className={MARKETING_LEAD}>
            One connected operating system instead of stitching a store, POS, inventory app, and ERP
            together.
          </p>
          <ul className="space-y-3">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-semibold text-neutral-800">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm shadow-brand-primary/30">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Button asChild className="h-11 rounded-xl bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-dark">
            <Link href="/why-tenvo">See why TENVO wins</Link>
          </Button>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] sm:rounded-[1.75rem]">
            {/* Mobile stacked */}
            <div className="divide-y divide-neutral-100 lg:hidden">
              {ROWS.map((row) => (
                <div key={row.label} className="space-y-3 p-4">
                  <p className="text-sm font-semibold text-neutral-900">{row.label}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'shopify', label: 'Shopify', value: row.shopify },
                      { key: 'odoo', label: 'Odoo', value: row.odoo },
                      { key: 'busy', label: 'Busy', value: row.busy },
                      { key: 'tenvo', label: 'TENVO', value: row.tenvo, highlight: true },
                    ].map((col) => (
                      <div
                        key={col.key}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2',
                          col.highlight
                            ? 'border-brand-200 bg-brand-50/70'
                            : 'border-neutral-100 bg-neutral-50/80'
                        )}
                      >
                        <CellMark value={col.value} highlight={col.highlight} />
                        <span
                          className={cn(
                            'text-[9px] font-semibold uppercase tracking-wide',
                            col.highlight ? 'text-brand-primary' : 'text-neutral-500'
                          )}
                        >
                          {col.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/90">
                    <th className="p-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Capability
                    </th>
                    <th className="p-4 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Shopify
                    </th>
                    <th className="p-4 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Odoo
                    </th>
                    <th className="p-4 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Busy
                    </th>
                    <th className="border-x border-brand-200 bg-brand-50/80 p-4 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <TenvoIcon size={22} className="h-[22px] w-[22px]" alt="" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                          TENVO
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60"
                    >
                      <td className="p-4 text-sm font-semibold text-neutral-900">{row.label}</td>
                      <td className="p-4 text-center">
                        <CellMark value={row.shopify} />
                      </td>
                      <td className="p-4 text-center">
                        <CellMark value={row.odoo} />
                      </td>
                      <td className="p-4 text-center">
                        <CellMark value={row.busy} />
                      </td>
                      <td className="border-x border-brand-100 bg-brand-50/40 p-4 text-center">
                        <CellMark value={row.tenvo} highlight />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t border-neutral-100 bg-neutral-50/70 px-4 py-3 text-[11px] font-medium text-neutral-500 sm:px-5">
              Illustrative buyer positioning. Offline POS is plan-gated Phase 1. Regional tax packs
              vary by country; live government filing connectors stay on the roadmap where noted.
            </p>
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}

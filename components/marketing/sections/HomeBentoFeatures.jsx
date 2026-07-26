'use client';

import {
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  PackageCheck,
  ArrowRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { MARKETING_CONTAINER, MARKETING_SECTION_HEADING } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/marketing/effects/ModernEffects';

export default function HomeBentoFeatures() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200/80 bg-neutral-50 py-16 sm:py-24 lg:py-32">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[800px] rounded-full bg-brand-primary/5 blur-[120px]" />
      </div>

      <div className={MARKETING_CONTAINER}>
        <ScrollReveal direction="up" threshold={0.2} className="mb-12 text-center sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary mb-6">
            <Zap className="h-4 w-4" /> Powering Operations
          </div>
          <h2 className={cn(MARKETING_SECTION_HEADING, "max-w-4xl mx-auto")}>
            Everything you need to scale, built into one unified engine.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-neutral-500 sm:text-lg">
            Say goodbye to fragmented tools and manual data entry. TENVO brings your inventory, pricing, and compliance together in a lightning-fast workspace.
          </p>
        </ScrollReveal>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          
          {/* Card 1: Excel Import (Spans 2 cols on lg) */}
          <ScrollReveal direction="up" threshold={0.2} delay={0} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md lg:col-span-2">
            <div className="flex flex-1 flex-col justify-end p-8 sm:p-10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/50">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Native Excel Import</h3>
              <p className="max-w-md text-sm font-medium leading-relaxed text-neutral-500">
                Stop wrestling with CSV formats. Drop your existing spreadsheets directly into TENVO. We map columns automatically, flag errors inline, and guarantee a 100% round-trip validation.
              </p>
            </div>
            {/* Visual element */}
            <div className="relative h-48 overflow-hidden bg-neutral-100 sm:h-56">
              <div className="absolute -right-10 top-8 h-40 w-full rounded-l-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-transform duration-500 group-hover:-translate-x-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 text-xs font-semibold uppercase text-neutral-400">
                    <span className="w-24">SKU</span>
                    <span className="flex-1">Product</span>
                    <span className="w-16">Stock</span>
                  </div>
                  {[
                    { sku: 'TNV-01', name: 'Cotton Crew Neck', stock: 120, status: 'success' },
                    { sku: 'TNV-02', name: 'Denim Jacket', stock: 45, status: 'success' },
                    { sku: 'TNV-03', name: 'Summer Linen', stock: 80, status: 'pending' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-neutral-700">
                      <span className="w-24 font-mono text-xs">{row.sku}</span>
                      <span className="flex-1 truncate">{row.name}</span>
                      <span className="w-16 font-bold">{row.stock}</span>
                      <div className={cn("h-1.5 w-1.5 rounded-full", row.status === 'success' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse')} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: FBR Compliance */}
          <ScrollReveal direction="up" threshold={0.2} delay={100} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-1 flex-col p-8 sm:p-10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-primary ring-1 ring-brand-200/50">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">GST Built-in</h3>
              <p className="text-sm font-medium leading-relaxed text-neutral-500">
                Generate localized, 18% GST-compliant invoices instantly. We handle the math so your receipts are always tax-ready.
              </p>
              <div className="mt-8 flex-1 rounded-xl border border-neutral-100 bg-neutral-50 p-4 relative overflow-hidden group-hover:bg-neutral-100/50 transition-colors">
                <div className="space-y-3 font-mono text-[10px] sm:text-xs">
                  <div className="flex justify-between font-bold text-neutral-800">
                    <span>SUBTOTAL</span>
                    <span>PKR 25,000</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>STANDARD GST (18%)</span>
                    <span>PKR 4,500</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm font-black text-brand-primary">
                    <span>TOTAL</span>
                    <span>PKR 29,500</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Intelligent Reordering */}
          <ScrollReveal direction="up" threshold={0.2} delay={200} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-1 flex-col p-8 sm:p-10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200/50">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Smart Auto-PO</h3>
              <p className="text-sm font-medium leading-relaxed text-neutral-500">
                Never run out of stock. TENVO monitors inventory velocity and auto-drafts supplier purchase orders the moment you hit safety limits.
              </p>
              <div className="mt-8 flex-1 rounded-xl border border-purple-100 bg-purple-50/50 p-4 transition-colors group-hover:bg-purple-50">
                 <div className="flex items-center gap-3 border-b border-purple-100 pb-3">
                   <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">Draft Ready</span>
                 </div>
                 <p className="mt-3 font-mono text-xs font-semibold text-neutral-700">PO-2026-004</p>
                 <p className="mt-1 text-[11px] font-medium text-neutral-500">Supplier: Denim Mills Ltd.</p>
                 <div className="mt-3 flex items-center justify-between text-xs font-bold text-purple-700">
                   <span>500 Units</span>
                   <ArrowRight className="h-4 w-4" />
                 </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 4: Margin-First Pricing (Spans 2 cols on lg) */}
          <ScrollReveal direction="up" threshold={0.2} delay={300} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md lg:col-span-2">
            <div className="flex flex-1 flex-col justify-end p-8 sm:p-10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Margin-First Protection</h3>
              <p className="max-w-md text-sm font-medium leading-relaxed text-neutral-500">
                With vendor costs changing daily, static prices mean lost money. Define your target profit margin, and TENVO dynamically recalculates retail prices across all locations instantly.
              </p>
            </div>
            {/* Visual element */}
            <div className="relative h-48 overflow-hidden bg-neutral-100 sm:h-56">
              <div className="absolute inset-x-8 bottom-0 h-40 rounded-t-2xl border border-neutral-200 border-b-0 bg-white p-6 shadow-sm transition-transform duration-500 group-hover:translate-y-2">
                <div className="flex h-full items-end gap-2 pb-2">
                  {[40, 55, 45, 60, 75, 90, 80].map((height, i) => (
                    <div key={i} className="group/bar relative flex flex-1 flex-col justify-end gap-1">
                      {/* Profit portion */}
                      <div className="w-full rounded-t-sm bg-brand-primary transition-all duration-500 group-hover/bar:bg-brand-primary-dark" style={{ height: `${height * 0.4}%` }} />
                      {/* Cost portion */}
                      <div className="w-full rounded-sm bg-neutral-200 transition-all duration-500 group-hover/bar:bg-neutral-300" style={{ height: `${height * 0.6}%` }} />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px] bg-white/30">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-sm border border-neutral-200">
                    25% Margin Maintained
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  CheckCircle2,
  Factory,
  Globe,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Workflow,
} from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';

const proofStats = [
  { value: '450k+', label: 'operators, owners, and finance users onboarded' },
  { value: '55+', label: 'industry-ready business templates' },
  { value: '99.9%', label: 'core uptime for live operational workloads' },
  { value: 'Days', label: 'to launch instead of multi-month ERP projects' },
];

const painPoints = [
  {
    title: 'Disconnected operations',
    description: 'Inventory, POS, accounting, and purchasing stop drifting across spreadsheets and disconnected tools.',
    icon: Blocks,
  },
  {
    title: 'Manual compliance pressure',
    description: 'Sales tax, FBR-sensitive invoicing, and audit readiness stay embedded in day-to-day workflows.',
    icon: ShieldCheck,
  },
  {
    title: 'Slow, expensive rollouts',
    description: 'Industry-tuned defaults, role-aware dashboards, and ready modules shorten adoption from months to days.',
    icon: Sparkles,
  },
];

const adoptionSteps = [
  {
    step: '01',
    title: 'Pick your business vertical',
    description: 'Start from a retail, wholesale, manufacturing, healthcare, or hospitality operating model already aligned to the domain.',
  },
  {
    step: '02',
    title: 'Invite your team and switch on modules',
    description: 'Owners, admins, finance teams, warehouse teams, and POS operators each get a focused workspace and role-based access.',
  },
  {
    step: '03',
    title: 'Run every workflow from one system',
    description: 'Orders, stock, purchasing, invoicing, collections, and reporting stay synchronized without duplicate data entry.',
  },
];

const modules = [
  { title: 'Inventory Control', description: 'Batches, serials, transfers, reorder rules, and warehouse visibility.', icon: Package },
  { title: 'Sales & POS', description: 'Counter sales, faster billing, receipts, discounts, and customer-led checkout flows.', icon: Store },
  { title: 'Finance & Tax', description: 'Invoices, ledgers, expenses, receivables, and compliance-aware accounting.', icon: Receipt },
  { title: 'Purchasing', description: 'Vendor lifecycle, approvals, purchase orders, and inward stock alignment.', icon: Workflow },
  { title: 'Management Reporting', description: 'Owner-ready KPIs, team insights, margin tracking, and health dashboards.', icon: BarChart3 },
  { title: 'Multi-Business Governance', description: 'Switch entities, isolate data, and keep central oversight where it belongs.', icon: Users },
];

const industries = [
  { name: 'Retail & Supermarkets', icon: Store },
  { name: 'Wholesale & Distribution', icon: Globe },
  { name: 'Manufacturing & Factory Ops', icon: Factory },
  { name: 'Pharmacy & Healthcare', icon: ShieldCheck },
];

export default function Home() {
  const { user } = useAuth();
  const primaryHref = user ? '/multi-business' : '/register';
  const primaryText = user ? 'Open Workspace' : 'Start Your Setup';

  return (
    <MarketingLayout transparentNav>
      <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6 lg:px-12 lg:pb-16 lg:pt-10">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_right,rgba(47,91,255,0.20),transparent_32%),radial-gradient(circle_at_top_left,rgba(198,146,20,0.14),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4" />
                Pakistan-ready enterprise operations
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                  Modern operating system for serious business execution.
                </h1>
                <p className="max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">
                  TENVO replaces fragmented software with one disciplined platform for inventory, finance, POS, purchasing, and compliance. Teams get a clean, consistent interface that helps them move faster with more control.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base font-black uppercase tracking-[0.18em]">
                  <Link href={primaryHref}>
                    {primaryText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-slate-300 bg-white/70 px-8 text-base font-black uppercase tracking-[0.18em] backdrop-blur-xl">
                  <Link href="/pricing">See Pricing</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {proofStats.map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/80 bg-white/82 p-5 shadow-[0_26px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                    <div className="text-3xl font-black tracking-tight text-slate-950">{item.value}</div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(9,18,37,0.98),rgba(21,56,165,0.96))] p-6 shadow-[0_38px_110px_-36px_rgba(15,23,42,0.55)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-100/70">Executive Command</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Built for operators, finance teams, and leadership.</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-amber-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-100/70">What we solve</p>
                        <p className="mt-2 text-lg font-bold text-white">Disconnected teams, delayed visibility, and preventable operational mistakes.</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3 text-blue-200">
                        <Blocks className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white p-5 text-slate-900">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Easy to adopt</p>
                      <p className="mt-3 text-lg font-black tracking-tight">Role-based workflows, guided setup, and ready industry templates.</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-amber-300/30 bg-amber-300/12 p-5 text-white">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">Why teams switch</p>
                      <p className="mt-3 text-lg font-black tracking-tight">One product language, one data model, and one source of truth.</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['Unified dashboarding', 'Cleaner approval flow', 'Business-specific navigation', 'Localized tax operations'].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white/88 p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:p-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">Why this system exists</p>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Because growing businesses should not need five disconnected tools to close one day of work.</h2>
            <p className="text-base font-medium leading-7 text-slate-600 sm:text-lg">
              TENVO is built for operators who need discipline, speed, and visibility. It gives owners control, admins structure, finance teams accuracy, and frontline teams a UI that stays compact, modern, and predictable.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {painPoints.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">How easy it is</p>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">A clean rollout path from first signup to daily operations.</h2>
            <p className="text-lg font-medium leading-8 text-slate-600">
              The platform is designed to feel enterprise-grade without forcing enterprise complexity into every task.
            </p>
          </div>
          <div className="grid gap-5">
            {adoptionSteps.map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-slate-200 bg-white/88 p-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.4)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">Step {item.step}</div>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{item.title}</h3>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white">Fast setup</div>
                </div>
                <p className="mt-4 text-base font-medium leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">One workspace, every team</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Every critical business function lives in the same visual language.</h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-7 text-slate-600">
              The theme is intentional: royal blue for primary guidance, black and white for clarity, green for success, wine only for danger, and gold where an important badge or tier marker needs emphasis.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.4)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#091225_0%,#10224a_58%,#1738a5_100%)] p-8 text-white shadow-[0_36px_100px_-40px_rgba(15,23,42,0.7)] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-100/80">Industry-ready from day one</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Localized for the sectors that actually run Pakistan.</h2>
              <p className="mt-4 text-base font-medium leading-8 text-blue-100/80">
                Retail chains, distributors, factories, and compliance-sensitive businesses all start with a cleaner baseline. That means fewer configuration gaps and a stronger day-one experience.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {industries.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-lg font-black tracking-tight">{item.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-10 sm:px-6 lg:px-12 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white/92 p-8 text-center shadow-[0_26px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:p-12">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">Ready to move</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Move to one serious enterprise interface.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-600">
            If you want a business system that looks modern, stays consistent across modules, and helps teams work faster without losing control, this is the right foundation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base font-black uppercase tracking-[0.18em]">
              <Link href={primaryHref}>{primaryText}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-slate-300 px-8 text-base font-black uppercase tracking-[0.18em]">
              <Link href="/industries">Explore Industries</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

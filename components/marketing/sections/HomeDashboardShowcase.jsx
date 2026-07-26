'use client';

import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { ScrollReveal } from '@/components/marketing/effects/ModernEffects';
import { cn } from '@/lib/utils';
import { Search, Bell, BarChart3, Package, Users, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';

export default function HomeDashboardShowcase() {
  return (
    <section className="relative overflow-hidden bg-neutral-900 py-20 sm:py-32 lg:py-40">
      {/* Dark mode background glow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 opacity-30">
        <div className="h-[400px] w-[800px] rounded-[100%] bg-brand-primary blur-[120px]" />
      </div>

      <div className={cn(MARKETING_CONTAINER, "relative z-10")}>
        <ScrollReveal direction="up" threshold={0.3} className="text-center mb-16 lg:mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            Command your business. <br className="hidden sm:block" />
            <span className="text-brand-primary">From one screen.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            TENVO is not just another app. It's the operating system for modern retail and wholesale. Monitor multi-location stock, approve POs, and watch real-time sales, all at a glance.
          </p>
        </ScrollReveal>

        {/* Browser Chrome & Dashboard Frame */}
        <ScrollReveal direction="up" threshold={0.1} className="mx-auto max-w-6xl">
          <div className="relative rounded-2xl sm:rounded-[2rem] border border-neutral-700/50 bg-neutral-900/50 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:p-4">

            {/* Browser Header */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-2 sm:px-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-neutral-700" />
                <div className="h-3 w-3 rounded-full bg-neutral-700" />
                <div className="h-3 w-3 rounded-full bg-neutral-700" />
              </div>
              <div className="mx-auto flex h-6 w-full max-w-xs items-center justify-center rounded-md bg-neutral-800/80 px-3 text-[10px] font-medium text-neutral-400 sm:max-w-md sm:text-xs">
                workspace.tenvo.com
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Dashboard Inner Screen */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-neutral-800 bg-[#0A0A0A] sm:aspect-video">

              {/* Sidebar Mock */}
              <div className="absolute bottom-0 left-0 top-0 hidden w-64 border-r border-neutral-800 bg-[#111111] p-4 sm:flex flex-col">
                <div className="mb-8 flex items-center gap-2 px-2">
                  <div className="h-6 w-6 rounded bg-brand-primary" />
                  <span className="font-bold text-white tracking-wide">TENVO</span>
                </div>

                <nav className="space-y-1">
                  <NavItem icon={LayoutDashboard} label="Overview" active />
                  <NavItem icon={Package} label="Inventory" />
                  <NavItem icon={BarChart3} label="Analytics" />
                  <NavItem icon={Users} label="Customers" />
                </nav>

                <div className="mt-auto">
                  <NavItem icon={Settings} label="Settings" />
                </div>
              </div>

              {/* Main Content Area Mock */}
              <div className="absolute bottom-0 right-0 top-0 w-full p-4 sm:left-64 sm:w-auto sm:p-8">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="h-8 w-48 rounded bg-neutral-800" />
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-neutral-800" />
                    <div className="h-8 w-8 rounded-full bg-brand-primary/20" />
                  </div>
                </div>

                {/* KPI Cards Row */}
                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { label: 'Total Revenue', val: 'PKR 4.2M', trend: '+12%' },
                    { label: 'Active Orders', val: '143', trend: '+5%' },
                    { label: 'Low Stock Alerts', val: '12', trend: '-2', alert: true },
                    { label: 'Profit Margin', val: '28.4%', trend: '+1.2%' }
                  ].map((kpi, i) => (
                    <div key={i} className="rounded-xl border border-neutral-800 bg-[#111111] p-4 sm:p-5">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase text-neutral-500">{kpi.label}</p>
                      <p className="mt-2 text-lg sm:text-2xl font-bold text-white">{kpi.val}</p>
                      <p className={cn("mt-1 text-[10px] sm:text-xs font-medium", kpi.alert ? "text-red-400" : "text-emerald-400")}>
                        {kpi.trend} this week
                      </p>
                    </div>
                  ))}
                </div>

                {/* Main Graph & List Area */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="hidden rounded-xl border border-neutral-800 bg-[#111111] p-5 lg:col-span-2 lg:block">
                    <div className="mb-4 h-5 w-32 rounded bg-neutral-800" />
                    {/* Fake Graph Lines */}
                    <div className="flex h-48 items-end gap-2 pb-4">
                      {[40, 55, 45, 70, 65, 80, 95, 75, 60, 85, 90, 100].map((h, i) => (
                        <div key={i} className="w-full rounded-t-sm bg-brand-primary/80 transition-all hover:bg-brand-primary" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-[#111111] p-5">
                    <div className="mb-6 h-5 w-40 rounded bg-neutral-800" />
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded bg-neutral-800" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-2 w-full max-w-[120px] rounded bg-neutral-700" />
                            <div className="h-2 w-16 rounded bg-neutral-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Overlay Gradient to make it look premium */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function NavItem({ icon: Icon, label, active }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-default",
      active ? "bg-brand-primary/10 text-brand-primary" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
    )}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

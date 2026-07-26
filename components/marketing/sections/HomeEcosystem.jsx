'use client';

import {
  BarChart3,
  Boxes,
  Factory,
  Megaphone,
  MonitorSmartphone,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
  Warehouse,
  Wallet,
} from 'lucide-react';
import { TenvoIcon } from '@/components/branding/TenvoIcon';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

const ORBIT = [
  { label: 'Inventory', icon: Boxes, color: 'text-brand-primary', ring: 'ring-brand-200' },
  { label: 'POS', icon: MonitorSmartphone, color: 'text-brand-primary', ring: 'ring-brand-200' },
  { label: 'Accounting', icon: Wallet, color: 'text-emerald-600', ring: 'ring-emerald-200' },
  { label: 'CRM', icon: Users, color: 'text-brand-primary', ring: 'ring-brand-200' },
  { label: 'Ecommerce', icon: ShoppingCart, color: 'text-sky-600', ring: 'ring-sky-200' },
  { label: 'Warehouse', icon: Warehouse, color: 'text-sky-600', ring: 'ring-sky-200' },
  { label: 'Manufacturing', icon: Factory, color: 'text-slate-600', ring: 'ring-slate-200' },
  { label: 'Analytics', icon: BarChart3, color: 'text-indigo-600', ring: 'ring-indigo-200' },
];

const FLOATING = [
  { label: 'AI', icon: Sparkles, className: 'left-[6%] top-[18%] text-violet-600' },
  { label: 'Marketing', icon: Megaphone, className: 'right-[4%] top-[22%] text-rose-600' },
  { label: 'Shipping', icon: Package, className: 'bottom-[14%] left-[10%] text-amber-600' },
];

/**
 * Hub-and-spoke business ecosystem visual (screenshot Section 3).
 */
export default function HomeEcosystem() {
  return (
    <MarketingSection
      padding="loose"
      className="relative overflow-hidden border-b border-neutral-200/80 bg-neutral-50"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/[0.06] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-14">
        <p className={MARKETING_EYEBROW}>Beautiful business ecosystem</p>
        <h2 className={MARKETING_SECTION_HEADING}>
          Everything connected.
          <br className="hidden sm:block" />
          Nothing repeated.
        </h2>
        <p className={MARKETING_LEAD}>
          Inventory, POS, storefront, warehouses, accounting, CRM, and AI share one data model. Sell
          once. Update everywhere.
        </p>
      </div>

      {/* Desktop orbit */}
      <div className="relative z-10 mx-auto hidden max-w-3xl lg:block">
        <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
          <div
            className="absolute inset-[12%] rounded-full border border-dashed border-brand-primary/25"
            aria-hidden
          />
          <div
            className="absolute inset-[28%] rounded-full border border-dashed border-brand-primary/15"
            aria-hidden
          />

          {ORBIT.map((node, index) => {
            const angle = (index / ORBIT.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 42;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const Icon = node.icon;
            return (
              <div
                key={node.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={cn(
                    'flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center rounded-full border border-white bg-white shadow-[0_14px_34px_-18px_rgba(15,23,42,0.45)] ring-1',
                    node.ring
                  )}
                >
                  <Icon className={cn('h-5 w-5', node.color)} aria-hidden />
                  <span className="mt-1 text-[10px] font-semibold text-neutral-700">{node.label}</span>
                </div>
              </div>
            );
          })}

          {FLOATING.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.label}
                className={cn(
                  'absolute flex items-center gap-1.5 rounded-full border border-white bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-neutral-700 shadow-md backdrop-blur-sm',
                  node.className
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {node.label}
              </div>
            );
          })}

          <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.35rem] bg-white shadow-[0_20px_50px_-16px_rgba(210,43,43,0.55)] ring-1 ring-brand-200/80">
            <TenvoIcon size={56} className="h-14 w-14" alt="TENVO" />
          </div>
        </div>
      </div>

      {/* Mobile / tablet grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
        <div className="col-span-2 flex items-center justify-center rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-md shadow-brand-primary/20 ring-1 ring-brand-200/70">
              <TenvoIcon size={56} className="h-14 w-14" alt="" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">TENVO Hub</p>
              <p className="text-xs font-medium text-neutral-500">One OS for every module</p>
            </div>
          </div>
        </div>
        {ORBIT.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.label}
              className="flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm"
            >
              <span
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 ring-1',
                  node.ring,
                  node.color
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold text-neutral-800">{node.label}</span>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}

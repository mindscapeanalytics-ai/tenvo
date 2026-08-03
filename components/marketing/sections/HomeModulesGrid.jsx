'use client';

import {
  BarChart3,
  ContactRound,
  Factory,
  FileBadge2,
  LayoutGrid,
  Package,
  ShoppingCart,
  Store,
} from 'lucide-react';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { cn } from '@/lib/utils';

/**
 * Exact mockup strip — white centered cards, line icons only (no tinted icon wells).
 * Colors match the marketing screenshot.
 */
const MODULES = [
  {
    title: 'Inventory',
    description: 'Real-time stock visibility',
    icon: Package,
    iconClass: 'text-[#E53935]',
  },
  {
    title: 'POS',
    description: 'Lightning fast checkout',
    icon: Store,
    iconClass: 'text-[#E53935]',
  },
  {
    title: 'Accounting',
    description: 'Automate your finances',
    icon: FileBadge2,
    iconClass: 'text-[#43A047]',
  },
  {
    title: 'CRM',
    description: 'Build stronger relationships',
    icon: ContactRound,
    iconClass: 'text-[#E53935]',
  },
  {
    title: 'Ecommerce',
    description: 'Powerful online store',
    icon: ShoppingCart,
    iconClass: 'text-[#1E88E5]',
  },
  {
    title: 'Manufacturing',
    description: 'Streamline production',
    icon: Factory,
    iconClass: 'text-[#5E35B1]',
  },
  {
    title: 'Analytics',
    description: 'AI-powered insights',
    icon: BarChart3,
    iconClass: 'text-[#00897B]',
  },
  {
    title: 'More',
    description: 'And more features',
    icon: LayoutGrid,
    iconClass: 'text-[#E53935]',
  },
];

export default function HomeModulesGrid() {
  return (
    <MarketingSection
      padding="loose"
      className="border-b border-neutral-200/70 bg-[#F9F9F9]"
    >
      <div className="mx-auto mb-10 text-center sm:mb-12 lg:mb-14">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#212121] sm:text-4xl lg:text-[2.65rem]">
          <span className="text-[#D32F2F]">Everything</span> You Need, In One Place
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5 lg:grid-cols-8 lg:gap-3 xl:gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className={cn(
                'flex flex-col items-center rounded-xl border border-[#EEEEEE] bg-white px-3 py-6 text-center',
                'shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300',
                'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]',
                'sm:rounded-[0.65rem] sm:px-3 sm:py-7 lg:min-h-[9.5rem] lg:px-2 lg:py-6 xl:px-3'
              )}
            >
              <Icon
                className={cn('mb-3.5 h-8 w-8 shrink-0 sm:h-9 sm:w-9', mod.iconClass)}
                strokeWidth={1.6}
                aria-hidden
              />
              <h3 className="text-sm font-semibold tracking-tight text-[#333333] sm:text-[0.9375rem]">
                {mod.title}
              </h3>
              <p className="mt-1.5 max-w-[9.5rem] text-[11px] font-medium leading-snug text-[#757575] sm:text-xs">
                {mod.description}
              </p>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}

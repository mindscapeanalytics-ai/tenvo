'use client';

import Image from 'next/image';
import {
  Dumbbell,
  MonitorSmartphone,
  Printer,
  Receipt,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import MarketingSection from '@/components/marketing/layout/MarketingSection';
import { cn } from '@/lib/utils';

/** Modern product proofs — visual UIs only (no spreadsheet / P&L plates) */
const TRUST_SHOTS = [
  {
    src: TENVO_IMG.milkEasy,
    label: 'Milk Hub',
    hint: 'Easy Mode ops',
    icon: Store,
    accent: 'from-rose-500/15 to-transparent',
  },
  {
    src: TENVO_IMG.milkPos,
    label: 'Smart POS',
    hint: 'Counter ready',
    icon: MonitorSmartphone,
    accent: 'from-emerald-500/15 to-transparent',
  },
  {
    src: TENVO_IMG.restaurantStore,
    label: 'Restaurant',
    hint: 'Digital menu',
    icon: UtensilsCrossed,
    accent: 'from-orange-500/15 to-transparent',
  },
  {
    src: TENVO_IMG.fitnessStore,
    label: 'Fitness',
    hint: 'Gym retail',
    icon: Dumbbell,
    accent: 'from-violet-500/15 to-transparent',
  },
  {
    src: TENVO_IMG.milkBillWhatsapp,
    label: 'Billing',
    hint: 'WhatsApp bills',
    icon: Receipt,
    accent: 'from-sky-500/15 to-transparent',
  },
  {
    src: TENVO_IMG.milkBillBilingual,
    label: 'Receipts',
    hint: 'Thermal bills',
    icon: Printer,
    accent: 'from-amber-500/15 to-transparent',
  },
];

/**
 * Modern trust strip — elevated product cards (no Excel / ledger screenshots).
 */
export default function HomeProductTrustStrip() {
  return (
    <MarketingSection padding="tight" className="border-b border-neutral-200/80 bg-[#FAFAFA]">
      <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 sm:mb-10 sm:text-[11px]">
        Trusted by growing businesses around the world
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 lg:gap-4">
        {TRUST_SHOTS.map((shot) => {
          const Icon = shot.icon;
          return (
            <div
              key={shot.label}
              className={cn(
                'group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white',
                'shadow-[0_8px_24px_-16px_rgba(15,23,42,0.28)]',
                'transition-[transform,box-shadow] duration-300',
                'motion-safe:hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)]'
              )}
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-neutral-100">
                <Image
                  src={shot.src}
                  alt={`TENVO ${shot.label}`}
                  fill
                  className="object-cover object-top transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-t',
                    shot.accent
                  )}
                  aria-hidden
                />
                <div className="absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
              </div>
              <div className="space-y-0.5 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-800">
                  {shot.label}
                </p>
                <p className="text-[10px] font-medium text-neutral-400">{shot.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs font-medium text-neutral-500">
        And many more verticals across retail, hospitality, and services
      </p>
    </MarketingSection>
  );
}

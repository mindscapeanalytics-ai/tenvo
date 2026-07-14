'use client';

import { Shield, Package, Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  certified: Shield,
  insured: Package,
  packaging: Award,
  authenticity: Star,
};

/**
 * Jewelry trust pillars strip — certification, insured shipping, luxury packaging.
 * 2026 design: Premium badges with golden accent glow.
 */
export function JewelleryTrustStrip({ pillars = [], accent = '#c9a227' }) {
  if (!pillars.length) return null;

  return (
    <section className="border-b border-stone-200 bg-gradient-to-br from-stone-50 to-white py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = ICON_MAP[pillar.id] || Shield;
            return (
              <div
                key={pillar.id}
                className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4 transition-all hover:scale-[1.02] hover:shadow-lg sm:p-5"
              >
                {/* Golden glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                  style={{ background: `radial-gradient(circle at center, ${accent} 0%, transparent 70%)` }}
                />

                <div className="relative flex flex-col items-center text-center">
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <Icon
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      style={{ color: accent }}
                    />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 sm:text-base">{pillar.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-[13px]">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

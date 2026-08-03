'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/** True-alpha photoreal wheel (no checkerboard). */
export const TYRE_HERO_SPIN_WHEEL_SRC = '/storefront/tyre/hero-spinning-wheel-v2.png';

/**
 * Single realistic tyre spinning in place on the hero (right side).
 */
export function TyreHeroRunningWheel({ className }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute z-[5] hidden select-none sm:block',
        'right-[2%] top-[46%] -translate-y-1/2 md:right-[4%] lg:right-[6%] xl:right-[8%]',
        className
      )}
      aria-hidden
    >
      <div className="relative">
        <div
          className="absolute -bottom-2 left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-[100%] bg-black/55 blur-lg"
          aria-hidden
        />
        <div
          className={cn(
            'tyre-hero-spin relative',
            'h-[200px] w-[200px] md:h-[260px] md:w-[260px] lg:h-[320px] lg:w-[320px] xl:h-[360px] xl:w-[360px]',
            'drop-shadow-[0_18px_36px_rgba(0,0,0,0.65)]'
          )}
        >
          <Image
            src={TYRE_HERO_SPIN_WHEEL_SRC}
            alt=""
            fill
            sizes="(max-width: 768px) 200px, (max-width: 1024px) 260px, 360px"
            className="object-contain object-center"
            priority={false}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

export default TyreHeroRunningWheel;

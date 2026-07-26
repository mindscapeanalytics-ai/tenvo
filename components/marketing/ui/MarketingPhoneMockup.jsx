'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Marketing phone mockup with real device insets so screenshots breathe
 * like an app (safe top for island, side/bottom margins, rounded screen).
 */
export function MarketingPhoneMockup({
  src,
  alt,
  className,
  priority = false,
  sizes = '220px',
  /** 'cover' fills the inset screen; 'contain' shows full capture with matte */
  fit = 'cover',
  tilt = 0,
}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[17rem]',
        'origin-bottom will-change-transform',
        className
      )}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <div
        className={cn(
          'relative rounded-[2.15rem] bg-neutral-950 p-[0.55rem]',
          'shadow-[0_28px_56px_-20px_rgba(0,0,0,0.55)]',
          'ring-1 ring-white/15'
        )}
      >
        {/* Side buttons */}
        <span
          className="pointer-events-none absolute -left-[2px] top-[18%] h-7 w-[2.5px] rounded-l bg-neutral-700"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-[2px] top-[28%] h-11 w-[2.5px] rounded-l bg-neutral-700"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-[2px] top-[24%] h-14 w-[2.5px] rounded-r bg-neutral-700"
          aria-hidden
        />

        {/* Dynamic Island */}
        <div
          className="pointer-events-none absolute left-1/2 top-[0.72rem] z-30 h-[0.78rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-black shadow-sm"
          aria-hidden
        />

        {/* Screen with app-like safe insets */}
        <div className="relative overflow-hidden rounded-[1.7rem] bg-[#F3F4F6]">
          <div className="relative aspect-[9/19.2] w-full">
            {/* Safe area: top clears island, sides/bottom keep UI off the bezel */}
            <div className="absolute inset-x-[0.38rem] bottom-[0.55rem] top-[1.35rem] overflow-hidden rounded-[1.05rem] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
              <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                className={cn(
                  fit === 'contain'
                    ? 'object-contain object-top'
                    : 'object-cover object-top'
                )}
                sizes={sizes}
              />
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div
          className="pointer-events-none absolute bottom-[0.42rem] left-1/2 z-30 h-[0.2rem] w-[4.25rem] -translate-x-1/2 rounded-full bg-white/50"
          aria-hidden
        />
      </div>
    </div>
  );
}

/**
 * Dual-phone stage for marketing banners (hub + POS style).
 * Overlaps slightly and tilts toward center like the brand mockups.
 */
export function MarketingPhonePair({
  left,
  right,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'relative mx-auto flex w-full items-end justify-center',
        compact ? 'max-w-sm gap-1.5 px-1' : 'max-w-xl gap-2 px-2 lg:max-w-2xl lg:gap-3',
        className
      )}
    >
      <MarketingPhoneMockup
        src={left.src}
        alt={left.alt}
        tilt={compact ? -5 : -8}
        priority={left.priority}
        fit={left.fit || 'cover'}
        className={cn(
          'relative z-10 shrink-0',
          compact
            ? 'w-[47%] max-w-[10.5rem] translate-x-1 translate-y-2'
            : 'w-[45%] max-w-[15.5rem] translate-x-2 translate-y-4'
        )}
        sizes={compact ? '(max-width: 640px) 44vw, 168px' : '(min-width: 1024px) 248px, 205px'}
      />
      <MarketingPhoneMockup
        src={right.src}
        alt={right.alt}
        tilt={compact ? 4 : 7}
        priority={right.priority}
        fit={right.fit || 'cover'}
        className={cn(
          'relative z-20 shrink-0',
          compact
            ? 'w-[49%] max-w-[11rem] -translate-x-1 -translate-y-0.5'
            : 'w-[49%] max-w-[16.5rem] -translate-x-2 -translate-y-1'
        )}
        sizes={compact ? '(max-width: 640px) 46vw, 178px' : '(min-width: 1024px) 268px, 225px'}
      />
    </div>
  );
}
